/**
 * QuantumLayer.js
 * Base quantum neural network layer implementation.
 * 
 * This provides the fundamental building block for quantum neural networks,
 * with trainable parameters and quantum circuit representations.
 */

import { QCircuit } from '../core/qCircuit.js';
import { QTensor } from '../core/qTensor.js';
import * as Gates from '../core/gates.js';
import * as qMath from '../math/qmath.js';

/**
 * Base class for quantum neural network layers
 */
export class QuantumLayer {
    /**
     * Create a new quantum layer
     * @param {Object} options - Configuration options
     * @param {number} options.inputQubits - Number of input qubits
     * @param {number} options.outputQubits - Number of output qubits
     * @param {string} options.activation - Activation function ('relu', 'tanh', etc.)
     * @param {string} options.name - Layer name
     */
    constructor(options = {}) {
        this.inputQubits = options.inputQubits || 1;
        this.outputQubits = options.outputQubits || 1;
        this.activation = options.activation || 'identity';
        this.name = options.name || `quantum_layer_${Date.now()}`;
        
        // Total qubits used in this layer
        this.totalQubits = this.inputQubits + this.outputQubits;
        
        // Circuit representation
        this.circuit = this._buildCircuit();
        
        // Trainable parameters
        this.params = this._initializeParameters();
        
        // Training state
        this.isTraining = false;
        this.gradients = Array(this.params.length).fill(0);
        
        // Input/output tracking for backpropagation
        this.lastInput = null;
        this.lastOutput = null;
    }
    
    /**
     * Forward pass through the layer
     * @param {QTensor} input - Input quantum state
     * @param {Object} options - Forward pass options
     * @returns {QTensor} Output quantum state
     */
    forward(input, options = {}) {
        // Validate input dimensions
        if (input.numQubits !== this.inputQubits) {
            throw new Error(`Input has ${input.numQubits} qubits, but layer expects ${this.inputQubits} qubits`);
        }
        
        // Store input for backpropagation if in training mode
        if (this.isTraining) {
            this.lastInput = input.clone();
        }
        
        // Apply quantum circuit with current parameters
        let output = this._applyCircuit(input);
        
        // Apply activation function
        output = this._applyActivation(output);
        
        // Store output for backpropagation if in training mode
        if (this.isTraining) {
            this.lastOutput = output.clone();
        }
        
        return output;
    }
    
    /**
     * Backward pass through the layer
     * @param {QTensor} gradOutput - Gradient from the next layer
     * @param {number} learningRate - Learning rate
     * @returns {QTensor} Gradient for the previous layer
     */
    backward(gradOutput, learningRate = 0.01) {
        if (!this.isTraining) {
            throw new Error('Layer is not in training mode. Call setTraining(true) before backward pass.');
        }
        
        if (!this.lastInput || !this.lastOutput) {
            throw new Error('No forward pass detected before backward pass');
        }
        
        // Calculate parameter gradients
        this._calculateParameterGradients(gradOutput);
        
        // Update parameters
        this._updateParameters(learningRate);
        
        // Calculate input gradients for previous layer
        return this._calculateInputGradients(gradOutput);
    }
    
    /**
     * Set the layer's training mode
     * @param {boolean} training - Whether the layer is in training mode
     */
    setTraining(training) {
        this.isTraining = training;
        if (training) {
            // Reset gradients when entering training mode
            this.gradients = Array(this.params.length).fill(0);
        } else {
            // Clean up memory when exiting training mode
            this.lastInput = null;
            this.lastOutput = null;
        }
    }
    
    /**
     * Get the layer's parameters
     * @returns {Array<number>} Layer parameters
     */
    getParameters() {
        return [...this.params];
    }
    
    /**
     * Set the layer's parameters
     * @param {Array<number>} params - New parameters
     */
    setParameters(params) {
        if (params.length !== this.params.length) {
            throw new Error(`Expected ${this.params.length} parameters, but got ${params.length}`);
        }
        this.params = [...params];
    }
    
    /**
     * Get the number of parameters in the layer
     * @returns {number} Parameter count
     */
    getParameterCount() {
        return this.params.length;
    }
    
    /**
     * Build the quantum circuit for this layer
     * @returns {QCircuit} Quantum circuit
     * @protected
     */
    _buildCircuit() {
        // Default implementation - should be overridden by subclasses
        const circuit = new QCircuit(this.totalQubits);
        
        // Add basic parameterized rotations
        for (let i = 0; i < this.totalQubits; i++) {
            circuit.addParameterizedGate('RY', [i]);
            circuit.addParameterizedGate('RZ', [i]);
        }
        
        return circuit;
    }
    
    /**
     * Initialize parameters for the layer
     * @returns {Array<number>} Initialized parameters
     * @protected
     */
    _initializeParameters() {
        // Initialize with small random values
        return Array(this.circuit.paramCount).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    }
    
    /**
     * Apply the quantum circuit to an input state
     * @param {QTensor} input - Input quantum state
     * @returns {QTensor} Output quantum state
     * @protected
     */
    _applyCircuit(input) {
        // Run the circuit with current parameters
        return this.circuit.run(input, this.params);
    }
    
    /**
     * Apply activation function to output state
     * @param {QTensor} state - Quantum state
     * @returns {QTensor} Activated state
     * @protected
     */
    _applyActivation(state) {
        // Default implementation - identity activation
        // Subclasses can override with quantum-specific activations
        return state;
    }
    
    /**
     * Calculate gradients for the parameters
     * @param {QTensor} gradOutput - Gradient from the next layer
     * @protected
     */
    _calculateParameterGradients(gradOutput) {
        // Implementation of parameter-shift rule for quantum gradients
        // For each parameter, shift it by +/- pi/2 and calculate the difference
        
        for (let i = 0; i < this.params.length; i++) {
            // Calculate gradient using parameter-shift rule
            // This is a core quantum computing technique for calculating gradients
            // of parameterized quantum circuits
            
            // Store original parameter
            const originalParam = this.params[i];
            
            // Shift parameter by +pi/2
            this.params[i] = originalParam + Math.PI / 2;
            const plusOutput = this._applyCircuit(this.lastInput);
            
            // Shift parameter by -pi/2
            this.params[i] = originalParam - Math.PI / 2;
            const minusOutput = this._applyCircuit(this.lastInput);
            
            // Restore original parameter
            this.params[i] = originalParam;
            
            // Calculate gradient using parameter-shift rule:
            // grad = 0.5 * (f(θ+π/2) - f(θ-π/2))
            const paramGradient = this._calculateExpectationDifference(plusOutput, minusOutput) / 2;
            
            // Update gradient with chain rule
            this.gradients[i] = paramGradient;
        }
    }
    
    /**
     * Calculate the difference in expectation values between two states
     * @param {QTensor} state1 - First quantum state
     * @param {QTensor} state2 - Second quantum state
     * @returns {number} Difference in expectation values
     * @protected
     */
    _calculateExpectationDifference(state1, state2) {
        // This is a simplified implementation
        // In a full implementation, would calculate the actual expectation
        // values of an observable and take the difference
        
        // For now, use a simple metric like probability difference of |1> state
        const prob1 = qMath.getProbability(state1, 0, 1); // Prob of |1> in first qubit
        const prob2 = qMath.getProbability(state2, 0, 1); // Prob of |1> in first qubit
        return prob1 - prob2;
    }
    
    /**
     * Update parameters using calculated gradients
     * @param {number} learningRate - Learning rate
     * @protected
     */
    _updateParameters(learningRate) {
        // Simple gradient descent update
        for (let i = 0; i < this.params.length; i++) {
            this.params[i] -= learningRate * this.gradients[i];
        }
    }
    
    /**
     * Calculate input gradients for the previous layer
     * @param {QTensor} gradOutput - Gradient from the next layer
     * @returns {QTensor} Gradient for the previous layer
     * @protected
     */
    _calculateInputGradients(gradOutput) {
        // In quantum neural networks, calculating input gradients is complex
        // This is a simplified implementation
        
        // Create a gradient tensor with the same dimensions as the input
        const inputGradient = this.lastInput.clone();
        
        // TODO: Implement proper quantum backpropagation
        // This would involve the adjoint of the quantum operation
        
        return inputGradient;
    }
    
    /**
     * Convert to a JSON-serializable object
     * @returns {Object} JSON-serializable representation
     */
    toJSON() {
        return {
            type: this.constructor.name,
            name: this.name,
            inputQubits: this.inputQubits,
            outputQubits: this.outputQubits,
            activation: this.activation,
            params: this.params
        };
    }
    
    /**
     * Create from a JSON object
     * @param {Object} json - JSON representation
     * @returns {QuantumLayer} Reconstructed layer
     */
    static fromJSON(json) {
        const layer = new QuantumLayer({
            name: json.name,
            inputQubits: json.inputQubits,
            outputQubits: json.outputQubits,
            activation: json.activation
        });
        
        if (json.params) {
            layer.setParameters(json.params);
        }
        
        return layer;
    }
    
    /**
     * Clone the layer
     * @returns {QuantumLayer} A copy of the layer
     */
    clone() {
        const clonedLayer = new this.constructor({
            name: `${this.name}_clone`,
            inputQubits: this.inputQubits,
            outputQubits: this.outputQubits,
            activation: this.activation
        });
        
        clonedLayer.setParameters(this.getParameters());
        return clonedLayer;
    }
}
