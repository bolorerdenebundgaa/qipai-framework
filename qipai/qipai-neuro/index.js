/**
 * index.js
 * Main entry point for the Quantum Neural Networks module.
 * 
 * This module provides components for building quantum neural networks,
 * combining classical neural architectures with quantum computing principles.
 */

// Export core quantum neural network components
export { QuantumLayer } from './QuantumLayer.js';
export { VariationalQuantumLayer } from './VariationalQuantumLayer.js';
export { QuantumNeuralNetwork } from './QuantumNeuralNetwork.js';

/**
 * Create a simple quantum neural network with variational layers
 * @param {Object} options - Configuration options
 * @param {number} options.inputQubits - Number of input qubits
 * @param {number} options.hiddenLayers - Number of hidden layers
 * @param {number} options.outputQubits - Number of output qubits
 * @param {number} options.depth - Circuit depth for each layer
 * @param {string} options.encoding - Data encoding strategy
 * @param {string} options.entanglement - Entanglement pattern
 * @returns {QuantumNeuralNetwork} Configured quantum neural network
 */
export function createSimpleQNN(options = {}) {
    const { QuantumNeuralNetwork, VariationalQuantumLayer } = require('./QuantumNeuralNetwork.js');
    
    // Default configuration
    const inputQubits = options.inputQubits || 2;
    const hiddenLayers = options.hiddenLayers || 1;
    const outputQubits = options.outputQubits || 1;
    const depth = options.depth || 2;
    const encoding = options.encoding || 'angle';
    const entanglement = options.entanglement || 'full';
    
    // Create the network
    const qnn = new QuantumNeuralNetwork({
        name: options.name || 'SimpleQNN',
        optimizer: options.optimizer || {
            type: 'adam',
            learningRate: 0.01
        }
    });
    
    // Add input layer
    qnn.addLayer(new VariationalQuantumLayer({
        name: 'input_layer',
        inputQubits: inputQubits,
        outputQubits: hiddenLayers > 0 ? inputQubits : outputQubits,
        depth: depth,
        encoding: encoding,
        entanglement: entanglement
    }));
    
    // Add hidden layers
    for (let i = 0; i < hiddenLayers; i++) {
        const isLastHidden = i === hiddenLayers - 1;
        qnn.addLayer(new VariationalQuantumLayer({
            name: `hidden_layer_${i}`,
            inputQubits: inputQubits,
            outputQubits: isLastHidden ? outputQubits : inputQubits,
            depth: depth,
            entanglement: entanglement
        }));
    }
    
    return qnn;
}

/**
 * Quantum Neural Networks Module
 * 
 * This module provides components for building quantum-enhanced neural networks.
 * Key features include:
 * 
 * 1. Quantum Layers - Basic building blocks with quantum circuit architectures
 * 2. Variational Quantum Circuits - Parameterized circuits with various encoding strategies
 * 3. Quantum Neural Networks - Full networks combining multiple quantum layers
 * 4. Training Utilities - Tools for optimizing quantum circuit parameters
 * 
 * These components can be used to build hybrid quantum-classical neural architectures
 * that leverage quantum computing principles for enhanced learning capabilities.
 */

// Module info
export const info = {
    name: 'qipai-neuro',
    version: '0.1.0',
    description: 'Quantum Neural Networks for QiPAI framework',
    dependencies: [
        'qipai-core',
        'qipai-math'
    ]
};
