/**
 * VariationalQuantumLayer.js
 * Implementation of a variational quantum circuit layer for quantum neural networks.
 * 
 * This layer implements a pattern commonly used in quantum machine learning,
 * with data encoding followed by a variational (parameterized) circuit.
 */

import { QuantumLayer } from './QuantumLayer.js';
import { QCircuit } from '../core/qCircuit.js';
import { QTensor } from '../core/qTensor.js';
import * as Gates from '../core/gates.js';

/**
 * Variational Quantum Circuit Layer
 * Implements a pattern of data encoding + variational circuit
 */
export class VariationalQuantumLayer extends QuantumLayer {
    /**
     * Create a new variational quantum layer
     * @param {Object} options - Configuration options
     * @param {number} options.inputQubits - Number of input qubits
     * @param {number} options.outputQubits - Number of output qubits (0 means same as input)
     * @param {number} options.depth - Number of repetitions of the variational circuit (default: 2)
     * @param {string} options.encoding - Data encoding strategy ('angle', 'amplitude', 'phase')
     * @param {string} options.entanglement - Entanglement pattern ('full', 'linear', 'circular')
     * @param {Array<number>} options.observables - Qubits to measure as output (default: all qubits)
     */
    constructor(options = {}) {
        // Default values for output qubits if not specified
        if (options.outputQubits === undefined) {
            options.outputQubits = options.inputQubits || 1;
        }
        
        // Call parent constructor
        super(options);
        
        // VQC-specific properties
        this.depth = options.depth || 2;
        this.encoding = options.encoding || 'angle';
        this.entanglement = options.entanglement || 'full';
        this.observables = options.observables || Array.from({ length: this.outputQubits }, (_, i) => i);
        
        // Rebuild circuit with VQC architecture
        this.circuit = this._buildCircuit();
        
        // Re-initialize parameters to match new circuit
        this.params = this._initializeParameters();
    }
    
    /**
     * Build a variational quantum circuit
     * @returns {QCircuit} Quantum circuit
     */
    _buildCircuit() {
        const circuit = new QCircuit(this.totalQubits);
        
        // Step 1: Data encoding circuit
        this._addEncodingLayer(circuit);
        
        // Step 2: Variational circuit (repeated depth times)
        for (let d = 0; d < this.depth; d++) {
            // Add single-qubit rotations (variational)
            this._addRotationLayer(circuit);
            
            // Add entanglement based on specified pattern
            this._addEntanglementLayer(circuit);
        }
        
        // Final rotation layer
        this._addRotationLayer(circuit);
        
        return circuit;
    }
    
    /**
     * Add data encoding layer to circuit
     * @param {QCircuit} circuit - Circuit to modify
     * @private
     */
    _addEncodingLayer(circuit) {
        // This layer will encode classical data into quantum states
        // The actual encoding happens at runtime based on input data
        
        // For now, we just prepare a clean initial state
        // The forward() method will handle the actual data encoding
        
        // Initialize all qubits to |0⟩ state (already the default)
        // In a real implementation, we would have different encoding strategies
    }
    
    /**
     * Add parameterized rotation layer to circuit
     * @param {QCircuit} circuit - Circuit to modify
     * @private
     */
    _addRotationLayer(circuit) {
        // Add parameterized rotation gates to each qubit
        for (let i = 0; i < this.totalQubits; i++) {
            // Rotations around all 3 axes for universal computation
            circuit.addParameterizedGate('RX', [i]); // Rotation around X axis
            circuit.addParameterizedGate('RY', [i]); // Rotation around Y axis
            circuit.addParameterizedGate('RZ', [i]); // Rotation around Z axis
        }
    }
    
    /**
     * Add entanglement layer to circuit
     * @param {QCircuit} circuit - Circuit to modify
     * @private
     */
    _addEntanglementLayer(circuit) {
        switch (this.entanglement) {
            case 'full':
                // All-to-all connectivity
                for (let i = 0; i < this.totalQubits; i++) {
                    for (let j = i + 1; j < this.totalQubits; j++) {
                        circuit.addGate(Gates.CNOT, [j], [i]);
                    }
                }
                break;
                
            case 'linear':
                // Linear connectivity (each qubit connected to neighbors)
                for (let i = 0; i < this.totalQubits - 1; i++) {
                    circuit.addGate(Gates.CNOT, [i + 1], [i]);
                }
                break;
                
            case 'circular':
                // Circular connectivity (linear + connection between first and last)
                for (let i = 0; i < this.totalQubits - 1; i++) {
                    circuit.addGate(Gates.CNOT, [i + 1], [i]);
                }
                // Connect last qubit to first qubit
                circuit.addGate(Gates.CNOT, [0], [this.totalQubits - 1]);
                break;
                
            default:
                console.warn(`Unknown entanglement pattern: ${this.entanglement}, defaulting to linear`);
                // Linear connectivity (each qubit connected to neighbors)
                for (let i = 0; i < this.totalQubits - 1; i++) {
                    circuit.addGate(Gates.CNOT, [i + 1], [i]);
                }
        }
    }
    
    /**
     * Encode classical data into quantum states
     * @param {QTensor} state - Initial quantum state
     * @param {Array<number>} data - Classical data to encode
     * @returns {QTensor} Encoded quantum state
     * @private
     */
    _encodeData(state, data) {
        // Create a circuit for data encoding
        const encodingCircuit = new QCircuit(this.inputQubits);
        
        // Encode data based on the specified encoding strategy
        switch (this.encoding) {
            case 'angle':
                // Angle encoding: data values encoded as rotation angles
                for (let i = 0; i < Math.min(data.length, this.inputQubits); i++) {
                    // Normalize data to [0, 1] range if needed
                    const normalizedValue = Math.max(0, Math.min(1, data[i]));
                    const angle = normalizedValue * Math.PI;
                    
                    // Apply rotation based on data value
                    encodingCircuit.addRotation('RY', angle, [i]);
                }
                break;
                
            case 'amplitude':
                // Amplitude encoding: data values encoded as amplitudes
                // This is more complex and would require custom state preparation
                // Simplified implementation
                for (let i = 0; i < Math.min(data.length, this.inputQubits); i++) {
                    const normalizedValue = Math.max(0, Math.min(1, data[i]));
                    const angle = Math.asin(Math.sqrt(normalizedValue));
                    encodingCircuit.addRotation('RY', 2 * angle, [i]);
                }
                break;
                
            case 'phase':
                // Phase encoding: data values encoded as phases
                // First put all qubits in superposition
                for (let i = 0; i < this.inputQubits; i++) {
                    encodingCircuit.addGate(Gates.H, [i]);
                }
                
                // Then apply phase rotations based on data
                for (let i = 0; i < Math.min(data.length, this.inputQubits); i++) {
                    const normalizedValue = Math.max(0, Math.min(1, data[i]));
                    const angle = normalizedValue * Math.PI;
                    encodingCircuit.addRotation('RZ', angle, [i]);
                }
                break;
                
            default:
                console.warn(`Unknown encoding strategy: ${this.encoding}, defaulting to angle encoding`);
                // Default to angle encoding
                for (let i = 0; i < Math.min(data.length, this.inputQubits); i++) {
                    const normalizedValue = Math.max(0, Math.min(1, data[i]));
                    const angle = normalizedValue * Math.PI;
                    encodingCircuit.addRotation('RY', angle, [i]);
                }
        }
        
        // Apply the encoding circuit
        return encodingCircuit.run(state);
    }
    
    /**
     * Forward pass through the layer
     * @param {QTensor|Array<number>} input - Input quantum state or classical data
     * @param {Object} options - Forward pass options
     * @returns {QTensor|Array<number>} Output quantum state or measurement results
     */
    forward(input, options = {}) {
        let quantumState;
        
        // Handle classical data input
        if (Array.isArray(input)) {
            // Create initial state (all zeros)
            const initialState = new QTensor(this.inputQubits);
            
            // Encode classical data into quantum state
            quantumState = this._encodeData(initialState, input);
        } else {
            // Input is already a quantum state
            quantumState = input;
        }
        
        // Call parent forward method to apply the variational circuit
        const outputState = super.forward(quantumState, options);
        
        // Determine if we should return quantum state or measurements
        const returnMeasurements = options.measure !== false; // Default to true
        
        if (returnMeasurements) {
            // Return measurement results
            return this._measureOutput(outputState);
        } else {
            // Return quantum state
            return outputState;
        }
    }
    
    /**
     * Measure output qubits
     * @param {QTensor} state - Quantum state to measure
     * @returns {Array<number>} Measurement results (probabilities of |1⟩ for each observable qubit)
     * @private
     */
    _measureOutput(state) {
        const measurements = [];
        
        // Measure each observable qubit
        for (const qubit of this.observables) {
            // Measure the probability of |1⟩ state
            const prob1 = state.measureProbability(qubit, 1);
            measurements.push(prob1);
        }
        
        return measurements;
    }
    
    /**
     * Convert to a JSON-serializable object
     * @returns {Object} JSON-serializable representation
     */
    toJSON() {
        const json = super.toJSON();
        
        // Add VQC-specific properties
        json.depth = this.depth;
        json.encoding = this.encoding;
        json.entanglement = this.entanglement;
        json.observables = this.observables;
        
        return json;
    }
    
    /**
     * Create from a JSON object
     * @param {Object} json - JSON representation
     * @returns {VariationalQuantumLayer} Reconstructed layer
     */
    static fromJSON(json) {
        return new VariationalQuantumLayer({
            name: json.name,
            inputQubits: json.inputQubits,
            outputQubits: json.outputQubits,
            activation: json.activation,
            depth: json.depth,
            encoding: json.encoding,
            entanglement: json.entanglement,
            observables: json.observables,
            params: json.params
        });
    }
}
