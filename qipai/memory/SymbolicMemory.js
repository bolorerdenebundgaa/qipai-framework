/**
 * memory/SymbolicMemory.js
 * Handles mapping between symbolic representations (like text labels)
 * and quantum states (QTensors) in PhaseMemory.
 * (Conceptual placeholder)
 */

import { QTensor } from '../core/qTensor.js';
import { PhaseMemory } from './PhaseMemory.js';
import * as qMath from '../math/qmath.js'; // Need complex math and normalize

export class SymbolicMemory {
    /**
     * @param {PhaseMemory} phaseMemoryInstance - Instance of PhaseMemory.
     * @param {object} options - Configuration options.
     * @param {number} options.embeddingDim - The dimension (power of 2) for new state embeddings.
     */
    constructor(phaseMemoryInstance, options = {}) {
        if (!(phaseMemoryInstance instanceof PhaseMemory)) {
            throw new Error("SymbolicMemory requires an instance of PhaseMemory.");
        }
         if (!options.embeddingDim || (options.embeddingDim & (options.embeddingDim - 1)) !== 0 || options.embeddingDim === 0) {
             throw new Error("SymbolicMemory requires a valid embeddingDim (power of 2) in options.");
         }
        this.phaseMemory = phaseMemoryInstance;
        this.embeddingDim = options.embeddingDim;
        this.numQubits = Math.log2(this.embeddingDim);
        // Map symbols (e.g., "apple") to state IDs used in PhaseMemory
        this.symbolToIdMap = new Map();
        // Map state IDs back to symbols (optional, for lookup)
        this.idToSymbolMap = new Map();
        console.log("SymbolicMemory created.");
    }

    /**
     * Associates a symbol with a quantum state, storing it in PhaseMemory.
     * @param {string} symbol - The symbolic label.
     * @param {QTensor} qTensor - The quantum state.
     * @param {object} metadata - Additional metadata.
     */
    async learnSymbol(symbol, qTensor, metadata = {}) {
        const stateId = this.symbolToIdMap.get(symbol) || this.generateIdForSymbol(symbol);
        this.symbolToIdMap.set(symbol, stateId);
        this.idToSymbolMap.set(stateId, symbol);
        metadata.symbol = symbol; // Add symbol to metadata for potential persistence
        // Use the updated PhaseMemory store method
        await this.phaseMemory.store(stateId, qTensor, metadata);
        // Log confirms storage in PhaseMemory's in-memory map for now
    }

    /**
     * Retrieves the quantum state associated with a symbol.
     * @param {string} symbol - The symbolic label.
      * Retrieves the quantum state associated with a symbol.
      * If the symbol is not found, creates a new random embedding, stores it, and returns it.
      * @param {string} symbol - The symbolic label.
      * @returns {Promise<QTensor | null>} The associated QTensor. Returns null only on internal error.
      */
     async getStateForSymbol(symbol) {
         let stateId = this.symbolToIdMap.get(symbol);
         let qTensor = null;

         if (stateId) {
            // Symbol known, try to retrieve from PhaseMemory
            qTensor = await this.phaseMemory.retrieve(stateId);
            if (qTensor) {
                return qTensor; // Found in memory
            } else {
                 console.warn(`State ID '${stateId}' for symbol '${symbol}' known but not found in PhaseMemory. Will create a new embedding.`);
                 // Proceed to create a new one, potentially overwriting the old ID association
            }
         }

         // Symbol not found OR state was missing from PhaseMemory -> Create new embedding
         console.log(`Symbol '${symbol}' not found or state missing. Creating new random embedding...`);
         const newState = this._createRandomEmbedding();
         // Use learnSymbol to store it in PhaseMemory and update maps
         await this.learnSymbol(symbol, newState, { created: Date.now() });
         return newState;
     }

     /**
      * Creates a random, normalized QTensor state for embedding.
      * @returns {QTensor}
      */
     _createRandomEmbedding() {
         const amplitudes = [];
         for (let i = 0; i < this.embeddingDim; i++) {
             // Random complex number (adjust range/distribution as needed)
             amplitudes.push(qMath.complex(Math.random() * 2 - 1, Math.random() * 2 - 1));
         }
         const normalizedAmplitudes = qMath.normalize(amplitudes);
         // Create QTensor without entanglement info initially for an embedding
         return new QTensor(normalizedAmplitudes, { isNormalized: true });
     }

     /**
      * Retrieves the symbol associated with a state ID (if tracked).
      * @param {string} stateId - The state ID.
      * @returns {string | null} The associated symbol, or null.
      */
     getSymbolForStateId(stateId) {
         return this.idToSymbolMap.get(stateId) || null;
     }

     generateIdForSymbol(symbol) {
        // Simple ID generation, could be more robust (e.g., UUID)
        return `symbol_${symbol.replace(/\s+/g, '_')}_${Date.now()}`;
    }

    // TODO: Add methods for finding related symbols via PhaseMemory search.
}
