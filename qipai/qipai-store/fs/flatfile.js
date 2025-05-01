/**
 * flatfile.js
 * Implements the storage strategy where each quantum state is saved
 * as a separate binary file (.qstate.bin).
 * Provides both browser and Node.js compatible implementations.
 */

import * as qstateBin from '../format/qstate.bin.js';

// Detect if we're in a browser or Node.js environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Saves a QTensor state to storage.
 * @param {QTensor} qTensor - The state to save.
 * @param {string} key - The path/key to save the file.
 * @param {object} metadata - Optional metadata to include.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function saveStateToFile(qTensor, key, metadata = {}) {
    try {
        // 1. Encode the state and metadata
        const arrayBuffer = qstateBin.encodeState(qTensor, metadata);

        if (arrayBuffer.byteLength === 0) {
            console.error(`Failed to encode state for saving to ${key}.`);
            return false;
        }

        if (isBrowser) {
            // Browser implementation - use localStorage or IndexedDB
            try {
                // For small states, use localStorage
                if (arrayBuffer.byteLength < 5000000) {
                    // Convert ArrayBuffer to base64 string for storage
                    const binary = new Uint8Array(arrayBuffer);
                    let base64 = '';
                    for (let i = 0; i < binary.length; i++) {
                        base64 += String.fromCharCode(binary[i]);
                    }
                    const b64encoded = btoa(base64);
                    localStorage.setItem(`qipai_state_${key}`, b64encoded);
                    console.log(`Successfully saved state to localStorage (${arrayBuffer.byteLength} bytes).`);
                } else {
                    console.warn('State too large for localStorage, would use IndexedDB in production.');
                }
                return true;
            } catch (err) {
                console.error(`Browser storage error: ${err}`);
                return false;
            }
        } else {
            // Node.js implementation
            try {
                // Dynamically import fs modules in Node environment only
                const fs = await import('fs/promises');
                // Write the buffer to the file
                // Convert ArrayBuffer to Buffer for Node.js writeFile
                const nodeBuffer = Buffer.from(arrayBuffer);
                await fs.writeFile(key, nodeBuffer);
                console.log(`Successfully saved state to ${key} (${nodeBuffer.length} bytes).`);
                return true;
            } catch (nodeErr) {
                console.error(`Node.js fs error: ${nodeErr}`);
                return false;
            }
        }
    } catch (error) {
        console.error(`Error saving state to ${key}:`, error);
        return false;
    }
}

/**
 * Loads a QTensor state from storage.
 * @param {string} key - The path/key to load the file from.
 * @returns {Promise<{qTensor: QTensor | null, metadata: object}>} - The loaded state and metadata.
 */
export async function loadStateFromFile(key) {
    try {
        if (isBrowser) {
            // Browser implementation - use localStorage or IndexedDB
            try {
                const storedData = localStorage.getItem(`qipai_state_${key}`);
                if (!storedData) {
                    console.warn(`State not found in localStorage: ${key}`);
                    return { qTensor: null, metadata: {} };
                }
                
                // Convert from base64 back to ArrayBuffer
                const binaryString = atob(storedData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const arrayBuffer = bytes.buffer;
                console.log(`Read ${arrayBuffer.byteLength} bytes from localStorage`);
                const { qTensor, metadata } = qstateBin.decodeState(arrayBuffer);
                
                return { qTensor, metadata };
            } catch (err) {
                console.error(`Browser storage read error: ${err}`);
                return { qTensor: null, metadata: {} };
            }
        } else {
            // Node.js implementation
            try {
                // Dynamically import fs modules in Node environment only
                const fs = await import('fs/promises');
                const { constants } = await import('fs');
                
                // Check if file exists and is readable
                await fs.access(key, constants.R_OK);
                
                // Read the file content into a buffer
                const buffer = await fs.readFile(key);
                console.log(`Read ${buffer.byteLength} bytes from ${key}`);
                
                // Decode the buffer
                const { qTensor, metadata } = qstateBin.decodeState(buffer.buffer); // Pass ArrayBuffer
                
                return { qTensor, metadata };
            } catch (nodeErr) {
                if (nodeErr.code === 'ENOENT') {
                    console.warn(`File not found: ${key}`);
                } else {
                    console.error(`Error loading state from file ${key}:`, nodeErr);
                }
                return { qTensor: null, metadata: {} };
            }
        }
    } catch (error) {
        console.error(`Error loading state:`, error);
        return { qTensor: null, metadata: {} };
    }
}
