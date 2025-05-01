/**
 * getting-started.js
 * 
 * A simple example to demonstrate the core features of the QiPAI framework.
 * This example creates a Bell state, visualizes it, and measures the results.
 */

import { 
    createCircuit, 
    createState,
    QCircuit,
    QTensor 
} from '../index.js';

import * as Gates from '../core/gates.js';
import * as qMath from '../math/qmath.js';

/**
 * Create a Bell state (maximally entangled state of two qubits)
 */
function createBellState() {
    console.log('Creating a Bell state...');
    
    // Create a circuit with 2 qubits
    const circuit = createCircuit(2);
    
    // Add Hadamard gate to the first qubit
    circuit.addGate(Gates.H, [0]);
    
    // Add CNOT gate with control=qubit 0, target=qubit 1
    circuit.addGate(Gates.CNOT, [1], [0]);
    
    console.log('Circuit created with gates:');
    console.log('- Hadamard on qubit 0');
    console.log('- CNOT with control=0, target=1');
    
    // Initialize state to |00⟩
    const initialState = createState(2);
    
    // Run the circuit to get Bell state
    const bellState = circuit.run(initialState);
    
    return {
        circuit,
        state: bellState
    };
}

/**
 * Measure the Bell state multiple times to demonstrate correlations
 */
function measureBellState(bellState) {
    console.log('\nMeasuring Bell state 1000 times...');
    
    const results = {
        '00': 0,
        '01': 0,
        '10': 0,
        '11': 0
    };
    
    // Perform 1000 measurements
    for (let i = 0; i < 1000; i++) {
        const measurement = bellState.clone().measure();
        const bitString = measurement.toBitString();
        results[bitString]++;
    }
    
    console.log('Measurement results:');
    for (const [bitString, count] of Object.entries(results)) {
        console.log(`- |${bitString}⟩: ${count} (${(count/1000*100).toFixed(1)}%)`);
    }
    
    return results;
}

/**
 * Demonstrate the framework by creating and analyzing a Bell state
 */
function runDemo() {
    console.log('QiPAI Framework Demo - Bell State\n');
    
    // Create Bell state
    const { circuit, state } = createBellState();
    
    // Examine state amplitudes
    console.log('\nBell state amplitudes:');
    for (let i = 0; i < 4; i++) {
        const bitString = i.toString(2).padStart(2, '0');
        const amplitude = state.getAmplitude(i);
        console.log(`- |${bitString}⟩: ${amplitude.re.toFixed(3)} + ${amplitude.im.toFixed(3)}i`);
    }
    
    // Measure Bell state to demonstrate correlations
    const results = measureBellState(state);
    
    // Skip visualizations in non-browser environment
    console.log('\nIn a browser environment, you can visualize the circuit and state.');
    console.log('To see visualizations, run the appropriate browser demo.');
    
    return {
        circuit,
        state,
        results
    };
}

// Run the demo if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runDemo();
}

export {
    createBellState,
    measureBellState,
    runDemo
};
