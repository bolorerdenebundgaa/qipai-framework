/**
 * PhaseAgent.js
 * 
 * Quantum-inspired autonomous reasoning agent using phase-based planning.
 * The agent uses quantum-like interference patterns to perform reasoning
 * and planning tasks with implicit parallelism.
 */

import { QTensor } from '../core/qTensor.js';
import { QCircuit } from '../core/qCircuit.js';
import * as Gates from '../core/gates.js';
import * as qMath from '../math/qmath.js';
import { PhaseMemory } from '../memory/PhaseMemory.js';
import { SymbolicMemory } from '../memory/SymbolicMemory.js';

/**
 * Phase-based Quantum Agent
 * An agent that leverages quantum-inspired algorithms for reasoning
 */
export class PhaseAgent {
    /**
     * Create a new phase-based agent
     * @param {Object} options - Configuration options
     * @param {number} options.stateSize - Size of the agent's state space (qubits)
     * @param {number} options.actionSize - Size of the agent's action space (qubits)
     * @param {Object} options.memory - Memory configuration
     * @param {boolean} options.useQuantumHardware - Whether to use quantum hardware if available
     */
    constructor(options = {}) {
        // Core state dimensions
        this.stateSize = options.stateSize || 6;  // Default: 6 qubits (64 states)
        this.actionSize = options.actionSize || 3; // Default: 3 qubits (8 actions)
        
        // Memory systems
        this.phaseMemory = new PhaseMemory({
            size: options.memory?.phaseSize || 256,
            decayRate: options.memory?.decayRate || 0.99
        });
        
        this.symbolicMemory = new SymbolicMemory({
            capacity: options.memory?.symbolicCapacity || 1000
        });
        
        // Reasoning circuit
        this.reasoningCircuit = this._buildReasoningCircuit();
        
        // Hardware configuration
        this.useQuantumHardware = options.useQuantumHardware || false;
        this.hardwareAdapter = null;
        
        // Agent state
        this.currentState = null;
        this.goalState = null;
        this.lastAction = null;
        this.reasoningSteps = 0;
        
        // Performance metrics
        this.metrics = {
            planningAccuracy: 0,
            reasoningTime: 0,
            explorationRate: 1.0,
            successRate: 0
        };
    }
    
    /**
     * Connect to environment
     * @param {Object} environment - Environment interface
     * @returns {PhaseAgent} this (for chaining)
     */
    connect(environment) {
        this.environment = environment;
        this.currentState = this._observeState();
        return this;
    }
    
    /**
     * Set a goal for the agent
     * @param {Object|Array} goal - Goal representation
     * @returns {PhaseAgent} this (for chaining)
     */
    setGoal(goal) {
        this.goalState = this._encodeState(goal);
        return this;
    }
    
    /**
     * Execute a single reasoning step
     * @returns {Object} Action to take
     */
    reason() {
        const startTime = performance.now();
        
        // Encode current state and goal into quantum representation
        const stateEncoding = this._encodeState(this.currentState);
        
        // Initialize superposition of all possible actions
        const actionState = this._initializeActionSpace();
        
        // Query phase memory for relevant past experiences
        const memories = this.phaseMemory.retrieveSimilar(stateEncoding, 5);
        
        // Perform quantum-inspired reasoning
        let reasonedAction;
        if (this.useQuantumHardware && this.hardwareAdapter) {
            reasonedAction = this._performQuantumReasoning(stateEncoding, actionState);
        } else {
            reasonedAction = this._performSimulatedReasoning(stateEncoding, actionState, memories);
        }
        
        // Update metrics
        this.reasoningSteps++;
        this.metrics.reasoningTime = performance.now() - startTime;
        this.metrics.explorationRate = Math.max(0.1, 1.0 / (1 + this.reasoningSteps/100));
        
        // Store the action
        this.lastAction = reasonedAction;
        
        return this._decodeAction(reasonedAction);
    }
    
    /**
     * Execute a plan towards the goal
     * @param {Object} options - Planning options
     * @param {number} options.maxSteps - Maximum number of steps to take
     * @param {number} options.threshold - Success threshold
     * @returns {Object} Planning results
     */
    async plan(options = {}) {
        const maxSteps = options.maxSteps || 100;
        const threshold = options.threshold || 0.95;
        
        const planSteps = [];
        let success = false;
        
        // Plan and execute actions until goal is reached or max steps
        for (let i = 0; i < maxSteps; i++) {
            // Perceive current state
            this.currentState = this._observeState();
            
            // Check if goal reached
            const similarity = this._stateSimilarity(this.currentState, this.goalState);
            if (similarity > threshold) {
                success = true;
                break;
            }
            
            // Reason about next action
            const action = this.reason();
            
            // Execute action
            const result = await this.environment.executeAction(action);
            
            // Store in memory
            this._storeExperience(this.currentState, action, result);
            
            // Record plan step
            planSteps.push({
                state: this.currentState,
                action: action,
                result: result,
                step: i
            });
        }
        
        // Update success metrics
        if (success) {
            this.metrics.successRate = 
                (this.metrics.successRate * this.reasoningSteps + 1) / 
                (this.reasoningSteps + 1);
        }
        
        return {
            success,
            steps: planSteps,
            metrics: { ...this.metrics },
            finalState: this._observeState()
        };
    }
    
    /**
     * Learn from example plans or demonstrations
     * @param {Array<Object>} examples - Example sequences
     * @returns {Object} Learning metrics
     */
    learn(examples) {
        let totalExamples = 0;
        let learnedPatterns = 0;
        
        // Process each example
        for (const example of examples) {
            const { states, actions, results } = example;
            
            // Store each state-action-result triplet
            for (let i = 0; i < states.length - 1; i++) {
                const state = states[i];
                const action = actions[i];
                const result = results ? results[i] : states[i+1];
                
                // Encode and store in memory
                this._storeExperience(state, action, result, 1.5); // Higher weight for expert examples
                learnedPatterns++;
            }
            
            totalExamples++;
        }
        
        return {
            processedExamples: totalExamples,
            learnedPatterns: learnedPatterns,
            phaseMemorySize: this.phaseMemory.getSize(),
            symbolicMemorySize: this.symbolicMemory.getSize()
        };
    }
    
    /**
     * Connect to quantum hardware
     * @param {Object} hardwareAdapter - Quantum hardware adapter
     * @returns {PhaseAgent} this (for chaining)
     */
    connectHardware(hardwareAdapter) {
        this.hardwareAdapter = hardwareAdapter;
        this.useQuantumHardware = true;
        return this;
    }
    
    /**
     * Get agent's current metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Build the quantum reasoning circuit
     * @returns {QCircuit} Reasoning circuit
     * @private
     */
    _buildReasoningCircuit() {
        // Total qubits: state + action
        const totalQubits = this.stateSize + this.actionSize;
        const circuit = new QCircuit(totalQubits);
        
        // Create entanglement between state and action qubits
        for (let s = 0; s < this.stateSize; s++) {
            // Apply Hadamard to create superposition
            circuit.addGate(Gates.H, [s]);
            
            // Entangle with action qubits
            for (let a = 0; a < this.actionSize; a++) {
                circuit.addGate(
                    Gates.CNOT, 
                    [this.stateSize + a], // Target: action qubit
                    [s]                   // Control: state qubit
                );
            }
        }
        
        // Create action superposition
        for (let a = 0; a < this.actionSize; a++) {
            circuit.addGate(Gates.H, [this.stateSize + a]);
        }
        
        return circuit;
    }
    
    /**
     * Initialize action space in superposition
     * @returns {QTensor} Quantum state representing action space
     * @private
     */
    _initializeActionSpace() {
        // Create quantum state for actions
        const actionState = new QTensor(this.actionSize);
        
        // Apply Hadamard gates to create superposition
        const circuit = new QCircuit(this.actionSize);
        for (let i = 0; i < this.actionSize; i++) {
            circuit.addGate(Gates.H, [i]);
        }
        
        return circuit.run(actionState);
    }
    
    /**
     * Perform simulated quantum reasoning
     * @param {Object} stateEncoding - Encoded current state
     * @param {QTensor} actionState - Action state
     * @param {Array} memories - Retrieved memories
     * @returns {Object} Reasoned action state
     * @private
     */
    _performSimulatedReasoning(stateEncoding, actionState, memories) {
        // Prepare reasoning tensor
        const reasoningState = new QTensor(this.stateSize + this.actionSize);
        
        // Encode current state
        const stateCircuit = new QCircuit(this.stateSize);
        for (let i = 0; i < this.stateSize; i++) {
            if (stateEncoding[i]) {
                stateCircuit.addGate(Gates.X, [i]);
            }
        }
        
        // Run state preparation
        const preparedState = stateCircuit.run(reasoningState);
        
        // Run reasoning circuit
        const reasonedState = this.reasoningCircuit.run(preparedState);
        
        // Incorporate memory for interference effects
        for (const memory of memories) {
            this._interferenceFromMemory(reasonedState, memory.data);
        }
        
        // Extract action from reasoned state
        return this._extractAction(reasonedState);
    }
    
    /**
     * Perform quantum reasoning on hardware
     * @param {Object} stateEncoding - Encoded current state
     * @param {QTensor} actionState - Action state
     * @returns {Object} Reasoned action state
     * @private
     */
    _performQuantumReasoning(stateEncoding, actionState) {
        // Create combined circuit for hardware execution
        const totalQubits = this.stateSize + this.actionSize;
        const hardwareCircuit = new QCircuit(totalQubits);
        
        // Prepare state
        for (let i = 0; i < this.stateSize; i++) {
            if (stateEncoding[i]) {
                hardwareCircuit.addGate(Gates.X, [i]);
            }
        }
        
        // Add reasoning circuit gates
        for (const gate of this.reasoningCircuit.gates) {
            hardwareCircuit.addGate(
                gate.gate,
                gate.targets,
                gate.controls,
                ...(gate.parameters || [])
            );
        }
        
        // Add measurement of action qubits
        for (let a = 0; a < this.actionSize; a++) {
            hardwareCircuit.addMeasurement(this.stateSize + a);
        }
        
        // Execute on quantum hardware
        const result = this.hardwareAdapter.executeCircuit(hardwareCircuit, {
            shots: 1024,
            optimize: true
        });
        
        // Process measurement results to determine best action
        const actionCounts = result.counts;
        let bestAction = null;
        let maxCount = 0;
        
        for (const [bitstring, count] of Object.entries(actionCounts)) {
            if (count > maxCount) {
                // Extract only the action part of the bitstring
                bestAction = parseInt(
                    bitstring.slice(this.stateSize),
                    2
                );
                maxCount = count;
            }
        }
        
        // Encode as action array
        const actionArray = new Array(this.actionSize);
        for (let i = 0; i < this.actionSize; i++) {
            actionArray[i] = (bestAction >> i) & 1;
        }
        
        return actionArray;
    }
    
    /**
     * Apply interference effects from memory
     * @param {QTensor} state - Quantum state
     * @param {Object} memory - Memory data
     * @private
     */
    _interferenceFromMemory(state, memory) {
        // Extract state and action from memory
        const memoryState = memory.state;
        const memoryAction = memory.action;
        const memoryReward = memory.reward || 0;
        
        // Determine phase shift based on similarity and reward
        const similarity = this._stateSimilarity(this.currentState, memoryState);
        const phaseShift = similarity * Math.PI * (memoryReward > 0 ? 1 : -0.5);
        
        // Create circuit for applying phase shift
        const circuit = new QCircuit(this.stateSize + this.actionSize);
        
        // Apply phase rotation based on memory
        // For matching action bits
        for (let i = 0; i < this.actionSize; i++) {
            // Apply X gates to qubits where action bit is 0
            if (!memoryAction[i]) {
                circuit.addGate(Gates.X, [this.stateSize + i]);
            }
        }
        
        // Multi-controlled phase gate
        const controls = Array.from(
            { length: this.actionSize }, 
            (_, i) => this.stateSize + i
        );
        
        // Apply phase rotation
        circuit.addGate(Gates.PHASE, [0], controls, phaseShift); 
        
        // Undo X gates
        for (let i = 0; i < this.actionSize; i++) {
            if (!memoryAction[i]) {
                circuit.addGate(Gates.X, [this.stateSize + i]);
            }
        }
        
        // Apply interference circuit
        circuit.run(state);
    }
    
    /**
     * Extract optimal action from quantum state
     * @param {QTensor} state - Quantum state after reasoning
     * @returns {Array} Action encoding
     * @private
     */
    _extractAction(state) {
        const actionBits = [];
        
        // Measure each action qubit probability
        for (let i = 0; i < this.actionSize; i++) {
            // Get probability of |1⟩ for this qubit
            const prob1 = state.measureProbability(this.stateSize + i, 1);
            
            // Exploration vs exploitation
            if (Math.random() < this.metrics.explorationRate) {
                // Exploration: random bit
                actionBits[i] = Math.random() < 0.5 ? 0 : 1;
            } else {
                // Exploitation: most probable bit
                actionBits[i] = prob1 > 0.5 ? 1 : 0;
            }
        }
        
        return actionBits;
    }
    
    /**
     * Observe current state from environment
     * @returns {Object} Current state
     * @private
     */
    _observeState() {
        return this.environment ? this.environment.getState() : null;
    }
    
    /**
     * Encode state into binary representation
     * @param {Object} state - Environment state
     * @returns {Array} Binary state encoding
     * @private
     */
    _encodeState(state) {
        // Default implementation: assume state is already encoded or convertible
        if (Array.isArray(state) && state.length === this.stateSize) {
            return state;
        }
        
        // Create binary encoding of appropriate size
        const encoding = new Array(this.stateSize).fill(0);
        
        // Generic encoding strategy
        if (typeof state === 'number') {
            // Encode number as binary
            let value = state;
            for (let i = 0; i < this.stateSize && value > 0; i++) {
                encoding[i] = value & 1;
                value >>= 1;
            }
        } else if (typeof state === 'object') {
            // Use hash-based encoding for objects
            const stateStr = JSON.stringify(state);
            let hashCode = 0;
            for (let i = 0; i < stateStr.length; i++) {
                hashCode = ((hashCode << 5) - hashCode) + stateStr.charCodeAt(i);
                hashCode |= 0; // Convert to 32bit integer
            }
            
            // Distribute hash bits
            for (let i = 0; i < this.stateSize; i++) {
                encoding[i] = (hashCode >> i) & 1;
            }
        }
        
        return encoding;
    }
    
    /**
     * Decode action from binary representation
     * @param {Array} encodedAction - Binary action encoding
     * @returns {Object} Action object
     * @private
     */
    _decodeAction(encodedAction) {
        // Convert binary array to number
        let actionValue = 0;
        for (let i = 0; i < encodedAction.length; i++) {
            actionValue |= (encodedAction[i] << i);
        }
        
        // Return concrete action
        return {
            id: actionValue,
            encoding: [...encodedAction]
        };
    }
    
    /**
     * Calculate similarity between states
     * @param {Object} stateA - First state
     * @param {Object} stateB - Second state
     * @returns {number} Similarity score [0-1]
     * @private
     */
    _stateSimilarity(stateA, stateB) {
        // Handle null states
        if (!stateA || !stateB) return 0;
        
        // Encode states
        const encodingA = this._encodeState(stateA);
        const encodingB = this._encodeState(stateB);
        
        // Count matching bits
        let matches = 0;
        for (let i = 0; i < this.stateSize; i++) {
            if (encodingA[i] === encodingB[i]) {
                matches++;
            }
        }
        
        return matches / this.stateSize;
    }
    
    /**
     * Store experience in memory
     * @param {Object} state - State
     * @param {Object} action - Action taken
     * @param {Object} result - Result of action
     * @param {number} importance - Importance weight
     * @private
     */
    _storeExperience(state, action, result, importance = 1.0) {
        // Encode data
        const encodedState = this._encodeState(state);
        const encodedAction = Array.isArray(action) ? action : action.encoding;
        
        // Calculate reward from result
        const reward = result ? (result.reward || 0) : 0;
        
        // Create memory entry
        const memoryEntry = {
            state: encodedState,
            action: encodedAction,
            result: result,
            reward: reward,
            timestamp: Date.now()
        };
        
        // Store in memories
        this.phaseMemory.store(memoryEntry, importance);
        
        // Symbolic memory storage
        if (typeof state === 'object' && typeof result === 'object') {
            this.symbolicMemory.store({
                context: JSON.stringify(state),
                action: JSON.stringify(action),
                result: JSON.stringify(result),
                reward: reward
            });
        }
    }
}
