/**
 * qMeasure.js
 * Handles measurement simulation on QTensor states.
 * Calculates probabilities and collapses the state vector based on measurement outcomes.
 */

import { QTensor } from './qTensor.js';
import * as qMath from '../math/qmath.js';

/**
 * Calculates the probability of measuring a specific qubit in the |1> state.
 * Assumes measurement in the computational (Z) basis.
 * P(qubit_k = 1) = Σ |amplitude_i|^2 for all states i where qubit k is 1.
 *
 * @param {QTensor} tensor - The quantum state.
 * @param {number} qubitIndex - The index of the qubit to measure (0 to numQubits-1).
 * @returns {number} The probability of measuring |1>.
 */
export function probabilityOfOne(tensor, qubitIndex) {
    if (!(tensor instanceof QTensor) || qubitIndex < 0 || qubitIndex >= tensor.qubitCount) {
        throw new Error("Invalid input for probability calculation.");
    }

    const amplitudes = tensor.amplitudes;
    const dimension = tensor.dimension;
    let prob = 0;
    const bitMask = 1 << (tensor.qubitCount - 1 - qubitIndex); // Mask to check the qubit's value

    for (let i = 0; i < dimension; i++) {
        if ((i & bitMask) !== 0) { // Check if the qubit at qubitIndex is 1
            const amp = amplitudes[i];
            prob += amp.re ** 2 + amp.im ** 2; // Add |amplitude|^2
        }
    }
    // Due to potential floating point errors, clamp the probability
    return Math.max(0, Math.min(1, prob));
}

/**
 * Performs a measurement on a single qubit in the computational (Z) basis.
 * Collapses the state vector according to the outcome and returns the measurement outcome.
 *
 * @param {QTensor} tensor - The quantum state to measure. This object WILL BE MODIFIED in place.
 * @param {number} qubitIndex - The index of the qubit to measure.
 * @returns {0 | 1} - The measurement outcome (0 or 1).
 */
export function measureQubit(tensor, qubitIndex) {
    // Note: This function now modifies the tensor object directly.
    if (!(tensor instanceof QTensor) || qubitIndex < 0 || qubitIndex >= tensor.qubitCount) {
        throw new Error("Invalid input for measurement.");
    }

    const prob1 = probabilityOfOne(tensor, qubitIndex);
    const rand = Math.random();
    const outcome = rand < prob1 ? 1 : 0;

    // Use the internal stateVector directly for modification
    const stateVector = tensor.stateVector;
    const dimension = tensor.dimension;
    let normSquared = 0;
    const bitMask = 1 << (tensor.qubitCount - 1 - qubitIndex);

    // Zero out amplitudes that don't match the outcome
    for (let i = 0; i < dimension; i++) {
        const qubitValue = (i & bitMask) !== 0 ? 1 : 0;
        if (qubitValue === outcome) {
            // Keep this amplitude for now
            normSquared += stateVector[i].re ** 2 + stateVector[i].im ** 2;
        } else {
            // Zero out this amplitude
            stateVector[i] = qMath.complex(0, 0);
        }
    }

    // Normalize the remaining state vector (in place)
    const norm = Math.sqrt(normSquared);
    if (norm > 1e-10) { // Avoid division by zero or near-zero
        const invNorm = 1.0 / norm;
        for (let i = 0; i < dimension; i++) {
             // Only divide the non-zero elements (those matching the outcome)
             const qubitValue = (i & bitMask) !== 0 ? 1 : 0;
             if (qubitValue === outcome) {
                 stateVector[i] = {
                    re: stateVector[i].re * invNorm,
                    im: stateVector[i].im * invNorm
                 };
             }
        }
    } else {
         // This case should ideally not happen for valid quantum states if prob calculation is correct
         console.warn("Warning: Collapsed state norm is near zero after measurement.");
         // If the norm is zero, the state is invalid. We might need to handle this,
         // but for now, the state vector is already all zeros.
    }

    // TODO: Refine entanglement map updates after measurement.
    // Measurement typically breaks entanglement involving the measured qubit.
    // A simple approach: remove the measured qubit from all entanglement sets.
    tensor.entanglement.delete(qubitIndex);
    tensor.entanglement.forEach((group) => {
        group.delete(qubitIndex);
    });

    // Return only the outcome, as the tensor object itself is modified.
    return outcome;
}


// TODO: Implement measurement in different bases (e.g., X, Y) by applying basis change gates first.
// TODO: Implement measurement of multiple qubits simultaneously.
// TODO: Implement partial measurement (measuring a subset of qubits).
// TODO: Refine entanglement map updates after measurement.
