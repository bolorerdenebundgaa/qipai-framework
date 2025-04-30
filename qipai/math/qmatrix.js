// Matrix operations for quantum gates and Hamiltonians will go here.
// Examples: matrix-vector multiplication, matrix-matrix multiplication,
// tensor product, matrix exponentiation, etc.

import * as qComplex from './qcomplex.js';

/**
 * Applies a matrix (gate) to a vector (state).
 * Assumes matrix dimensions match vector length.
 * @param {Array<Array<{re: number, im: number}>>} matrix The matrix (gate).
 * @param {Array<{re: number, im: number}>} vector The vector (state).
 * @returns {Array<{re: number, im: number}>} The resulting vector.
 */
export function applyMatrix(matrix, vector) {
    const numRows = matrix.length;
    if (numRows === 0) return [];
    const numCols = matrix[0].length;

    if (numCols !== vector.length) {
        throw new Error(`Matrix columns (${numCols}) must match vector length (${vector.length}).`);
    }

    const resultVector = new Array(numRows).fill(null).map(() => qComplex.complex(0, 0));

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            const product = qComplex.multiply(matrix[i][j], vector[j]);
            resultVector[i] = qComplex.add(resultVector[i], product);
        }
    }

    return resultVector;
}

/**
 * Calculates the tensor product (Kronecker product) of two matrices A ⊗ B.
 * If A is m x n and B is p x q, the result is mp x nq.
 * @param {Array<Array<{re: number, im: number}>>} matrixA
 * @param {Array<Array<{re: number, im: number}>>} matrixB
 * @returns {Array<Array<{re: number, im: number}>>} The resulting tensor product matrix.
 */
export function tensorProduct(matrixA, matrixB) {
    const m = matrixA.length;
    if (m === 0) return [];
    const n = matrixA[0].length;
    const p = matrixB.length;
    if (p === 0) return [];
    const q = matrixB[0].length;

    const resultMatrix = new Array(m * p);

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            const a_ij = matrixA[i][j];
            for (let k = 0; k < p; k++) {
                const row_index = i * p + k;
                if (!resultMatrix[row_index]) {
                    resultMatrix[row_index] = new Array(n * q);
                }
                for (let l = 0; l < q; l++) {
                    const b_kl = matrixB[k][l];
                    const col_index = j * q + l;
                    resultMatrix[row_index][col_index] = qComplex.multiply(a_ij, b_kl);
                }
            }
        }
    }
    return resultMatrix;
}


// TODO: Implement matrix multiplication.
// TODO: Implement matrix exponentiation (for Hamiltonian evolution).
