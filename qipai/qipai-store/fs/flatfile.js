/**
 * flatfile.js
 * Implements the storage strategy where each quantum state is saved
 * as a separate binary file (.qstate.bin).
 */

import * as qstateBin from '../format/qstate.bin.js';
// Assuming Node.js environment for fs access
import { writeFile, readFile, access } from 'fs/promises';
import { constants as fsConstants } from 'fs';

/**
 * Saves a QTensor state to a flat file.
 * @param {QTensor} qTensor - The state to save.
 * @param {string} filePath - The path to save the file (e.g., 'path/to/state_01.qstate.bin').
 * @param {object} metadata - Optional metadata to include.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function saveStateToFile(qTensor, filePath, metadata = {}) {
    try {
        // 1. Encode the state and metadata
        const arrayBuffer = qstateBin.encodeState(qTensor, metadata);

        if (arrayBuffer.byteLength === 0) {
            console.error(`Failed to encode state for saving to ${filePath}.`);
            return false;
        }

        // 2. Write the buffer to the file
        // Need to convert ArrayBuffer to Buffer for Node.js writeFile
        const nodeBuffer = Buffer.from(arrayBuffer);
        await writeFile(filePath, nodeBuffer);
        console.log(`Successfully saved state to ${filePath} (${nodeBuffer.length} bytes).`);
        return true;

    } catch (error) {
        console.error(`Error saving state to file ${filePath}:`, error);
        return false;
    }
}

/**
 * Loads a QTensor state from a flat file.
 * @param {string} filePath - The path to the state file.
 * @returns {Promise<{qTensor: QTensor | null, metadata: object}>} - The loaded state and metadata, or null if file not found/readable.
 */
export async function loadStateFromFile(filePath) {
    try {
        // Check if file exists and is readable
        await access(filePath, fsConstants.R_OK);

        // 1. Read the file content into a buffer
        const buffer = await readFile(filePath);
        console.log(`Read ${buffer.byteLength} bytes from ${filePath}`);

        // 2. Decode the buffer (decodeState needs implementation)
        const { qTensor, metadata } = qstateBin.decodeState(buffer.buffer); // Pass ArrayBuffer

        return { qTensor, metadata };

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found: ${filePath}`);
        } else {
            console.error(`Error loading state from file ${filePath}:`, error);
        }
        // Return null state if file doesn't exist or other error occurs
        return { qTensor: null, metadata: {} };
    }
}
