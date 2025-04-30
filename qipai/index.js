/**
 * QiPAI - Quantum-inspired AI Framework
 * 
 * Main entry point for the QiPAI framework, providing access to all modules.
 * 
 * This framework combines quantum computing principles with modern AI techniques
 * to create a powerful platform for quantum and quantum-inspired applications.
 */

// Export core quantum components
export * from './core/qTensor.js';
export * from './core/qCircuit.js';
export * from './core/qEntangle.js';
export * from './core/qDynamics.js';
export * from './core/qMeasure.js';
export * from './core/gates.js';

// Export math utilities
export * from './math/qcomplex.js';
export * from './math/qvector.js';
export * from './math/qmatrix.js';
export * from './math/qmath.js';

// Export module namespaces
export * as qNeuro from './qipai-neuro/index.js';
export * as qViz from './qipai-viz/index.js';
export * as qLang from './qipai-lang/index.js';
export * as qRL from './qipai-rl/index.js';
export * as qAgent from './qipai-agent/index.js';
export * as qHardware from './qipai-hardware/index.js';

// Export API
export * from './api/qipai.js';
export * from './api/config.js';

/**
 * Create a quantum circuit
 * @param {number} numQubits - Number of qubits in the circuit
 * @returns {QCircuit} Quantum circuit
 */
export function createCircuit(numQubits) {
    const { QCircuit } = require('./core/qCircuit.js');
    return new QCircuit(numQubits);
}

/**
 * Create a quantum state
 * @param {number} numQubits - Number of qubits in the state
 * @returns {QTensor} Quantum state
 */
export function createState(numQubits) {
    const { QTensor } = require('./core/qTensor.js');
    return new QTensor(numQubits);
}

/**
 * Create a quantum neural network
 * @param {Object} options - Neural network options
 * @returns {QuantumNeuralNetwork} Quantum neural network
 */
export function createQuantumNeuralNetwork(options = {}) {
    const { createSimpleQNN } = require('./qipai-neuro/index.js');
    return createSimpleQNN(options);
}

/**
 * Create an autonomous agent
 * @param {Object} options - Agent options
 * @returns {PhaseAgent} Quantum-inspired agent
 */
export function createAgent(options = {}) {
    const { createAgent } = require('./qipai-agent/index.js');
    return createAgent(options);
}

/**
 * Compile QiPAI language code into quantum circuits
 * @param {string} code - QiPAI language code
 * @param {Object} options - Compiler options
 * @returns {Object} Compiled circuits
 */
export function compileQiPAICode(code, options = {}) {
    const { compileQiPAICode } = require('./qipai-lang/index.js');
    return compileQiPAICode(code, options);
}

/**
 * Visualize a quantum circuit
 * @param {QCircuit} circuit - Quantum circuit to visualize
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeCircuit(circuit, options = {}) {
    const { visualizeCircuit } = require('./qipai-viz/index.js');
    return visualizeCircuit(circuit, options);
}

/**
 * Visualize a quantum state
 * @param {QTensor} state - Quantum state to visualize
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeState(state, options = {}) {
    const { visualizeState } = require('./qipai-viz/index.js');
    return visualizeState(state, options);
}

/**
 * Connect to quantum hardware
 * @param {Object} options - Hardware connection options
 * @returns {Object} Hardware adapter
 */
export function connectToQuantumHardware(options = {}) {
    const { IBMQAdapter } = require('./qipai-hardware/ibmq/IBMQAdapter.js');
    
    const adapter = new IBMQAdapter(options);
    return adapter.connect().then(() => adapter);
}

/**
 * QiPAI Framework
 * 
 * A comprehensive JavaScript framework for quantum computing with AI integration.
 * Key features include:
 * 
 * 1. Core Quantum Computing - Simulation of quantum states and circuits
 * 2. Quantum Neural Networks - Integration of quantum computing with neural networks
 * 3. Quantum Language - Domain-specific language for quantum programming
 * 4. Visualization - Tools for visualizing quantum states and circuits
 * 5. Autonomous Agents - Quantum-inspired intelligent agents
 * 6. Hardware Integration - Connection to real quantum hardware
 */

// Framework info
export const info = {
    name: 'qipai',
    version: '0.1.0',
    description: 'Quantum-inspired AI Framework',
    author: 'QiPAI Team',
    repository: 'https://github.com/qipai/qipai',
    license: 'MIT'
};
