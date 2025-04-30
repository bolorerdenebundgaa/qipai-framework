/**
 * QLangCompiler.js
 * Compiler for the QiPAI quantum language.
 * 
 * This module provides tools for compiling quantum algorithm descriptions
 * written in the QiPAI domain-specific language into executable circuits.
 */

import { QLangParser } from './QLangParser.js';
import { QCircuit } from '../core/qCircuit.js';
import * as Gates from '../core/gates.js';

/**
 * QiPAI Language Compiler
 * Compiles quantum language descriptions into executable quantum circuits
 */
export class QLangCompiler {
    /**
     * Create a new QiPAI language compiler
     * @param {Object} options - Compiler options
     */
    constructor(options = {}) {
        this.parser = new QLangParser(options);
        this.debug = options.debug || false;
        this.optimize = options.optimize !== false;
        
        // Compilation state
        this.ast = null;
        this.circuits = {};
        this.environment = {
            variables: {},
            constants: {
                pi: Math.PI,
                e: Math.E
            }
        };
        
        this.errors = [];
        this.warnings = [];
    }
    
    /**
     * Compile QiPAI code into executable quantum circuits
     * @param {string} code - QiPAI code to compile
     * @returns {Object} Compiled circuits
     */
    compile(code) {
        // Reset compiler state
        this.ast = null;
        this.circuits = {};
        this.errors = [];
        this.warnings = [];
        this.environment.variables = {};
        
        try {
            // Parse code into AST
            this.ast = this.parser.parse(code);
            
            if (!this.ast || this.parser.errors.length > 0) {
                // Parsing errors occurred
                this.errors = [...this.parser.errors];
                if (this.debug) {
                    console.error('Parsing errors:', this.errors);
                }
                return null;
            }
            
            // Process variable declarations
            this._processDeclarations(this.ast.declarations);
            
            // Compile circuits
            for (const circuitDef of this.ast.circuits) {
                const circuit = this._compileCircuit(circuitDef);
                this.circuits[circuitDef.name] = circuit;
            }
            
            // Apply optimizations if enabled
            if (this.optimize) {
                for (const name in this.circuits) {
                    this.circuits[name] = this._optimizeCircuit(this.circuits[name]);
                }
            }
            
            return this.circuits;
        } catch (error) {
            this.errors.push(error.message);
            if (this.debug) {
                console.error('Compilation error:', error);
            }
            return null;
        }
    }
    
    /**
     * Get a specific compiled circuit
     * @param {string} name - Circuit name
     * @returns {QCircuit|null} Compiled circuit
     */
    getCircuit(name) {
        return this.circuits[name] || null;
    }
    
    /**
     * Get all compiled circuits
     * @returns {Object} Map of circuit names to compiled circuits
     */
    getAllCircuits() {
        return { ...this.circuits };
    }
    
    /**
     * Get compilation errors
     * @returns {Array<string>} Compilation errors
     */
    getErrors() {
        return [...this.errors, ...this.parser.errors];
    }
    
    /**
     * Get compilation warnings
     * @returns {Array<string>} Compilation warnings
     */
    getWarnings() {
        return [...this.warnings, ...this.parser.warnings];
    }
    
    /**
     * Process variable declarations
     * @param {Array<Object>} declarations - Variable declarations
     * @private
     */
    _processDeclarations(declarations) {
        for (const decl of declarations) {
            if (decl.type === 'Declaration') {
                this.environment.variables[decl.name] = this._evaluateExpression(decl.value);
            }
        }
    }
    
    /**
     * Compile a circuit definition into an executable circuit
     * @param {Object} circuitDef - Circuit definition AST node
     * @returns {QCircuit} Compiled circuit
     * @private
     */
    _compileCircuit(circuitDef) {
        // Map qubit references to indices
        const qubitMap = {};
        let numQubits = 0;
        
        for (const qubit of circuitDef.qubits) {
            qubitMap[qubit.name] = numQubits++;
        }
        
        // Create circuit instance
        const circuit = new QCircuit(numQubits);
        
        // Local environment for circuit compilation
        const localEnv = {
            variables: { ...this.environment.variables },
            constants: { ...this.environment.constants }
        };
        
        // Process operations
        for (const op of circuitDef.operations) {
            this._compileOperation(op, circuit, qubitMap, localEnv);
        }
        
        return circuit;
    }
    
    /**
     * Compile an operation into circuit gates
     * @param {Object} operation - Operation AST node
     * @param {QCircuit} circuit - Circuit to add gates to
     * @param {Object} qubitMap - Map of qubit names to indices
     * @param {Object} env - Compilation environment
     * @private
     */
    _compileOperation(operation, circuit, qubitMap, env) {
        if (operation.type === 'GateApplication') {
            // Handle gate application
            this._compileGateApplication(operation, circuit, qubitMap, env);
        } else if (operation.type === 'Measurement') {
            // Handle measurement
            this._compileMeasurement(operation, circuit, qubitMap, env);
        } else if (operation.type === 'Loop') {
            // Handle loop
            this._compileLoop(operation, circuit, qubitMap, env);
        } else if (operation.type === 'Comment') {
            // Comments are ignored during compilation
        } else {
            throw new Error(`Unsupported operation type: ${operation.type}`);
        }
    }
    
    /**
     * Compile a gate application into circuit gates
     * @param {Object} gate - Gate application AST node
     * @param {QCircuit} circuit - Circuit to add gates to
     * @param {Object} qubitMap - Map of qubit names to indices
     * @param {Object} env - Compilation environment
     * @private
     */
    _compileGateApplication(gate, circuit, qubitMap, env) {
        // Get gate parameters
        const params = gate.parameters.map(param => this._evaluateExpression(param, env));
        
        // Resolve target qubits
        const targets = gate.targets.map(target => this._resolveQubitReference(target, qubitMap, env));
        
        // Resolve control qubits
        const controls = gate.controls.map(control => this._resolveQubitReference(control, qubitMap, env));
        
        // Find the appropriate gate in the core Gates module
        const gateOp = this._getGateOperation(gate.name);
        
        if (!gateOp) {
            throw new Error(`Unknown gate: ${gate.name}`);
        }
        
        // Add the gate to the circuit
        if (controls.length > 0) {
            // Controlled gate
            circuit.addGate(gateOp, targets, controls, ...params);
        } else {
            // Standard gate
            circuit.addGate(gateOp, targets, ...params);
        }
    }
    
    /**
     * Compile a measurement operation
     * @param {Object} measurement - Measurement AST node
     * @param {QCircuit} circuit - Circuit to add gates to
     * @param {Object} qubitMap - Map of qubit names to indices
     * @param {Object} env - Compilation environment
     * @private
     */
    _compileMeasurement(measurement, circuit, qubitMap, env) {
        // Resolve qubit reference
        const qubit = this._resolveQubitReference(measurement.qubit, qubitMap, env);
        
        // Add measurement gate
        circuit.addMeasurement(qubit, measurement.target);
    }
    
    /**
     * Compile a loop into repeated circuit operations
     * @param {Object} loop - Loop AST node
     * @param {QCircuit} circuit - Circuit to add gates to
     * @param {Object} qubitMap - Map of qubit names to indices
     * @param {Object} env - Compilation environment
     * @private
     */
    _compileLoop(loop, circuit, qubitMap, env) {
        // Evaluate loop bounds
        const start = this._evaluateExpression(loop.start, env);
        const end = this._evaluateExpression(loop.end, env);
        const step = loop.step !== undefined ? this._evaluateExpression(loop.step, env) : 1;
        
        // Create local environment for loop
        const loopEnv = {
            variables: { ...env.variables },
            constants: env.constants
        };
        
        // Execute loop
        for (let i = start; i <= end; i += step) {
            // Set loop variable
            loopEnv.variables[loop.variable] = i;
            
            // Execute loop body
            for (const op of loop.body) {
                this._compileOperation(op, circuit, qubitMap, loopEnv);
            }
        }
    }
    
    /**
     * Resolve a qubit reference to a circuit index
     * @param {Object} qubitRef - Qubit reference AST node
     * @param {Object} qubitMap - Map of qubit names to indices
     * @param {Object} env - Compilation environment
     * @returns {number} Qubit index
     * @private
     */
    _resolveQubitReference(qubitRef, qubitMap, env) {
        let name = qubitRef.name;
        
        // Handle indexed reference (e.g., qreg[i])
        if (qubitRef.index !== null) {
            const index = this._evaluateExpression(qubitRef.index, env);
            name = `${name}[${index}]`;
        }
        
        // Look up qubit in map
        const index = qubitMap[name];
        
        if (index === undefined) {
            throw new Error(`Unknown qubit: ${name}`);
        }
        
        return index;
    }
    
    /**
     * Evaluate an expression in the given environment
     * @param {Object} expr - Expression AST node
     * @param {Object} env - Compilation environment
     * @returns {*} Evaluated value
     * @private
     */
    _evaluateExpression(expr, env = this.environment) {
        if (!expr) return null;
        
        if (expr.type === 'Number') {
            return expr.value;
        } else if (expr.type === 'String') {
            return expr.value;
        } else if (expr.type === 'Variable') {
            // Look up variable
            if (env.variables[expr.name] !== undefined) {
                return env.variables[expr.name];
            } else if (env.constants[expr.name] !== undefined) {
                return env.constants[expr.name];
            } else {
                throw new Error(`Unknown variable or constant: ${expr.name}`);
            }
        }
        
        // In a full implementation, we would handle binary operations and functions here
        
        throw new Error(`Unsupported expression type: ${expr.type}`);
    }
    
    /**
     * Get a gate operation from the Gates module
     * @param {string} name - Gate name
     * @returns {Function} Gate operation
     * @private
     */
    _getGateOperation(name) {
        // Map from QiPAI gate names to Gates module names
        const gateMap = {
            'h': Gates.H,        // Hadamard
            'x': Gates.X,        // Pauli X (NOT)
            'y': Gates.Y,        // Pauli Y
            'z': Gates.Z,        // Pauli Z
            's': Gates.S,        // S gate (√Z)
            't': Gates.T,        // T gate (√S)
            'rx': Gates.RX,      // Rotation around X
            'ry': Gates.RY,      // Rotation around Y
            'rz': Gates.RZ,      // Rotation around Z
            'cnot': Gates.CNOT,  // Controlled NOT
            'cx': Gates.CNOT,    // Alias for CNOT
            'cz': Gates.CZ,      // Controlled Z
            'swap': Gates.SWAP,  // SWAP gate
            'ccnot': Gates.CCNOT, // Toffoli (CCNOT) gate
            'toffoli': Gates.CCNOT, // Alias for Toffoli
            'phase': Gates.PHASE, // Phase gate
            'u': Gates.U         // Universal single qubit gate
        };
        
        // Case-insensitive lookup
        const lowercaseName = name.toLowerCase();
        return gateMap[lowercaseName];
    }
    
    /**
     * Apply optimizations to a circuit
     * @param {QCircuit} circuit - Circuit to optimize
     * @returns {QCircuit} Optimized circuit
     * @private
     */
    _optimizeCircuit(circuit) {
        // In a full implementation, we would have various optimization passes
        // For now, we just return the original circuit
        return circuit;
    }
}
