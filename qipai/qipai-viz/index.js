/**
 * index.js
 * Main entry point for the Quantum Visualization module.
 * 
 * This module provides tools for visualizing quantum states and circuits.
 */

// Export visualization components
export { CircuitVisualizer } from './CircuitVisualizer.js';
export { StateVisualizer } from './StateVisualizer.js';
export { Visualizer3D } from './Visualizer3D.js';

/**
 * Create a circuit visualizer with default settings
 * @param {Object} options - Visualization options
 * @returns {CircuitVisualizer} Circuit visualizer instance
 */
export function createCircuitVisualizer(options = {}) {
    const { CircuitVisualizer } = require('./CircuitVisualizer.js');
    return new CircuitVisualizer(options);
}

/**
 * Create a state visualizer with default settings
 * @param {Object} options - Visualization options
 * @returns {StateVisualizer} State visualizer instance
 */
export function createStateVisualizer(options = {}) {
    const { StateVisualizer } = require('./StateVisualizer.js');
    return new StateVisualizer(options);
}

/**
 * Generate HTML visualization of a quantum circuit
 * @param {QCircuit} circuit - Quantum circuit to visualize
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeCircuit(circuit, options = {}) {
    const visualizer = createCircuitVisualizer(options);
    return visualizer.generateHTML(circuit);
}

/**
 * Generate HTML visualization of a quantum state
 * @param {QTensor} state - Quantum state to visualize
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeState(state, options = {}) {
    const visualizer = createStateVisualizer(options);
    return visualizer.generateHTML(state, options);
}

/**
 * Create a 3D visualizer with default settings
 * @param {Object} options - Visualization options
 * @returns {Visualizer3D} 3D visualizer instance
 */
export function create3DVisualizer(options = {}) {
    const { Visualizer3D } = require('./Visualizer3D.js');
    return new Visualizer3D(options);
}

/**
 * Visualize quantum state evolution in 3D
 * @param {Array<QTensor>} states - Array of quantum states
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeEvolution(states, options = {}) {
    const visualizer = create3DVisualizer(options);
    return visualizer.generateEvolutionVisualization(states, options);
}

/**
 * Visualize quantum state interference in 3D
 * @param {QTensor} state - Quantum state to visualize
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeInterference(state, options = {}) {
    const visualizer = create3DVisualizer(options);
    return visualizer.generateInterferenceVisualization(state, options);
}

/**
 * Visualize Bloch sphere representation of qubits
 * @param {QTensor} state - Quantum state to visualize
 * @param {Array<number>} qubits - Indices of qubits to visualize
 * @param {Object} options - Visualization options
 * @returns {string} HTML visualization
 */
export function visualizeBlochSphere(state, qubits = null, options = {}) {
    const visualizer = create3DVisualizer(options);
    return visualizer.generateBlochVisualization(state, qubits);
}

/**
 * Quantum Visualization Module
 * 
 * This module provides tools for visualizing quantum states and circuits.
 * Key features include:
 * 
 * 1. Circuit Visualization - Generate visual representation of quantum circuits
 * 2. State Visualization - Visualize quantum states as probability bars or Bloch spheres
 * 3. HTML Output - Generate embeddable HTML representations
 * 
 * These tools are essential for understanding and debugging quantum algorithms.
 */

// Module info
export const info = {
    name: 'qipai-viz',
    version: '0.1.0',
    description: 'Quantum Visualization Tools for QiPAI framework',
    dependencies: [
        'qipai-core',
        'qipai-math'
    ]
};
