import * as qComplex from './qcomplex.js';

/**
 * Normalizes a state vector (array of complex numbers).
 * @param {Array<{re: number, im: number}>} vec The vector to normalize.
 * @returns {Array<{re: number, im: number}>} The normalized vector.
 */
export function normalize(vec) {
  let sumOfSquares = 0;
  for (const v of vec) {
    sumOfSquares += v.re ** 2 + v.im ** 2;
  }
  const norm = Math.sqrt(sumOfSquares);

  if (norm === 0) {
    // Handle zero vector case if necessary, maybe return it as is or throw error
    return vec;
  }

  return vec.map(v => ({
    re: v.re / norm,
    im: v.im / norm,
  }));
}

/**
 * Performs element-wise addition (interference) of two vectors.
 * Assumes vectors are the same length.
 * @param {Array<{re: number, im: number}>} a First vector.
 * @param {Array<{re: number, im: number}>} b Second vector.
 * @returns {Array<{re: number, im: number}>} The resulting vector.
 */
export function interfere(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length for interference.");
  }
  return a.map((v, i) => qComplex.add(v, b[i]));
}

/**
 * Calculates the inner product (dot product) of two complex vectors.
 * <a|b> = Σ a_i* * b_i  (where * denotes complex conjugate)
 * @param {Array<{re: number, im: number}>} a First vector.
 * @param {Array<{re: number, im: number}>} b Second vector.
 * @returns {{re: number, im: number}} The complex inner product.
 */
export function innerProduct(a, b) {
    if (a.length !== b.length) {
        throw new Error("Vectors must have the same length for inner product.");
    }
    let result = qComplex.complex(0, 0);
    for (let i = 0; i < a.length; i++) {
        const conjA = qComplex.conjugate(a[i]);
        const product = qComplex.multiply(conjA, b[i]);
        result = qComplex.add(result, product);
    }
    return result;
}

/**
 * Calculates the outer product of two complex vectors.
 * |a><b| = a ⊗ b† (tensor product of a and the conjugate transpose of b)
 * Results in a matrix.
 * @param {Array<{re: number, im: number}>} a First vector (column).
 * @param {Array<{re: number, im: number}>} b Second vector (row after conjugate transpose).
 * @returns {Array<Array<{re: number, im: number}>>} The resulting matrix.
 */
export function outerProduct(a, b) {
    const matrix = [];
    for (let i = 0; i < a.length; i++) {
        matrix[i] = [];
        const ai = a[i];
        for (let j = 0; j < b.length; j++) {
            const conjB = qComplex.conjugate(b[j]);
            matrix[i][j] = qComplex.multiply(ai, conjB);
        }
    }
    return matrix;
}

// Add other necessary vector operations as needed...
