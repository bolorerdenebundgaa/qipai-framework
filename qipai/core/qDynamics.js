/**
 * qDynamics.js
 * Handles continuous time evolution of quantum states based on Hamiltonians.
 * Implements Schrödinger equation simulation: d/dt |ψ> = -i/ħ H |ψ>
 * (We can assume ħ=1 for simplicity in simulation units).
 */

import { QTensor } from './qTensor.js';
import * as qMath from '../math/qmath.js';

/**
 * Evolves a QTensor state under a given Hamiltonian for a specific time duration.
 * Uses simple Euler method or could be extended to Runge-Kutta methods.
 * d|ψ>/dt = -i * H |ψ>  =>  |ψ(t+Δt)> ≈ |ψ(t)> - i * Δt * H |ψ(t)>
 *
 * @param {QTensor} initialTensor - The initial quantum state.
 * @param {Array<Array<{re: number, im: number}>>} hamiltonian - The Hamiltonian matrix.
 * @param {number} timeDuration - The total time to evolve for.
 * @param {number} timeStep - The small time step for numerical integration.
 * @returns {QTensor} The evolved quantum state.
 */
export function evolveState(initialTensor, hamiltonian, timeDuration, timeStep) {
    if (!(initialTensor instanceof QTensor)) {
        throw new Error("Initial state must be a QTensor instance.");
    }
    // TODO: Validate Hamiltonian dimensions against initialTensor.dimension

    let currentStateVector = initialTensor.amplitudes;
    const numSteps = Math.max(1, Math.round(timeDuration / timeStep));
    const dt = timeDuration / numSteps;
    const negI_dt = qMath.complex(0, -dt); // -i * Δt

    for (let step = 0; step < numSteps; step++) {
        // Calculate H |ψ(t)>
        const H_psi = qMath.applyMatrix(hamiltonian, currentStateVector);

        // Calculate -i * Δt * H |ψ(t)>
        const deltaPsi = H_psi.map(amp => qMath.multiply(negI_dt, amp));

        // Calculate |ψ(t+Δt)> = |ψ(t)> + Δψ
        currentStateVector = qMath.interfere(currentStateVector, deltaPsi); // interfere is vector addition

        // Optional: Re-normalize at each step or less frequently to control numerical error
        // currentStateVector = qMath.normalize(currentStateVector);
    }

    // Normalize at the end
    currentStateVector = qMath.normalize(currentStateVector);

    // Create a new QTensor for the final state
    const finalTensor = new QTensor(currentStateVector, {
        isNormalized: true, // We normalized it
        entanglementMap: initialTensor.entanglement // Evolution doesn't change entanglement structure directly
    });

    return finalTensor;
}

// TODO: Implement more sophisticated integration methods (e.g., Runge-Kutta 4).
// TODO: Handle time-dependent Hamiltonians.
// TODO: Explore matrix exponentiation methods (e.g., exp(-iHt)) for exact evolution if feasible.
