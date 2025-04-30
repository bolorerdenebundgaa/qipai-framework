/**
 * qEntangle.js
 * Functions related to creating and manipulating entangled quantum states.
 */

import { QTensor } from './qTensor.js';
import { QCircuit } from './qCircuit.js';
import * as qMath from '../math/qmath.js';
// We might need gate definitions here eventually
// import { H, CNOT } from './gates.js';

/**
 * Creates one of the four standard Bell states.
 * Bell states are maximally entangled states of two qubits.
 * |Φ+> = (|00> + |11>) / sqrt(2)
 * |Φ-> = (|00> - |11>) / sqrt(2)
 * |Ψ+> = (|01> + |10>) / sqrt(2)
 * |Ψ-> = (|01> - |10>) / sqrt(2)
 *
 * @param {'Phi+' | 'Phi-' | 'Psi+' | 'Psi-'} type - The type of Bell state to create.
 * @returns {QTensor} A QTensor instance representing the Bell state.
 */
export function createBellState(type) {
    const sqrt1_2 = Math.SQRT1_2; // 1 / sqrt(2)
    let amplitudes = [
        qMath.complex(0, 0), // |00>
        qMath.complex(0, 0), // |01>
        qMath.complex(0, 0), // |10>
        qMath.complex(0, 0)  // |11>
    ];

    switch (type) {
        case 'Phi+':
            amplitudes[0] = qMath.complex(sqrt1_2, 0); // |00>
            amplitudes[3] = qMath.complex(sqrt1_2, 0); // |11>
            break;
        case 'Phi-':
            amplitudes[0] = qMath.complex(sqrt1_2, 0);  // |00>
            amplitudes[3] = qMath.complex(-sqrt1_2, 0); // -|11>
            break;
        case 'Psi+':
            amplitudes[1] = qMath.complex(sqrt1_2, 0); // |01>
            amplitudes[2] = qMath.complex(sqrt1_2, 0); // |10>
            break;
        case 'Psi-':
            amplitudes[1] = qMath.complex(sqrt1_2, 0);  // |01>
            amplitudes[2] = qMath.complex(-sqrt1_2, 0); // -|10>
            break;
        default:
            throw new Error(`Unknown Bell state type: ${type}`);
    }

    // Manually create the entanglement map for a 2-qubit Bell state
    const entanglementMap = new Map();
    const group = new Set([0, 1]);
    entanglementMap.set(0, group);
    entanglementMap.set(1, group);

    return new QTensor(amplitudes, { isNormalized: true, entanglementMap });
}

/**
 * Creates a GHZ (Greenberger–Horne–Zeilinger) state for N qubits.
 * GHZ state = (|00...0> + |11...1>) / sqrt(2)
 *
 * @param {number} numQubits - The number of qubits (must be >= 2).
 * @returns {QTensor} A QTensor instance representing the GHZ state.
 */
export function createGHZState(numQubits) {
    if (numQubits < 2) {
        throw new Error("GHZ state requires at least 2 qubits.");
    }
    const dimension = 2 ** numQubits;
    const sqrt1_2 = Math.SQRT1_2;
    let amplitudes = new Array(dimension).fill(qMath.complex(0, 0));

    amplitudes[0] = qMath.complex(sqrt1_2, 0);             // |00...0> state
    amplitudes[dimension - 1] = qMath.complex(sqrt1_2, 0); // |11...1> state

    // Create entanglement map for GHZ state (all qubits entangled)
    const entanglementMap = new Map();
    const group = new Set();
    for (let i = 0; i < numQubits; i++) {
        group.add(i);
    }
    for (let i = 0; i < numQubits; i++) {
        entanglementMap.set(i, group);
    }


    return new QTensor(amplitudes, { isNormalized: true, entanglementMap });
}


// Note: Entanglement can also be generated dynamically using gates like CNOT
// within a QCircuit simulation. The QTensor._markEntangled method is used there.
// These functions provide ways to create specific known entangled states directly.

// TODO: Add functions to quantify entanglement (e.g., concurrence, entropy of entanglement).
// TODO: Add functions for entanglement swapping protocols.
