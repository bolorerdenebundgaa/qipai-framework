/**
 * QLearningEngine.js
 * Core quantum reinforcement learning engine for QiPAI framework.
 * 
 * This engine provides the fundamental mechanisms for quantum-enhanced 
 * reinforcement learning, including state representation, action selection,
 * and value/policy learning through quantum circuits.
 */

import { QTensor } from '../core/qTensor.js';
import { QTensorSparse } from '../core/qTensorSparse.js';
import { QCircuit } from '../core/qCircuit.js';
import * as Gates from '../core/gates.js';
import * as qMath from '../math/qmath.js';
import { PhaseMemory } from '../memory/PhaseMemory.js';
import { QOptimizer } from '../training/qOptimizer.js';

/**
 * Quantum Reinforcement Learning Engine
 * Provides base functionality for quantum-enhanced RL algorithms
 */
export class QLearningEngine {
    /**
     * @param {Object} options - Configuration options
     * @param {number} options.stateQubits - Number of qubits for state representation
     * @param {number} options.actionQubits - Number of qubits for action representation
     * @param {boolean} options.sparse - Whether to use sparse quantum state representation
     * @param {Object} options.memory - Memory configuration
     * @param {number} options.memory.capacity - Maximum number of experiences to store
     * @param {number} options.gamma - Discount factor (default: 0.99)
     * @param {string} options.optimizer - Optimizer type (default: 'adam')
     */
    constructor(options = {}) {
        // Core parameters
        this.stateQubits = options.stateQubits || 4;
        this.actionQubits = options.actionQubits || 2;
        this.totalQubits = this.stateQubits + this.actionQubits;
        this.useSparse = options.sparse || false;
        
        // RL parameters
        this.gamma = options.gamma || 0.99; // Discount factor
        
        // Create memory for experience storage
        this.memory = new PhaseMemory({
            capacity: options.memory?.capacity || 10000,
            qubitCount: this.totalQubits
        });
        
        // Initialize policy and value circuits
        this.policyCircuit = this._createPolicyCircuit();
        this.valueCircuit = this._createValueCircuit();
        
        // Circuit parameters (trainable)
        this.policyParams = this._initializeParameters(this.policyCircuit.paramCount);
        this.valueParams = this._initializeParameters(this.valueCircuit.paramCount);
        
        // Optimizer
        this.optimizer = new QOptimizer({
            type: options.optimizer || 'adam',
            learningRate: options.learningRate || 0.001
        });
        
        // Statistics and tracking
        this.episodeRewards = [];
        this.episodeSteps = [];
        this.cumulativeReward = 0;
        this.steps = 0;
    }
    
    /**
     * Encode a classical state into a quantum state
     * @param {Array|Object} classicalState - Classical state representation
     * @returns {QTensor|QTensorSparse} - Quantum state
     */
    encodeState(classicalState) {
        // Convert classical state to quantum state
        // This is a simple encoding - more sophisticated encodings can be implemented
        
        // Create a quantum state with all qubits in |0⟩
        const stateVector = this.useSparse ? 
            new QTensorSparse({ numQubits: this.stateQubits }) : 
            new QTensor(this.stateQubits);
            
        // Apply encoding circuit based on classical state values
        const encodingCircuit = new QCircuit(this.stateQubits);
        
        if (Array.isArray(classicalState)) {
            // Assuming classicalState is an array of numbers in [0,1]
            for (let i = 0; i < Math.min(classicalState.length, this.stateQubits); i++) {
                const rotationAngle = classicalState[i] * Math.PI;
                // Apply rotation based on feature value
                encodingCircuit.addRotation('Y', rotationAngle, [i]);
            }
        } else if (typeof classicalState === 'object') {
            // Assuming classicalState is an object with named features
            let i = 0;
            for (const [key, value] of Object.entries(classicalState)) {
                if (i >= this.stateQubits) break;
                
                const normalizedValue = typeof value === 'number' ? 
                    Math.max(0, Math.min(1, value)) : // Ensure value is in [0,1]
                    (value ? 1.0 : 0.0); // Boolean or other type as binary
                    
                const rotationAngle = normalizedValue * Math.PI;
                encodingCircuit.addRotation('Y', rotationAngle, [i]);
                i++;
            }
        }
        
        // Run the encoding circuit to prepare the state
        return encodingCircuit.run(stateVector);
    }
    
    /**
     * Selects an action for a given state using the policy circuit
     * @param {QTensor|QTensorSparse} stateVector - Quantum state representing the environment state
     * @param {number} epsilon - Exploration rate (0-1)
     * @returns {Object} Selected action information
     */
    selectAction(stateVector, epsilon = 0.1) {
        // Epsilon-greedy exploration
        if (Math.random() < epsilon) {
            // Explore: Random action
            const actionIndex = Math.floor(Math.random() * (2 ** this.actionQubits));
            return {
                actionIndex,
                actionVector: this._indexToVector(actionIndex, this.actionQubits),
                isExploration: true
            };
        }
        
        // Exploit: Use policy circuit to get action probabilities
        const actionProbabilities = this._computeActionProbabilities(stateVector);
        
        // Select action based on probabilities
        const actionIndex = this._sampleFromDistribution(actionProbabilities);
        return {
            actionIndex,
            actionVector: this._indexToVector(actionIndex, this.actionQubits),
            actionProbabilities,
            isExploration: false
        };
    }
    
    /**
     * Store an experience tuple in memory
     * @param {Object} experience - Experience data
     * @param {QTensor|QTensorSparse} experience.state - State
     * @param {number} experience.action - Action index
     * @param {number} experience.reward - Reward value
     * @param {QTensor|QTensorSparse} experience.nextState - Next state
     * @param {boolean} experience.done - Whether the episode is done
     */
    storeExperience(experience) {
        this.memory.store({
            state: experience.state,
            action: experience.action,
            reward: experience.reward,
            nextState: experience.nextState,
            done: experience.done
        });
        
        // Update statistics
        this.cumulativeReward += experience.reward;
        this.steps++;
        
        if (experience.done) {
            this.episodeRewards.push(this.cumulativeReward);
            this.episodeSteps.push(this.steps);
            this.cumulativeReward = 0;
            this.steps = 0;
        }
    }
    
    /**
     * Train the agent using experiences from memory
     * @param {Object} options - Training options
     * @param {number} options.batchSize - Number of experiences per batch
     * @param {number} options.epochs - Number of training epochs
     * @returns {Object} Training statistics
     */
    train(options = {}) {
        const batchSize = options.batchSize || 32;
        const epochs = options.epochs || 1;
        
        if (this.memory.size < batchSize) {
            console.warn(`Not enough experiences in memory (${this.memory.size}/${batchSize}). Skipping training.`);
            return { loss: null, iterations: 0 };
        }
        
        let totalPolicyLoss = 0;
        let totalValueLoss = 0;
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            // Sample batch of experiences
            const batch = this.memory.sample(batchSize);
            
            // Compute value targets and advantages
            const { targets, advantages } = this._computeTargetsAndAdvantages(batch);
            
            // Update value function
            const valueLoss = this._updateValueFunction(batch, targets);
            
            // Update policy
            const policyLoss = this._updatePolicy(batch, advantages);
            
            totalValueLoss += valueLoss;
            totalPolicyLoss += policyLoss;
        }
        
        return {
            valueLoss: totalValueLoss / epochs,
            policyLoss: totalPolicyLoss / epochs,
            iterations: epochs
        };
    }
    
    /**
     * Get the estimated value of a state
     * @param {QTensor|QTensorSparse} stateVector - Quantum state
     * @returns {number} Estimated value
     */
    estimateValue(stateVector) {
        // Prepare the state for value estimation
        const valueCircuitInput = this._prepareValueInput(stateVector);
        
        // Apply value circuit with current parameters
        const valueCircuitOutput = this.valueCircuit.run(valueCircuitInput, this.valueParams);
        
        // Measure the output to get the value estimate
        // Simplified: Use the expectation value of a specific qubit
        const { outcome, probability } = qMath.measureQubit(valueCircuitOutput, 0);
        
        // Map from [0,1] to [-1,1] range for the value estimate
        return 2 * probability - 1;
    }
    
    // --- Private helper methods ---
    
    /**
     * Create the policy circuit architecture
     * @private
     */
    _createPolicyCircuit() {
        // This is a simplified policy circuit - in a real implementation,
        // this would be more sophisticated with trainable parameters
        
        const circuit = new QCircuit(this.totalQubits);
        
        // Add initial Hadamard gates to action qubits for superposition
        for (let i = this.stateQubits; i < this.totalQubits; i++) {
            circuit.addGate(Gates.H, [i]);
        }
        
        // Add entanglement between state and action qubits
        for (let i = 0; i < this.stateQubits; i++) {
            for (let j = this.stateQubits; j < this.totalQubits; j++) {
                circuit.addGate(Gates.CNOT, [j], [i]);
            }
        }
        
        // Add trainable rotation gates
        for (let i = 0; i < this.totalQubits; i++) {
            circuit.addParameterizedGate('RY', [i]); // Rotation around Y axis
            circuit.addParameterizedGate('RZ', [i]); // Rotation around Z axis
        }
        
        return circuit;
    }
    
    /**
     * Create the value circuit architecture
     * @private
     */
    _createValueCircuit() {
        // Simplified value circuit
        const circuit = new QCircuit(this.stateQubits + 1); // +1 for value output qubit
        
        // Add Hadamard to the value qubit
        circuit.addGate(Gates.H, [this.stateQubits]);
        
        // Add entanglement between state and value qubit
        for (let i = 0; i < this.stateQubits; i++) {
            circuit.addGate(Gates.CNOT, [this.stateQubits], [i]);
        }
        
        // Add trainable rotation gates
        for (let i = 0; i < circuit.numQubits; i++) {
            circuit.addParameterizedGate('RY', [i]);
            circuit.addParameterizedGate('RZ', [i]);
        }
        
        return circuit;
    }
    
    /**
     * Initialize trainable parameters for a circuit
     * @param {number} paramCount - Number of parameters
     * @private
     */
    _initializeParameters(paramCount) {
        // Initialize with small random values
        return Array.from({ length: paramCount }, () => (Math.random() - 0.5) * 0.1);
    }
    
    /**
     * Compute action probabilities using the policy circuit
     * @param {QTensor|QTensorSparse} stateVector - State representation
     * @returns {Array<number>} Action probabilities
     * @private
     */
    _computeActionProbabilities(stateVector) {
        // Prepare input for policy circuit (combine state with action qubits)
        const policyInput = this._preparePolicyInput(stateVector);
        
        // Run policy circuit with current parameters
        const policyOutput = this.policyCircuit.run(policyInput, this.policyParams);
        
        // Extract action probabilities by measuring action qubits
        const actionProbs = [];
        const numActions = 2 ** this.actionQubits;
        
        // Simplified: Calculate probabilities for all possible actions
        for (let actionIdx = 0; actionIdx < numActions; actionIdx++) {
            // Convert action index to bit string
            const actionBits = actionIdx.toString(2).padStart(this.actionQubits, '0');
            
            // Calculate probability of this action
            let prob = 0;
            for (let i = 0; i < policyOutput.dimension; i++) {
                // Get the action part of the state index
                const stateBinary = i.toString(2).padStart(this.totalQubits, '0');
                const actionPart = stateBinary.slice(-this.actionQubits);
                
                if (actionPart === actionBits) {
                    const amplitude = policyOutput.getAmplitude(i);
                    prob += qMath.squaredMagnitude(amplitude);
                }
            }
            
            actionProbs.push(prob);
        }
        
        // Normalize probabilities (should sum to 1, but ensure numerical stability)
        const sum = actionProbs.reduce((a, b) => a + b, 0);
        return actionProbs.map(p => p / sum);
    }
    
    /**
     * Prepare input state for policy circuit
     * @param {QTensor|QTensorSparse} stateVector - State representation
     * @returns {QTensor|QTensorSparse} - Combined state for policy circuit
     * @private
     */
    _preparePolicyInput(stateVector) {
        // Create a larger quantum state that includes action qubits
        const combinedState = this.useSparse ?
            new QTensorSparse({ numQubits: this.totalQubits }) :
            new QTensor(this.totalQubits);
        
        // TODO: Properly encode stateVector into combinedState
        // This is a simplification - in practice would need tensoring
        return combinedState;
    }
    
    /**
     * Prepare input state for value circuit
     * @param {QTensor|QTensorSparse} stateVector - State representation
     * @returns {QTensor|QTensorSparse} - Combined state for value circuit
     * @private
     */
    _prepareValueInput(stateVector) {
        // Add an extra qubit for value output
        const valueInput = this.useSparse ?
            new QTensorSparse({ numQubits: this.stateQubits + 1 }) :
            new QTensor(this.stateQubits + 1);
        
        // TODO: Properly encode stateVector into valueInput
        // This is a simplification - in practice would need tensoring
        return valueInput;
    }
    
    /**
     * Compute targets and advantages for a batch of experiences
     * @param {Array} batch - Batch of experiences
     * @returns {Object} Targets and advantages
     * @private
     */
    _computeTargetsAndAdvantages(batch) {
        const targets = [];
        const advantages = [];
        
        for (const experience of batch) {
            // Compute target for value function
            let target;
            if (experience.done) {
                target = experience.reward;
            } else {
                const nextValue = this.estimateValue(experience.nextState);
                target = experience.reward + this.gamma * nextValue;
            }
            
            // Compute advantage (how much better this action was than expected)
            const value = this.estimateValue(experience.state);
            const advantage = target - value;
            
            targets.push(target);
            advantages.push(advantage);
        }
        
        return { targets, advantages };
    }
    
    /**
     * Update value function based on targets
     * @param {Array} batch - Batch of experiences
     * @param {Array} targets - Target values
     * @returns {number} Value loss
     * @private
     */
    _updateValueFunction(batch, targets) {
        // Calculate gradients using parameter-shift rule
        const gradients = this._computeValueGradients(batch, targets);
        
        // Update parameters using optimizer
        this.valueParams = this.optimizer.update(this.valueParams, gradients);
        
        // Calculate and return loss
        let loss = 0;
        for (let i = 0; i < batch.length; i++) {
            const value = this.estimateValue(batch[i].state);
            loss += (value - targets[i]) ** 2;
        }
        
        return loss / batch.length;
    }
    
    /**
     * Update policy based on advantages
     * @param {Array} batch - Batch of experiences
     * @param {Array} advantages - Advantages for each experience
     * @returns {number} Policy loss
     * @private
     */
    _updatePolicy(batch, advantages) {
        // Calculate gradients using parameter-shift rule
        const gradients = this._computePolicyGradients(batch, advantages);
        
        // Update parameters using optimizer
        this.policyParams = this.optimizer.update(this.policyParams, gradients);
        
        // Calculate and return loss (policy gradient loss)
        let loss = 0;
        // Loss calculation is complex for policy gradient methods
        // This is simplified for illustration
        
        return loss;
    }
    
    /**
     * Compute gradients for value function using parameter-shift rule
     * @param {Array} batch - Batch of experiences
     * @param {Array} targets - Target values
     * @returns {Array} Gradients for each parameter
     * @private
     */
    _computeValueGradients(batch, targets) {
        // Parameter-shift rule for computing gradients
        // This is a simplified implementation
        const gradients = new Array(this.valueParams.length).fill(0);
        
        // TODO: Implement proper parameter-shift rule
        
        return gradients;
    }
    
    /**
     * Compute gradients for policy using parameter-shift rule
     * @param {Array} batch - Batch of experiences
     * @param {Array} advantages - Advantages for each experience
     * @returns {Array} Gradients for each parameter
     * @private
     */
    _computePolicyGradients(batch, advantages) {
        // Parameter-shift rule for computing gradients
        // This is a simplified implementation
        const gradients = new Array(this.policyParams.length).fill(0);
        
        // TODO: Implement proper parameter-shift rule
        
        return gradients;
    }
    
    /**
     * Sample an index from a probability distribution
     * @param {Array<number>} probs - Probability distribution
     * @returns {number} Sampled index
     * @private
     */
    _sampleFromDistribution(probs) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < probs.length; i++) {
            cumulative += probs[i];
            if (rand < cumulative) {
                return i;
            }
        }
        
        return probs.length - 1; // Fallback
    }
    
    /**
     * Convert an action index to a vector representation
     * @param {number} index - Action index
     * @param {number} size - Vector size
     * @returns {Array<number>} Binary vector representation
     * @private
     */
    _indexToVector(index, size) {
        const binary = index.toString(2).padStart(size, '0');
        return Array.from(binary).map(bit => parseInt(bit));
    }
}
