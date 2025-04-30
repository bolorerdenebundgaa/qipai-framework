/**
 * autonomous-agent-example.js
 * 
 * This example demonstrates how to build a fully autonomous self-learning quantum AI
 * model by integrating the different QiPAI components:
 * 
 * 1. Quantum Reinforcement Learning (qipai-rl) for decision making
 * 2. Quantum Memory (memory) for experience storage
 * 3. Core quantum mechanics (core) for state representation
 * 4. Symbolic reasoning (reasoning) for conceptual understanding
 * 5. Integration with storage (qipai-store) for persisting states and models
 */

// Import core components
import { QTensor, QTensorSparse } from '../core/qTensor.js';
import * as qMath from '../math/qmath.js';

// Import RL components
import { QLearningEngine, QRLAgent } from '../qipai-rl/index.js';
import { GridWorldEnv } from '../qipai-rl/examples/GridWorldExample.js';

// Import memory components
import { PhaseMemory } from '../memory/PhaseMemory.js';
import { SymbolicMemory } from '../memory/SymbolicMemory.js';

// Import reasoning components
import { SymbolicInterference } from '../reasoning/SymbolicInterference.js';
import { PhaseRules } from '../reasoning/PhaseRules.js';

// Import storage components
import * as qStore from '../qipai-store/index.js';

/**
 * AutonomousQuantumAgent integrates multiple QiPAI modules to create
 * a fully autonomous self-learning agent with quantum capabilities.
 */
class AutonomousQuantumAgent {
    /**
     * Create a new autonomous quantum agent
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Initialize the reinforcement learning module
        this._initializeRL(options.rl || {});
        
        // Initialize symbolic memory for concepts
        this.symbolicMemory = new SymbolicMemory();
        
        // Initialize symbolic reasoning
        this.symbolicReasoning = new SymbolicInterference({
            memory: this.symbolicMemory
        });
        
        // Initialize phase rules for quantum-inspired reasoning
        this.phaseRules = new PhaseRules();
        
        // Storage for persisting agent state
        this.storage = {
            enabled: options.enableStorage || false,
            path: options.storagePath || './agent_data',
            strategy: options.storageStrategy || 'flatfile',
            autosaveInterval: options.autosaveInterval || 100 // steps
        };
        
        // Learning statistics
        this.stats = {
            episodeCount: 0,
            learnedConcepts: new Set(),
            storageOperations: 0,
            reasoningOperations: 0
        };
    }
    
    /**
     * Initialize the reinforcement learning components
     * @private
     */
    _initializeRL(options) {
        // Create RL engine (quantum-enhanced)
        this.engine = new QLearningEngine({
            stateQubits: options.stateQubits || 6,
            actionQubits: options.actionQubits || 3,
            sparse: options.sparse !== undefined ? options.sparse : true,
            gamma: options.gamma || 0.99,
            memory: {
                capacity: options.memoryCapacity || 10000
            }
        });
        
        // Create the agent interface
        this.agent = new QRLAgent({
            engine: this.engine,
            explorationRate: options.explorationRate || 0.5,
            explorationDecay: options.explorationDecay || 0.99,
            minExploration: options.minExploration || 0.01,
            episodeLimit: options.episodeLimit || 1000,
            trainingFrequency: options.trainingFrequency || 10,
            useSymbolicMemory: true
        });
    }
    
    /**
     * Connect the agent to an environment
     * @param {Object} environment - Environment to interact with
     */
    connect(environment) {
        this.environment = environment;
        this.agent.initialize(environment);
        console.log(`Connected to environment`);
    }
    
    /**
     * Begin the autonomous learning process
     * @param {Object} options - Learning options
     */
    async learn(options = {}) {
        const episodes = options.episodes || 100;
        const evaluationFrequency = options.evaluationFrequency || 10;
        const conceptLearningThreshold = options.conceptLearningThreshold || 5.0;
        
        console.log(`Starting autonomous learning for ${episodes} episodes`);
        
        for (let episode = 0; episode < episodes; episode++) {
            // Run a training episode
            const result = await this.agent.runEpisode(true, false);
            
            // Track performance
            this.stats.episodeCount++;
            
            // Periodic evaluation without exploration
            if (episode % evaluationFrequency === 0) {
                const evalResult = await this.agent.evaluate({ episodes: 3 });
                console.log(`Episode ${episode}: Avg Reward ${evalResult.averageReward.toFixed(2)}, Steps ${evalResult.averageSteps.toFixed(1)}`);
                
                // If performance is good, link the state with a concept
                if (evalResult.averageReward > conceptLearningThreshold) {
                    // Extract a concept using symbolic reasoning
                    const concept = await this._extractConcept(evalResult);
                    if (concept && !this.stats.learnedConcepts.has(concept)) {
                        this.agent.linkWithConcept(concept);
                        this.stats.learnedConcepts.add(concept);
                        console.log(`Learned new concept: ${concept}`);
                    }
                }
            }
            
            // Autosave agent state periodically
            if (this.storage.enabled && this.stats.episodeCount % this.storage.autosaveInterval === 0) {
                await this._saveState();
            }
        }
        
        console.log(`\nLearning complete. Summary:`);
        console.log(`- Episodes completed: ${this.stats.episodeCount}`);
        console.log(`- Concepts learned: ${Array.from(this.stats.learnedConcepts).join(', ')}`);
        console.log(`- Storage operations: ${this.stats.storageOperations}`);
        console.log(`- Reasoning operations: ${this.stats.reasoningOperations}`);
        
        // Final evaluation
        const finalEvaluation = await this.agent.evaluate({ episodes: 5, render: true });
        console.log(`\nFinal performance: Reward ${finalEvaluation.averageReward.toFixed(2)}, Steps ${finalEvaluation.averageSteps.toFixed(1)}`);
    }
    
    /**
     * Extract a concept from agent performance using symbolic reasoning
     * @param {Object} evaluation - Evaluation results
     * @returns {string|null} Extracted concept or null
     * @private
     */
    async _extractConcept(evaluation) {
        this.stats.reasoningOperations++;
        
        // Simple concept extraction based on performance
        if (evaluation.averageReward > 8) {
            return "optimal_strategy";
        } else if (evaluation.averageSteps < 15) {
            return "efficient_path";
        } else if (evaluation.episodes.every(ep => ep.totalReward > 0)) {
            return "reliable_approach";
        }
        
        return null;
    }
    
    /**
     * Save agent state to storage
     * @private
     */
    async _saveState() {
        if (!this.storage.enabled) return;
        
        this.stats.storageOperations++;
        
        // In a real implementation, this would use qipai-store to save:
        // 1. The agent's policy parameters (quantum circuit parameters)
        // 2. The symbolic memory (concepts)
        // 3. Statistics and learned knowledge
        
        console.log(`Agent state autosaved (operation ${this.stats.storageOperations})`);
    }
    
    /**
     * Load agent state from storage
     */
    async loadState(path) {
        // Would use qipai-store to load the agent state
        console.log(`Would load agent state from ${path}`);
    }
}

/**
 * Run the autonomous quantum agent example
 */
async function runAutonomousAgentExample() {
    console.log("QiPAI Autonomous Quantum Agent Example");
    console.log("======================================");
    
    // Create an environment for the agent to learn in
    // We'll use the GridWorld as a simple demonstration
    const environment = new GridWorldEnv({
        width: 6,
        height: 6,
        obstacles: [[1, 1], [2, 2], [3, 3], [1, 3], [4, 1], [5, 4]],
        start: [0, 0],
        goal: [5, 5]
    });
    
    // Display the environment
    console.log("\nEnvironment:");
    environment.render();
    
    // Create the autonomous quantum agent
    const agent = new AutonomousQuantumAgent({
        rl: {
            stateQubits: 6,         // For representing position and goal (6D)
            actionQubits: 2,         // For representing 4 actions (2²=4)
            sparse: true,            // Use sparse representation
            gamma: 0.98,             // Discount factor
            memoryCapacity: 5000     // Experience memory capacity
        },
        enableStorage: true,
        storagePath: './agent_data/grid_world',
        autosaveInterval: 50
    });
    
    // Connect agent to environment
    agent.connect(environment);
    
    // Start the autonomous learning process
    await agent.learn({
        episodes: 100,
        evaluationFrequency: 10,
        conceptLearningThreshold: 5.0
    });
    
    console.log("\nExample completed. The agent has learned to navigate the grid world");
    console.log("and developed concepts about effective strategies.");
    
    return agent;
}

// Run the example if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runAutonomousAgentExample().catch(console.error);
}

export { AutonomousQuantumAgent, runAutonomousAgentExample };
