/**
 * advanced-features-demo.js
 * 
 * This demo showcases the advanced features of the QiPAI framework,
 * including:
 * 1. Y-basis measurement
 * 2. Sparse quantum state representation
 * 3. Multi-qubit controlled operations
 * 4. QiPAI-Store as a quantum database
 */

import { QTensor } from '../core/qTensor.js';
import { QTensorSparse } from '../core/qTensorSparse.js';
import { QCircuit } from '../core/qCircuit.js';
import * as Gates from '../core/gates.js';
import * as qMath from '../math/qmath.js';
import { QStoreClient } from '../qipai-store/server/client.js';
import { SymbolicMemory } from '../memory/SymbolicMemory.js';
import { Interpreter } from '../qipai-store/qql-engine/interpreter.js';
import { tokenize } from '../qipai-store/qql-engine/tokenizer.js';
import { Parser } from '../qipai-store/qql-engine/parser.js';

/**
 * Demo 1: Y-basis Measurement
 * Shows how to measure qubits in different bases.
 */
async function demoYBasisMeasurement() {
    console.log('\n--- Demo 1: Y-basis Measurement ---');
    
    // Create a Bell state |00⟩ + |11⟩
    const bellState = new QTensor(2);
    
    // Apply Hadamard to first qubit
    const prep = new QCircuit(2);
    prep.addGate(Gates.H, [0]); // Hadamard on qubit 0
    prep.addGate(Gates.CNOT, [1], [0]); // CNOT with control=0, target=1
    
    const state = prep.run(bellState);
    console.log('Created Bell state |00⟩ + |11⟩');
    
    // Measure in different bases
    console.log('\nMeasuring in Z-basis (computational basis):');
    for (let i = 0; i < 5; i++) {
        // Create a copy for each measurement (since measurement changes state)
        const stateCopy = new QTensor(state.amplitudes);
        const circuit = new QCircuit(2);
        // No basis change needed for Z-basis
        
        // Measure qubit 0
        const { outcome, newState } = await measureInBasis(stateCopy, 0, 'Z');
        console.log(`Run ${i+1}: Measured qubit 0 in Z-basis, got ${outcome}`);
    }
    
    console.log('\nMeasuring in X-basis:');
    for (let i = 0; i < 5; i++) {
        const stateCopy = new QTensor(state.amplitudes);
        
        // Measure qubit 0 in X-basis
        const { outcome, newState } = await measureInBasis(stateCopy, 0, 'X');
        console.log(`Run ${i+1}: Measured qubit 0 in X-basis, got ${outcome}`);
        // For a Bell state, should get 0 more often in X-basis
    }
    
    console.log('\nMeasuring in Y-basis:');
    for (let i = 0; i < 5; i++) {
        const stateCopy = new QTensor(state.amplitudes);
        
        // Measure qubit 0 in Y-basis
        const { outcome, newState } = await measureInBasis(stateCopy, 0, 'Y');
        console.log(`Run ${i+1}: Measured qubit 0 in Y-basis, got ${outcome}`);
    }
}

/**
 * Helper function to measure a qubit in a specific basis
 */
async function measureInBasis(state, qubitIndex, basis) {
    // Apply basis change circuit if needed
    const basisChange = new QCircuit(state.qubitCount);
    
    if (basis === 'X') {
        // X-basis: Apply Hadamard before Z-basis measurement
        basisChange.addGate(Gates.H, [qubitIndex]);
    } else if (basis === 'Y') {
        // Y-basis: Apply S† then Hadamard before Z-basis measurement
        basisChange.addGate(Gates.Sdg, [qubitIndex]);
        basisChange.addGate(Gates.H, [qubitIndex]);
    }
    // For Z-basis, no change needed
    
    // Apply basis change if needed
    let stateToMeasure = state;
    if (basis !== 'Z') {
        stateToMeasure = basisChange.run(state);
    }
    
    // Now measure in Z-basis
    const measureResult = qMath.measureQubit(stateToMeasure, qubitIndex);
    
    return measureResult;
}

/**
 * Demo 2: Sparse Quantum Tensor
 * Shows the memory efficiency of sparse representation for large states.
 */
async function demoSparseQuantumTensor() {
    console.log('\n--- Demo 2: Sparse Quantum Tensor ---');
    
    // Create a 20-qubit system (2^20 = ~1 million amplitudes)
    console.log('Creating a 20-qubit system...');
    
    // Dense representation would use ~16MB for 2^20 complex numbers
    console.log('A dense 20-qubit state would require ~16MB of memory');
    
    // Create a sparse representation with just 2 non-zero amplitudes
    // |0...0⟩ and |1...1⟩ (GHZ state)
    const sparseState = new QTensorSparse({
        numQubits: 20,
        nonzeroAmplitudes: new Map([
            [0, qMath.complex(1/Math.sqrt(2), 0)],              // |0...0⟩
            [1048575, qMath.complex(1/Math.sqrt(2), 0)]         // |1...1⟩ (2^20 - 1)
        ])
    });
    
    // Analyze memory usage
    const memoryStats = sparseState.getMemoryComparison();
    console.log('Sparse representation statistics:');
    console.log(`- Number of qubits: ${sparseState.numQubits}`);
    console.log(`- State dimension: ${sparseState.dimension} (2^${sparseState.numQubits})`);
    console.log(`- Non-zero amplitudes: ${sparseState.nonzeroAmplitudes.size}`);
    console.log(`- Sparsity: ${sparseState.getSparsity().toFixed(8)}%`);
    console.log(`- Memory usage (sparse): ${memoryStats.sparse} bytes`);
    console.log(`- Memory usage (dense): ${memoryStats.dense} bytes`);
    console.log(`- Memory savings: ${memoryStats.savingsPercent.toFixed(8)}%`);
    
    // Demonstrate applying a gate to the sparse state
    console.log('\nApplying Hadamard gate to qubit 0...');
    const circuit = new QCircuit(20);
    circuit.addGate(Gates.H, [0]);
    
    // Run the circuit (this constructs the unitary via tensor products)
    // Note: This is still an expensive operation, but at least the state representation is sparse
    // const resultState = circuit.run(sparseState);
    console.log('Gate application would change sparsity pattern for large states,');
    console.log('but we skip this computation here as it would be expensive for 20 qubits.');
}

/**
 * Demo 3: Multi-qubit Controlled Gates
 * Shows how controlled gates work with our enhanced QCircuit implementation.
 */
async function demoMultiQubitGates() {
    console.log('\n--- Demo 3: Multi-qubit Controlled Gates ---');
    
    // Create a 3-qubit system
    const state = new QTensor(3);
    console.log('Created initial 3-qubit state |000⟩');
    
    // Create a circuit with controlled gates
    const circuit = new QCircuit(3);
    
    // First, prepare superposition of qubit 0
    circuit.addGate(Gates.H, [0]);
    console.log('Added H gate on qubit 0');
    
    // Add CNOT gate with control=0, target=1
    circuit.addGate(Gates.CNOT, [1], [0]);
    console.log('Added CNOT gate: control=0, target=1');
    
    // Add another controlled operation: control=1, target=2
    // This creates a GHZ state |000⟩ + |111⟩
    circuit.addGate(Gates.CNOT, [2], [1]);
    console.log('Added CNOT gate: control=1, target=2');
    
    // Run the circuit to create GHZ state
    const ghzState = circuit.run(state);
    console.log('\nCreated GHZ state |000⟩ + |111⟩');
    
    // Display amplitudes
    console.log('State amplitudes:');
    for (let i = 0; i < ghzState.dimension; i++) {
        const amplitude = ghzState.getAmplitude(i);
        if (Math.abs(amplitude.re) > 0.01 || Math.abs(amplitude.im) > 0.01) {
            const binaryString = i.toString(2).padStart(3, '0');
            console.log(`|${binaryString}⟩: ${amplitude.re.toFixed(3)} + ${amplitude.im.toFixed(3)}i`);
        }
    }
    
    // Now demonstrate a Toffoli-like gate (control-control-X)
    // Note: Our current implementation focuses on single-controlled gates,
    // but we can simulate this with two CNOTs
    console.log('\nDemonstrating multiple controlled operations:');
    
    // Start with a new 3-qubit state
    const newState = new QTensor(3);
    
    // Prepare superpositions on qubits 0 and 1
    const prepCircuit = new QCircuit(3);
    prepCircuit.addGate(Gates.H, [0]);
    prepCircuit.addGate(Gates.H, [1]);
    
    const preparedState = prepCircuit.run(newState);
    console.log('Prepared state with qubits 0 and 1 in superposition');
    
    // Now apply controlled operations
    const controlledCircuit = new QCircuit(3);
    // This is an approximation of control-control-X
    // True multi-control requires matrix construction
    controlledCircuit.addGate(Gates.CNOT, [2], [0]);
    controlledCircuit.addGate(Gates.CNOT, [2], [1]);
    
    const finalState = controlledCircuit.run(preparedState);
    console.log('Applied controlled operations to qubits 0, 1, 2');
    
    // Demonstrate how entanglement is tracked
    console.log('\nDemonstrating entanglement tracking:');
    if (finalState.areEntangled(0, 2)) {
        console.log('Qubits 0 and 2 are entangled');
    }
    if (finalState.areEntangled(1, 2)) {
        console.log('Qubits 1 and 2 are entangled');
    }
}

/**
 * Demo 4: QiPAI-Store Database
 * Shows how to use QiPAI-Store as a quantum state database with QQL.
 */
async function demoQiPAIStoreDatabase() {
    console.log('\n--- Demo 4: QiPAI-Store as a Quantum Database ---');
    console.log('This demo would normally connect to a running QiPAI-Store server.');
    console.log('Instead, we will demonstrate QQL execution directly:');
    
    // Create a context with a symbolic memory and input state
    const symbolicMemory = new SymbolicMemory();
    
    // Create a Bell state as an input
    const bellState = new QTensor(2);
    const prep = new QCircuit(2);
    prep.addGate(Gates.H, [0]);
    prep.addGate(Gates.CNOT, [1], [0]);
    const inputState = prep.run(bellState);
    
    // Context for the QQL interpreter
    const context = {
        symbolicMemory,
        input_state: inputState
    };
    
    // QQL query
    const qql = `
        -- This QQL script would typically load from the database,
        -- but we'll use the input_state from context directly
        
        -- Create a new state variable
        LOAD STATE s
        WHERE s.metadata.type = "input" 
        USING STORE { strategy: 'flatfile', path: './dummy-path.qstate.bin' }
        
        -- Use the context variable (since the LOAD wouldn't actually find a file)
        INTERFERE s WITH input_state
        
        -- Entangle with a symbolic concept
        ENTANGLE s WITH "quantum_computation"
        
        -- Measure in Y-basis
        MEASURE s IN BASIS_Y ON QUBITS [0, 1]
        
        -- Return the measurement outcomes
        RETURN LAST_RESULT
    `;
    
    console.log('\nExecuting QQL:');
    console.log(qql);
    
    // This would normally go through the QiPAI-Store server,
    // but we'll execute it directly for demonstration
    try {
        // Mock a minimal state for the LOAD operation
        context.s = new QTensor(2);
        
        // Parse and execute the QQL
        const tokens = tokenize(qql);
        const parser = new Parser(tokens);
        const commands = parser.parse();
        const interpreter = new Interpreter(context);
        const result = await interpreter.interpret(commands);
        
        console.log('\nQQL execution result:');
        console.log(result);
        
        // In a real database scenario, states would be persisted
        console.log('\nIn a real QiPAI-Store database:');
        console.log('- States would be saved to persistent storage');
        console.log('- Could query based on metadata or quantum properties');
        console.log('- Results would be cached for future operations');
        console.log('- Multiple clients could share quantum states');
    } catch (error) {
        console.error('Error executing QQL:', error.message);
    }
}

/**
 * Main demo runner
 */
async function runAllDemos() {
    console.log('QiPAI Framework Advanced Features Demo');
    console.log('======================================');
    
    await demoYBasisMeasurement();
    await demoSparseQuantumTensor();
    await demoMultiQubitGates();
    await demoQiPAIStoreDatabase();
    
    console.log('\nAll demos completed.');
}

// Run the demos if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runAllDemos().catch(console.error);
}

export {
    demoYBasisMeasurement,
    demoSparseQuantumTensor,
    demoMultiQubitGates,
    demoQiPAIStoreDatabase,
    runAllDemos
};
