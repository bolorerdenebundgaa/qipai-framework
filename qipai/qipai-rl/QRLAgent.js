/**
 * QRLAgent.js
 * Quantum Reinforcement Learning Agent - a high-level agent that
 * uses quantum reinforcement learning to interact with environments.
 * 
 * This agent provides the autonomous decision-making capabilities
 * needed for self-learning AI within the QiPAI framework.
 */

import { QLearningEngine } from './QLearningEngine.js';
import { QTensor } from '../core/qTensor.js';
import { QTensorSparse } from '../core/qTensorSparse.js';
import { SymbolicMemory } from '../memory/SymbolicMemory.js';

/**
 * Quantum Reinforcement Learning Agent
 * Autonomous agent that uses quantum-enhanced RL for decision making
 */
export class QRLAgent {
    /**
     * @param {Object} options - Configuration options
     * @param {QLearningEngine} options.engine - Learning engine (if not provided, one will be created)
     * @param {Object} options.engineOptions - Options for creating a new engine
     * @param {number} options.episodeLimit - Maximum steps per episode
     * @param {number} options.explorationDecay - Rate at which exploration decreases
     * @param {number} options.minExploration - Minimum exploration rate
     * @param {number} options.trainingFrequency - How often to train (in steps)
     * @param {boolean} options.useSymbolicMemory - Whether to use symbolic memory for concepts
     */
    constructor(options = {}) {
        // Learning engine
        this.engine = options.engine || new QLearningEngine(options.engineOptions || {});
        
        // Learning parameters
        this.episodeLimit = options.episodeLimit || 1000;
        this.explorationRate = options.explorationRate || 1.0;
        this.explorationDecay = options.explorationDecay || 0.995;
        this.minExploration = options.minExploration || 0.05;
        this.trainingFrequency = options.trainingFrequency || 10;
        
        // Episode tracking
        this.episodeCount = 0;
        this.stepCount = 0;
        this.totalSteps = 0;
        
        // State tracking
        this.currentState = null;
        this.lastAction = null;
        this.lastReward = null;
        
        // Symbolic memory (for concept learning)
        this.useSymbolicMemory = options.useSymbolicMemory || false;
        if (this.useSymbolicMemory) {
            this.symbolicMemory = new SymbolicMemory();
        }
        
        // Performance metrics
        this.episodeRewards = [];
        this.episodeLengths = [];
        this.runningReward = 0;
    }
    
    /**
     * Initialize the agent with an environment
     * @param {Object} env - Environment object with observe(), step(action), and reset() methods
     */
    initialize(env) {
        this.environment = env;
        this.reset();
    }
    
    /**
     * Reset the agent for a new episode
     */
    reset() {
        // Reset environment
        if (this.environment) {
            const observation = this.environment.reset();
            this.currentState = this.engine.encodeState(observation);
        }
        
        // Reset episode tracking
        this.stepCount = 0;
        this.runningReward = 0;
        this.lastAction = null;
        this.lastReward = null;
        
        if (this.episodeCount > 0) {
            // Record episode metrics if this isn't the first reset
            this.episodeRewards.push(this.runningReward);
            this.episodeLengths.push(this.stepCount);
        }
        
        this.episodeCount++;
    }
    
    /**
     * Take a single step in the environment
     * @param {boolean} training - Whether the agent is training or evaluating
     * @returns {Object} Step results including reward, next state, and done flag
     */
    step(training = true) {
        if (!this.environment) {
            throw new Error("Agent must be initialized with an environment before stepping");
        }
        
        // Select action based on current state
        const exploration = training ? this.explorationRate : 0;
        const actionInfo = this.engine.selectAction(this.currentState, exploration);
        
        // Take action in environment
        const { nextObservation, reward, done, info } = this.environment.step(actionInfo.actionIndex);
        
        // Convert observation to quantum state
        const nextState = this.engine.encodeState(nextObservation);
        
        // Store experience if training
        if (training) {
            this.engine.storeExperience({
                state: this.currentState,
                action: actionInfo.actionIndex,
                reward: reward,
                nextState: nextState,
                done: done
            });
            
            // Decay exploration rate
            this.explorationRate = Math.max(
                this.minExploration, 
                this.explorationRate * this.explorationDecay
            );
            
            // Train at specified frequency
            if (this.totalSteps % this.trainingFrequency === 0) {
                this.train();
            }
        }
        
        // Update state tracking
        this.currentState = nextState;
        this.lastAction = actionInfo;
        this.lastReward = reward;
        this.runningReward += reward;
        this.stepCount++;
        this.totalSteps++;
        
        // End episode if done or episode limit reached
        const episodeOver = done || (this.stepCount >= this.episodeLimit);
        if (episodeOver && training) {
            this.reset();
        }
        
        return {
            state: this.currentState,
            action: actionInfo,
            reward: reward,
            done: done,
            info: info,
            episodeOver: episodeOver
        };
    }
    
    /**
     * Run a complete episode
     * @param {boolean} training - Whether the agent is training or evaluating
     * @param {boolean} render - Whether to render the environment
     * @returns {Object} Episode results
     */
    runEpisode(training = true, render = false) {
        this.reset();
        let totalReward = 0;
        let done = false;
        
        while (!done && this.stepCount < this.episodeLimit) {
            // Take a step
            const stepResult = this.step(training);
            totalReward += stepResult.reward;
            done = stepResult.done;
            
            // Render if requested
            if (render && this.environment.render) {
                this.environment.render();
            }
        }
        
        return {
            totalReward,
            steps: this.stepCount,
            explorationRate: this.explorationRate
        };
    }
    
    /**
     * Train the agent for a specified number of episodes
     * @param {Object} options - Training options
     * @param {number} options.episodes - Number of episodes to train
     * @param {boolean} options.render - Whether to render the environment
     * @param {Function} options.callback - Callback after each episode
     * @returns {Object} Training results
     */
    trainEpisodes(options = {}) {
        const episodes = options.episodes || 10;
        const render = options.render || false;
        const callback = options.callback || null;
        
        const results = [];
        
        for (let i = 0; i < episodes; i++) {
            const episodeResult = this.runEpisode(true, render);
            results.push(episodeResult);
            
            if (callback) {
                callback({
                    episode: this.episodeCount - 1,
                    ...episodeResult
                });
            }
        }
        
        return {
            episodes: results,
            averageReward: results.reduce((sum, r) => sum + r.totalReward, 0) / results.length,
            averageSteps: results.reduce((sum, r) => sum + r.steps, 0) / results.length
        };
    }
    
    /**
     * Evaluate the agent for a specified number of episodes
     * @param {Object} options - Evaluation options
     * @param {number} options.episodes - Number of episodes to evaluate
     * @param {boolean} options.render - Whether to render the environment
     * @returns {Object} Evaluation results
     */
    evaluate(options = {}) {
        const episodes = options.episodes || 5;
        const render = options.render || false;
        
        const results = [];
        
        for (let i = 0; i < episodes; i++) {
            const episodeResult = this.runEpisode(false, render);
            results.push(episodeResult);
        }
        
        return {
            episodes: results,
            averageReward: results.reduce((sum, r) => sum + r.totalReward, 0) / results.length,
            averageSteps: results.reduce((sum, r) => sum + r.steps, 0) / results.length
        };
    }
    
    /**
     * Explicitly trigger training
     * @param {Object} options - Training options
     * @returns {Object} Training statistics
     */
    train(options = {}) {
        return this.engine.train(options);
    }
    
    /**
     * Save the agent's state
     * @param {string} path - Path to save to
     * @returns {Promise<void>}
     */
    async save(path) {
        // TODO: Implement saving the agent's state
        // This would involve saving:
        // 1. The engine's parameters
        // 2. The agent's configuration
        // 3. The symbolic memory (if used)
        console.log(`Would save agent state to ${path}`);
    }
    
    /**
     * Load the agent's state
     * @param {string} path - Path to load from
     * @returns {Promise<void>}
     */
    async load(path) {
        // TODO: Implement loading the agent's state
        console.log(`Would load agent state from ${path}`);
    }
    
    /**
     * Get agent performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            episodeCount: this.episodeCount,
            totalSteps: this.totalSteps,
            averageReward: this.episodeRewards.length > 0 ? 
                this.episodeRewards.reduce((a, b) => a + b, 0) / this.episodeRewards.length : 0,
            averageEpisodeLength: this.episodeLengths.length > 0 ?
                this.episodeLengths.reduce((a, b) => a + b, 0) / this.episodeLengths.length : 0,
            explorationRate: this.explorationRate,
            lastTrainingStats: this.lastTrainingStats
        };
    }
    
    /**
     * Conceptually link the current state with a symbolic concept
     * Only available if useSymbolicMemory is true
     * @param {string} concept - Concept to link with current state
     */
    linkWithConcept(concept) {
        if (!this.useSymbolicMemory) {
            throw new Error("Symbolic memory is not enabled for this agent");
        }
        
        if (!this.currentState) {
            throw new Error("No current state to link with concept");
        }
        
        this.symbolicMemory.associateStateWithSymbol(this.currentState, concept);
        console.log(`Linked current state with concept: ${concept}`);
    }
}
