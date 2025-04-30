/**
 * index.js
 * Public API for the QiPAI Quantum State Database (qipai-store).
 * Exposes high-level functions for saving and loading states using
 * different strategies.
 */

import { saveStateToFile, loadStateFromFile } from './fs/flatfile.js';
import { StateContainer } from './fs/container.js';
import { saveStateMapped, loadStateMapped } from './fs/dirmapper.js';
import { QueryBuilder } from './query-engine/queryBuilder.js';
import { tokenize } from './qql-engine/tokenizer.js';
import { Parser } from './qql-engine/parser.js';
import { Interpreter } from './qql-engine/interpreter.js';

/**
 * Saves a quantum state.
 * @param {QTensor} qTensor - The quantum state to save.
 * @param {object} options - Saving options.
 * @param {'flatfile' | 'container' | 'dirmapper'} options.strategy - The storage strategy to use.
 * @param {string} options.path - The file path (for flatfile/container) or base directory (for dirmapper).
 * @param {string} [options.stateId] - Required for container and dirmapper strategies.
 * @param {object} [options.metadata] - Optional metadata to store alongside the state.
 * @param {StateContainer} [options.containerInstance] - Required for container strategy if using an existing instance.
 */
export async function saveState(qTensor, options) {
    const { strategy, path, stateId, metadata, containerInstance } = options;

    switch (strategy) {
        case 'flatfile':
            if (!path) throw new Error("Missing 'path' option for flatfile strategy.");
            await saveStateToFile(qTensor, path, metadata);
            break;
        case 'container':
            if (!path && !containerInstance) throw new Error("Missing 'path' or 'containerInstance' option for container strategy.");
            if (!stateId) throw new Error("Missing 'stateId' option for container strategy.");
            const container = containerInstance || new StateContainer(path);
            // TODO: Handle loading index if containerInstance wasn't provided but file exists
            await container.addState(stateId, qTensor, metadata);
            // TODO: Handle saving index
            break;
        case 'dirmapper':
            if (!path) throw new Error("Missing 'path' (base directory) option for dirmapper strategy.");
            if (!stateId) throw new Error("Missing 'stateId' option for dirmapper strategy.");
            await saveStateMapped(path, stateId, qTensor, metadata);
            break;
        default:
            throw new Error(`Unknown storage strategy: ${strategy}`);
    }
}

/**
 * Loads a quantum state.
 * @param {object} options - Loading options.
 * @param {'flatfile' | 'container' | 'dirmapper'} options.strategy - The storage strategy used.
 * @param {string} options.path - The file path (for flatfile/container) or base directory (for dirmapper).
 * @param {string} [options.stateId] - Required for container and dirmapper strategies.
 * @param {StateContainer} [options.containerInstance] - Required for container strategy if using an existing instance.
 * @returns {Promise<{qTensor: QTensor, metadata: object}>} - The loaded state and metadata.
 */
export async function loadState(options) {
    const { strategy, path, stateId, containerInstance } = options;

     switch (strategy) {
        case 'flatfile':
            if (!path) throw new Error("Missing 'path' option for flatfile strategy.");
            return await loadStateFromFile(path);
        case 'container':
             if (!path && !containerInstance) throw new Error("Missing 'path' or 'containerInstance' option for container strategy.");
             if (!stateId) throw new Error("Missing 'stateId' option for container strategy.");
             const container = containerInstance || new StateContainer(path);
             // TODO: Handle loading index if containerInstance wasn't provided but file exists
             return await container.getState(stateId);
        case 'dirmapper':
            if (!path) throw new Error("Missing 'path' (base directory) option for dirmapper strategy.");
            if (!stateId) throw new Error("Missing 'stateId' option for dirmapper strategy.");
            // Metadata might be needed for mapping here if loadStateMapped requires it
            return await loadStateMapped(path, stateId);
        default:
            throw new Error(`Unknown storage strategy: ${strategy}`);
    }
}

/**
 * Creates a new query builder instance for the quantum state store.
 * @param {object} options - Query options, primarily storage configuration.
 * @param {object} options.storageOptions - Options defining how to access the store
 *                                          (e.g., { strategy: 'dirmapper', path: './my_states' }).
 * @returns {QueryBuilder} A new QueryBuilder instance.
 */
export function query(options = {}) {
    return new QueryBuilder(options);
}

/**
 * Executes a Quantum Query Language (QQL) string.
 * @param {string} qqlString - The QQL query string to execute.
 * @param {object} [context={}] - Optional initial context for the interpreter (e.g., input states).
 * @returns {Promise<any>} - The result of the QQL execution (often the result of the last command).
 */
export async function executeQQL(qqlString, context = {}) {
    console.log("Executing QQL:", qqlString);
    // 1. Tokenize
    const tokens = tokenize(qqlString);
    console.log("Tokens:", tokens);

    // 2. Parse
    const parser = new Parser(tokens);
    const commands = parser.parse();
    console.log("Parsed Commands:", commands);

    // 3. Interpret
    const interpreter = new Interpreter(context);
    const result = await interpreter.interpret(commands);
    console.log("Interpretation Result:", result);
    console.log("Final Interpreter Context:", interpreter.loadedStates);

    return result;
}


// Re-export specific classes/functions if needed for advanced usage
export { StateContainer, QueryBuilder };
// Expose QQL engine components? Maybe not needed for typical usage.
// export { tokenize, Parser, Interpreter };
