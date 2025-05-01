/**
 * container.js
 * Implements the storage strategy where multiple quantum states are stored
 * within a single container, using an index.
 * Provides cross-platform (browser + Node.js) implementation.
 */

import * as qstateBin from '../format/qstate.bin.js';
import * as qindex from '../format/qindex.js';

// Detect environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Container for storing multiple quantum states in a single storage unit
 */
export class StateContainer {
    /**
     * Creates a new StateContainer
     * @param {string} key - Container identifier (file path in Node.js, localStorage key in browser)
     */
    constructor(key) {
        this.key = key;
        this.index = new Map(); // Map<stateId, {offset: number, length: number}>
        this.data = null; // In-memory data for browser implementation
        this.isDirty = false;
        
        // Notify that implementation is still a work in progress
        console.warn("StateContainer implementation is minimal.");
    }

    /**
     * Loads the container index
     */
    async loadIndex() {
        if (isBrowser) {
            try {
                // In browser, try to load from localStorage
                const storedIndex = localStorage.getItem(`qipai_container_index_${this.key}`);
                if (storedIndex) {
                    this.index = new Map(JSON.parse(storedIndex));
                    console.log(`Loaded container index with ${this.index.size} entries`);
                }
                
                // Also load any existing data
                const storedData = localStorage.getItem(`qipai_container_data_${this.key}`);
                if (storedData) {
                    // Convert from base64 back to ArrayBuffer
                    const binaryString = atob(storedData);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    this.data = bytes.buffer;
                    console.log(`Loaded container data (${this.data.byteLength} bytes)`);
                } else {
                    // Initialize empty data buffer
                    this.data = new ArrayBuffer(0);
                }
            } catch (err) {
                console.error(`Error loading container index: ${err}`);
                this.index = new Map();
                this.data = new ArrayBuffer(0);
            }
        } else {
            // Node.js implementation would use fs to read the index portion
            console.warn("StateContainer.loadIndex for Node.js not fully implemented");
            // To implement:
            // 1. Check if file exists
            // 2. Read index portion from start of file
            // 3. Parse index data
        }
    }

    /**
     * Saves the container index
     */
    async saveIndex() {
        if (!this.isDirty) return;

        if (isBrowser) {
            try {
                // Save index to localStorage
                const indexJson = JSON.stringify(Array.from(this.index.entries()));
                localStorage.setItem(`qipai_container_index_${this.key}`, indexJson);
                
                // Save data if available
                if (this.data && this.data.byteLength > 0) {
                    // Convert ArrayBuffer to base64 string
                    const binary = new Uint8Array(this.data);
                    let base64 = '';
                    for (let i = 0; i < binary.length; i++) {
                        base64 += String.fromCharCode(binary[i]);
                    }
                    const b64encoded = btoa(base64);
                    
                    localStorage.setItem(`qipai_container_data_${this.key}`, b64encoded);
                    console.log(`Saved container data (${this.data.byteLength} bytes)`);
                }
                
                this.isDirty = false;
                console.log(`Saved container index with ${this.index.size} entries`);
            } catch (err) {
                console.error(`Error saving container index: ${err}`);
            }
        } else {
            // Node.js implementation would use fs to write the index
            console.warn("StateContainer.saveIndex for Node.js not fully implemented");
            // To implement:
            // 1. Generate index data buffer
            // 2. Write to start of file
        }
    }

    /**
     * Adds a state to the container
     * @param {string} stateId - Unique identifier for the state
     * @param {QTensor} qTensor - The quantum state to store
     * @param {object} metadata - Additional metadata
     * @returns {Promise<boolean>} Success status
     */
    async addState(stateId, qTensor, metadata = {}) {
        if (isBrowser) {
            try {
                // 1. Encode state
                const stateBuffer = qstateBin.encodeState(qTensor, metadata);
                
                // 2. Append to in-memory data
                const offset = this.data ? this.data.byteLength : 0;
                const newBuffer = new ArrayBuffer(offset + stateBuffer.byteLength);
                const newView = new Uint8Array(newBuffer);
                
                // Copy existing data if any
                if (this.data && this.data.byteLength > 0) {
                    newView.set(new Uint8Array(this.data), 0);
                }
                
                // Append new state data
                newView.set(new Uint8Array(stateBuffer), offset);
                this.data = newBuffer;
                
                // 3. Update index
                this.index.set(stateId, {
                    offset: offset,
                    length: stateBuffer.byteLength
                });
                
                // 4. Mark as needing save
                this.isDirty = true;
                
                // 5. Save right away for now (could be optimized to batch saves)
                await this.saveIndex();
                
                return true;
            } catch (err) {
                console.error(`Error adding state ${stateId} to container: ${err}`);
                return false;
            }
        } else {
            // Node.js implementation
            console.warn(`StateContainer.addState for ${stateId} not fully implemented for Node.js`);
            return false;
        }
    }

    /**
     * Retrieves a state from the container
     * @param {string} stateId - Unique identifier for the state
     * @returns {Promise<{qTensor: QTensor, metadata: object}>} The quantum state and metadata
     */
    async getState(stateId) {
        if (isBrowser) {
            try {
                // 1. Look up in index
                const entry = this.index.get(stateId);
                if (!entry) {
                    console.warn(`State not found in container: ${stateId}`);
                    return { qTensor: null, metadata: {} };
                }
                
                // 2. Extract data slice
                const { offset, length } = entry;
                if (!this.data || offset + length > this.data.byteLength) {
                    console.error(`Invalid data reference for state ${stateId}`);
                    return { qTensor: null, metadata: {} };
                }
                
                const stateBuffer = this.data.slice(offset, offset + length);
                
                // 3. Decode
                return qstateBin.decodeState(stateBuffer);
            } catch (err) {
                console.error(`Error retrieving state ${stateId} from container: ${err}`);
                return { qTensor: null, metadata: {} };
            }
        } else {
            // Node.js implementation
            console.warn(`StateContainer.getState for ${stateId} not fully implemented for Node.js`);
            return { qTensor: null, metadata: {} };
        }
    }
}
