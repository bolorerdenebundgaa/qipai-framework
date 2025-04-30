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
 * Collapses the state vector according to the outcome and returns the result.
 *
 * @param {QTensor} tensor - The quantum state to measure. Will be modified (state collapsed).
 * @param {number} qubitIndex - The index of the qubit to measure.
 * @returns {{ outcome: 0 | 1, newState: QTensor }} - The measurement outcome (0 or 1)
 *                                                    and the new collapsed QTensor state.
 */
export function measureQubit(tensor, qubitIndex) {
    if (!(tensor instanceof QTensor) || qubitIndex < 0 || qubitIndex >= tensor.qubitCount) {
        throw new Error("Invalid input for measurement.");
    }

    const prob1 = probabilityOfOne(tensor, qubitIndex);
    const rand = Math.random();
    const outcome = rand < prob1 ? 1 : 0;

    const amplitudes = tensor.amplitudes;
    const dimension = tensor.dimension;
    const newAmplitudes = new Array(dimension).fill(qMath.complex(0, 0));
    let normSquared = 0;
    const bitMask = 1 << (tensor.qubitCount - 1 - qubitIndex);

    for (let i = 0; i < dimension; i++) {
        const qubitValue = (i & bitMask) !== 0 ? 1 : 0;
        if (qubitValue === outcome) {
            newAmplitudes[i] = amplitudes[i]; // Keep amplitude if it matches outcome
            normSquared += amplitudes[i].re ** 2 + amplitudes[i].im ** 2;
        }
        // Else: amplitude becomes 0 (already initialized)
    }

    // Normalize the collapsed state
    const norm = Math.sqrt(normSquared);
    if (norm > 1e-10) { // Avoid division by zero or near-zero
        for (let i = 0; i < dimension; i++) {
            if ((i & bitMask) !== 0 ? 1 : 0 === outcome) { // Check again to only divide non-zero elements
                 newAmplitudes[i] = {
                    re: newAmplitudes[i].re / norm,
                    im: newAmplitudes[i].im / norm
                 };
            }
        }
    } else {
         // This case should ideally not happen for valid quantum states if prob calculation is correct
         console.warn("Warning: Collapsed state norm is near zero after measurement.");
         // Handle potentially - e.g., return a specific state or throw error
    }


    // Create a new QTensor for the collapsed state
    // Note: Measurement can break entanglement. Updating the entanglement map accurately
    // after measurement is complex and depends on the specifics. For now, we pass the old map.
    // A more advanced implementation might remove the measured qubit from entanglement groups.
    const newState = new QTensor(newAmplitudes, {
        isNormalized: true, // We just normalized it
        entanglementMap: tensor.entanglement // TODO: Refine entanglement handling post-measurement
    });

    return { outcome, newState };
}


// TODO: Implement measurement in different bases (e.g., X, Y) by applying basis change gates first.
// TODO: Implement measurement of multiple qubits simultaneously.
// TODO: Implement partial measurement (measuring a subset of qubits).
// TODO: Refine entanglement map updates after measurement.
