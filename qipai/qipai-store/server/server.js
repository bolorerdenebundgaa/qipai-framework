/**
 * server.js
 * Basic HTTP server implementation for qipai-store as a standalone database.
 * This is a conceptual prototype to demonstrate the potential for 
 * qipai-store to operate as an independent database service.
 */

import http from 'http';
import url from 'url';
import { tokenize } from '../qql-engine/tokenizer.js';
import { Parser } from '../qql-engine/parser.js';
import { Interpreter } from '../qql-engine/interpreter.js';
import { QTensor } from '../../core/qTensor.js';
import { QTensorSparse } from '../../core/qTensorSparse.js';
import { SymbolicMemory } from '../../memory/SymbolicMemory.js';

/**
 * QiPAI-Store Database Server
 * Exposes quantum state storage and QQL operations over HTTP
 */
export class QStoreServer {
    constructor(options = {}) {
        this.port = options.port || 8765;
        this.host = options.host || 'localhost';
        
        // Database state
        this.states = new Map(); // In-memory state storage for this example
        this.symbolicMemory = new SymbolicMemory();
        
        // Server instance
        this.server = null;
    }
    
    /**
     * Start the server
     */
    start() {
        if (this.server) {
            console.log('Server already running');
            return;
        }
        
        this.server = http.createServer(this.handleRequest.bind(this));
        
        this.server.listen(this.port, this.host, () => {
            console.log(`QiPAI-Store Database Server running at http://${this.host}:${this.port}/`);
        });
    }
    
    /**
     * Stop the server
     */
    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('Server stopped');
            });
            this.server = null;
        }
    }
    
    /**
     * Handle incoming HTTP requests
     */
    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        
        res.setHeader('Content-Type', 'application/json');
        
        try {
            // Route requests to appropriate handlers
            if (path === '/api/states' && req.method === 'GET') {
                // List all states
                await this.handleListStates(req, res);
            } 
            else if (path === '/api/states' && req.method === 'POST') {
                // Create a new state
                await this.handleCreateState(req, res);
            }
            else if (path.startsWith('/api/states/') && req.method === 'GET') {
                // Get a specific state
                const stateId = path.substring('/api/states/'.length);
                await this.handleGetState(req, res, stateId);
            }
            else if (path === '/api/qql' && req.method === 'POST') {
                // Execute QQL query
                await this.handleQQLQuery(req, res);
            }
            else {
                // Unknown route
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('Error handling request:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    /**
     * Handle listing all states
     */
    async handleListStates(req, res) {
        const states = Array.from(this.states.entries()).map(([id, state]) => ({
            id,
            numQubits: state.tensor.numQubits,
            metadata: state.metadata
        }));
        
        res.statusCode = 200;
        res.end(JSON.stringify({ states }));
    }
    
    /**
     * Handle creating a new state
     */
    async handleCreateState(req, res) {
        // Read request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { id, numQubits, metadata, amplitudes, sparse } = data;
                
                if (!id || !numQubits) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                
                // Create quantum state
                let tensor;
                if (sparse) {
                    tensor = QTensorSparse.fromSpecificAmplitudes(numQubits, amplitudes || {});
                } else {
                    tensor = new QTensor(numQubits);
                    // Set amplitudes if provided
                    if (amplitudes) {
                        Object.entries(amplitudes).forEach(([index, amplitude]) => {
                            tensor.setAmplitude(parseInt(index), amplitude);
                        });
                        tensor.normalize();
                    }
                }
                
                // Store the state
                this.states.set(id, {
                    tensor,
                    metadata: metadata || {}
                });
                
                res.statusCode = 201;
                res.end(JSON.stringify({ 
                    id, 
                    numQubits,
                    metadata: metadata || {}
                }));
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    /**
     * Handle retrieving a specific state
     */
    async handleGetState(req, res, stateId) {
        if (!this.states.has(stateId)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `State '${stateId}' not found` }));
            return;
        }
        
        const { tensor, metadata } = this.states.get(stateId);
        
        // We'll use a sparse representation to efficiently transmit the state
        let nonzeroAmplitudes = {};
        if (tensor instanceof QTensorSparse) {
            // If it's already sparse, extract non-zero amplitudes
            tensor.nonzeroAmplitudes.forEach((amplitude, index) => {
                nonzeroAmplitudes[index] = { re: amplitude.re, im: amplitude.im };
            });
        } else {
            // If it's dense, find non-zero amplitudes
            for (let i = 0; i < tensor.dimension; i++) {
                const amplitude = tensor.getAmplitude(i);
                if (Math.abs(amplitude.re) > 1e-10 || Math.abs(amplitude.im) > 1e-10) {
                    nonzeroAmplitudes[i] = { re: amplitude.re, im: amplitude.im };
                }
            }
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify({
            id: stateId,
            numQubits: tensor.numQubits,
            metadata,
            nonzeroAmplitudes,
            sparsity: tensor instanceof QTensorSparse ? tensor.getSparsity() : 
                (100 * (1 - Object.keys(nonzeroAmplitudes).length / Math.pow(2, tensor.numQubits)))
        }));
    }
    
    /**
     * Handle executing a QQL query
     */
    async handleQQLQuery(req, res) {
        // Read request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { qql, contextStates = [] } = data;
                
                if (!qql) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Missing QQL query' }));
                    return;
                }
                
                // Build initial context with referenced states
                const context = { symbolicMemory: this.symbolicMemory };
                for (const contextState of contextStates) {
                    if (!this.states.has(contextState.id)) {
                        res.statusCode = 404;
                        res.end(JSON.stringify({ error: `Context state '${contextState.id}' not found` }));
                        return;
                    }
                    
                    context[contextState.name] = this.states.get(contextState.id).tensor;
                }
                
                // Parse and execute QQL
                const tokens = tokenize(qql);
                const parser = new Parser(tokens);
                const commands = parser.parse();
                const interpreter = new Interpreter(context);
                
                // Execute QQL
                const result = await interpreter.interpret(commands);
                
                // Extract updated states from the interpreter
                const updatedStates = {};
                interpreter.loadedStates.forEach((tensor, name) => {
                    // Store any states loaded in the QQL script back in our database
                    // This makes the QQL operations persistent
                    const stateId = `qql_result_${name}_${Date.now()}`;
                    this.states.set(stateId, {
                        tensor,
                        metadata: {
                            source: 'qql_execution',
                            qql_variable: name,
                            timestamp: new Date().toISOString()
                        }
                    });
                    
                    updatedStates[name] = {
                        id: stateId,
                        numQubits: tensor.numQubits
                    };
                });
                
                // Format response based on result type
                let formattedResult = result;
                if (result instanceof QTensor || result instanceof QTensorSparse) {
                    formattedResult = {
                        type: 'quantum_state',
                        numQubits: result.numQubits,
                        // Include just enough information for the client to understand the state
                        preview: Object.fromEntries(
                            Array.from({ length: Math.min(8, result.dimension) }, (_, i) => {
                                const amp = result instanceof QTensorSparse ? 
                                    result.getAmplitude(i) : result.amplitudes[i];
                                return [i, { re: amp.re, im: amp.im }];
                            })
                        )
                    };
                } else if (Array.isArray(result)) {
                    formattedResult = {
                        type: 'measurement_outcomes',
                        outcomes: result
                    };
                }
                
                res.statusCode = 200;
                res.end(JSON.stringify({
                    result: formattedResult,
                    updatedStates
                }));
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
}

/**
 * Start the server if this module is run directly
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = new QStoreServer();
    server.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Shutting down server...');
        server.stop();
        process.exit(0);
    });
}
