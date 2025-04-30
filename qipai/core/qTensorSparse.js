/**
 * qTensorSparse.js
 * Memory-efficient sparse representation of quantum states.
 * Optimized for states with many zero or negligible amplitudes.
 */

import * as qMath from '../math/qmath.js';

export class QTensorSparse {
    /**
     * Creates a sparse QTensor instance.
     * @param {Object} options - Initialization options
     * @param {number} options.numQubits - Number of qubits in the system
     * @param {Map<number,{re:number,im:number}>} options.nonzeroAmplitudes - Map of index→amplitude for non-zero entries
     * @param {number} options.threshold - Threshold below which amplitudes are considered zero (default: 1e-10)
     * @param {boolean} options.isNormalized - Whether the state is already normalized
     * @param {Map<number,Set<number>>} options.entanglementMap - Entanglement information
     */
    constructor(options) {
        this.numQubits = options.numQubits;
        this.dimension = 2 ** this.numQubits;
        
        // Threshold for considering an amplitude as zero
        this.threshold = options.threshold || 1e-10;
        
        // Storage for non-zero amplitudes: Map of index → complex amplitude
        this.nonzeroAmplitudes = new Map();
        
        // Initialize with provided amplitudes or |0...0⟩ state
        if (options.nonzeroAmplitudes instanceof Map) {
            this.nonzeroAmplitudes = new Map(options.nonzeroAmplitudes);
        } else if (options.initialState && Array.isArray(options.initialState)) {
            // Initialize from dense vector, keeping only non-zero amplitudes
            for (let i = 0; i < options.initialState.length; i++) {
                const amp = options.initialState[i];
                if (qMath.magnitude(amp) > this.threshold) {
                    this.nonzeroAmplitudes.set(i, amp);
                }
            }
        } else {
            // Default to |0...0⟩ state
            this.nonzeroAmplitudes.set(0, qMath.complex(1, 0));
        }
        
        // Entanglement tracking
        this.entanglement = options.entanglementMap || new Map();
        
        // Normalize if needed
        if (!options.isNormalized) {
            this.normalize();
        }
    }
    
    /**
     * Get a single amplitude at the specified index
     * @param {number} index - State vector index
     * @returns {Object} Complex amplitude
     */
    getAmplitude(index) {
        if (index < 0 || index >= this.dimension) {
            throw new Error(`Index ${index} out of bounds for ${this.numQubits}-qubit state`);
        }
        
        return this.nonzeroAmplitudes.has(index) ? 
            this.nonzeroAmplitudes.get(index) : 
            qMath.complex(0, 0);
    }
    
    /**
     * Set a single amplitude
     * @param {number} index - State vector index
     * @param {Object} value - Complex amplitude
     */
    setAmplitude(index, value) {
        if (index < 0 || index >= this.dimension) {
            throw new Error(`Index ${index} out of bounds for ${this.numQubits}-qubit state`);
        }
        
        if (qMath.magnitude(value) > this.threshold) {
            this.nonzeroAmplitudes.set(index, qMath.complex(value.re, value.im));
        } else if (this.nonzeroAmplitudes.has(index)) {
            this.nonzeroAmplitudes.delete(index);
        }
    }
    
    /**
     * Get probability amplitude for a specific computational basis state
     * @param {Array<number>} bitstring - Array of 0s and 1s representing qubit states
     * @returns {Object} Complex amplitude
     */
    getAmplitudeFromBits(bitstring) {
        if (bitstring.length !== this.numQubits) {
            throw new Error(`Bitstring length ${bitstring.length} doesn't match number of qubits ${this.numQubits}`);
        }
        
        // Convert bitstring to index
        let index = 0;
        for (let i = 0; i < bitstring.length; i++) {
            if (bitstring[i] === 1) {
                index |= (1 << (bitstring.length - 1 - i));
            }
        }
        
        return this.getAmplitude(index);
    }
    
    /**
     * Convert to full (dense) state vector representation
     * @returns {Array<{re:number,im:number}>} Full state vector
     */
    toDenseVector() {
        const vector = new Array(this.dimension).fill(null)
            .map(() => qMath.complex(0, 0));
            
        for (const [index, amplitude] of this.nonzeroAmplitudes.entries()) {
            vector[index] = qMath.complex(amplitude.re, amplitude.im);
        }
        
        return vector;
    }
    
    /**
     * Normalize the state vector.
     */
    normalize() {
        // Calculate current norm (scalar product with itself)
        let normSquared = 0;
        for (const amplitude of this.nonzeroAmplitudes.values()) {
            normSquared += qMath.squaredMagnitude(amplitude);
        }
        
        if (normSquared === 0) {
            throw new Error("Cannot normalize zero state");
        }
        
        const normFactor = 1 / Math.sqrt(normSquared);
        
        // Apply normalization to all non-zero amplitudes
        for (const [index, amplitude] of this.nonzeroAmplitudes.entries()) {
            this.nonzeroAmplitudes.set(index, qMath.multiply(amplitude, qMath.complex(normFactor, 0)));
        }
    }
    
    /**
     * Apply unitary matrix to the state, returning a new sparse tensor.
     * Optimized to only compute necessary elements.
     * @param {Array<Array<{re:number,im:number}>>} matrix - Unitary matrix to apply
     * @returns {QTensorSparse} New sparse tensor after operation
     */
    applyMatrix(matrix) {
        // Check if matrix dimension matches state dimension
        if (matrix.length !== this.dimension || matrix[0].length !== this.dimension) {
            throw new Error(`Matrix dimensions ${matrix.length}×${matrix[0].length} don't match state dimension ${this.dimension}`);
        }

        const resultAmplitudes = new Map();
        
        // For each row in the matrix (i = output index)
        for (let i = 0; i < this.dimension; i++) {
            let newAmp = qMath.complex(0, 0);
            let isNonZero = false;
            
            // Only iterate through non-zero amplitudes in the input state
            for (const [j, inputAmp] of this.nonzeroAmplitudes.entries()) {
                const matrixElement = matrix[i][j];
                const product = qMath.multiply(matrixElement, inputAmp);
                
                if (qMath.magnitude(product) > this.threshold) {
                    newAmp = qMath.add(newAmp, product);
                    isNonZero = true;
                }
            }
            
            // Only add to the result if the new amplitude is non-zero
            if (isNonZero && qMath.magnitude(newAmp) > this.threshold) {
                resultAmplitudes.set(i, newAmp);
            }
        }
        
        return new QTensorSparse({
            numQubits: this.numQubits,
            nonzeroAmplitudes: resultAmplitudes,
            threshold: this.threshold,
            entanglementMap: this.entanglement,  // Preserve entanglement info
            isNormalized: false // Applying a matrix might unnormalize the state
        });
    }
    
    /**
     * Returns the sparsity of the state (percentage of zero amplitudes)
     * @returns {number} Sparsity percentage (0-100)
     */
    getSparsity() {
        return 100 * (1 - this.nonzeroAmplitudes.size / this.dimension);
    }
    
    /**
     * Returns memory usage estimate in bytes
     * @returns {number} Approximate memory usage
     */
    getMemoryUsage() {
        // Each complex number needs 16 bytes (2 doubles)
        // Map overhead is about 4 bytes per entry
        return this.nonzeroAmplitudes.size * (16 + 4);
    }
    
    /**
     * Compares memory usage to equivalent dense representation
     * @returns {Object} Memory usage stats
     */
    getMemoryComparison() {
        const sparseBytes = this.getMemoryUsage();
        const denseBytes = this.dimension * 16; // 16 bytes per complex number
        
        return {
            sparse: sparseBytes,
            dense: denseBytes,
            ratio: sparseBytes / denseBytes,
            savingsPercent: 100 * (1 - sparseBytes / denseBytes)
        };
    }
    
    /**
     * Create from dense QTensor
     * @param {QTensor} tensor - Dense tensor to convert
     * @param {number} threshold - Threshold for zero amplitudes
     * @returns {QTensorSparse} Sparse representation
     */
    static fromQTensor(tensor, threshold = 1e-10) {
        return new QTensorSparse({
            numQubits: tensor.qubitCount,
            initialState: tensor.amplitudes,
            threshold: threshold,
            entanglementMap: tensor.entanglement,
            isNormalized: true // Assume QTensor was normalized
        });
    }
    
    /**
     * Create a sparse tensor with only specified amplitudes
     * @param {number} numQubits - Number of qubits
     * @param {Object} amplitudes - Object mapping indices to complex amplitudes
     * @returns {QTensorSparse} Sparse tensor
     */
    static fromSpecificAmplitudes(numQubits, amplitudes) {
        const map = new Map();
        for (const [index, amplitude] of Object.entries(amplitudes)) {
            map.set(parseInt(index), qMath.complex(amplitude.re, amplitude.im));
        }
        
        return new QTensorSparse({
            numQubits,
            nonzeroAmplitudes: map,
            isNormalized: false // Will normalize during construction
        });
    }
    
    // --- Entanglement Methods (matching QTensor API) ---
    
    /**
     * Marks two qubits as entangled.
     * @param {number} qubitIndex1
     * @param {number} qubitIndex2
     */
    _markEntangled(qubitIndex1, qubitIndex2) {
        if (qubitIndex1 === qubitIndex2 || qubitIndex1 < 0 || qubitIndex2 < 0 || 
            qubitIndex1 >= this.numQubits || qubitIndex2 >= this.numQubits) {
            return; // Invalid indices or self-entanglement
        }

        const group1 = this.entanglement.get(qubitIndex1);
        const group2 = this.entanglement.get(qubitIndex2);

        if (group1 && group2) {
            if (group1 === group2) return; // Already in the same group
            // Merge group2 into group1
            for (const qubit of group2) {
                group1.add(qubit);
                this.entanglement.set(qubit, group1); // Update mapping for merged qubits
            }
        } else if (group1) {
            group1.add(qubitIndex2);
            this.entanglement.set(qubitIndex2, group1);
        } else if (group2) {
            group2.add(qubitIndex1);
            this.entanglement.set(qubitIndex1, group2);
        } else {
            // Create a new entanglement group
            const newGroup = new Set([qubitIndex1, qubitIndex2]);
            this.entanglement.set(qubitIndex1, newGroup);
            this.entanglement.set(qubitIndex2, newGroup);
        }
    }

    /**
     * Checks if two qubits are entangled.
     * @param {number} qubitIndex1
     * @param {number} qubitIndex2
     * @returns {boolean}
     */
    areEntangled(qubitIndex1, qubitIndex2) {
        const group1 = this.entanglement.get(qubitIndex1);
        return group1 ? group1.has(qubitIndex2) : false;
    }

    /**
     * Gets the set of qubits entangled with the given qubit.
     * @param {number} qubitIndex
     * @returns {Set<number> | undefined}
     */
    getEntangledGroup(qubitIndex) {
        return this.entanglement.get(qubitIndex);
    }
    
    /**
     * Marks all qubits in this tensor as entangled with all qubits in another tensor.
     * @param {QTensorSparse|QTensor} otherTensor - The other tensor to entangle with.
     */
    _markEntangledWithTensor(otherTensor) {
        if (!otherTensor || !otherTensor.numQubits) return;

        // Create a combined group concept (similar to QTensor implementation)
        if (this.numQubits > 1) {
            for (let i = 0; i < this.numQubits; i++) {
                for (let j = i + 1; j < this.numQubits; j++) {
                    this._markEntangled(i, j);
                }
            }
        }
        
        console.warn("QTensorSparse._markEntangledWithTensor: Entanglement map update is conceptual for cross-tensor links.");
    }
}
