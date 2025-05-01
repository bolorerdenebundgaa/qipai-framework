/**
 * qTensor.js
 * Represents a quantum state vector (tensor) using complex amplitudes.
 * Handles state representation, normalization, and potentially entanglement metadata.
 */

import * as qMath from '../math/qmath.js';
import { measureQubit } from './qMeasure.js'; // Import measurement function (Corrected name)

export class QTensor {
    /**
     * Creates a QTensor instance.
     * @param {Array<{re: number, im: number}> | number} initialState -
     *        Either an array of complex amplitudes representing the state,
     *        or the number of qubits to initialize (defaults to |0...0> state).
     * @param {object} options - Optional configuration.
     * @param {boolean} options.isNormalized - Skip normalization if true (default: false).
     * @param {Map<number, Set<number>>} options.entanglementMap - Initial entanglement info.
     */
    constructor(initialState, options = {}) {
        this.stateVector = []; // Array of complex numbers {re, im}
        this.numQubits = 0;
        // Map where key is qubit index, value is a Set of qubit indices it's entangled with.
        this.entanglement = options.entanglementMap || new Map();

        if (typeof initialState === 'number') {
            // Initialize |0...0> state for N qubits
            this.numQubits = initialState;
            const dimension = 2 ** this.numQubits;
            this.stateVector = new Array(dimension).fill(qMath.complex(0, 0));
            if (dimension > 0) {
                this.stateVector[0] = qMath.complex(1, 0); // |0...0> state
            }
        } else if (Array.isArray(initialState)) {
            // Initialize with provided state vector
            const dimension = initialState.length;
            // Basic check for power of 2 dimension
            if (dimension > 0 && (dimension & (dimension - 1)) !== 0) {
                 console.warn(`Warning: Initial state vector dimension (${dimension}) is not a power of 2.`);
                 // Decide how to handle: error, pad, or proceed? For now, proceed.
            }
            this.numQubits = Math.log2(dimension); // This might not be integer if not power of 2
            this.stateVector = initialState.map(c => qMath.complex(c.re, c.im)); // Ensure complex objects

            if (!options.isNormalized) {
                this.normalize();
            }
        } else {
            throw new Error("Invalid initialState: Must be number of qubits or state vector array.");
        }

        // TODO: Implement sparse representation logic if needed for efficiency.
    }

    /**
     * Normalizes the state vector.
     */
    normalize() {
        this.stateVector = qMath.normalize(this.stateVector);
    }

    /**
     * Returns the number of qubits represented by this tensor.
     * @returns {number}
     */
    get qubitCount() {
        return this.numQubits;
    }

    /**
     * Returns the dimension (size) of the state vector (2^numQubits).
     * @returns {number}
     */
    get dimension() {
        return this.stateVector.length;
    }

    /**
     * Returns a copy of the state vector amplitudes.
     * @returns {Array<{re: number, im: number}>}
     */
    get amplitudes() {
        // Return a copy to prevent external modification
        return this.stateVector.map(c => ({ ...c }));
    }

    /**
     * Updates the internal state vector. Use with caution.
     * Primarily for use by qCircuit, qDynamics, etc.
     * @param {Array<{re: number, im: number}>} newStateVector
     * @param {boolean} skipNormalization - Optionally skip normalization.
     */
    _updateState(newStateVector, skipNormalization = false) {
        if (newStateVector.length !== this.dimension) {
            throw new Error("New state vector dimension must match current dimension.");
        }
        this.stateVector = newStateVector;
        if (!skipNormalization) {
            this.normalize();
        }
    }

    // --- Entanglement Methods ---

    /**
     * Marks two qubits as entangled.
     * @param {number} qubitIndex1
     * @param {number} qubitIndex2
     */
    _markEntangled(qubitIndex1, qubitIndex2) {
        if (qubitIndex1 === qubitIndex2 || qubitIndex1 < 0 || qubitIndex2 < 0 || qubitIndex1 >= this.numQubits || qubitIndex2 >= this.numQubits) {
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
     * This updates the internal entanglement map for *this* tensor only.
     * The corresponding method should be called on the other tensor as well.
     * Note: This assumes qubit indices are local to each tensor for the map,
     * but conceptually links the entire systems. A tensor product representation
     * would handle global indices more formally.
     * @param {QTensor} otherTensor - The other tensor to entangle with.
     */
    _markEntangledWithTensor(otherTensor) {
        if (!otherTensor || !(otherTensor instanceof QTensor)) return;

        const ownQubitIndices = Array.from({ length: this.numQubits }, (_, i) => i);
        const otherQubitIndices = Array.from({ length: otherTensor.numQubits }, (_, i) => i);

        // Create a combined group concept (even if indices are local)
        // For simplicity, just ensure all own qubits are linked together if they weren't already
        // This is a simplification; a true entanglement map might need global indices.
        if (this.numQubits > 1) {
            for (let i = 0; i < this.numQubits; i++) {
                for (let j = i + 1; j < this.numQubits; j++) {
                    this._markEntangled(i, j);
                }
            }
        }
         // Add a conceptual link marker (optional, depends on how map is used)
         // Example: this.entanglement.set(-1, new Set([-1])); // Marker for external entanglement
         console.warn("QTensor._markEntangledWithTensor: Entanglement map update is conceptual for cross-tensor links.");
    }


    // TODO: Add methods for tensor product (combining QTensor instances).
    // TODO: Add methods for partial trace (reducing QTensor instances).
    /**
     * Gets the complex amplitude for a specific basis state index.
     * @param {number} index - The index of the basis state (0 to 2^numQubits - 1).
     * @returns {{re: number, im: number}} The complex amplitude.
     */
    getAmplitude(index) {
        if (index < 0 || index >= this.dimension) {
            throw new Error(`Amplitude index ${index} out of bounds for dimension ${this.dimension}`);
        }
        // Return a copy to prevent external modification
        const amp = this.stateVector[index];
        return { re: amp.re, im: amp.im };
    }

    /**
     * Creates a deep copy of this QTensor instance.
     * @returns {QTensor} A new QTensor instance with the same state and entanglement.
     */
    clone() {
        const clonedVector = this.stateVector.map(c => ({ ...c }));
        const clonedEntanglement = new Map();
        // Deep copy the entanglement map (Sets are copied by reference, which is okay here)
        this.entanglement.forEach((groupSet, qubitIndex) => {
            clonedEntanglement.set(qubitIndex, groupSet);
        });
        return new QTensor(clonedVector, {
            isNormalized: true, // Already normalized
            entanglementMap: clonedEntanglement
        });
    }

    /**
     * Performs a measurement on the quantum state.
     * This collapses the state to one of the basis states based on probabilities.
     * @param {Array<number>} [qubitsToMeasure] - Optional array of qubit indices to measure. If omitted, measures all qubits.
     * @returns {QTensor} The collapsed state after measurement (this instance is modified).
     */
    measure(qubitsToMeasure = null) {
        // Determine which qubits to measure
        let measuredQubits = [];
        if (qubitsToMeasure === null) {
            // Measure all qubits if none specified
            measuredQubits = Array.from({ length: this.numQubits }, (_, i) => i);
        } else if (Array.isArray(qubitsToMeasure)) {
            measuredQubits = qubitsToMeasure;
        } else if (typeof qubitsToMeasure === 'number') {
            measuredQubits = [qubitsToMeasure];
        } else {
            throw new Error("Invalid qubitsToMeasure argument. Must be null, number, or array.");
        }

        // Sequentially measure each specified qubit.
        // measureQubit now modifies 'this' tensor in place and returns the outcome (0 or 1).
        // Note: Sequential measurement is not the same as simultaneous multi-qubit measurement,
        // but it's a common simulation approach.
        for (const qubitIndex of measuredQubits) {
             if (qubitIndex < 0 || qubitIndex >= this.numQubits) {
                 console.warn(`Skipping measurement of invalid qubit index: ${qubitIndex}`);
                 continue;
             }
             // measureQubit modifies 'this' tensor directly
             measureQubit(this, qubitIndex);
        }

        // After all measurements, the state vector in 'this' is collapsed.
        // Find the index of the single non-zero amplitude which represents the outcome.
        let collapsedIndex = -1;
        for (let i = 0; i < this.dimension; i++) {
            const amp = this.stateVector[i];
            // Check if the squared magnitude is close to 1
            if (qMath.squaredMagnitude(amp) > 0.9999) {
                collapsedIndex = i;
                break;
            }
        }

        if (collapsedIndex === -1) {
             // This might happen due to floating point errors or if the state was invalid.
             console.warn("Could not definitively determine collapsed state index after measurement. Finding largest amplitude.");
             // Fallback: find the index with the largest probability
             let maxProb = -1;
             for (let i = 0; i < this.dimension; i++) {
                 const prob = qMath.squaredMagnitude(this.stateVector[i]);
                 if (prob > maxProb) {
                     maxProb = prob;
                     collapsedIndex = i;
                 }
             }
             if (collapsedIndex === -1) collapsedIndex = 0; // Final fallback
        }

        // Store the final collapsed index for toBitString()
        this._lastMeasurementOutcome = collapsedIndex;

        return this; // Return the modified instance (now collapsed)
    }

    /**
     * Converts the last measurement outcome to a bit string.
     * Assumes measure() was called immediately before.
     * @returns {string} The bit string representation of the measurement outcome.
     */
    toBitString() {
        if (this._lastMeasurementOutcome === undefined || this._lastMeasurementOutcome === null) {
            throw new Error("No measurement outcome available. Call measure() first.");
        }
        const bitString = this._lastMeasurementOutcome.toString(2).padStart(this.numQubits, '0');
        // Clear the temporary outcome
        // delete this._lastMeasurementOutcome;
        return bitString;
    }

    // TODO: Add methods for tensor product (combining QTensor instances).
    // TODO: Add methods for partial trace (reducing QTensor instances).
}
