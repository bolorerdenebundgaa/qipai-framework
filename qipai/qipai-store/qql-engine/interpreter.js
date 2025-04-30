/**
 * interpreter.js
 * Executes the parsed QQL command structure.
 * Translates QQL commands into calls to the functional API (QueryBuilder).
 */

import * as qStore from '../index.js';
import { QTensor } from '../../core/qTensor.js';
import * as qMath from '../../math/qmath.js';
import * as qMeasure from '../../core/qMeasure.js';
import { SymbolicMemory } from '../../memory/SymbolicMemory.js';
import { QCircuit } from '../../core/qCircuit.js'; // Need QCircuit for basis change
import * as Gates from '../../core/gates.js'; // Need Hadamard gate

export class Interpreter {
    /**
     * @param {object} context - Initial context, potentially including { symbolicMemory: SymbolicMemory, input_state: QTensor, ... }
     */
    constructor(context = {}) {
        // Context can hold variables, input states, symbolic memory instance, etc.
        this.context = { ...context };
        // Stores loaded states mapped by their QQL variable name
        this.loadedStates = new Map();
        // Extract symbolic memory if provided
        this.symbolicMemory = this.context.symbolicMemory instanceof SymbolicMemory
            ? this.context.symbolicMemory
            : null;
        this.lastResult = null; // Store result of the most recently executed command
    }

    async interpret(commands) {
        // Use this.lastResult defined in constructor
        this.lastResult = null;
        for (const command of commands) {
            try {
                this.lastResult = await this.executeCommand(command);
                // If the command was RETURN, stop execution and return its value
                if (command.type.toUpperCase() === 'RETURN') {
                    return this.lastResult;
                }
            } catch (e) {
                console.error(`Runtime Error executing command: ${JSON.stringify(command)}`, e);
                throw e; // Rethrow or handle error reporting
            }
        }
        // If no RETURN command was encountered, return the result of the last executed command
        return this.lastResult;
    }

    async executeCommand(command) {
        switch (command.type.toUpperCase()) {
            case 'LOAD':
                return await this.executeLoad(command);
            case 'INTERFERE':
                return this.executeInterfere(command); // Not async
            case 'MEASURE':
                return this.executeMeasure(command); // Not async
            case 'ENTANGLE':
                return this.executeEntangle(command); // Not async
            case 'RETURN':
                return this.executeReturn(command); // Not async
            default:
                throw new Error(`Unknown command type: ${command.type}`);
        }
    }

    async executeLoad(command) {
        const { stateVariable, where, store } = command;

        if (!store || !store.strategy || !store.path) {
             throw new Error("LOAD command requires valid STORE options (strategy, path).");
        }

        // Use the functional query builder to load the state
        const queryOptions = { storageOptions: store };
        const qb = qStore.query(queryOptions);

        // Apply WHERE clause if present (simple metadata filter for now)
        if (where) {
            // Basic implementation: assumes where.left is 's.metadata.key'
            const metadataKey = where.left.split('.').pop(); // Get 'tag' from 's.metadata.tag'
            if (metadataKey && where.operator === '=') {
                 qb.whereMetadata({ [metadataKey]: where.right });
            } else {
                console.warn(`Unsupported WHERE clause structure: ${where.left} ${where.operator} ...`);
                // For now, we might ignore complex WHERE clauses or throw error
            }
        }

        // Execute the query - assuming LOAD implies loading one state matching criteria
        // If multiple match, how do we handle it? For now, take the first.
        // A more robust LOAD might need a specific state ID in the STORE options or WHERE clause.
        qb.limit(1); // Assume LOAD gets one state for now
        // Execute the query. run() returns an array of { qTensor, metadata } objects
        const results = await qb.run();

        if (results.length === 0) {
             throw new Error(`No state found matching criteria for LOAD ${stateVariable}`);
        }

        // Extract the QTensor from the first result
        // Note: run() currently only supports loading one file via flatfile strategy
        const loadedData = results[0];
        const loadedTensor = loadedData.qTensor;

        if (!loadedTensor) {
             // This might happen if decodeState failed to construct the QTensor
             throw new Error(`Failed to decode QTensor data for LOAD ${stateVariable}, although metadata matched.`);
        }

        this.loadedStates.set(stateVariable, loadedTensor);
        console.log(`Loaded QTensor state into variable '${stateVariable}'`);
        return loadedTensor; // Return the loaded QTensor object
    }

    executeInterfere(command) {
        const { target: targetVar, source: sourceVar } = command;

        // Get the target QTensor (must be loaded within the script)
        const targetTensor = this.getStateVariable(targetVar); // Throws if not found

        // Get the source QTensor - check loaded states first, then initial context
        let sourceTensor = null;
        if (this.loadedStates.has(sourceVar)) {
            sourceTensor = this.loadedStates.get(sourceVar);
        } else if (this.context.hasOwnProperty(sourceVar)) {
            sourceTensor = this.context[sourceVar];
            console.log(`Using context variable '${sourceVar}' for INTERFERE source.`);
        }

        if (!sourceTensor) {
            throw new Error(`Source variable '${sourceVar}' for INTERFERE not found in loaded states or context.`);
        }

        if (!(targetTensor instanceof QTensor) || !(sourceTensor instanceof QTensor)) {
             throw new Error(`Target variable '${targetVar}' for INTERFERE must hold a QTensor object.`);
        }
        if (!(sourceTensor instanceof QTensor)) {
             throw new Error(`Source variable '${sourceVar}' for INTERFERE must hold a QTensor object.`);
        }


        if (targetTensor.dimension !== sourceTensor.dimension) {
            throw new Error(`Cannot interfere states with different dimensions: ${targetVar}(${targetTensor.dimension}) vs ${sourceVar}(${sourceTensor.dimension})`);
        }

        // Perform interference (vector addition) using qMath
        const resultAmplitudes = qMath.interfere(targetTensor.amplitudes, sourceTensor.amplitudes);

        // Create a new QTensor for the result (or update targetTensor in-place?)
        // For now, create a new one. Need to decide how to handle entanglement map.
        // Simple approach: inherit target's map? Or clear it? Or try to merge? Let's inherit for now.
        // Also, the result is likely *not* normalized.
        const resultTensor = new QTensor(resultAmplitudes, {
            isNormalized: false, // Result of addition is not normalized
            entanglementMap: targetTensor.entanglement // Inherit target's map (simplistic)
        });

        // Update the target variable in the interpreter's context
        this.loadedStates.set(targetVar, resultTensor);
        console.log(`Interfered state '${sourceVar}' with '${targetVar}'. Result stored in '${targetVar}'.`);

        return resultTensor; // Return the resulting tensor
    }

    executeMeasure(command) {
        const { stateVariable, qubitIndices, basis } = command;

        let currentTensor = this.getStateVariable(stateVariable); // Get initial tensor
        let basisChangeCircuit = null;

        // Apply basis change gates if necessary
        if (basis === 'X') {
            // Apply H gate to each target qubit before measuring
            basisChangeCircuit = new QCircuit(currentTensor.qubitCount);
            for (const qubitIndex of qubitIndices) {
                basisChangeCircuit.addGate(Gates.H, [qubitIndex]);
            }
        } else if (basis === 'Y') {
            // Apply Sdg then H for Y-basis measurement
            basisChangeCircuit = new QCircuit(currentTensor.qubitCount);
            for (const qubitIndex of qubitIndices) {
                basisChangeCircuit.addGate(Gates.Sdg, [qubitIndex]); // Apply Sdg first
                basisChangeCircuit.addGate(Gates.H, [qubitIndex]);   // Then H
            }
            console.log(`Y-basis measurement: applying S† and H gates to qubits ${qubitIndices.join(', ')}`);
        } else if (basis !== 'Z') {
            throw new Error(`Unsupported measurement basis: ${basis}. Only Z, X currently supported.`);
        }

        // Apply the basis change circuit if one was created
        if (basisChangeCircuit) {
            console.log(`Applying basis change circuit for ${basis}-basis measurement...`);
            currentTensor = basisChangeCircuit.run(currentTensor);
            // Note: The state variable in loadedStates is NOT updated yet, only the local currentTensor
        }

        const outcomes = [];

        // Perform sequential Z-basis measurements on the (potentially basis-transformed) state
        for (const qubitIndex of qubitIndices) {
            if (!currentTensor || !(currentTensor instanceof QTensor)) {
                 // This check might be redundant if getStateVariable worked, but good practice
                 throw new Error(`Variable '${stateVariable}' became invalid during measurement sequence.`);
            }
            if (qubitIndex === null || qubitIndex < 0 || qubitIndex >= currentTensor.qubitCount) {
                throw new Error(`Invalid qubit index ${qubitIndex} provided for MEASURE on state '${stateVariable}' with ${currentTensor.qubitCount} qubits.`);
            }

            // Perform Z-basis measurement using qMeasure.measureQubit
            const { outcome, newState } = qMeasure.measureQubit(currentTensor, qubitIndex);

            console.log(`Measured qubit ${qubitIndex} (in effective ${basis}-basis). Outcome: ${outcome}.`);
            outcomes.push(outcome);
            currentTensor = newState; // Update tensor for the next measurement in the sequence
        }

        // Update the state variable with the final collapsed state after all measurements
        this.loadedStates.set(stateVariable, currentTensor);
        console.log(`State '${stateVariable}' collapsed after measurement(s).`);

        // Return the array of outcomes (one for each measured qubit)
        return outcomes;
    }

    async executeEntangle(command) { // Make async to handle potential symbol lookup
        const { target: targetVar, with: withTarget } = command;

        const targetTensor = this.getStateVariable(targetVar); // The tensor being modified

        let otherTensor = null;
        if (withTarget.type === 'variable') {
            otherTensor = this.getStateVariable(withTarget.name);
        } else if (withTarget.type === 'symbol') {
            if (!this.symbolicMemory) {
                throw new Error("ENTANGLE WITH symbol requires a SymbolicMemory instance in the interpreter context.");
            }
            // Get or create the embedding for the symbol
            otherTensor = await this.symbolicMemory.getStateForSymbol(withTarget.name);
        } else {
             throw new Error(`Unsupported 'with' target type for ENTANGLE: ${withTarget.type}`);
        }


        if (!targetTensor || !otherTensor || !(targetTensor instanceof QTensor) || !(otherTensor instanceof QTensor)) {
             throw new Error(`Could not resolve one or both targets for ENTANGLE to valid QTensors: ${targetVar}, ${JSON.stringify(withTarget)}`);
        }

        // Mark entanglement conceptually within each tensor's map
        // Note: This uses the simplified internal method added to QTensor
        // Mark entanglement conceptually within each tensor's map
        targetTensor._markEntangledWithTensor(otherTensor);
        otherTensor._markEntangledWithTensor(targetTensor); // Mark the other way too

        console.log(`Marked state '${targetVar}' and target '${JSON.stringify(withTarget)}' as entangled (conceptually).`);

        // ENTANGLE command doesn't produce a new value to return, maybe return null or true?
        return true;
    }

    executeReturn(command) {
        const { value } = command;

        if (value.type === 'variable') {
            // Return the QTensor object associated with the variable name
            const stateVar = this.getStateVariable(value.name);
            console.log(`Returning state variable '${value.name}'.`);
            return stateVar;
        } else if (value.type === 'collapse') {
             // RETURN COLLAPSE stateVar is equivalent to RETURN stateVar
             // because MEASURE already updated the variable to the collapsed state.
             const stateVar = this.getStateVariable(value.name);
             console.log(`Returning collapsed state variable '${value.name}'.`);
             return stateVar;
        } else if (value.type === 'last_result') {
            console.log("Returning result of the previous command.");
            // The actual value is already stored in this.lastResult by the interpret loop
            // before this function is called. We just need to return it.
            // Note: This assumes RETURN LAST_RESULT is the *last* command.
            // If other commands followed, this.lastResult would be overwritten.
            // A more robust implementation might store results differently.
            return this.lastResult;
        }
        // TODO: Handle returning literals if parser supports them
        else {
            throw new Error(`Unsupported RETURN value type: ${value.type}`);
        }
    }


    // --- Placeholder Execution Methods ---

    // async executeEntangle(command) {
    //     // 1. Get target state(s) from this.loadedStates or context
    //     // 2. Get entanglement target (symbolic name? another state variable?)
    //     // 3. Perform entanglement (might involve creating circuits/applying gates)
    //     // 4. Update the state in this.loadedStates
    //     console.warn("ENTANGLE command interpretation not implemented.");
    // }

    // async executeInterfere(command) {
    //     // 1. Get target state from this.loadedStates
    //     // 2. Get 'otherState' (resolve if it's a variable name)
    //     // 3. Perform interference using qMath.interfere or similar
    //     // 4. Update the state in this.loadedStates
    //      console.warn("INTERFERE command interpretation not implemented.");
    // }

     // async executeMeasure(command) {
    //     // 1. Get target state from this.loadedStates
    //     // 2. Parse basis and target qubits
    //     // 3. Perform measurement using qMeasure functions
    //     // 4. Store result (outcome, collapsed state) potentially in context or update state
    //      console.warn("MEASURE command interpretation not implemented.");
    // }

    // executeReturn(command) {
    //     // 1. Resolve the value to return (state variable, measurement outcome, etc.)
    //     // 2. Return the value
    //      console.warn("RETURN command interpretation not implemented.");
    //      return null;
    // }

    // Helper to get state from variable name
    getStateVariable(name) {
        if (!this.loadedStates.has(name)) {
            throw new Error(`State variable '${name}' not loaded or defined.`);
        }
        return this.loadedStates.get(name);
    }
}

// Example Usage:
// import { tokenize } from './tokenizer.js';
// import { Parser } from './parser.js';
//
// async function runQQL(qqlString, initialContext = {}) {
//     const tokens = tokenize(qqlString);
//     const parser = new Parser(tokens);
//     const commands = parser.parse();
//     const interpreter = new Interpreter(initialContext);
//     const result = await interpreter.interpret(commands);
//     console.log("QQL Execution Result:", result);
//     console.log("Interpreter State Context:", interpreter.loadedStates);
// }
//
// const qql = `LOAD STATE myState WHERE myState.metadata.tag = "test" USING STORE { strategy: 'flatfile', path: './test_state.qstate.bin' }`;
// // Assume test_state.qstate.bin exists and matches metadata
// // runQQL(qql);
