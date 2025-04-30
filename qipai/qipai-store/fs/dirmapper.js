/**
 * dirmapper.js
 * Implements a storage strategy using directory structures to organize
 * flat state files based on metadata or IDs.
 * (e.g., /baseDir/experiment_A/run_001/state_t5.qstate.bin)
 */

import { saveStateToFile, loadStateFromFile } from './flatfile.js';
// Need filesystem access for directory creation (Node.js 'fs/promises' or browser equivalent)
// import { mkdir } from 'fs/promises'; // Example for Node.js
// import path from 'path'; // Node.js path manipulation

// TODO: Implement logic to map state IDs/metadata to directory paths.
// TODO: Implement directory creation logic.

/**
 * Generates a file path based on a state ID and/or metadata.
 * @param {string} baseDir - The base directory for storage.
 * @param {string} stateId - A unique identifier for the state.
 * @param {object} metadata - Optional metadata to use for path generation.
 * @returns {string} The generated file path.
 */
function mapStateToPath(baseDir, stateId, metadata = {}) {
    // Example mapping: baseDir/stateId.qstate.bin
    // More complex mapping could use metadata.experiment, metadata.run, etc.
    // const filePath = path.join(baseDir, `${stateId}.qstate.bin`); // Node.js example
    const filePath = `${baseDir}/${stateId}.qstate.bin`; // Simple example
    console.warn("Dirmapper path generation logic might need refinement.");
    return filePath;
}

/**
 * Saves a state using a directory mapping strategy.
 * @param {string} baseDir - The base directory for storage.
 * @param {string} stateId - A unique identifier for the state.
 * @param {QTensor} qTensor - The state to save.
 * @param {object} metadata - Optional metadata to include and use for mapping.
 */
export async function saveStateMapped(baseDir, stateId, qTensor, metadata = {}) {
    const filePath = mapStateToPath(baseDir, stateId, metadata);
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/')); // Get directory part

    // Ensure directory exists
    // await mkdir(dirPath, { recursive: true }); // Node.js example
    console.warn(`Directory creation for ${dirPath} not implemented.`);

    // Save the state using the flatfile strategy
    await saveStateToFile(qTensor, filePath, metadata);
}

/**
 * Loads a state using a directory mapping strategy.
 * @param {string} baseDir - The base directory for storage.
 * @param {string} stateId - A unique identifier for the state.
 * @param {object} metadata - Optional metadata used for mapping (if needed).
 * @returns {Promise<{qTensor: QTensor, metadata: object}>} - The loaded state and metadata.
 */
export async function loadStateMapped(baseDir, stateId, metadata = {}) {
     const filePath = mapStateToPath(baseDir, stateId, metadata);
     // Load the state using the flatfile strategy
     return await loadStateFromFile(filePath);
}
