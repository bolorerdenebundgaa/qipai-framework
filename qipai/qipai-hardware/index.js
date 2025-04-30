/**
 * index.js
 * Main entry point for the Quantum Hardware module.
 * 
 * This module provides adapters for connecting QiPAI to real quantum hardware
 * providers, allowing execution of quantum circuits on actual quantum processors.
 */

// Export IBM Quantum adapter
export { IBMQAdapter } from './ibmq/IBMQAdapter.js';

/**
 * Hardware provider types
 */
export const HardwareProviders = {
    IBM: 'ibm',
    IONQ: 'ionq',    // Future implementation
    RIGETTI: 'rigetti',  // Future implementation
    AZURE: 'azure'   // Future implementation
};

/**
 * Create a hardware adapter based on provider type
 * @param {string} provider - Hardware provider type (see HardwareProviders)
 * @param {Object} options - Provider-specific options
 * @returns {Object} Hardware adapter instance
 */
export function createAdapter(provider, options = {}) {
    switch (provider.toLowerCase()) {
        case HardwareProviders.IBM:
            const { IBMQAdapter } = require('./ibmq/IBMQAdapter.js');
            return new IBMQAdapter(options);
            
        case HardwareProviders.IONQ:
            // Future implementation
            throw new Error("IonQ adapter not yet implemented");
            
        case HardwareProviders.RIGETTI:
            // Future implementation
            throw new Error("Rigetti adapter not yet implemented");
            
        case HardwareProviders.AZURE:
            // Future implementation
            throw new Error("Azure Quantum adapter not yet implemented");
            
        default:
            throw new Error(`Unknown quantum hardware provider: ${provider}`);
    }
}

/**
 * QiPAI Hardware Module
 * 
 * This module provides adapters for connecting QiPAI to real quantum hardware providers.
 * The adapters handle:
 * 
 * 1. Circuit translation - Convert QiPAI circuit representation to provider-specific format
 * 2. Job submission - Submit circuits to quantum processors and handle job lifecycle
 * 3. Result processing - Process results from quantum hardware and convert to QiPAI format
 * 4. Error handling - Manage errors and provide appropriate fallbacks
 * 
 * Each adapter provides a consistent interface regardless of the underlying hardware provider.
 */

// Module info
export const info = {
    name: 'qipai-hardware',
    version: '0.1.0',
    description: 'Quantum Hardware Integration for QiPAI framework',
    dependencies: [
        'qipai-core'
    ]
};
