/**
 * client.js
 * Simple client for the QiPAI-Store Database Server
 */

/**
 * Client for interacting with QiPAI-Store Database
 */
export class QStoreClient {
    /**
     * Create a new client instance
     * @param {Object} options - Configuration options
     * @param {string} options.host - Server host (default: localhost)
     * @param {number} options.port - Server port (default: 8765)
     */
    constructor(options = {}) {
        this.host = options.host || 'localhost';
        this.port = options.port || 8765;
        this.baseUrl = `http://${this.host}:${this.port}`;
    }
    
    /**
     * List all quantum states in the database
     * @returns {Promise<Array>} List of state metadata
     */
    async listStates() {
        const response = await fetch(`${this.baseUrl}/api/states`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        return data.states;
    }
    
    /**
     * Retrieve a specific quantum state
     * @param {string} stateId - ID of the state to retrieve
     * @returns {Promise<Object>} State data including metadata and amplitudes
     */
    async getState(stateId) {
        const response = await fetch(`${this.baseUrl}/api/states/${stateId}`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        return await response.json();
    }
    
    /**
     * Create a new quantum state in the database
     * @param {Object} stateData - State data
     * @param {string} stateData.id - Unique identifier for the state
     * @param {number} stateData.numQubits - Number of qubits in the state
     * @param {Object} stateData.metadata - Optional metadata for the state
     * @param {Object} stateData.amplitudes - Optional amplitudes (sparse representation)
     * @param {boolean} stateData.sparse - Whether to use sparse representation (default: true)
     * @returns {Promise<Object>} Created state metadata
     */
    async createState(stateData) {
        const response = await fetch(`${this.baseUrl}/api/states`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        
        return await response.json();
    }
    
    /**
     * Execute a QQL query
     * @param {Object} queryData - Query data
     * @param {string} queryData.qql - QQL script to execute
     * @param {Array<Object>} queryData.contextStates - Optional context states
     * @returns {Promise<Object>} Query results including updated states
     */
    async executeQQL(queryData) {
        const response = await fetch(`${this.baseUrl}/api/qql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        
        return await response.json();
    }
}

/**
 * Example usage of the QiPAI-Store client
 */
async function exampleUsage() {
    const client = new QStoreClient();
    
    // Create a new quantum state
    console.log('Creating a new state...');
    const state = await client.createState({
        id: 'bell_state_01',
        numQubits: 2,
        metadata: {
            name: 'Bell State |00⟩ + |11⟩',
            type: 'entangled',
            createdAt: new Date().toISOString()
        },
        // Bell state |00⟩ + |11⟩ (normalized)
        amplitudes: {
            0: { re: 1/Math.sqrt(2), im: 0 },  // |00⟩
            3: { re: 1/Math.sqrt(2), im: 0 }   // |11⟩
        },
        sparse: true
    });
    console.log('Created state:', state);
    
    // List all states
    console.log('Listing all states...');
    const states = await client.listStates();
    console.log('States:', states);
    
    // Execute a QQL query
    console.log('Executing QQL query...');
    const qqlResult = await client.executeQQL({
        qql: `
            LOAD STATE s
            WHERE s.metadata.name = "Bell State |00⟩ + |11⟩"
            USING STORE { strategy: 'flatfile', path: '' }
            
            MEASURE s ON QUBITS [0]
            
            RETURN LAST_RESULT
        `,
        contextStates: []
    });
    console.log('QQL result:', qqlResult);
    
    // Get the resulting state after measurement
    if (qqlResult.updatedStates && qqlResult.updatedStates.s) {
        console.log('Getting measured state...');
        const measuredState = await client.getState(qqlResult.updatedStates.s.id);
        console.log('Measured state:', measuredState);
    }
}

// If this module is run directly, run the example
if (typeof require !== 'undefined' && require.main === module) {
    exampleUsage().catch(console.error);
}
