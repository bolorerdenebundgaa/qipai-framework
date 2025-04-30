/**
 * visualization-example.js
 * 
 * Example demonstrating the use of quantum visualization tools.
 * This shows how to visualize quantum circuits and states.
 */

import { QCircuit } from '../../core/qCircuit.js';
import { QTensor } from '../../core/qTensor.js';
import * as Gates from '../../core/gates.js';
import { visualizeCircuit, visualizeState } from '../index.js';

/**
 * Create and visualize a Bell state circuit
 */
function bellStateExample() {
    console.log('Bell State Visualization Example');
    console.log('================================');
    
    // Create a Bell state circuit
    const circuit = new QCircuit(2);
    circuit.addGate(Gates.H, [0]);         // Hadamard on qubit 0
    circuit.addGate(Gates.CNOT, [1], [0]); // CNOT with control=0, target=1
    
    console.log('Bell state circuit:');
    console.log('- Apply H to qubit 0');
    console.log('- Apply CNOT with control=0, target=1');
    
    // Visualize the circuit
    const circuitHTML = visualizeCircuit(circuit);
    
    // Run the circuit to get the Bell state
    const initialState = new QTensor(2);   // Start with |00⟩
    const bellState = circuit.run(initialState);
    
    // Visualize the quantum state
    const stateHTML = visualizeState(bellState);
    
    return {
        circuit,
        bellState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Create and visualize a GHZ state circuit
 */
function ghzStateExample() {
    console.log('\nGHZ State Visualization Example');
    console.log('===============================');
    
    // Create a GHZ state circuit (|000⟩ + |111⟩)/√2 for 3 qubits
    const circuit = new QCircuit(3);
    circuit.addGate(Gates.H, [0]);         // Hadamard on qubit 0
    circuit.addGate(Gates.CNOT, [1], [0]); // CNOT with control=0, target=1
    circuit.addGate(Gates.CNOT, [2], [1]); // CNOT with control=1, target=2
    
    console.log('GHZ state circuit:');
    console.log('- Apply H to qubit 0');
    console.log('- Apply CNOT with control=0, target=1');
    console.log('- Apply CNOT with control=1, target=2');
    
    // Visualize the circuit
    const circuitHTML = visualizeCircuit(circuit);
    
    // Run the circuit to get the GHZ state
    const initialState = new QTensor(3);   // Start with |000⟩
    const ghzState = circuit.run(initialState);
    
    // Visualize the quantum state
    const stateHTML = visualizeState(ghzState);
    
    return {
        circuit,
        ghzState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Create and visualize a single qubit superposition with Bloch sphere
 */
function blochSphereExample() {
    console.log('\nBloch Sphere Visualization Example');
    console.log('==================================');
    
    // Create a single qubit circuit with arbitrary rotation
    const circuit = new QCircuit(1);
    circuit.addGate(Gates.H, [0]);         // Hadamard on qubit 0 (creates |+⟩)
    circuit.addGate(Gates.S, [0]);         // S gate (phase gate) on qubit 0
    
    console.log('Single qubit circuit:');
    console.log('- Apply H to qubit 0');
    console.log('- Apply S to qubit 0');
    
    // Visualize the circuit
    const circuitHTML = visualizeCircuit(circuit);
    
    // Run the circuit to get the state
    const initialState = new QTensor(1);   // Start with |0⟩
    const qubitState = circuit.run(initialState);
    
    // Visualize the quantum state with Bloch sphere
    const stateHTML = visualizeState(qubitState, { type: 'bloch' });
    
    return {
        circuit,
        qubitState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Create and visualize quantum Fourier transform circuit
 */
function qftExample() {
    console.log('\nQuantum Fourier Transform Visualization Example');
    console.log('============================================');
    
    // Create a 3-qubit QFT circuit
    const numQubits = 3;
    const circuit = new QCircuit(numQubits);
    
    // QFT implementation for 3 qubits
    // For qubit 0
    circuit.addGate(Gates.H, [0]);
    circuit.addGate(Gates.CPHASE, [0], [1], Math.PI/2);
    circuit.addGate(Gates.CPHASE, [0], [2], Math.PI/4);
    
    // For qubit 1
    circuit.addGate(Gates.H, [1]);
    circuit.addGate(Gates.CPHASE, [1], [2], Math.PI/2);
    
    // For qubit 2
    circuit.addGate(Gates.H, [2]);
    
    // Swap qubits to match standard QFT output ordering
    circuit.addGate(Gates.SWAP, [0, 2]);
    
    console.log('QFT circuit for 3 qubits created');
    
    // Visualize the circuit
    const circuitHTML = visualizeCircuit(circuit);
    
    // Create input state |001⟩
    const initialState = new QTensor(numQubits);
    initialState.setState(1); // Set to |001⟩
    
    // Run the circuit to get the QFT state
    const qftState = circuit.run(initialState);
    
    // Visualize the quantum state showing phases
    const stateHTML = visualizeState(qftState, { showPhase: true, type: 'amplitude' });
    
    return {
        circuit,
        qftState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Run all visualization examples
 */
function runVisualizationExamples() {
    // Run Bell state example
    const bellExample = bellStateExample();
    
    // Run GHZ state example
    const ghzExample = ghzStateExample();
    
    // Run Bloch sphere example
    const blochExample = blochSphereExample();
    
    // Run QFT example
    const qftExample = qftExample();
    
    console.log('\nAll visualization examples completed!');
    
    return {
        bellExample,
        ghzExample,
        blochExample,
        qftExample
    };
}

// Run the examples if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runVisualizationExamples();
}

export {
    bellStateExample,
    ghzStateExample,
    blochSphereExample,
    qftExample,
    runVisualizationExamples
};
