/**
 * api/config.js
 * Default configuration settings for the QiPAI framework.
 */

export const defaultConfig = {
    storage: {
        defaultStrategy: 'flatfile', // or 'container', 'dirmapper'
        defaultPath: './qipai_data' // Default location for storage
    },
    runtime: {
        defaultBackend: 'cpu', // 'cpu', 'webgpu', 'wasm'
        timeStep: 0.1 // Default time step for dynamics
    },
    logging: {
        level: 'info' // 'debug', 'info', 'warn', 'error'
    }
    // Add other configuration sections as needed
};

// Function to merge user config with defaults (optional)
export function mergeConfig(userConfig) {
    // Deep merge logic would go here
    return { ...defaultConfig, ...userConfig }; // Simple merge for now
}
