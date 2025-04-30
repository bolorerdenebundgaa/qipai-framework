/**
 * io/qAgentAPI.js
 * Defines an API interface for interacting with QAgent models.
 * Could be used for external communication (e.g., web server, chatbot interface).
 * (Conceptual placeholder)
 */

import { QAgent } from '../models/qAgent.js';

export class QAgentAPI {
    constructor(agentInstance) {
        if (!(agentInstance instanceof QAgent)) {
            throw new Error("QAgentAPI requires an instance of QAgent.");
        }
        this.agent = agentInstance;
        console.log("QAgentAPI created.");
    }

    /**
     * Sends input to the agent and gets a response.
     * @param {*} input - Input data for the agent.
     * @returns {Promise<*>} The agent's response.
     */
    async processInput(input) {
        // TODO: Potentially preprocess input before sending to agent.step()
        const response = await this.agent.step(input);
        // TODO: Potentially postprocess the agent's response.
        return response;
    }

    // Add other API endpoints as needed (e.g., getAgentStatus, loadGoal, etc.)
}
