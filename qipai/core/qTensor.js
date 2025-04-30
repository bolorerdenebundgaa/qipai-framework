/**
 * qTensor.js
 * Represents a quantum state vector (tensor) using complex amplitudes.
 * Handles state representation, normalization, and potentially entanglement metadata.
 */

import * as qMath from '../math/qmath.js';

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
    // TODO: Add methods for accessing specific amplitudes (e.g., getAmplitude([0, 1])).
}
