/**
 * visualization3d-example.js
 * 
 * Example demonstrating the use of 3D quantum visualization tools.
 * This shows how to create advanced visualizations of quantum states,
 * including Bloch spheres, state evolution, and phase interference.
 */

import { QCircuit } from '../../core/qCircuit.js';
import { QTensor } from '../../core/qTensor.js';
import * as Gates from '../../core/gates.js';
import {
    create3DVisualizer,
    visualizeEvolution,
    visualizeInterference,
    visualizeBlochSphere
} from '../index.js';

/**
 * Example of Bloch sphere visualization
 */
function blochSphereExample() {
    console.log('Bloch Sphere Visualization Example');
    console.log('=================================');
    
    // Create a single-qubit state in a superposition
    const circuit = new QCircuit(1);
    const initialState = new QTensor(1);
    
    // Apply a Hadamard gate to create |+⟩ state
    circuit.addGate(Gates.H, [0]);
    
    // Apply a phase rotation to make it more interesting
    circuit.addGate(Gates.PHASE, [0], [], Math.PI / 4);
    
    // Run circuit to get state
    const state = circuit.run(initialState);
    
    console.log('Created state with circuit:');
    console.log('- Apply H to qubit 0');
    console.log('- Apply PHASE(π/4) to qubit 0');
    
    // Create 3D visualizer
    const visualizer = create3DVisualizer({
        width: 600,
        height: 600,
        colors: {
            background: '#151520'
        }
    });
    
    // Generate Bloch sphere visualization
    const blochHTML = visualizer.generateBlochVisualization(state);
    
    console.log('Bloch sphere visualization generated');
    
    return {
        state,
        html: blochHTML
    };
}

/**
 * Example of quantum state evolution visualization
 */
function stateEvolutionExample() {
    console.log('\nQuantum State Evolution Visualization');
    console.log('==================================');
    
    // Create a series of states showing a qubit rotating on the Bloch sphere
    const numSteps = 16;
    const states = [];
    
    // Start with |0⟩ state
    const initialState = new QTensor(1);
    states.push(initialState.clone());
    
    // Rotate in steps around the X axis
    for (let i = 1; i < numSteps; i++) {
        const angle = (i / numSteps) * Math.PI; // Rotate from 0 to π
        
        // Create circuit for this rotation
        const circuit = new QCircuit(1);
        circuit.addGate(Gates.RX, [0], [], angle);
        
        // Apply circuit to initial state
        const rotatedState = circuit.run(initialState.clone());
        states.push(rotatedState);
    }
    
    console.log(`Created ${states.length} states showing rotation around X axis`);
    
    // Generate evolution visualization
    const evolutionHTML = visualizeEvolution(states, {
        width: 800,
        height: 500
    });
    
    console.log('Evolution visualization generated');
    
    return {
        states,
        html: evolutionHTML
    };
}

/**
 * Example of quantum interference pattern visualization
 */
function interferenceExample() {
    console.log('\nQuantum Interference Visualization');
    console.log('================================');
    
    // Create a 3-qubit state with interesting interference
    // We'll use a QFT circuit as it creates nice phase patterns
    const circuit = new QCircuit(3);
    const initialState = new QTensor(3);
    
    // Initialize to a non-trivial state - a superposition of |001⟩ and |100⟩
    const prepCircuit = new QCircuit(3);
    prepCircuit.addGate(Gates.X, [0]); // Set to |001⟩
    prepCircuit.addGate(Gates.H, [0]); // Create superposition
    prepCircuit.addGate(Gates.H, [2]); // Create superposition
    const prepState = prepCircuit.run(initialState);
    
    // Apply QFT which creates complex interference patterns
    circuit.addGate(Gates.H, [0]);
    circuit.addGate(Gates.CPHASE, [0], [1], Math.PI/2);
    circuit.addGate(Gates.CPHASE, [0], [2], Math.PI/4);
    circuit.addGate(Gates.H, [1]);
    circuit.addGate(Gates.CPHASE, [1], [2], Math.PI/2);
    circuit.addGate(Gates.H, [2]);
    
    // Run circuit to get QFT state with interference
    const state = circuit.run(prepState);
    
    console.log('Created QFT state with interference patterns');
    
    // Generate interference visualization
    const interferenceHTML = visualizeInterference(state, {
        width: 800,
        height: 600
    });
    
    console.log('Interference visualization generated');
    
    return {
        state,
        html: interferenceHTML
    };
}

/**
 * Example of multi-qubit Bloch sphere visualization
 */
function multiQubitBlochExample() {
    console.log('\nMulti-Qubit Bloch Sphere Example');
    console.log('==============================');
    
    // Create a 3-qubit entangled state (GHZ state)
    const circuit = new QCircuit(3);
    const initialState = new QTensor(3);
    
    // Create GHZ state (|000⟩ + |111⟩)/√2
    circuit.addGate(Gates.H, [0]);
    circuit.addGate(Gates.CNOT, [1], [0]);
    circuit.addGate(Gates.CNOT, [2], [1]);
    
    // Run circuit to get GHZ state
    const state = circuit.run(initialState);
    
    console.log('Created GHZ state:');
    console.log('- Apply H to qubit 0');
    console.log('- Apply CNOT with control=0, target=1');
    console.log('- Apply CNOT with control=1, target=2');
    
    // Visualize all three qubits on Bloch spheres
    const blochHTML = visualizeBlochSphere(state, [0, 1, 2], {
        width: 900,
        height: 400
    });
    
    console.log('Multi-qubit Bloch visualization generated');
    
    return {
        state,
        html: blochHTML
    };
}

/**
 * Run all 3D visualization examples
 */
function run3DVisualizationExamples() {
    // Run Bloch sphere example
    const blochExample = blochSphereExample();
    
    // Run state evolution example
    const evolutionExample = stateEvolutionExample();
    
    // Run interference example
    const interferenceExample = interferenceExample();
    
    // Run multi-qubit Bloch sphere example
    const multiBlochExample = multiQubitBlochExample();
    
    console.log('\nAll 3D visualization examples completed!');
    
    return {
        blochExample,
        evolutionExample,
        interferenceExample,
        multiBlochExample
    };
}

// Run the examples if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    run3DVisualizationExamples();
}

export {
    blochSphereExample,
    stateEvolutionExample,
    interferenceExample,
    multiQubitBlochExample,
    run3DVisualizationExamples
};
