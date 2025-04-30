/**
 * examples/qChat.js
 * Example application: A quantum-inspired chatbot.
 * Example application: Demonstrates basic QMLM prediction.
 */

import { QMLM } from '../models/qMLM.js';
import { PhaseMemory } from '../memory/PhaseMemory.js';
import { SymbolicMemory } from '../memory/SymbolicMemory.js';
import { QTensor } from '../core/qTensor.js'; // For potential type checks if needed

console.log("--- QMLM Prediction Example ---");

async function runQMLMPrediction() {
    console.log("Initializing components...");

    // --- Configuration ---
    const embeddingDim = 16; // Dimension of quantum embeddings (must be 2^N, e.g., 2^4=16)
    const vocabSize = 50;   // Example vocabulary size
    const qmlmConfig = {
        vocabSize: vocabSize,
        embeddingDim: embeddingDim,
        hiddenDims: [32, 64], // Example hidden layer dimensions
        activation: null      // No activation in hidden layers for now
    };

    // --- Setup Memory ---
    // PhaseMemory handles the actual QTensor storage (in-memory for now)
    const phaseMemory = new PhaseMemory();
    // SymbolicMemory maps words to QTensors, creating random ones if needed
    const symbolicMemory = new SymbolicMemory(phaseMemory, { embeddingDim });

    // --- Create Model ---
    const qmlm = new QMLM(qmlmConfig, symbolicMemory);

    // --- Input Token ---
    const inputToken = "hello";
    console.log(`\nInput token: "${inputToken}"`);

    // --- Get Embedding (Creates if not exists) ---
    // This step happens inside qmlm.predict now
    // const embedding = await symbolicMemory.getStateForSymbol(inputToken);
    // console.log(`Embedding state retrieved/created for "${inputToken}":`, embedding?.amplitudes);

    // --- Run Prediction ---
    console.log("Running prediction...");
    const outputProbabilities = await qmlm.predict(inputToken);

    if (outputProbabilities) {
        console.log(`\nOutput Probability Distribution (Vocab Size: ${vocabSize}):`);
        // Print first few probabilities for brevity
        const probsToShow = outputProbabilities.slice(0, 10);
        probsToShow.forEach((prob, index) => {
            console.log(`  Token ${index}: ${prob.toFixed(4)}`);
        });
        if (outputProbabilities.length > 10) {
            console.log("  ...");
        }
        // Verify sum is close to 1
        const sum = outputProbabilities.reduce((s, p) => s + p, 0);
        console.log(`\nSum of probabilities: ${sum.toFixed(6)}`);
    } else {
        console.log("Prediction failed (e.g., token not found and embedding creation failed).");
    }

    // --- Example: Predict for another token (will also create embedding) ---
    const inputToken2 = "world";
    console.log(`\nInput token: "${inputToken2}"`);
    const outputProbabilities2 = await qmlm.predict(inputToken2);
     if (outputProbabilities2) {
        console.log(`\nOutput Probability Distribution (Vocab Size: ${vocabSize}):`);
        const probsToShow2 = outputProbabilities2.slice(0, 10);
        probsToShow2.forEach((prob, index) => {
            console.log(`  Token ${index}: ${prob.toFixed(4)}`);
        });
         if (outputProbabilities2.length > 10) {
            console.log("  ...");
        }
    }

}

runQMLMPrediction().catch(console.error);
