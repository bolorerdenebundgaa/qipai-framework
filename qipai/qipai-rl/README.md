# QiPAI Reinforcement Learning (qipai-rl)

The Quantum Reinforcement Learning module for the QiPAI framework, providing quantum-enhanced reinforcement learning capabilities for building autonomous self-learning agents.

## Overview

This module leverages quantum computing principles to enhance reinforcement learning algorithms. Key components include:

- **Quantum State Representation**: Encode state information in quantum states leveraging superposition and entanglement
- **Quantum Circuit Policies**: Use parameterized quantum circuits for decision-making
- **Sparse Quantum Tensor Support**: Efficiently handle large state spaces with sparse representation
- **Integration with QiPAI Core**: Build on the quantum tensor and circuit foundation
- **Symbolic Memory Integration**: Associate quantum states with symbolic concepts
- **Hardware Compatibility**: Interface with real quantum processors (via qipai-hardware)

## Components

### Core Classes

- **QLearningEngine**: Core reinforcement learning engine that implements quantum-enhanced versions of RL algorithms
- **QRLAgent**: High-level agent for autonomous decision-making and environment interaction
- **GridWorldEnv**: Example environment for testing quantum RL agents

## Getting Started

1. **Create a basic agent**

```javascript
import { createAgent } from 'qipai-rl';

// Create an agent with default settings
const agent = createAgent();
```

2. **Create a custom agent**

```javascript
import { QLearningEngine, QRLAgent } from 'qipai-rl';

// Create a learning engine
const engine = new QLearningEngine({
    stateQubits: 8,      // 8 qubits for state representation
    actionQubits: 3,     // 3 qubits for action representation (8 actions)
    sparse: true,        // Use sparse representation for efficiency
    gamma: 0.99,         // Discount factor
    memory: {
        capacity: 100000 // Experience memory capacity
    }
});

// Create agent using the engine
const agent = new QRLAgent({
    engine,
    explorationRate: 1.0,      // Start with full exploration
    explorationDecay: 0.99,    // Decay exploration by 1% per step
    minExploration: 0.01,      // Minimum exploration rate
    episodeLimit: 500,         // Maximum steps per episode
    trainingFrequency: 10,     // Train every 10 steps
    useSymbolicMemory: true    // Enable symbolic memory integration
});
```

3. **Train the agent in an environment**

```javascript
// Initialize with environment
const env = new YourEnvironment();
agent.initialize(env);

// Train for 100 episodes
const results = await agent.trainEpisodes({
    episodes: 100,
    render: false,
    callback: (result) => console.log(`Episode ${result.episode}: ${result.totalReward}`)
});

console.log(`Average reward: ${results.averageReward}`);
```

4. **Run the built-in example**

```javascript
import { runGridWorldExample } from 'qipai-rl';

// Run the GridWorld example
const results = await runGridWorldExample();
```

## Advanced Usage

### Custom Environment Integration

To use your own environment with QRLAgent, implement these methods:

```javascript
class YourEnvironment {
    // Reset environment to initial state
    reset() {
        // Reset logic
        return initialObservation; // Return initial state
    }
    
    // Take a step with given action
    step(action) {
        // Apply action and update environment
        return {
            nextObservation, // New state
            reward,          // Reward value
            done,           // Whether episode is finished
            info            // Additional info (optional)
        };
    }
    
    // Optional: Render environment
    render() {
        // Display environment state
    }
}
```

### Custom Quantum Circuit Policies

You can customize the policy and value circuits by extending the QLearningEngine class:

```javascript
class CustomQLearningEngine extends QLearningEngine {
    _createPolicyCircuit() {
        // Create custom quantum circuit for policy
        const circuit = new QCircuit(this.totalQubits);
        
        // Your custom circuit creation logic
        
        return circuit;
    }
}
```

### Symbolic Memory Integration

Link quantum states with symbolic concepts for higher-level reasoning:

```javascript
// Enable symbolic memory
const agent = createAgent({ useSymbolicMemory: true });

// Associate current state with concept after good outcome
if (reward > threshold) {
    agent.linkWithConcept("successful_strategy");
}
```

## Examples

See the `examples` directory for ready-to-run examples:

- **GridWorldExample.js**: Navigate an agent through a grid world to reach a goal
- More examples coming soon!

## Performance Considerations

- **State Size**: Each additional qubit doubles the state space
- **Sparse Representation**: Use `sparse: true` for large state spaces
- **Batch Training**: Adjust batch size for memory/speed tradeoffs
- **Hardware Acceleration**: WebGPU acceleration available for quantum circuit simulation

## Integration with Other QiPAI Modules

- **qipai-core**: Provides quantum tensor and circuit foundations
- **qipai-neuro**: Combine quantum RL with quantum neural networks
- **qipai-hardware**: Run on real quantum processors when available
- **qipai-store**: Store and retrieve quantum states and agent parameters
- **qipai-agent**: Higher-level agent capabilities including planning and reasoning

## Future Development

- Quantum advantage analysis for RL problems
- Additional quantum-native RL algorithms
- Improved quantum gradient calculations with parameter-shift rule
- Multi-agent quantum RL systems
- Quantum circuit optimization for RL tasks
