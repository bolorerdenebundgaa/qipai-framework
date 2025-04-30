/**
 * parser.js
 * Parses a stream of QQL tokens into a structured representation (e.g., an AST or command list).
 * (Dependency-free implementation using recursive descent)
 */

import { TokenType } from './tokenizer.js';

export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.commands = []; // Stores the parsed commands
    }

    parse() {
        while (!this.isAtEnd()) {
            try {
                const command = this.parseCommand();
                if (command) {
                    this.commands.push(command);
                } else {
                    // If parseCommand returns null but not at end, something is wrong
                    if (!this.isAtEnd()) {
                         this.error("Expected a command but found end of input or invalid token.");
                    }
                }
            } catch (e) {
                // Handle or rethrow parsing errors
                console.error("Parsing error:", e.message);
                // Attempt to synchronize to the next potential command start? (Advanced)
                // For now, stop parsing on error.
                break;
            }
        }
        return this.commands;
    }

    // --- Recursive Descent Parsing Methods ---

    parseCommand() {
        const currentToken = this.peek();
        const keyword = currentToken.value.toUpperCase();

        if (currentToken.type === TokenType.KEYWORD) {
            if (keyword === 'LOAD') {
                return this.parseLoadCommand();
            } else if (keyword === 'INTERFERE') {
                return this.parseInterfereCommand();
            } else if (keyword === 'MEASURE') {
                return this.parseMeasureCommand();
            } else if (keyword === 'ENTANGLE') {
                return this.parseEntangleCommand();
            } else if (keyword === 'RETURN') {
                return this.parseReturnCommand();
            }
        }

        if (currentToken.type !== TokenType.EOF) {
             this.error(`Unexpected token type ${currentToken.type} ('${currentToken.value}') at start of command.`);
        }
        return null; // Reached EOF or unknown command start
    }

    parseLoadCommand() {
        this.consume(TokenType.KEYWORD, 'LOAD');
        this.consume(TokenType.KEYWORD, 'STATE'); // Expect 'STATE' keyword
        const stateVariable = this.consume(TokenType.IDENTIFIER).value;

        let whereClause = null;
        if (this.match(TokenType.KEYWORD, 'WHERE')) {
            whereClause = this.parseWhereClause();
        }

        let usingStoreClause = null;
        if (this.match(TokenType.KEYWORD, 'USING')) {
             usingStoreClause = this.parseUsingStoreClause();
        }

        // Basic validation
        if (!usingStoreClause) {
            this.error("LOAD command requires a USING STORE clause.");
        }

        return {
            type: 'LOAD',
            stateVariable,
            where: whereClause,
            store: usingStoreClause
        };
    }

    parseWhereClause() {
        // Simple WHERE clause: identifier OPERATOR value (e.g., s.metadata.tag = "apple")
        // TODO: Expand to handle AND/OR, more complex conditions
        const left = this.consume(TokenType.IDENTIFIER).value; // e.g., s.metadata.tag
        const operator = this.consume(TokenType.OPERATOR, '=').value; // Only '=' for now
        const rightToken = this.peek();
        let right;
        if (rightToken.type === TokenType.STRING) {
            right = this.consume(TokenType.STRING).value;
            // Remove quotes from string value
             right = right.substring(1, right.length - 1);
        } else if (rightToken.type === TokenType.NUMBER) {
            right = parseFloat(this.consume(TokenType.NUMBER).value);
        } else {
            this.error(`Expected STRING or NUMBER in WHERE clause, found ${rightToken.type}`);
        }

        return { left, operator, right };
    }

    parseUsingStoreClause() {
        this.consume(TokenType.KEYWORD, 'STORE');
        this.consume(TokenType.PUNCTUATION, '{');

        const options = {};
        while (!this.check(TokenType.PUNCTUATION, '}')) {
            const keyToken = this.consume(TokenType.IDENTIFIER); // e.g., strategy, path
            this.consume(TokenType.OPERATOR, ':'); // Expecting colon for key-value pair (JS-like)
            const valueToken = this.peek();
            let value;

            if (valueToken.type === TokenType.STRING) {
                 value = this.consume(TokenType.STRING).value;
                 // Remove quotes
                 value = value.substring(1, value.length - 1);
            } else {
                 this.error(`Expected STRING value in STORE options, found ${valueToken.type}`);
            }
            options[keyToken.value] = value;

            if (!this.check(TokenType.PUNCTUATION, '}')) {
                this.consume(TokenType.OPERATOR, ','); // Expect comma separator
            }
        }

        this.consume(TokenType.PUNCTUATION, '}');
        return options;
    }

    parseInterfereCommand() {
        // Syntax: INTERFERE targetStateVar WITH sourceStateVar
        this.consume(TokenType.KEYWORD, 'INTERFERE');
        const targetVariable = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.KEYWORD, 'WITH');
        const sourceVariable = this.consume(TokenType.IDENTIFIER).value;

        return {
            type: 'INTERFERE',
            target: targetVariable,
            source: sourceVariable
        };
    }

    parseMeasureCommand() {
        // Syntax: MEASURE stateVar ON QUBITS [qubitIndex]
        // Syntax: MEASURE stateVar [IN basis] ON QUBITS [idx1, idx2, ...]
        this.consume(TokenType.KEYWORD, 'MEASURE');
        const stateVariable = this.consume(TokenType.IDENTIFIER).value;
        let basis = 'Z'; // Default basis

        // Parse optional IN basis clause
        if (this.match(TokenType.KEYWORD, 'IN')) {
            const basisToken = this.peek();
            if (basisToken.type === TokenType.KEYWORD && basisToken.value.toUpperCase().startsWith('BASIS_')) {
                 basis = basisToken.value.toUpperCase().replace('BASIS_', ''); // Extract X, Y, or Z
                 if (!['X', 'Y', 'Z'].includes(basis)) {
                     this.error(`Invalid basis specified: ${basisToken.value}. Expected BASIS_X, BASIS_Y, or BASIS_Z.`);
                 }
                 this.advance();
            } else {
                 this.error("Expected BASIS_X, BASIS_Y, or BASIS_Z after IN");
            }
        }

        // Parse required ON QUBITS clause
        let qubitIndices = []; // Store multiple indices
        if (this.match(TokenType.KEYWORD, 'ON')) {
            this.consume(TokenType.KEYWORD, 'QUBITS');
            this.consume(TokenType.OPERATOR, '[');
            // Parse comma-separated list of numbers
            if (!this.check(TokenType.OPERATOR, ']')) { // Handle empty list? For now, require at least one.
                do {
                    const indexToken = this.consume(TokenType.NUMBER);
                    qubitIndices.push(parseInt(indexToken.value, 10));
                } while (this.match(TokenType.OPERATOR, ',')); // Continue if comma is found
            }
            this.consume(TokenType.OPERATOR, ']');
        } else {
            // Default behavior if ON QUBITS is omitted? Measure all? Measure first? Error?
            // Let's require it for now for clarity.
            this.error("MEASURE command requires 'ON QUBITS [...]' clause.");
        }

        if (qubitIndices.length === 0) {
             this.error("MEASURE command requires at least one qubit index in 'ON QUBITS [...]'.");
        }

        return {
            type: 'MEASURE',
            stateVariable: stateVariable,
            qubitIndices: qubitIndices, // Use plural name
            basis: basis
        };
    }

    parseEntangleCommand() {
        // Syntax: ENTANGLE stateVar1 WITH stateVar2
        // This implies linking the *entire* systems represented by the state variables.
        // A more granular command might be needed to entangle specific qubits across states.
        this.consume(TokenType.KEYWORD, 'ENTANGLE');
        const variable1 = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.KEYWORD, 'WITH');

        const targetToken = this.peek();
        let targetValue;
        if (targetToken.type === TokenType.IDENTIFIER) {
            targetValue = { type: 'variable', name: this.consume(TokenType.IDENTIFIER).value };
        } else if (targetToken.type === TokenType.STRING) {
            let symbol = this.consume(TokenType.STRING).value;
            targetValue = { type: 'symbol', name: symbol.substring(1, symbol.length - 1) }; // Remove quotes
        } else {
            this.error(`Expected variable name or symbol string after ENTANGLE ... WITH, found ${targetToken.type}`);
        }

        return {
            type: 'ENTANGLE',
            target: variable1, // The state variable being modified
            with: targetValue   // The variable or symbol to entangle with
        };
    }

    parseReturnCommand() {
        // Syntax: RETURN stateVar | value
        // TODO: Handle returning literals or results of previous commands (e.g., measurement outcome)
        this.consume(TokenType.KEYWORD, 'RETURN');
        const valueToken = this.peek();
        let returnValue;

        if (valueToken.type === TokenType.IDENTIFIER) {
            // RETURN stateVar
            returnValue = { type: 'variable', name: this.consume(TokenType.IDENTIFIER).value };
        } else if (valueToken.type === TokenType.KEYWORD && valueToken.value.toUpperCase() === 'LAST_RESULT') {
            // RETURN LAST_RESULT
            returnValue = { type: 'last_result' };
            this.advance(); // Consume LAST_RESULT keyword
        } else if (valueToken.type === TokenType.KEYWORD && valueToken.value.toUpperCase() === 'COLLAPSE') {
            // RETURN COLLAPSE stateVar
            this.advance(); // Consume COLLAPSE keyword
            const stateVarToken = this.consume(TokenType.IDENTIFIER);
            returnValue = { type: 'collapse', name: stateVarToken.value };
        }
        // Add checks for other returnable types (literals, etc.) if needed
        else {
            this.error(`Unexpected token type ${valueToken.type} after RETURN. Expected variable name, LAST_RESULT, or COLLAPSE.`);
        }

        return {
            type: 'RETURN',
            value: returnValue
        };
    }


    // --- Helper Methods ---

    peek() {
        return this.tokens[this.position];
    }

    previous() {
        return this.tokens[this.position - 1];
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    advance() {
        if (!this.isAtEnd()) this.position++;
        return this.previous();
    }

    check(type, value = null) {
        if (this.isAtEnd()) return false;
        const currentToken = this.peek();
        if (currentToken.type !== type) return false;
        if (value !== null && currentToken.value.toUpperCase() !== value.toUpperCase()) return false;
        return true;
    }

    match(type, value = null) {
        if (this.check(type, value)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type, expectedValue = null) {
        const currentToken = this.peek();
        if (this.check(type, expectedValue)) {
            return this.advance();
        }
        const expectedDesc = expectedValue ? `${type} ('${expectedValue}')` : type;
        this.error(`Expected ${expectedDesc} but found ${currentToken.type} ('${currentToken.value}')`);
    }

    error(message) {
        const token = this.peek();
        throw new Error(`Parse Error at line ${token.line}, column ${token.column}: ${message}`);
    }
}

// Example Usage:
// import { tokenize } from './tokenizer.js';
// const qql = `LOAD STATE s WHERE s.metadata.tag = "apple" USING STORE { strategy: 'flatfile', path: './data/apple.qstate.bin' }`;
// const tokens = tokenize(qql);
// const parser = new Parser(tokens);
// const commands = parser.parse();
// console.log(JSON.stringify(commands, null, 2));
