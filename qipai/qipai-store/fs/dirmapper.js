/**
 * dirmapper.js
 * Implements a storage strategy using hierarchical structures to organize
 * state files based on metadata or IDs.
 * Provides cross-platform (browser + Node.js) implementation.
 */

import { saveStateToFile, loadStateFromFile } from './flatfile.js';

// Detect environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Creates a directory structure in browser storage.
 * In browsers, this is a no-op as storage APIs handle paths automatically.
 * @param {string} dirPath - The directory path to create.
 * @returns {Promise<boolean>} - Success status
 */
async function ensureDirectoryExists(dirPath) {
    if (isBrowser) {
        // In browser, storage APIs handle hierarchy automatically
        return true;
    } else {
        try {
            // In Node.js, we need to create directories
            const fs = await import('fs/promises');
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error(`Failed to create directory ${dirPath}:`, error);
            return false;
        }
    }
}

/**
 * Generates a storage key/path based on a state ID and/or metadata.
 * @param {string} baseDir - The base directory/namespace for storage.
 * @param {string} stateId - A unique identifier for the state.
 * @param {object} metadata - Optional metadata to use for path generation.
 * @returns {string} The generated key/path.
 */
function mapStateToPath(baseDir, stateId, metadata = {}) {
    // Build a path based on metadata if available
    let path = baseDir;
    
    // Add experiment path component if available
    if (metadata.experiment) {
        path += `/experiment_${metadata.experiment}`;
    }
    
    // Add run path component if available
    if (metadata.run !== undefined) {
        path += `/run_${String(metadata.run).padStart(3, '0')}`;
    }
    
    // Add timestamp path component if available
    if (metadata.timestamp) {
        // Format timestamp as ISO date without special characters
        const timestamp = metadata.timestamp instanceof Date 
            ? metadata.timestamp.toISOString().replace(/[:.]/g, '-')
            : String(metadata.timestamp);
        path += `/t_${timestamp}`;
    }
    
    // Add the state ID and extension
    path += `/${stateId}.qstate.bin`;
    
    return path;
}

/**
 * Saves a state using a directory mapping strategy.
 * @param {string} baseDir - The base directory/namespace for storage.
 * @param {string} stateId - A unique identifier for the state.
 * @param {QTensor} qTensor - The state to save.
 * @param {object} metadata - Optional metadata to include and use for mapping.
 * @returns {Promise<boolean>} - Success status
 */
export async function saveStateMapped(baseDir, stateId, qTensor, metadata = {}) {
    try {
        const path = mapStateToPath(baseDir, stateId, metadata);
        
        if (!isBrowser) {
            // In Node.js, ensure directory structure exists
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            await ensureDirectoryExists(dirPath);
        }
        
        // Save the state using the flatfile strategy (which handles browser/Node.js differences)
        return await saveStateToFile(qTensor, path, metadata);
    } catch (error) {
        console.error(`Failed to save mapped state ${stateId}:`, error);
        return false;
    }
}

/**
 * Loads a state using a directory mapping strategy.
 * @param {string} baseDir - The base directory for storage.
 * @param {string} stateId - A unique identifier for the state.
 * @param {object} metadata - Optional metadata used for mapping.
 * @returns {Promise<{qTensor: QTensor, metadata: object}>} - The loaded state and metadata.
 */
export async function loadStateMapped(baseDir, stateId, metadata = {}) {
    try {
        const path = mapStateToPath(baseDir, stateId, metadata);
        // Load using the flatfile strategy
        return await loadStateFromFile(path);
    } catch (error) {
        console.error(`Failed to load mapped state ${stateId}:`, error);
        return { qTensor: null, metadata: {} };
    }
}
