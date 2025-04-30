/**
 * tokenizer.js
 * Splits a QQL string into a stream of tokens.
 * (Dependency-free implementation)
 */

// Define token types
export const TokenType = {
    KEYWORD: 'KEYWORD',       // LOAD, WHERE, ENTANGLE, INTERFERE, MEASURE, RETURN, USING, STORE, WITH, IN, ON, BASIS_X, BASIS_Z, BASIS_Y, COLLAPSE, QUBITS, STATE, LAST_RESULT
    IDENTIFIER: 'IDENTIFIER', // State names, variable names, metadata keys (e.g., s, input_state, tag)
    STRING: 'STRING',         // "apple", "fruit"
    NUMBER: 'NUMBER',         // 0, 1, 5
    OPERATOR: 'OPERATOR',     // =, [, ], ',', '.' (for metadata access like s.metadata.tag)
    PUNCTUATION: 'PUNCTUATION', // {, } (for store options)
    WHITESPACE: 'WHITESPACE', // Spaces, tabs, newlines (often ignored)
    COMMENT: 'COMMENT',       // -- Single line comment
    EOF: 'EOF',               // End of input
    UNKNOWN: 'UNKNOWN'        // Unrecognized character/sequence
};

// Regular expressions for token matching (order matters)
const tokenRegexes = [
    { type: TokenType.COMMENT, regex: /^--.*/ },
    { type: TokenType.WHITESPACE, regex: /^\s+/ },
    // Keywords need to be ordered carefully if one is a prefix of another. Added STATE, RETURN, LAST_RESULT, COLLAPSE.
    { type: TokenType.KEYWORD, regex: /^(LOAD|STATE|WHERE|ENTANGLE|INTERFERE|MEASURE|RETURN|LAST_RESULT|COLLAPSE|USING|STORE|WITH|IN|ON|BASIS_X|BASIS_Z|BASIS_Y|QUBITS)\b/i },
    { type: TokenType.IDENTIFIER, regex: /^[a-zA-Z_][a-zA-Z0-9_.]*/ }, // Allows dot for metadata access
    { type: TokenType.STRING, regex: /^"[^"]*"/ },
    { type: TokenType.NUMBER, regex: /^[0-9]+(?:\.[0-9]+)?/ }, // Basic integer/float
    { type: TokenType.OPERATOR, regex: /^[=\[\].,]/ },
    { type: TokenType.PUNCTUATION, regex: /^[{}]/ },
];

/**
 * Tokenizes a QQL input string.
 * @param {string} input - The QQL string.
 * @returns {Array<{type: TokenType, value: string, line: number, column: number}>} An array of tokens.
 */
export function tokenize(input) {
    const tokens = [];
    let remainingInput = input;
    let line = 1;
    let column = 1;
    let currentPos = 0;

    while (remainingInput.length > 0) {
        let matchFound = false;
        for (const { type, regex } of tokenRegexes) {
            const match = remainingInput.match(regex);
            if (match) {
                const value = match[0];
                if (type !== TokenType.WHITESPACE && type !== TokenType.COMMENT) { // Ignore whitespace and comments
                    tokens.push({ type, value, line, column });
                }

                // Update line and column counts
                const lines = value.split('\n');
                if (lines.length > 1) {
                    line += lines.length - 1;
                    column = lines[lines.length - 1].length + 1;
                } else {
                    column += value.length;
                }

                remainingInput = remainingInput.substring(value.length);
                currentPos += value.length;
                matchFound = true;
                break; // Move to next part of the input string
            }
        }

        if (!matchFound) {
            // If no regex matched, handle unknown token
            const unknownChar = remainingInput[0];
            tokens.push({ type: TokenType.UNKNOWN, value: unknownChar, line, column });
            remainingInput = remainingInput.substring(1);
            currentPos += 1;
            column += 1;
            // Optionally throw an error here instead of adding UNKNOWN token
            // throw new Error(`Unexpected character "${unknownChar}" at line ${line}, column ${column}`);
        }
    }

    tokens.push({ type: TokenType.EOF, value: '', line, column });
    return tokens;
}

// Example Usage:
// const qql = `
// -- Load state s
// LOAD STATE s
// WHERE s.metadata.tag = "apple"
// USING STORE { strategy: 'flatfile', path: './data/apple.qstate.bin' }
// `;
// const tokens = tokenize(qql);
// console.log(tokens);
