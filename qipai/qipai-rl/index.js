/**
 * index.js
 * Main entry point for the Quantum Reinforcement Learning module.
 * Exports all public components for easy import by users.
 */

// Core quantum RL components
export { QLearningEngine } from './QLearningEngine.js';
export { QRLAgent } from './QRLAgent.js';

// Example exports
export { GridWorldEnv, runGridWorldExample } from './examples/GridWorldExample.js';

/**
 * Initialize a Quantum Reinforcement Learning agent with default settings
 * Convenience function for quick setup
 * @param {Object} options - Initialization options
 * @returns {QRLAgent} Configured agent
 */
export function createAgent(options = {}) {
    const { QLearningEngine } = require('./QLearningEngine.js');
    const { QRLAgent } = require('./QRLAgent.js');
    
    // Create engine with specified or default options
    const engineOptions = options.engineOptions || {};
    const engine = new QLearningEngine({
        stateQubits: engineOptions.stateQubits || 4,
        actionQubits: engineOptions.actionQubits || 2,
        sparse: engineOptions.sparse !== undefined ? engineOptions.sparse : true,
        gamma: engineOptions.gamma || 0.99,
        memory: engineOptions.memory || { capacity: 10000 }
    });
    
    // Create agent with specified or default options
    return new QRLAgent({
        engine,
        explorationRate: options.explorationRate || 1.0,
        explorationDecay: options.explorationDecay || 0.995,
        minExploration: options.minExploration || 0.05,
        episodeLimit: options.episodeLimit || 1000,
        trainingFrequency: options.trainingFrequency || 10,
        useSymbolicMemory: options.useSymbolicMemory || false
    });
}

/**
 * Quantum Reinforcement Learning Module
 * 
 * This module provides components for building quantum-enhanced reinforcement
 * learning agents. The key advantages of these quantum RL agents include:
 * 
 * 1. Quantum state representations for potentially more efficient encoding
 * 2. Quantum circuit policies that can leverage superposition and entanglement
 * 3. Sparse quantum state handling for large state spaces
 * 4. Integration with quantum neural components in qipai-neuro
 * 5. Compatibility with quantum hardware through qipai-hardware adapters
 * 
 * The module can be used in three main ways:
 * 
 * - Quick start: Use createAgent() to get a pre-configured agent
 * - Custom agent: Create a QRLAgent with a custom QLearningEngine
 * - Advanced: Extend these classes to create custom quantum RL algorithms
 */

// Module info
export const info = {
    name: 'qipai-rl',
    version: '0.1.0',
    description: 'Quantum Reinforcement Learning module for QiPAI framework',
    dependencies: [
        'qipai-core',
        'qipai-math',
        'qipai-memory'
    ]
};
