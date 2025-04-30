/**
 * QLangParser.js
 * Parser for the QiPAI quantum language.
 * 
 * This module provides tools for parsing quantum algorithm descriptions
 * written in the QiPAI domain-specific language.
 */

/**
 * QiPAI Language Parser
 * Parses quantum algorithm descriptions into executable circuit definitions
 */
export class QLangParser {
    /**
     * Create a new QiPAI language parser
     * @param {Object} options - Parser options
     */
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.includeComments = options.includeComments !== false;
        
        // Initialize parser state
        this.reset();
    }
    
    /**
     * Reset parser state
     */
    reset() {
        this.tokens = [];
        this.ast = null;
        this.errors = [];
        this.warnings = [];
    }
    
    /**
     * Parse QiPAI quantum language code
     * @param {string} code - QiPAI language code to parse
     * @returns {Object} Abstract syntax tree representing the circuit
     */
    parse(code) {
        this.reset();
        
        try {
            // Tokenize the input
            this.tokens = this._tokenize(code);
            
            // Parse tokens into AST
            this.ast = this._parseTokens(this.tokens);
            
            return this.ast;
        } catch (error) {
            this.errors.push(error.message);
            if (this.debug) {
                console.error('Parsing error:', error);
            }
            return null;
        }
    }
    
    /**
     * Tokenize the input code
     * @param {string} code - QiPAI language code
     * @returns {Array<Object>} Tokens
     * @private
     */
    _tokenize(code) {
        const tokens = [];
        const lines = code.split('\n');
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum].trim();
            
            // Skip empty lines
            if (line === '') continue;
            
            // Handle comments
            if (line.startsWith('//')) {
                if (this.includeComments) {
                    tokens.push({
                        type: 'COMMENT',
                        value: line.slice(2).trim(),
                        line: lineNum + 1
                    });
                }
                continue;
            }
            
            // Process line content
            let position = 0;
            
            while (position < line.length) {
                const char = line[position];
                
                // Skip whitespace
                if (/\s/.test(char)) {
                    position++;
                    continue;
                }
                
                // Identifiers (variable names, gate names)
                if (/[a-zA-Z_]/.test(char)) {
                    let identifier = '';
                    while (position < line.length && /[a-zA-Z0-9_]/.test(line[position])) {
                        identifier += line[position];
                        position++;
                    }
                    
                    // Check if it's a keyword
                    const keywords = ['circuit', 'qubit', 'register', 'measure', 'phase', 'pi', 'let', 'apply', 'for', 'to', 'step'];
                    const type = keywords.includes(identifier) ? 'KEYWORD' : 'IDENTIFIER';
                    
                    tokens.push({
                        type,
                        value: identifier,
                        line: lineNum + 1
                    });
                    continue;
                }
                
                // Numbers
                if (/[0-9]/.test(char)) {
                    let number = '';
                    let isFloat = false;
                    
                    while (position < line.length) {
                        const currentChar = line[position];
                        if (/[0-9]/.test(currentChar)) {
                            number += currentChar;
                        } else if (currentChar === '.' && !isFloat) {
                            number += currentChar;
                            isFloat = true;
                        } else {
                            break;
                        }
                        position++;
                    }
                    
                    tokens.push({
                        type: 'NUMBER',
                        value: isFloat ? parseFloat(number) : parseInt(number, 10),
                        line: lineNum + 1
                    });
                    continue;
                }
                
                // Symbols and operators
                if (/[(){}\[\],;:+\-*/=<>]/.test(char)) {
                    const symbolMap = {
                        '{': 'LBRACE',
                        '}': 'RBRACE',
                        '(': 'LPAREN',
                        ')': 'RPAREN',
                        '[': 'LBRACKET',
                        ']': 'RBRACKET',
                        ',': 'COMMA',
                        ';': 'SEMICOLON',
                        ':': 'COLON',
                        '+': 'PLUS',
                        '-': 'MINUS',
                        '*': 'MULTIPLY',
                        '/': 'DIVIDE',
                        '=': 'EQUALS',
                        '<': 'LESS',
                        '>': 'GREATER'
                    };
                    
                    // Check for multi-character operators
                    if (position + 1 < line.length) {
                        const twoChars = line.substring(position, position + 2);
                        if (['==', '!=', '<=', '>=', '->'].includes(twoChars)) {
                            tokens.push({
                                type: {
                                    '==': 'EQUALS_EQUALS',
                                    '!=': 'NOT_EQUALS',
                                    '<=': 'LESS_EQUALS',
                                    '>=': 'GREATER_EQUALS',
                                    '->': 'ARROW'
                                }[twoChars],
                                value: twoChars,
                                line: lineNum + 1
                            });
                            position += 2;
                            continue;
                        }
                    }
                    
                    // Single character operator
                    tokens.push({
                        type: symbolMap[char],
                        value: char,
                        line: lineNum + 1
                    });
                    position++;
                    continue;
                }
                
                // String literals
                if (char === '"' || char === "'") {
                    const quote = char;
                    let string = '';
                    position++; // Skip opening quote
                    
                    while (position < line.length && line[position] !== quote) {
                        // Handle escape sequences
                        if (line[position] === '\\' && position + 1 < line.length) {
                            position++;
                            const escapeChar = line[position];
                            switch (escapeChar) {
                                case 'n': string += '\n'; break;
                                case 't': string += '\t'; break;
                                case 'r': string += '\r'; break;
                                default: string += escapeChar;
                            }
                        } else {
                            string += line[position];
                        }
                        position++;
                    }
                    
                    if (position >= line.length) {
                        throw new Error(`Unterminated string literal at line ${lineNum + 1}`);
                    }
                    
                    tokens.push({
                        type: 'STRING',
                        value: string,
                        line: lineNum + 1
                    });
                    
                    position++; // Skip closing quote
                    continue;
                }
                
                // Unknown character
                this.warnings.push(`Ignoring unknown character '${char}' at line ${lineNum + 1}, position ${position}`);
                position++;
            }
        }
        
        // Add EOF token
        tokens.push({
            type: 'EOF',
            value: null,
            line: lines.length
        });
        
        return tokens;
    }
    
    /**
     * Parse tokens into an abstract syntax tree
     * @param {Array<Object>} tokens - Tokenized input
     * @returns {Object} Abstract syntax tree
     * @private
     */
    _parseTokens(tokens) {
        let position = 0;
        
        // Helper functions for token consumption
        const peek = () => tokens[position];
        const consume = () => tokens[position++];
        const match = (type) => {
            if (peek().type === type) {
                return consume();
            }
            return null;
        };
        const expect = (type, message) => {
            const token = match(type);
            if (!token) {
                throw new Error(message || `Expected token of type '${type}' at line ${peek().line}`);
            }
            return token;
        };
        
        // Grammar parsing functions
        const parseProgram = () => {
            const program = {
                type: 'Program',
                circuits: [],
                declarations: []
            };
            
            while (peek().type !== 'EOF') {
                if (peek().type === 'COMMENT') {
                    program.declarations.push({
                        type: 'Comment',
                        value: consume().value
                    });
                    continue;
                }
                
                if (match('KEYWORD') && tokens[position - 1].value === 'circuit') {
                    program.circuits.push(parseCircuit());
                } else if (match('KEYWORD') && tokens[position - 1].value === 'let') {
                    program.declarations.push(parseDeclaration());
                } else {
                    throw new Error(`Unexpected token ${peek().type} at line ${peek().line}`);
                }
            }
            
            return program;
        };
        
        const parseCircuit = () => {
            const circuit = {
                type: 'Circuit',
                name: expect('IDENTIFIER', 'Expected circuit name').value,
                parameters: [],
                qubits: [],
                operations: []
            };
            
            // Parse parameters if present
            if (match('LPAREN')) {
                if (!match('RPAREN')) {
                    do {
                        circuit.parameters.push(expect('IDENTIFIER', 'Expected parameter name').value);
                    } while (match('COMMA'));
                    expect('RPAREN', 'Expected closing parenthesis after parameters');
                }
            }
            
            // Parse circuit body
            expect('LBRACE', 'Expected opening brace for circuit body');
            
            // Parse qubit declarations and gates
            while (!match('RBRACE') && peek().type !== 'EOF') {
                if (match('KEYWORD') && tokens[position - 1].value === 'qubit') {
                    // Qubit declaration
                    const qubit = {
                        type: 'Qubit',
                        name: expect('IDENTIFIER', 'Expected qubit name').value
                    };
                    
                    // Check for optional index
                    if (match('LBRACKET')) {
                        qubit.index = expect('NUMBER', 'Expected qubit index').value;
                        expect('RBRACKET', 'Expected closing bracket after qubit index');
                    }
                    
                    circuit.qubits.push(qubit);
                    expect('SEMICOLON', 'Expected semicolon after qubit declaration');
                } else if (match('KEYWORD') && tokens[position - 1].value === 'register') {
                    // Qubit register declaration
                    const register = {
                        type: 'Register',
                        name: expect('IDENTIFIER', 'Expected register name').value,
                        size: null
                    };
                    
                    expect('LBRACKET', 'Expected opening bracket for register size');
                    register.size = expect('NUMBER', 'Expected register size').value;
                    expect('RBRACKET', 'Expected closing bracket after register size');
                    
                    // Add qubits to circuit
                    for (let i = 0; i < register.size; i++) {
                        circuit.qubits.push({
                            type: 'Qubit',
                            name: `${register.name}[${i}]`,
                            register: register.name,
                            index: i
                        });
                    }
                    
                    expect('SEMICOLON', 'Expected semicolon after register declaration');
                } else if (match('KEYWORD') && tokens[position - 1].value === 'apply') {
                    // Gate application
                    circuit.operations.push(parseGateApplication());
                    expect('SEMICOLON', 'Expected semicolon after gate application');
                } else if (match('KEYWORD') && tokens[position - 1].value === 'measure') {
                    // Measurement
                    circuit.operations.push(parseMeasurement());
                    expect('SEMICOLON', 'Expected semicolon after measurement');
                } else if (match('KEYWORD') && tokens[position - 1].value === 'for') {
                    // Loop
                    circuit.operations.push(parseLoop());
                } else if (peek().type === 'COMMENT') {
                    // Comment
                    circuit.operations.push({
                        type: 'Comment',
                        value: consume().value
                    });
                } else {
                    throw new Error(`Unexpected token ${peek().type} at line ${peek().line}`);
                }
            }
            
            return circuit;
        };
        
        const parseDeclaration = () => {
            const declaration = {
                type: 'Declaration',
                name: expect('IDENTIFIER', 'Expected variable name').value,
                value: null
            };
            
            expect('EQUALS', 'Expected equals sign in declaration');
            
            // Parse value based on next token
            if (peek().type === 'NUMBER') {
                declaration.value = {
                    type: 'Number',
                    value: consume().value
                };
            } else if (peek().type === 'STRING') {
                declaration.value = {
                    type: 'String',
                    value: consume().value
                };
            } else {
                // Expression or other complex value
                declaration.value = parseExpression();
            }
            
            expect('SEMICOLON', 'Expected semicolon after declaration');
            return declaration;
        };
        
        const parseGateApplication = () => {
            const gate = {
                type: 'GateApplication',
                name: expect('IDENTIFIER', 'Expected gate name').value,
                targets: [],
                controls: [],
                parameters: []
            };
            
            // Parse optional parameters
            if (match('LPAREN')) {
                if (!match('RPAREN')) {
                    do {
                        gate.parameters.push(parseExpression());
                    } while (match('COMMA'));
                    expect('RPAREN', 'Expected closing parenthesis after parameters');
                }
            }
            
            // Parse targets
            expect('IDENTIFIER', 'Expected "to" keyword').value === 'to';
            
            do {
                const target = {
                    type: 'QubitReference',
                    name: expect('IDENTIFIER', 'Expected qubit name').value,
                    index: null
                };
                
                // Check for indexed qubit
                if (match('LBRACKET')) {
                    target.index = parseExpression();
                    expect('RBRACKET', 'Expected closing bracket after index');
                }
                
                gate.targets.push(target);
            } while (match('COMMA'));
            
            // Parse optional controls
            if (match('KEYWORD') && tokens[position - 1].value === 'controlled' && match('KEYWORD') && tokens[position - 1].value === 'by') {
                do {
                    const control = {
                        type: 'QubitReference',
                        name: expect('IDENTIFIER', 'Expected qubit name').value,
                        index: null
                    };
                    
                    // Check for indexed qubit
                    if (match('LBRACKET')) {
                        control.index = parseExpression();
                        expect('RBRACKET', 'Expected closing bracket after index');
                    }
                    
                    gate.controls.push(control);
                } while (match('COMMA'));
            }
            
            return gate;
        };
        
        const parseMeasurement = () => {
            const measurement = {
                type: 'Measurement',
                qubit: null,
                target: null
            };
            
            // Parse qubit to measure
            const qubit = {
                type: 'QubitReference',
                name: expect('IDENTIFIER', 'Expected qubit name').value,
                index: null
            };
            
            // Check for indexed qubit
            if (match('LBRACKET')) {
                qubit.index = parseExpression();
                expect('RBRACKET', 'Expected closing bracket after index');
            }
            
            measurement.qubit = qubit;
            
            // Parse optional target (for storing result)
            if (match('KEYWORD') && tokens[position - 1].value === 'to') {
                measurement.target = expect('IDENTIFIER', 'Expected target variable name').value;
            }
            
            return measurement;
        };
        
        const parseLoop = () => {
            const loop = {
                type: 'Loop',
                variable: expect('IDENTIFIER', 'Expected loop variable').value,
                start: null,
                end: null,
                step: 1,
                body: []
            };
            
            expect('EQUALS', 'Expected equals sign after loop variable');
            loop.start = parseExpression();
            
            expect('KEYWORD', 'Expected "to" keyword').value === 'to';
            loop.end = parseExpression();
            
            // Parse optional step
            if (match('KEYWORD') && tokens[position - 1].value === 'step') {
                loop.step = parseExpression().value;
            }
            
            // Parse loop body
            expect('LBRACE', 'Expected opening brace for loop body');
            
            while (!match('RBRACE') && peek().type !== 'EOF') {
                if (match('KEYWORD') && tokens[position - 1].value === 'apply') {
                    // Gate application
                    loop.body.push(parseGateApplication());
                    expect('SEMICOLON', 'Expected semicolon after gate application');
                } else if (match('KEYWORD') && tokens[position - 1].value === 'measure') {
                    // Measurement
                    loop.body.push(parseMeasurement());
                    expect('SEMICOLON', 'Expected semicolon after measurement');
                } else if (peek().type === 'COMMENT') {
                    // Comment
                    loop.body.push({
                        type: 'Comment',
                        value: consume().value
                    });
                } else {
                    throw new Error(`Unexpected token ${peek().type} at line ${peek().line}`);
                }
            }
            
            return loop;
        };
        
        const parseExpression = () => {
            // Very simplified expression parsing - handle basic literals and identifiers
            if (peek().type === 'NUMBER') {
                return {
                    type: 'Number',
                    value: consume().value
                };
            } else if (peek().type === 'IDENTIFIER') {
                return {
                    type: 'Variable',
                    name: consume().value
                };
            } else if (match('KEYWORD') && tokens[position - 1].value === 'pi') {
                return {
                    type: 'Number',
                    value: Math.PI
                };
            } else if (match('LPAREN')) {
                const expr = parseExpression();
                expect('RPAREN', 'Expected closing parenthesis');
                return expr;
            } else {
                throw new Error(`Unexpected token in expression: ${peek().type} at line ${peek().line}`);
            }
            
            // In a complete implementation, we would handle binary operations and functions here
        };
        
        // Start parsing from the program level
        return parseProgram();
    }
    
    /**
     * Get parsing errors
     * @returns {Array<string>} Parsing errors
     */
    getErrors() {
        return this.errors;
    }
    
    /**
     * Get parsing warnings
     * @returns {Array<string>} Parsing warnings
     */
    getWarnings() {
        return this.warnings;
    }
    
    /**
     * Check if parsing completed successfully
     * @returns {boolean} True if parsing completed without errors
     */
    isValid() {
        return this.errors.length === 0 && this.ast !== null;
    }
}
