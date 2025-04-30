/**
 * models/qMLM.js
 * Quantum-inspired Masked Language Model.
 * (Conceptual placeholder)
 */

import { DensePhaseLayer } from '../layers/DensePhase.js';
// import { InterferenceLayer } from '../layers/Interference.js'; // Example if needed
// import { CollapseLayer } from '../layers/CollapseLayer.js'; // Example if needed
import { QTensor } from '../core/qTensor.js';
import * as qMath from '../math/qmath.js';
import { SymbolicMemory } from '../memory/SymbolicMemory.js'; // Import SymbolicMemory

export class QMLM {
    /**
     * @param {object} config - Model configuration.
     * @param {number} config.vocabSize - Size of the vocabulary.
     * @param {number} config.embeddingDim - Dimension of the quantum state embeddings (must be 2^N for some N).
     * @param {Array<number>} config.hiddenDims - Array of hidden layer dimensions.
     * @param {string | null} config.activation - Activation function for hidden layers.
     * @param {SymbolicMemory} symbolicMemory - Instance of SymbolicMemory to handle embeddings.
     */
    constructor(config, symbolicMemory) {
        if (!(symbolicMemory instanceof SymbolicMemory)) {
            throw new Error("QMLM requires an instance of SymbolicMemory.");
        }
        if ((config.embeddingDim & (config.embeddingDim - 1)) !== 0 || config.embeddingDim === 0) {
             throw new Error("QMLM config.embeddingDim must be a power of 2.");
        }

        this.config = config;
        this.symbolicMemory = symbolicMemory; // Store reference to memory
        this.layers = [];

        // --- Build Model Architecture ---
        let inputDim = config.embeddingDim; // Input to first hidden layer is the embedding dimension

        // 1. Initialize Vocabulary Embeddings (Conceptual)
        // TODO: Implement a robust strategy to create/load unique QTensor embeddings for each vocab item.
        // This might involve random state generation or loading pre-trained embeddings.
        // For now, we assume SymbolicMemory is populated elsewhere or will be populated.
        console.warn("QMLM: Vocabulary embedding initialization logic needed.");
        // Example conceptual population:
        // for (let i = 0; i < config.vocabSize; i++) {
        //    const word = `word_${i}`; // Placeholder symbol
        //    const embeddingState = new QTensor(Math.log2(config.embeddingDim)); // Create random/basis state
        //    // Initialize state randomly or to a basis state
        //    await this.symbolicMemory.learnSymbol(word, embeddingState);
        // }


        // 2. Hidden Layers
        for (const hiddenDim of config.hiddenDims) {
            // Note: DensePhaseLayer input/output are vector dimensions, not necessarily powers of 2
            this.layers.push(new DensePhaseLayer(inputDim, hiddenDim, config.activation));
            inputDim = hiddenDim; // Output of this layer is input to the next
        }

        // 3. Output Layer (Predicting vocabulary distribution)
        // Output dimension should match vocabSize.
        // TODO: Define appropriate output layer activation for probability distribution.
        this.layers.push(new DensePhaseLayer(inputDim, config.vocabSize, null));
        console.log(`QMLM model created with ${config.hiddenDims.length} hidden layers.`);

        // Store parameters for optimizer access
        this.parameters = this.layers.flatMap(layer => layer.weights.concat(layer.biases)); // Collect all params
    }

    /**
     * Processes an input token (word) to predict the next token distribution.
     * @param {string} inputToken - The input word/symbol.
     * @returns {Promise<Array<{re: number, im: number}> | null>} Output state vector (logits over vocabulary), or null if token not found.
     */
    async forward(inputToken) {
        // 1. Get Embedding for the input token
        const inputQTensor = await this.symbolicMemory.getStateForSymbol(inputToken);

        if (!inputQTensor) {
            console.warn(`QMLM: Input token '${inputToken}' not found in SymbolicMemory.`);
            return null; // Or handle unknown token differently
        }
        if (inputQTensor.dimension !== this.config.embeddingDim) {
             console.error(`QMLM: Embedding dimension mismatch for token '${inputToken}'. Expected ${this.config.embeddingDim}, got ${inputQTensor.dimension}.`);
             return null;
         }

         let currentStateVector = inputQTensor.amplitudes; // Get the complex vector from the QTensor embedding

         // 2. Pass through hidden layers + output layer
         for (const layer of this.layers) {
            // Ensure layer input size matches current state vector dimension
            // Note: This check assumes hidden layer dimensions match DensePhaseLayer config.
            // A more robust check might be needed if layer types vary.
            if (layer.inputSize !== currentStateVector.length) {
                 throw new Error(`Layer input size mismatch. Layer expects ${layer.inputSize}, got ${currentStateVector.length}`);
            }
             // Ensure the input to the layer is the vector, not the QTensor object
             currentStateVector = layer.forward(currentStateVector);
         }

         // 3. Convert final complex amplitudes to probabilities
         // Calculate squared magnitudes (|amplitude|^2)
         let probabilityVector = currentStateVector.map(amp => qMath.magnitude(amp) ** 2);

         // Normalize the probabilities to sum to 1 (like softmax)
         const sumOfProbs = probabilityVector.reduce((sum, p) => sum + p, 0);

         if (sumOfProbs > 1e-9) { // Avoid division by zero or near-zero
             probabilityVector = probabilityVector.map(p => p / sumOfProbs);
         } else {
             // Handle case where all output amplitudes are zero (or near zero)
             // Assign uniform probability? Or return zeros?
             console.warn("QMLM.forward: Sum of output probabilities is near zero. Returning uniform distribution.");
             const uniformProb = 1.0 / this.config.vocabSize;
             probabilityVector = new Array(this.config.vocabSize).fill(uniformProb);
         }

         // Return the probability distribution over the vocabulary
         return probabilityVector;
     }

     // Alias predict to forward for consistency
     async predict(inputToken) {
         // Returns probability vector
         return await this.forward(inputToken);
     }

    // TODO: Add training methods if applicable
}
