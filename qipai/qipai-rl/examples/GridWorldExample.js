/**
 * GridWorldExample.js
 * Example demonstrating the Quantum Reinforcement Learning agent solving a simple grid world.
 * 
 * This example shows a complete workflow:
 * 1. Define an environment (GridWorld)
 * 2. Create a quantum RL agent
 * 3. Train the agent to navigate the environment
 * 4. Evaluate the agent's performance
 */

import { QLearningEngine } from '../QLearningEngine.js';
import { QRLAgent } from '../QRLAgent.js';

/**
 * Simple GridWorld environment
 * The agent must navigate from start to goal while avoiding obstacles
 */
class GridWorldEnv {
    /**
     * Create a GridWorld environment
     * @param {Object} options - Grid world options
     * @param {number} options.width - Grid width (default: 5)
     * @param {number} options.height - Grid height (default: 5)
     * @param {Array<Array<number>>} options.obstacles - Obstacle positions
     * @param {Array<number>} options.start - Start position [x, y]
     * @param {Array<number>} options.goal - Goal position [x, y]
     */
    constructor(options = {}) {
        this.width = options.width || 5;
        this.height = options.height || 5;
        this.obstacles = options.obstacles || [[1, 1], [2, 3], [3, 1]];
        this.start = options.start || [0, 0];
        this.goal = options.goal || [4, 4];
        
        // Agent state
        this.position = [...this.start];
        
        // Action space: 0=up, 1=right, 2=down, 3=left
        this.actions = 4;
        
        // Statistics
        this.steps = 0;
        this.episodes = 0;
    }
    
    /**
     * Reset the environment for a new episode
     * @returns {Array} Initial observation
     */
    reset() {
        this.position = [...this.start];
        this.steps = 0;
        this.episodes++;
        return this._getObservation();
    }
    
    /**
     * Take a step in the environment
     * @param {number} action - Action to take (0=up, 1=right, 2=down, 3=left)
     * @returns {Object} Step result {nextObservation, reward, done, info}
     */
    step(action) {
        this.steps++;
        
        // Move the agent
        const newPosition = [...this.position];
        
        // Apply action
        switch (action) {
            case 0: // up
                newPosition[1] = Math.max(0, newPosition[1] - 1);
                break;
            case 1: // right
                newPosition[0] = Math.min(this.width - 1, newPosition[0] + 1);
                break;
            case 2: // down
                newPosition[1] = Math.min(this.height - 1, newPosition[1] + 1);
                break;
            case 3: // left
                newPosition[0] = Math.max(0, newPosition[0] - 1);
                break;
        }
        
        // Check if new position is an obstacle
        const hitObstacle = this.obstacles.some(
            obs => obs[0] === newPosition[0] && obs[1] === newPosition[1]
        );
        
        // If hit obstacle, don't move
        if (!hitObstacle) {
            this.position = newPosition;
        }
        
        // Check if reached goal
        const reachedGoal = this.position[0] === this.goal[0] && this.position[1] === this.goal[1];
        
        // Calculate reward
        let reward = -0.1; // Small penalty for each step (encourage efficiency)
        
        if (reachedGoal) {
            reward = 10.0; // Big reward for reaching goal
        } else if (hitObstacle) {
            reward = -1.0; // Penalty for hitting obstacle
        }
        
        return {
            nextObservation: this._getObservation(),
            reward,
            done: reachedGoal,
            info: { position: [...this.position], steps: this.steps }
        };
    }
    
    /**
     * Get the current observation
     * @returns {Array} Normalized state vector [x, y, goal_x, goal_y]
     * @private
     */
    _getObservation() {
        // Normalize position and goal coordinates to [0,1]
        return [
            this.position[0] / (this.width - 1),    // x position
            this.position[1] / (this.height - 1),   // y position
            this.goal[0] / (this.width - 1),        // goal x
            this.goal[1] / (this.height - 1)        // goal y
        ];
    }
    
    /**
     * Render the grid world
     * Simple console-based rendering
     */
    render() {
        // Create an empty grid
        const grid = Array(this.height).fill().map(() => Array(this.width).fill('.'));
        
        // Place obstacles
        for (const [x, y] of this.obstacles) {
            grid[y][x] = '#';
        }
        
        // Place goal
        grid[this.goal[1]][this.goal[0]] = 'G';
        
        // Place agent
        grid[this.position[1]][this.position[0]] = 'A';
        
        // Print the grid
        console.log(`Episode ${this.episodes}, Step ${this.steps}`);
        console.log('-'.repeat(this.width * 2 + 1));
        for (const row of grid) {
            console.log('|' + row.join(' ') + '|');
        }
        console.log('-'.repeat(this.width * 2 + 1));
        console.log('Legend: A=Agent, G=Goal, #=Obstacle, .=Empty');
        console.log('\n');
    }
}

/**
 * Run the GridWorld example with a quantum RL agent
 */
async function runGridWorldExample() {
    console.log('Quantum Reinforcement Learning - GridWorld Example');
    console.log('=================================================');
    
    // Create the environment
    const env = new GridWorldEnv({
        width: 5,
        height: 5,
        obstacles: [[1, 1], [2, 2], [3, 3], [1, 3]],
        start: [0, 0],
        goal: [4, 4]
    });
    
    // Create the quantum learning engine
    const engine = new QLearningEngine({
        stateQubits: 4,  // For representing position and goal
        actionQubits: 2, // For representing 4 actions
        sparse: true,    // Use sparse quantum state representation
        gamma: 0.99,     // Discount factor
        memory: {
            capacity: 1000 // Experience memory capacity
        }
    });
    
    // Create the agent
    const agent = new QRLAgent({
        engine,
        explorationRate: 1.0,      // Start with full exploration
        explorationDecay: 0.995,   // Decrease by 0.5% each step
        minExploration: 0.05,      // Minimum 5% exploration
        episodeLimit: 100,         // Maximum 100 steps per episode
        trainingFrequency: 10      // Train every 10 steps
    });
    
    // Initialize the agent with the environment
    agent.initialize(env);
    
    // Display the initial state
    console.log('Initial state:');
    env.render();
    
    // Training phase
    console.log('Starting training...');
    const trainingResult = await agent.trainEpisodes({
        episodes: 20,           // Train for 20 episodes
        render: false,          // Don't render during training
        callback: (result) => {
            // Print progress every 5 episodes
            if (result.episode % 5 === 0) {
                console.log(`Episode ${result.episode}: Reward=${result.totalReward.toFixed(2)}, Steps=${result.steps}, Exploration=${result.explorationRate.toFixed(2)}`);
            }
        }
    });
    
    console.log('Training complete!');
    console.log(`Average reward: ${trainingResult.averageReward.toFixed(2)}`);
    console.log(`Average steps: ${trainingResult.averageSteps.toFixed(2)}`);
    
    // Evaluation phase
    console.log('\nEvaluating agent...');
    const evalResult = await agent.evaluate({
        episodes: 5,      // Evaluate for 5 episodes
        render: true      // Show the agent's behavior
    });
    
    console.log('Evaluation complete!');
    console.log(`Average reward: ${evalResult.averageReward.toFixed(2)}`);
    console.log(`Average steps: ${evalResult.averageSteps.toFixed(2)}`);
    
    // Get and display agent metrics
    const metrics = agent.getMetrics();
    console.log('\nAgent metrics:');
    console.log(`Total episodes: ${metrics.episodeCount}`);
    console.log(`Total steps: ${metrics.totalSteps}`);
    console.log(`Average episode reward: ${metrics.averageReward.toFixed(2)}`);
    console.log(`Average episode length: ${metrics.averageEpisodeLength.toFixed(2)}`);
    console.log(`Current exploration rate: ${metrics.explorationRate.toFixed(4)}`);
    
    return {
        agent,
        env,
        trainingResult,
        evalResult
    };
}

// Run the example if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runGridWorldExample().catch(console.error);
}

export { GridWorldEnv, runGridWorldExample };
