/**
 * runtime/cpu.js
 * CPU execution backend using the custom math layer.
 * (Conceptual placeholder - most core logic already uses this via qMath)
 */

import * as qMath from '../math/qmath.js';
import { QTensor } from '../core/qTensor.js';
import { QCircuit } from '../core/qCircuit.js';
// etc.

export class CPURuntime {
    constructor() {
        console.log("CPURuntime initialized (uses default qMath).");
    }

    // Methods might wrap core functionalities or provide optimized CPU routines if needed.
    // For now, core modules directly use qMath which runs on CPU.

    applyGate(gateMatrix, stateVector) {
        // Directly use the math function
        return qMath.applyMatrix(gateMatrix, stateVector);
    }

    evolve(hamiltonian, stateVector, dt) {
         // Example using Euler step from qDynamics logic
         const H_psi = qMath.applyMatrix(hamiltonian, stateVector);
         const negI_dt = qMath.complex(0, -dt);
         const deltaPsi = H_psi.map(amp => qMath.multiply(negI_dt, amp));
         const newState = qMath.interfere(stateVector, deltaPsi);
         return qMath.normalize(newState); // Normalize after step
    }

    // Add other relevant operations if specific CPU optimizations are planned
}

// Export a default instance or allow creation
export const cpuRuntime = new CPURuntime();
