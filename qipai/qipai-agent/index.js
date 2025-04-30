/**
 * index.js
 * Main entry point for the QiPAI Agent module.
 * 
 * This module provides quantum-inspired autonomous intelligent agents
 * with reasoning and planning capabilities.
 */

// Export agent components
export { PhaseAgent } from './PhaseAgent.js';

/**
 * Create a new autonomous agent
 * @param {Object} options - Agent configuration options
 * @param {string} options.type - Agent type ('phase', 'quantum', 'hybrid')
 * @param {number} options.stateSize - Size of the agent's state space (qubits)
 * @param {number} options.actionSize - Size of the agent's action space (qubits)
 * @param {Object} options.memory - Memory configuration
 * @param {boolean} options.useQuantumHardware - Whether to use quantum hardware if available
 * @returns {PhaseAgent} Configured agent instance
 */
export function createAgent(options = {}) {
    const type = options.type || 'phase';
    
    // Currently only PhaseAgent is implemented
    // In the future, we could add different agent types
    if (type === 'phase' || type === 'quantum' || type === 'hybrid') {
        return new PhaseAgent(options);
    }
    
    throw new Error(`Unknown agent type: ${type}`);
}

/**
 * Create an environment adapter for the agent
 * @param {Object} environmentConfig - Environment configuration
 * @returns {Object} Environment adapter
 */
export function createEnvironment(environmentConfig) {
    return {
        // State management
        getState: environmentConfig.getState || (() => ({})),
        
        // Action execution
        executeAction: environmentConfig.executeAction || ((action) => Promise.resolve({ success: true })),
        
        // Optional methods
        reset: environmentConfig.reset || (() => {}),
        render: environmentConfig.render || (() => {}),
        
        // Environment properties
        config: { ...environmentConfig }
    };
}

/**
 * Connect an agent to hardware
 * @param {PhaseAgent} agent - Agent to connect
 * @param {Object} hardwareAdapter - Hardware adapter (e.g., IBM Quantum)
 * @returns {PhaseAgent} Connected agent
 */
export function connectToHardware(agent, hardwareAdapter) {
    return agent.connectHardware(hardwareAdapter);
}

/**
 * Quantum Agent Module
 * 
 * This module provides quantum-inspired autonomous agents for
 * intelligent reasoning and planning.
 * 
 * Key features include:
 * 
 * 1. Phase-based Reasoning - Using quantum interference patterns for reasoning
 * 2. Dual Memory System - Phase and symbolic memory for efficient learning
 * 3. Hardware Integration - Optional execution on quantum hardware
 * 4. Goal-directed Planning - Ability to reason towards specified goals
 * 
 * These agents can learn from examples, adapt to environments, and
 * improve performance over time through reinforcement.
 */

// Module info
export const info = {
    name: 'qipai-agent',
    version: '0.1.0',
    description: 'Quantum-Inspired Autonomous Agents',
    dependencies: [
        'qipai-core',
        'qipai-math',
        'qipai-memory'
    ]
};
