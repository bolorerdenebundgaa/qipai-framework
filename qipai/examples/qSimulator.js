/**
 * examples/qSimulator.js
 * Example application: A basic quantum circuit simulator using QiPAI core components.
 * (Conceptual placeholder)
 */

import { QTensor } from '../core/qTensor.js';
import { QCircuit } from '../core/qCircuit.js';
import * as qEntangle from '../core/qEntangle.js';
import * as qMeasure from '../core/qMeasure.js';
// Need gate definitions once they exist
// import { H, CNOT, X } from '../core/gates.js';

console.log("--- qSimulator Example ---");

async function runSimulation() {
    // TODO:
    // 1. Define standard gates (H, CNOT, X, etc.) with their matrices.
    // 2. Implement the gate application logic in QCircuit.run() and QCircuit._getOperationUnitary().
    // 3. Create a circuit, add gates, run it, and measure the result.

    console.warn("qSimulator example requires gate definitions and QCircuit.run() implementation.");

    // Example: Create a Bell state |Φ+> = (|00> + |11>)/sqrt(2) using gates
    // const numQubits = 2;
    // const circuit = new QCircuit(numQubits);
    // const initialState = new QTensor(numQubits); // Starts in |00>

    // circuit.addGate(H, [0]);       // Apply Hadamard to qubit 0 -> (|00> + |10>)/sqrt(2)
    // circuit.addGate(CNOT, [1], [0]); // Apply CNOT with control=0, target=1 -> (|00> + |11>)/sqrt(2)

    // const finalTensor = circuit.run(initialState);

    // console.log("Initial State (|00>):", initialState.amplitudes);
    // console.log("Final State (Bell |Φ+>):", finalTensor.amplitudes);

    // // Compare with directly created Bell state
    // const bellState = qEntangle.createBellState('Phi+');
    // console.log("Direct Bell State:", bellState.amplitudes);

    // // Example Measurement
    // const measurement = qMeasure.measureQubit(finalTensor, 0); // Measure qubit 0
    // console.log(`Measured Qubit 0: Outcome = ${measurement.outcome}`);
    // console.log("State after measurement:", measurement.newState.amplitudes);

}

runSimulation().catch(console.error);
