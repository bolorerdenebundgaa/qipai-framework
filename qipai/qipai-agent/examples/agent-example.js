/**
 * agent-example.js
 * 
 * Example demonstrating the use of quantum-inspired autonomous agents.
 * This example showcases the agent's ability to reason, plan, and adapt
 * in a simple navigation environment.
 */

import { createAgent, createEnvironment } from '../index.js';
import { IBMQAdapter } from '../../qipai-hardware/ibmq/IBMQAdapter.js';

/**
 * Example using a phase agent in a grid world environment
 */
async function gridWorldExample() {
    console.log('Quantum-Inspired Agent in Grid World Example');
    console.log('===========================================');

    // Create a simple grid world environment
    // The agent needs to navigate from the start to the goal
    // while avoiding obstacles
    const gridSize = 5;
    const grid = [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ];
    
    // Position: [row, col]
    let agentPosition = [0, 0]; 
    const goalPosition = [4, 4];
    
    console.log('Grid World:');
    printGrid(grid, agentPosition, goalPosition);
    
    // Create environment adapter
    const environment = createEnvironment({
        // Return the current state of the environment
        getState: () => ({
            position: [...agentPosition],
            grid: grid,
            goal: goalPosition
        }),
        
        // Execute agent's action and return the result
        executeAction: async (action) => {
            // Decode action
            // 0: Up, 1: Right, 2: Down, 3: Left
            const actionId = action.id % 4;
            
            // Calculate new position
            const newPosition = [...agentPosition];
            switch (actionId) {
                case 0: newPosition[0] = Math.max(0, newPosition[0] - 1); break; // Up
                case 1: newPosition[1] = Math.min(gridSize - 1, newPosition[1] + 1); break; // Right
                case 2: newPosition[0] = Math.min(gridSize - 1, newPosition[0] + 1); break; // Down
                case 3: newPosition[1] = Math.max(0, newPosition[1] - 1); break; // Left
            }
            
            // Check if the move is valid (not into an obstacle)
            if (grid[newPosition[0]][newPosition[1]] === 1) {
                // Hit obstacle, don't move
                console.log(`Action: ${['Up', 'Right', 'Down', 'Left'][actionId]} - Hit obstacle`);
                return {
                    success: false,
                    reward: -1,
                    position: [...agentPosition]
                };
            }
            
            // Update agent position
            agentPosition = newPosition;
            console.log(`Action: ${['Up', 'Right', 'Down', 'Left'][actionId]} - New position: [${agentPosition}]`);
            
            // Calculate reward
            let reward = -0.1; // Small negative reward for each step
            
            // Check if reached goal
            const reachedGoal = agentPosition[0] === goalPosition[0] && 
                               agentPosition[1] === goalPosition[1];
            
            if (reachedGoal) {
                reward = 10; // Big reward for reaching goal
                console.log('Goal reached!');
            }
            
            return {
                success: true,
                reward: reward,
                position: [...agentPosition],
                reachedGoal: reachedGoal
            };
        },
        
        // Reset the environment
        reset: () => {
            agentPosition = [0, 0];
        }
    });
    
    // Create agent
    const agent = createAgent({
        type: 'phase',
        stateSize: 8,      // 8 qubits to represent state
        actionSize: 2,     // 2 qubits to represent 4 actions
        memory: {
            phaseSize: 64,
            decayRate: 0.95
        }
    });
    
    // Connect agent to environment
    agent.connect(environment);
    
    // Set goal
    agent.setGoal({
        position: goalPosition,
        grid: grid
    });
    
    // First, let the agent learn from some examples
    console.log('\nTeaching the agent with examples...');
    
    // Example paths to goal
    const examplePaths = [
        // Example path 1
        {
            states: [
                { position: [0, 0], grid, goal: goalPosition },
                { position: [0, 1], grid, goal: goalPosition },
                { position: [0, 2], grid, goal: goalPosition },
                { position: [0, 3], grid, goal: goalPosition },
                { position: [0, 4], grid, goal: goalPosition },
                { position: [1, 4], grid, goal: goalPosition },
                { position: [2, 4], grid, goal: goalPosition },
                { position: [3, 4], grid, goal: goalPosition },
                { position: [4, 4], grid, goal: goalPosition }
            ],
            actions: [
                { id: 1 }, // Right
                { id: 1 }, // Right
                { id: 1 }, // Right
                { id: 1 }, // Right
                { id: 2 }, // Down
                { id: 2 }, // Down
                { id: 2 }, // Down
                { id: 2 }  // Down
            ]
        },
        // Example path 2
        {
            states: [
                { position: [0, 0], grid, goal: goalPosition },
                { position: [1, 0], grid, goal: goalPosition },
                { position: [2, 0], grid, goal: goalPosition },
                { position: [2, 1], grid, goal: goalPosition },
                { position: [2, 2], grid, goal: goalPosition },
                { position: [2, 3], grid, goal: goalPosition },
                { position: [2, 4], grid, goal: goalPosition },
                { position: [3, 4], grid, goal: goalPosition },
                { position: [4, 4], grid, goal: goalPosition }
            ],
            actions: [
                { id: 2 }, // Down
                { id: 2 }, // Down
                { id: 1 }, // Right
                { id: 1 }, // Right
                { id: 1 }, // Right
                { id: 1 }, // Right
                { id: 2 }, // Down
                { id: 2 }  // Down
            ]
        }
    ];
    
    // Teach the agent
    const learningResult = agent.learn(examplePaths);
    console.log('Learning completed:');
    console.log(`- Processed examples: ${learningResult.processedExamples}`);
    console.log(`- Learned patterns: ${learningResult.learnedPatterns}`);
    console.log(`- Phase memory size: ${learningResult.phaseMemorySize}`);
    
    // Try connecting to quantum hardware if available
    try {
        // Use simulated quantum hardware for this example
        const hardwareAdapter = new IBMQAdapter({
            token: process.env.IBMQ_TOKEN || 'SIMULATE',
            useSimulator: true
        });
        await hardwareAdapter.connect();
        connectToHardware(agent, hardwareAdapter);
        console.log('\nConnected to quantum hardware (simulator)');
    } catch (error) {
        console.log('\nUsing classical simulation mode');
    }
    
    // Reset environment
    environment.reset();
    
    // Plan a path to the goal
    console.log('\nPlanning a path to the goal...');
    const planResult = await agent.plan({
        maxSteps: 20,
        threshold: 0.99
    });
    
    // Print results
    console.log(`\nPlanning completed: ${planResult.success ? 'Success' : 'Failed'}`);
    console.log(`Steps taken: ${planResult.steps.length}`);
    console.log('Path:');
    for (const step of planResult.steps) {
        console.log(`- Step ${step.step}: Position [${step.state.position}], Action: ${['Up', 'Right', 'Down', 'Left'][step.action.id % 4]}`);
    }
    
    // Print agent metrics
    console.log('\nAgent metrics:');
    for (const [key, value] of Object.entries(planResult.metrics)) {
        console.log(`- ${key}: ${typeof value === 'number' ? value.toFixed(4) : value}`);
    }
    
    return {
        agent,
        environment,
        planResult
    };
}

/**
 * Example using hardware integration for quantum reasoning
 */
async function quantumHardwareExample() {
    console.log('\nQuantum Hardware Integration Example');
    console.log('==================================');
    
    // Create a simpler environment for quantum reasoning
    const environment = createEnvironment({
        getState: () => ({ value: 5 }),
        executeAction: async (action) => {
            return { success: true, value: action.id };
        }
    });
    
    // Create agent
    const agent = createAgent({
        type: 'quantum',
        stateSize: 4,
        actionSize: 3,
        useQuantumHardware: true
    });
    
    // Connect to environment
    agent.connect(environment);
    
    // Connect to IBM Quantum hardware (simulator)
    try {
        const hardwareAdapter = new IBMQAdapter({
            token: process.env.IBMQ_TOKEN || 'SIMULATE',
            useSimulator: true,
            backend: 'ibmq_qasm_simulator'
        });
        
        await hardwareAdapter.connect();
        
        // Connect agent to hardware
        agent.connectHardware(hardwareAdapter);
        
        console.log('Connected to IBM Quantum simulator');
        console.log('Executing reasoning on quantum hardware...');
        
        // Execute a single reasoning step
        const action = agent.reason();
        
        console.log(`Reasoned action: ${action.id}`);
        console.log('Metrics:', agent.getMetrics());
        
        return {
            agent,
            action
        };
    } catch (error) {
        console.error('Error connecting to quantum hardware:', error);
        console.log('Using classical simulation instead');
        
        // Execute reasoning without hardware
        const action = agent.reason();
        console.log(`Reasoned action: ${action.id}`);
        
        return {
            agent,
            action
        };
    }
}

/**
 * Utility function to print grid world
 * @param {Array<Array<number>>} grid - Grid representation
 * @param {Array<number>} agentPos - Agent position [row, col]
 * @param {Array<number>} goalPos - Goal position [row, col]
 */
function printGrid(grid, agentPos, goalPos) {
    for (let row = 0; row < grid.length; row++) {
        let line = '';
        for (let col = 0; col < grid[row].length; col++) {
            if (row === agentPos[0] && col === agentPos[1]) {
                line += 'A '; // Agent
            } else if (row === goalPos[0] && col === goalPos[1]) {
                line += 'G '; // Goal
            } else if (grid[row][col] === 1) {
                line += '# '; // Obstacle
            } else {
                line += '. '; // Empty space
            }
        }
        console.log(line);
    }
}

/**
 * Run both examples
 */
async function runAgentExamples() {
    // Run grid world example
    const gridResult = await gridWorldExample();
    
    // Run quantum hardware example
    const hardwareResult = await quantumHardwareExample();
    
    console.log('\nAll agent examples completed!');
    
    return {
        gridResult,
        hardwareResult
    };
}

// Run the examples if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runAgentExamples().catch(console.error);
}

export {
    gridWorldExample,
    quantumHardwareExample,
    runAgentExamples
};
