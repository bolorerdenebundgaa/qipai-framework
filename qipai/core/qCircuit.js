/**
 * qCircuit.js
 * Defines and simulates quantum circuits by applying gates to QTensor instances.
 */

import { QTensor } from './qTensor.js';
import * as qMath from '../math/qmath.js';
import * as Gates from './gates.js'; // Import defined gates

export class QCircuit {
    /**
     * Creates a QCircuit instance.
     * @param {number} numQubits - The number of qubits the circuit will operate on.
     */
    constructor(numQubits) {
        if (numQubits <= 0) {
            throw new Error("Number of qubits must be positive.");
        }
        this.numQubits = numQubits;
        this.gates = []; // Array of gate operations { gate: GateObject, targets: [qIndex], controls?: [qIndex] }
    }

    /**
     * Adds a gate operation to the circuit sequence.
     * @param {object} gate - The gate object (e.g., H, X, CNOT). Needs definition.
     * @param {Array<number>} targetQubits - Indices of the target qubit(s).
     * @param {Array<number>} controlQubits - Indices of the control qubit(s) (optional).
     */
    addGate(gate, targetQubits, controlQubits = []) {
        // TODO: Validate gate, targets, controls against numQubits
        this.gates.push({ gate, targets: targetQubits, controls: controlQubits });
        return this; // Allow chaining
    }

    /**
     * Runs the circuit simulation on a given initial QTensor state.
     * @param {QTensor} initialTensor - The initial quantum state.
     * @returns {QTensor} The final quantum state after applying all gates.
     */
    run(initialTensor) {
        if (!(initialTensor instanceof QTensor)) {
            throw new Error("Initial state must be a QTensor instance.");
        }
        if (initialTensor.qubitCount !== this.numQubits) {
            throw new Error(`Circuit numQubits (${this.numQubits}) does not match initialTensor qubitCount (${initialTensor.qubitCount}).`);
        }

        let currentStateVector = initialTensor.amplitudes; // Get a copy

        for (const operation of this.gates) {
            const op = operation; // Alias for clarity
            if (!op.gate || !op.gate.matrix) {
                console.warn(`Skipping operation with invalid gate definition: ${op.gate?.name}`);
                continue;
            }

            // Construct the full unitary matrix for the operation
            const unitary = this._getOperationUnitary(op.gate, op.targets, op.controls);

            // Apply the unitary matrix to the current state vector
            currentStateVector = qMath.applyMatrix(unitary, currentStateVector);

            // Update entanglement map for relevant gates (e.g., CNOT)
            // TODO: Implement robust entanglement tracking based on gate type
            if (op.gate.name === 'CNOT' && op.controls.length === 1 && op.targets.length === 1) {
               initialTensor._markEntangled(op.controls[0], op.targets[0]);
               console.log(`Marked entanglement between control ${op.controls[0]} and target ${op.targets[0]} for CNOT.`);
            } else if (op.gate.name === 'H') {
                // Hadamard on one qubit doesn't break entanglement with others, but might initiate it if applied correctly in Bell state prep
            }
            // Other gates might break entanglement if acting on only part of an entangled group - complex!

            console.log(`Applied gate ${op.gate.name} to target(s) ${op.targets}${op.controls.length > 0 ? ` controlled by ${op.controls}` : ''}`);
        }

        // Create a new QTensor for the final state
        // Pass the entanglement map from the original tensor (or an updated one)
        const finalTensor = new QTensor(currentStateVector, {
            isNormalized: true, // Assume gates preserve normalization (or re-normalize if needed)
            entanglementMap: initialTensor.entanglement // Pass potentially updated map
        });

        return finalTensor;
    }

    /**
     * (Private) Constructs the full unitary matrix for a gate operation.
     * This is a complex part involving tensor products.
     * @param {object} gate - The gate definition.
     * @param {Array<number>} targets - Target qubit indices.
     * @param {Array<number>} controls - Control qubit indices (currently ignored for single-qubit gates).
     * @returns {Array<Array<{re: number, im: number}>>} The full N-qubit unitary matrix.
     */
    /**
     * Constructs the unitary matrix for a gate operation on specific qubits.
     * @param {object} gate - The gate definition.
     * @param {Array<number>} targets - Target qubit indices.
     * @param {Array<number>} controls - Control qubit indices.
     * @returns {Array<Array<{re: number, im: number}>>} The full N-qubit unitary matrix.
     */
    _getOperationUnitary(gate, targets, controls = []) {
        // Validate target and control indices
        for (const idx of [...targets, ...controls]) {
            if (idx < 0 || idx >= this.numQubits) {
                throw new Error(`Qubit index ${idx} is out of bounds for ${this.numQubits} qubits.`);
            }
        }

        // --- Case 1: Single-qubit gate with no controls ---
        if (targets.length === 1 && controls.length === 0) {
            const targetQubit = targets[0];
            return this._constructSingleQubitGateMatrix(gate.matrix, targetQubit);
        }
        // --- Case 2: Controlled single-qubit gate (e.g., CNOT) ---
        else if (targets.length === 1 && controls.length === 1) {
            const targetQubit = targets[0];
            const controlQubit = controls[0];
            return this._constructControlledGateMatrix(gate.matrix, controlQubit, targetQubit);
        }
        // --- Case 3: Special case for 2-qubit CNOT with specific indices ---
        else if (gate.name === 'CNOT' && this.numQubits === 2 && targets.length === 1 && controls.length === 1) {
            // Direct 2-qubit CNOT
            const targetQubit = targets[0];
            const controlQubit = controls[0];
            
            // Standard CNOT is defined for control=0, target=1
            if (controlQubit === 0 && targetQubit === 1) {
                return Gates.CNOT_matrix;
            }
            // For control=1, target=0 we need to permute the matrix
            else if (controlQubit === 1 && targetQubit === 0) {
                // SWAP the middle rows/columns of the standard CNOT matrix
                // This is a simplified approach for the 2-qubit case only
                const cnot = Gates.CNOT_matrix;
                return [
                    [...cnot[0]],              // |00⟩ unchanged
                    [...cnot[2]],              // |01⟩ becomes |10⟩
                    [...cnot[1]],              // |10⟩ becomes |01⟩
                    [...cnot[3]]               // |11⟩ unchanged
                ];
            }
        }
        // --- Case 4: Unsupported gate configuration ---
        else {
            throw new Error(`Gate application for gate ${gate.name} with targets ${targets} and controls ${controls} not implemented.`);
        }
    }

    /**
     * Constructs matrix for single-qubit gate at specified position
     * @private
     */
    _constructSingleQubitGateMatrix(gateMatrix, targetQubit) {
        let finalMatrix = null;
        for (let i = 0; i < this.numQubits; i++) {
            const currentMatrix = (i === targetQubit) ? gateMatrix : Gates.I.matrix; // I for non-target qubits
            if (finalMatrix === null) {
                finalMatrix = currentMatrix;
            } else {
                // For quantum circuits, tensor products must be applied in reverse qubit order:
                // qubit 0 is the most significant (leftmost in state notation)
                finalMatrix = qMath.tensorProduct(finalMatrix, currentMatrix);
            }
        }
        return finalMatrix;
    }

    /**
     * Constructs controlled gate matrix for specified control and target qubits
     * @private
     */
    _constructControlledGateMatrix(gateMatrix, controlQubit, targetQubit) {
        // This method only handles simple controlled gates on qubits that are
        // adjacent or where the circuit has just two qubits

        // For 2-qubit systems, use dedicated controlled matrices if defined
        if (this.numQubits === 2) {
            if (controlQubit === 0 && targetQubit === 1 && gateMatrix === Gates.X.matrix) {
                return Gates.CNOT_matrix;
            }
            // Other special cases could be added here
        }

        // For the general case, we need to construct projectors
        // |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U
        // This implementation only handles adjacent qubits or the 2-qubit case
        if (Math.abs(controlQubit - targetQubit) === 1 || this.numQubits === 2) {
            // Projector matrices for control qubit
            const proj0 = [[qMath.complex(1, 0), qMath.complex(0, 0)], [qMath.complex(0, 0), qMath.complex(0, 0)]]; // |0⟩⟨0|
            const proj1 = [[qMath.complex(0, 0), qMath.complex(0, 0)], [qMath.complex(0, 0), qMath.complex(1, 0)]]; // |1⟩⟨1|
            
            // When control=0 doesn't affect target, apply I
            // When control=1 applies gate U to target
            const identityTerm = this._constructSingleQubitGateMatrix(Gates.I.matrix, targetQubit);
            const gateTerm = this._constructSingleQubitGateMatrix(gateMatrix, targetQubit);
            
            // Apply control projectors - crude approximation for adjacent qubits
            let controlledMatrix = [];
            const dim = identityTerm.length;

            // Split the matrix into two parts based on control qubit value
            const halfDim = dim / 2;
            
            // First half (control = |0⟩) - apply identity
            for (let i = 0; i < halfDim; i++) {
                controlledMatrix.push([]);
                for (let j = 0; j < dim; j++) {
                    const value = (j < halfDim) ? identityTerm[i][j] : qMath.complex(0, 0);
                    controlledMatrix[i].push(value);
                }
            }
            
            // Second half (control = |1⟩) - apply gate
            for (let i = 0; i < halfDim; i++) {
                controlledMatrix.push([]);
                for (let j = 0; j < dim; j++) {
                    const value = (j >= halfDim) ? gateTerm[i + halfDim][j] : qMath.complex(0, 0);
                    controlledMatrix[i + halfDim].push(value);
                }
            }
            
            return controlledMatrix;
        }

        // Non-adjacent qubits in larger circuits would need a more complex approach
        throw new Error(`Controlled gate for non-adjacent qubits (control=${controlQubit}, target=${targetQubit}) not implemented.`);
    }

    // TODO: Add methods for circuit visualization (text-based or connecting to qipai-viz).
    // TODO: Add methods for circuit optimization.
    // TODO: Add methods to load/save circuit definitions.
}
