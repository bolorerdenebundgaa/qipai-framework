/**
 * gates.js
 * Definitions of standard quantum gates.
 */

import * as qMath from '../math/qmath.js';

const SQRT1_2 = Math.SQRT1_2; // 1 / sqrt(2)

// --- Single Qubit Gates ---

// Identity Gate (I)
export const I = {
    name: 'I',
    matrix: [
        [qMath.complex(1, 0), qMath.complex(0, 0)],
        [qMath.complex(0, 0), qMath.complex(1, 0)]
    ]
};

// Pauli-X Gate (NOT Gate)
export const X = {
    name: 'X',
    matrix: [
        [qMath.complex(0, 0), qMath.complex(1, 0)],
        [qMath.complex(1, 0), qMath.complex(0, 0)]
    ]
};

// Pauli-Y Gate
export const Y = {
    name: 'Y',
    matrix: [
        [qMath.complex(0, 0), qMath.complex(0, -1)], // -i
        [qMath.complex(0, 1), qMath.complex(0, 0)]  // i
    ]
};

// Pauli-Z Gate
export const Z = {
    name: 'Z',
    matrix: [
        [qMath.complex(1, 0), qMath.complex(0, 0)],
        [qMath.complex(0, 0), qMath.complex(-1, 0)]
    ]
};

// Hadamard Gate (H)
export const H = {
    name: 'H',
    matrix: [
        [qMath.complex(SQRT1_2, 0), qMath.complex(SQRT1_2, 0)],
        [qMath.complex(SQRT1_2, 0), qMath.complex(-SQRT1_2, 0)]
    ]
};

// Phase Gate (S) - sqrt(Z)
export const S = {
    name: 'S',
    matrix: [
        [qMath.complex(1, 0), qMath.complex(0, 0)],
        [qMath.complex(0, 0), qMath.complex(0, 1)] // i
    ]
};

// S† Gate (conjugate transpose of S)
export const Sdg = {
    name: 'Sdg',
    matrix: [
        [qMath.complex(1, 0), qMath.complex(0, 0)],
        [qMath.complex(0, 0), qMath.complex(0, -1)] // -i
    ]
};

// T Gate - sqrt(S)
export const T = {
    name: 'T',
    matrix: [
        [qMath.complex(1, 0), qMath.complex(0, 0)],
        [qMath.complex(0, 0), qMath.expi(Math.PI / 4)] // e^(i*pi/4)
    ]
};

// T† Gate
export const Tdg = {
    name: 'Tdg',
    matrix: [
        [qMath.complex(1, 0), qMath.complex(0, 0)],
        [qMath.complex(0, 0), qMath.expi(-Math.PI / 4)] // e^(-i*pi/4)
    ]
};


// --- Multi-Qubit Gates (Defined for reference, application requires tensor products) ---

// Controlled-NOT Gate (CNOT / CX) - Matrix for 2 qubits
// Control=0, Target=1: |00>->|00>, |01>->|01>, |10>->|11>, |11>->|10>
// Matrix acts on basis |00>, |01>, |10>, |11>
export const CNOT_matrix = [
    [qMath.complex(1,0), qMath.complex(0,0), qMath.complex(0,0), qMath.complex(0,0)],
    [qMath.complex(0,0), qMath.complex(1,0), qMath.complex(0,0), qMath.complex(0,0)],
    [qMath.complex(0,0), qMath.complex(0,0), qMath.complex(0,0), qMath.complex(1,0)],
    [qMath.complex(0,0), qMath.complex(0,0), qMath.complex(1,0), qMath.complex(0,0)]
];
export const CNOT = { name: 'CNOT', matrix: CNOT_matrix, size: 2 }; // Indicate size for multi-qubit

// TODO: Add other gates like SWAP, Controlled-Z, Toffoli, parameterized gates (PhaseShift, RotationZ)
