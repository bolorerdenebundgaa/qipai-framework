/**
 * language-example.js
 * 
 * Example demonstrating the QiPAI quantum language capabilities.
 * This shows how to define, compile and execute quantum circuits
 * using the domain-specific language.
 */

import { compileQiPAICode } from '../index.js';
import { QTensor } from '../../core/qTensor.js';
import { visualizeCircuit, visualizeState } from '../../qipai-viz/index.js';

/**
 * Example of a Bell state circuit defined in QiPAI language
 */
function bellStateExample() {
    console.log('Bell State QiPAI Language Example');
    console.log('=================================');
    
    // Define Bell state circuit in QiPAI language
    const bellCode = `
        // Bell state circuit
        circuit BellState {
            // Define qubits
            qubit q0;
            qubit q1;
            
            // Create Bell state (|00⟩ + |11⟩)/√2
            apply h to q0;        // Hadamard on q0
            apply cnot to q1 controlled by q0;  // CNOT with control=q0, target=q1
        }
    `;
    
    console.log('QiPAI Code:');
    console.log(bellCode);
    
    // Compile code to circuit
    const circuits = compileQiPAICode(bellCode);
    
    if (!circuits) {
        console.error('Compilation failed');
        return null;
    }
    
    // Get the Bell state circuit
    const bellCircuit = circuits.BellState;
    
    console.log('\nCompiled circuit:');
    console.log(`- Number of qubits: ${bellCircuit.numQubits}`);
    console.log(`- Number of gates: ${bellCircuit.gates.length}`);
    
    // Visualize circuit
    const circuitHTML = visualizeCircuit(bellCircuit);
    
    // Run circuit to get Bell state
    const initialState = new QTensor(2); // Start with |00⟩
    const bellState = bellCircuit.run(initialState);
    
    // Visualize quantum state
    const stateHTML = visualizeState(bellState);
    
    console.log('\nCircuit executed successfully!');
    
    return {
        code: bellCode,
        circuit: bellCircuit,
        state: bellState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Example of a GHZ state circuit defined in QiPAI language
 */
function ghzStateExample() {
    console.log('\nGHZ State QiPAI Language Example');
    console.log('===============================');
    
    // Define GHZ state circuit in QiPAI language
    const ghzCode = `
        // GHZ state circuit - creates (|000⟩ + |111⟩)/√2
        circuit GHZState {
            // Define qubits as a register
            register q[3];
            
            // Create GHZ state
            apply h to q[0];            // Hadamard on q0
            apply cnot to q[1] controlled by q[0];  // CNOT: q0 controls q1
            apply cnot to q[2] controlled by q[1];  // CNOT: q1 controls q2
        }
    `;
    
    console.log('QiPAI Code:');
    console.log(ghzCode);
    
    // Compile code to circuit
    const circuits = compileQiPAICode(ghzCode);
    
    if (!circuits) {
        console.error('Compilation failed');
        return null;
    }
    
    // Get the GHZ state circuit
    const ghzCircuit = circuits.GHZState;
    
    console.log('\nCompiled circuit:');
    console.log(`- Number of qubits: ${ghzCircuit.numQubits}`);
    console.log(`- Number of gates: ${ghzCircuit.gates.length}`);
    
    // Visualize circuit
    const circuitHTML = visualizeCircuit(ghzCircuit);
    
    // Run circuit to get GHZ state
    const initialState = new QTensor(3); // Start with |000⟩
    const ghzState = ghzCircuit.run(initialState);
    
    // Visualize quantum state
    const stateHTML = visualizeState(ghzState);
    
    console.log('\nCircuit executed successfully!');
    
    return {
        code: ghzCode,
        circuit: ghzCircuit,
        state: ghzState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Example of a quantum Fourier transform circuit defined in QiPAI language
 */
function qftExample() {
    console.log('\nQuantum Fourier Transform QiPAI Language Example');
    console.log('==========================================');
    
    // Define QFT circuit in QiPAI language
    const qftCode = `
        // Quantum Fourier Transform for 3 qubits
        circuit QFT {
            // Define qubits as a register
            register q[3];
            
            // Define pi constant
            let pi2 = pi / 2;
            let pi4 = pi / 4;
            
            // QFT implementation
            // For qubit 0
            apply h to q[0];
            apply phase(pi2) to q[0] controlled by q[1];
            apply phase(pi4) to q[0] controlled by q[2];
            
            // For qubit 1
            apply h to q[1];
            apply phase(pi2) to q[1] controlled by q[2];
            
            // For qubit 2
            apply h to q[2];
            
            // Swap qubits to match standard QFT output ordering
            apply swap to q[0], q[2];
        }
    `;
    
    console.log('QiPAI Code:');
    console.log(qftCode);
    
    // Compile code to circuit
    const circuits = compileQiPAICode(qftCode);
    
    if (!circuits) {
        console.error('Compilation failed');
        return null;
    }
    
    // Get the QFT circuit
    const qftCircuit = circuits.QFT;
    
    console.log('\nCompiled circuit:');
    console.log(`- Number of qubits: ${qftCircuit.numQubits}`);
    console.log(`- Number of gates: ${qftCircuit.gates.length}`);
    
    // Visualize circuit
    const circuitHTML = visualizeCircuit(qftCircuit);
    
    // Create input state |001⟩ (binary 1)
    const initialState = new QTensor(3);
    initialState.setState(1); // Set to |001⟩
    
    // Run circuit to get QFT state
    const qftState = qftCircuit.run(initialState);
    
    // Visualize quantum state showing phases
    const stateHTML = visualizeState(qftState, { showPhase: true, type: 'amplitude' });
    
    console.log('\nCircuit executed successfully!');
    
    return {
        code: qftCode,
        circuit: qftCircuit,
        state: qftState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Example of a circuit with a loop in QiPAI language
 */
function loopExample() {
    console.log('\nLoop Example in QiPAI Language');
    console.log('=============================');
    
    // Define circuit with loop in QiPAI language
    const loopCode = `
        // Parameterized rotation circuit using loops
        circuit RotationSteps {
            // Define qubits
            qubit q0;
            
            // Define number of rotation steps
            let steps = 4;
            let angle = pi / steps;
            
            // Create a superposition
            apply h to q0;
            
            // Apply a series of z-rotations with increasing angles
            for i = 1 to steps {
                // Rotate by i*angle
                apply rz(i * angle) to q0;
            }
        }
    `;
    
    console.log('QiPAI Code:');
    console.log(loopCode);
    
    // Compile code to circuit
    const circuits = compileQiPAICode(loopCode);
    
    if (!circuits) {
        console.error('Compilation failed');
        return null;
    }
    
    // Get the rotation steps circuit
    const rotationCircuit = circuits.RotationSteps;
    
    console.log('\nCompiled circuit:');
    console.log(`- Number of qubits: ${rotationCircuit.numQubits}`);
    console.log(`- Number of gates: ${rotationCircuit.gates.length}`);
    
    // Visualize circuit
    const circuitHTML = visualizeCircuit(rotationCircuit);
    
    // Run circuit
    const initialState = new QTensor(1); // Start with |0⟩
    const finalState = rotationCircuit.run(initialState);
    
    // Visualize quantum state
    const stateHTML = visualizeState(finalState, { type: 'bloch' });
    
    console.log('\nCircuit executed successfully!');
    
    return {
        code: loopCode,
        circuit: rotationCircuit,
        state: finalState,
        circuitHTML,
        stateHTML
    };
}

/**
 * Run all language examples
 */
function runLanguageExamples() {
    // Run Bell state example
    const bellExample = bellStateExample();
    
    // Run GHZ state example
    const ghzExample = ghzStateExample();
    
    // Run QFT example
    const qftExample = qftExample();
    
    // Run loop example
    const loopExample = loopExample();
    
    console.log('\nAll language examples completed!');
    
    return {
        bellExample,
        ghzExample,
        qftExample,
        loopExample
    };
}

// Run the examples if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runLanguageExamples();
}

export {
    bellStateExample,
    ghzStateExample,
    qftExample,
    loopExample,
    runLanguageExamples
};
