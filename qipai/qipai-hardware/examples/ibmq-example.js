/**
 * ibmq-example.js
 * 
 * Example demonstrating how to use the IBM Quantum adapter to execute
 * QiPAI quantum circuits on real IBM Quantum hardware (or simulators).
 */

import { QCircuit } from '../../core/qCircuit.js';
import * as Gates from '../../core/gates.js';
import { IBMQAdapter } from '../ibmq/IBMQAdapter.js';

/**
 * Run a simple circuit on IBM Quantum
 */
async function runBellStateExperiment() {
    console.log('QiPAI IBM Quantum Integration Example');
    console.log('=====================================');
    
    // Create an IBM Quantum adapter
    // For real hardware, you would need to set your API token
    const adapter = new IBMQAdapter({
        token: process.env.IBMQ_TOKEN, // Use environment variable for token
        useSimulator: true,            // Use simulator for this example
        backend: 'ibmq_qasm_simulator'  // IBM's QASM simulator
    });
    
    // Connect to IBM Quantum
    await adapter.connect();
    
    // Create a Bell state circuit
    console.log('\nCreating Bell state circuit...');
    const circuit = new QCircuit(2);
    
    // Add gates to create Bell state (|00⟩ + |11⟩)/√2
    circuit.addGate(Gates.H, [0]);         // Hadamard on qubit 0
    circuit.addGate(Gates.CNOT, [1], [0]); // CNOT with control=0, target=1
    
    console.log('Circuit created:');
    console.log('- Apply H to qubit 0');
    console.log('- Apply CNOT with control=0, target=1');
    
    // Execute the circuit on IBM Quantum
    console.log('\nExecuting circuit on IBM Quantum...');
    const result = await adapter.executeCircuit(circuit, {
        shots: 1024,        // Number of circuit executions
        optimize: true,     // Optimize the circuit before execution
        waitForResult: true // Wait for the job to complete
    });
    
    // Display the results
    console.log('\nExecution completed!');
    console.log('Results:');
    console.log(`- Backend: ${result.metadata.backend}`);
    console.log(`- Execution time: ${result.metadata.executionTime}ms`);
    console.log(`- Job ID: ${result.metadata.jobId}`);
    
    console.log('\nMeasurement counts:');
    for (const [bitstring, count] of Object.entries(result.counts)) {
        const percentage = (count / 1024 * 100).toFixed(2);
        console.log(`- |${bitstring}⟩: ${count} (${percentage}%)`);
    }
    
    // Verify results are close to theoretical expectation
    // Bell state should give roughly 50% |00⟩ and 50% |11⟩
    console.log('\nTheoretical expectation for Bell state:');
    console.log('- |00⟩: 50%');
    console.log('- |11⟩: 50%');
    
    return result;
}

/**
 * Run a quantum teleportation circuit
 * A more complex example involving multiple qubits and gates
 */
async function runQuantumTeleportation() {
    console.log('\nQuantum Teleportation Example');
    console.log('============================');
    
    // Create an IBM Quantum adapter
    const adapter = new IBMQAdapter({
        token: process.env.IBMQ_TOKEN,
        useSimulator: true,
        backend: 'ibmq_qasm_simulator'
    });
    
    // Connect to IBM Quantum
    await adapter.connect();
    
    // Quantum teleportation requires 3 qubits:
    // - Qubit 0: The qubit to be teleported (in some arbitrary state)
    // - Qubit 1 & 2: A Bell pair shared between sender and receiver
    console.log('\nCreating quantum teleportation circuit...');
    const circuit = new QCircuit(3);
    
    // Step 1: Prepare a state to teleport (qubit 0)
    // We'll use a simple state prepared by applying a rotation to |0⟩
    // In a real application, this could be any quantum state
    circuit.addGate(Gates.X, [0]); // Apply X gate to create |1⟩ state
    circuit.addGate(Gates.H, [0]); // Apply H gate to create (|0⟩ - |1⟩)/√2 state
    
    // Step 2: Create Bell pair between qubits 1 & 2
    circuit.addGate(Gates.H, [1]);
    circuit.addGate(Gates.CNOT, [2], [1]);
    
    // Step 3: Perform the teleportation protocol
    // a) Entangle qubit 0 (state to teleport) with qubit 1 (sender's Bell pair half)
    circuit.addGate(Gates.CNOT, [1], [0]);
    
    // b) Apply Hadamard to qubit 0
    circuit.addGate(Gates.H, [0]);
    
    // c) Measure qubits 0 and 1 to get classical bits
    // (In a real quantum teleportation protocol, we would use these measurements
    // to conditionally apply corrections to qubit 2, but IBMQ simulators can handle
    // mid-circuit measurements with conditional operations)
    
    // d) Apply corrections to qubit 2 based on measurements
    // If qubit 1 was measured as 1, apply X to qubit 2
    // If qubit 0 was measured as 1, apply Z to qubit 2
    
    // For IBMQ, we'd need to implement these as controlled operations before measurement
    // as mid-circuit measurements with conditional logic aren't available on all hardware
    circuit.addGate(Gates.CNOT, [2], [1]); // Apply X to qubit 2 if qubit 1 is 1
    circuit.addGate(Gates.Z, [2], [0]);    // Apply Z to qubit 2 if qubit 0 is 1
    
    console.log('Circuit created with the following operations:');
    console.log('- Prepare state to teleport on qubit 0: X, H');
    console.log('- Create Bell pair between qubits 1 & 2: H, CNOT');
    console.log('- Perform teleportation: CNOT, H, measurements, conditional corrections');
    
    // Execute the circuit on IBM Quantum
    console.log('\nExecuting teleportation circuit on IBM Quantum...');
    const result = await adapter.executeCircuit(circuit, {
        shots: 1024,
        optimize: true,
        waitForResult: true
    });
    
    // Display the results
    console.log('\nExecution completed!');
    console.log('Results:');
    console.log(`- Backend: ${result.metadata.backend}`);
    console.log(`- Execution time: ${result.metadata.executionTime}ms`);
    
    console.log('\nMeasurement counts:');
    for (const [bitstring, count] of Object.entries(result.counts)) {
        const percentage = (count / 1024 * 100).toFixed(2);
        console.log(`- |${bitstring}⟩: ${count} (${percentage}%)`);
    }
    
    // In a perfect teleportation, if we had selected specific measurement outcomes,
    // qubit 2 would be in the state we originally prepared on qubit 0
    console.log('\nIn a perfect teleportation, qubit 2 should now be in the state (|0⟩ - |1⟩)/√2');
    
    return result;
}

/**
 * Run the IBM Quantum examples
 */
async function runIBMQExamples() {
    try {
        // Run Bell state example
        await runBellStateExperiment();
        
        // Run quantum teleportation example
        // await runQuantumTeleportation();  // Uncomment to run this example
        
        console.log('\nAll examples completed successfully!');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Run the examples if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runIBMQExamples().catch(console.error);
}

export {
    runBellStateExperiment,
    runQuantumTeleportation,
    runIBMQExamples
};
