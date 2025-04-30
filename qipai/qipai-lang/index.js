/**
 * index.js
 * Main entry point for the QiPAI Language module.
 * 
 * This module provides a domain-specific language for quantum computing programs.
 */

// Export language components
export { QLangParser } from './QLangParser.js';
export { QLangCompiler } from './QLangCompiler.js';

/**
 * Compile QiPAI quantum language code into executable circuits
 * @param {string} code - QiPAI language code
 * @param {Object} options - Compiler options
 * @returns {Object} Compiled circuits
 */
export function compileQiPAICode(code, options = {}) {
    const compiler = new QLangCompiler(options);
    return compiler.compile(code);
}

/**
 * Parse QiPAI quantum language code to AST
 * @param {string} code - QiPAI language code
 * @param {Object} options - Parser options
 * @returns {Object} Abstract syntax tree
 */
export function parseQiPAICode(code, options = {}) {
    const parser = new QLangParser(options);
    return parser.parse(code);
}

/**
 * QiPAI Quantum Language Module
 * 
 * This module provides a domain-specific language for quantum computing.
 * Key features include:
 * 
 * 1. Parser - Convert QiPAI code to abstract syntax tree
 * 2. Compiler - Compile QiPAI code to executable quantum circuits
 * 3. High-level abstractions - Express quantum algorithms in readable form
 * 
 * The language supports:
 * - Circuit definitions
 * - Qubit and register declarations
 * - Gate applications with parameters
 * - Control flow with loops
 * - Measurements
 */

// Module info
export const info = {
    name: 'qipai-lang',
    version: '0.1.0',
    description: 'Quantum Programming Language for QiPAI framework',
    dependencies: [
        'qipai-core'
    ]
};
