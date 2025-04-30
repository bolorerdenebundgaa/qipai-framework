/**
 * runtime/scheduler.js
 * Orchestrates time evolution, potentially across different components or models.
 * Manages the simulation clock and triggers updates.
 * (Conceptual placeholder)
 */

// May need access to dynamics, agents, etc.
// import { evolveState } from '../core/qDynamics.js';
// import { QAgent } from '../models/qAgent.js';

export class Scheduler {
    constructor(runtimeBackend, options = {}) {
        this.runtime = runtimeBackend; // e.g., cpuRuntime, WebGPURuntime instance
        this.currentTime = 0;
        this.timeStep = options.timeStep || 0.1; // Default time step
        this.scheduledItems = []; // Items to update (e.g., { item: QTensor/QAgent, updateFn: 'evolve'/'step' })
        console.log("Scheduler created.");
    }

    addItem(item, updateFnName = 'step') {
        // TODO: Add item to be managed by the scheduler
        this.scheduledItems.push({ item, updateFnName });
    }

    /**
     * Advances the simulation by one time step.
     */
    async tick() {
        this.currentTime += this.timeStep;
        console.log(`Scheduler tick: Time = ${this.currentTime.toFixed(2)}`);

        // TODO: Iterate through scheduledItems and call their update functions
        // This might involve passing the runtime backend and timeStep to the items.
        // Example:
        // for (const { item, updateFnName } of this.scheduledItems) {
        //     if (typeof item[updateFnName] === 'function') {
        //         await item[updateFnName](this.timeStep, this.runtime); // Pass dt and runtime
        //     }
        // }
        console.warn("Scheduler.tick update logic not implemented.");
    }

    /**
     * Runs the simulation for a specified duration or number of steps.
     * @param {number} durationOrSteps - Total time duration or number of steps.
     * @param {boolean} isDuration - True if the first parameter is duration, false if it's steps.
     */
    async run(durationOrSteps, isDuration = true) {
        const targetTime = isDuration ? this.currentTime + durationOrSteps : null;
        const numSteps = isDuration ? null : durationOrSteps;
        let stepCount = 0;

        console.log(`Scheduler run starting at T=${this.currentTime.toFixed(2)}...`);
        while (true) {
            if (targetTime !== null && this.currentTime >= targetTime) break;
            if (numSteps !== null && stepCount >= numSteps) break;

            await this.tick();
            stepCount++;
        }
         console.log(`Scheduler run finished at T=${this.currentTime.toFixed(2)}.`);
    }
}
