/**
 * Visualizer3D.js
 * 
 * 3D visualization of quantum states, phase interference, and evolution.
 * This module provides interactive 3D visualizations for quantum state
 * vectors and their evolution over time.
 */

import { QTensor } from '../core/qTensor.js';
import * as qMath from '../math/qmath.js';

/**
 * Quantum 3D Visualizer
 * Provides 3D visualization of quantum states and their evolution
 */
export class Visualizer3D {
    /**
     * Create a new 3D visualizer
     * @param {Object} options - Visualization options
     * @param {number} options.width - Canvas width (default: 800)
     * @param {number} options.height - Canvas height (default: 600)
     * @param {Object} options.colors - Color scheme
     */
    constructor(options = {}) {
        // Canvas dimensions
        this.width = options.width || 800;
        this.height = options.height || 600;
        
        // Visualization options
        this.rotationSpeed = options.rotationSpeed || 0.01;
        this.animationSpeed = options.animationSpeed || 0.02;
        this.scale = options.scale || 100;
        
        // Colors
        this.colors = {
            background: options.colors?.background || '#151520',
            axes: options.colors?.axes || '#666666',
            amplitude: options.colors?.amplitude || '#4285f4',
            phase: options.colors?.phase || '#fbbc05',
            superposition: options.colors?.superposition || '#34a853',
            entanglement: options.colors?.entanglement || '#ea4335',
            text: options.colors?.text || '#ffffff'
        };
        
        // State for animation
        this.animating = false;
        this.animationStates = [];
        this.currentFrame = 0;
        
        // Rotation state
        this.rotation = {
            x: 0.5,
            y: 0.5,
            z: 0
        };
    }
    
    /**
     * Generate a Three.js-based 3D visualization scene for quantum state
     * @param {QTensor} state - Quantum state to visualize
     * @param {Object} options - Visualization options
     * @returns {string} HTML/JavaScript code for 3D visualization
     */
    generateStateVisualization(state, options = {}) {
        const numQubits = state.numQubits;
        const numStates = Math.min(2 ** numQubits, 32); // Limit to 32 states for visual clarity
        
        // Generate state data
        const stateData = this._prepareStateData(state, numStates);
        
        // Create visualization script
        const scriptContent = this._generateThreeJsScript(stateData, options);
        
        // Create HTML container with script
        return `
            <div class="qipai-3d-visualization" style="width: ${this.width}px; height: ${this.height}px; position: relative;">
                <canvas id="quantum-viz-canvas" width="${this.width}" height="${this.height}" style="background-color: ${this.colors.background};"></canvas>
                <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; font-size: 14px; text-shadow: 1px 1px 1px black;">
                    <div id="quantum-viz-info">Quantum State | ${numQubits} qubits | ${numStates} basis states</div>
                </div>
                <script>${scriptContent}</script>
            </div>
        `;
    }
    
    /**
     * Generate a visualization of state evolution over time
     * @param {Array<QTensor>} states - Array of quantum states showing evolution
     * @param {Object} options - Visualization options
     * @returns {string} HTML/JavaScript code for animated 3D visualization
     */
    generateEvolutionVisualization(states, options = {}) {
        if (!states || states.length === 0) {
            throw new Error('No states provided for evolution visualization');
        }
        
        const numQubits = states[0].numQubits;
        const numStates = Math.min(2 ** numQubits, 32);
        
        // Prepare data for all states
        const evolutionData = states.map(state => this._prepareStateData(state, numStates));
        
        // Create animation script
        const scriptContent = this._generateAnimationScript(evolutionData, options);
        
        // Create HTML container with script
        return `
            <div class="qipai-3d-evolution" style="width: ${this.width}px; height: ${this.height + 50}px; position: relative;">
                <canvas id="quantum-evolution-canvas" width="${this.width}" height="${this.height}" style="background-color: ${this.colors.background};"></canvas>
                <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; font-size: 14px; text-shadow: 1px 1px 1px black;">
                    <div id="quantum-evolution-info">Quantum Evolution | ${numQubits} qubits | ${states.length} steps</div>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button id="play-pause-btn" style="margin-right: 10px;">Play/Pause</button>
                    <input type="range" id="evolution-slider" min="0" max="${states.length - 1}" value="0" style="width: 300px;">
                    <span id="step-indicator">Step: 0/${states.length - 1}</span>
                </div>
                <script>${scriptContent}</script>
            </div>
        `;
    }
    
    /**
     * Generate a 3D visualization of phase interference
     * @param {QTensor} state - Quantum state to visualize
     * @param {Object} options - Visualization options
     * @returns {string} HTML/JavaScript code for phase interference visualization
     */
    generateInterferenceVisualization(state, options = {}) {
        const numQubits = state.numQubits;
        const numStates = Math.min(2 ** numQubits, 32);
        
        // Prepare state data
        const stateData = this._prepareStateData(state, numStates);
        
        // Add interference patterns
        const interferenceData = this._calculateInterferencePatterns(stateData);
        
        // Create interference visualization script
        const scriptContent = this._generateInterferenceScript(stateData, interferenceData, options);
        
        // Create HTML container with script
        return `
            <div class="qipai-3d-interference" style="width: ${this.width}px; height: ${this.height}px; position: relative;">
                <canvas id="quantum-interference-canvas" width="${this.width}" height="${this.height}" style="background-color: ${this.colors.background};"></canvas>
                <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; font-size: 14px; text-shadow: 1px 1px 1px black;">
                    <div id="quantum-interference-info">Phase Interference | ${numQubits} qubits</div>
                </div>
                <script>${scriptContent}</script>
            </div>
        `;
    }
    
    /**
     * Generate a Bloch sphere visualization for multiple qubits
     * @param {QTensor} state - Quantum state to visualize
     * @param {Array<number>} qubits - Indices of qubits to show on Bloch spheres
     * @returns {string} HTML/JavaScript code for Bloch sphere visualization
     */
    generateBlochVisualization(state, qubits = null) {
        const numQubits = state.numQubits;
        
        // If qubits not specified, show all (up to 4)
        if (!qubits) {
            qubits = Array.from({ length: Math.min(numQubits, 4) }, (_, i) => i);
        }
        
        // Calculate Bloch vectors for each qubit
        const blochVectors = [];
        for (const qubitIndex of qubits) {
            if (qubitIndex >= numQubits) {
                throw new Error(`Invalid qubit index: ${qubitIndex} (state has ${numQubits} qubits)`);
            }
            
            // Calculate reduced density matrix for this qubit
            const vector = this._calculateBlochVector(state, qubitIndex);
            blochVectors.push({
                qubit: qubitIndex,
                vector: vector
            });
        }
        
        // Create Bloch sphere visualization script
        const scriptContent = this._generateBlochScript(blochVectors);
        
        // Create HTML container with multiple Bloch spheres
        const sphereWidth = Math.min(300, this.width / blochVectors.length);
        const totalWidth = sphereWidth * blochVectors.length;
        
        let blochSpheres = '';
        for (let i = 0; i < blochVectors.length; i++) {
            blochSpheres += `<div style="display: inline-block; width: ${sphereWidth}px;">
                <canvas id="bloch-sphere-${i}" width="${sphereWidth}" height="${sphereWidth}" style="background-color: ${this.colors.background};"></canvas>
                <div style="text-align: center; color: white; font-family: sans-serif; font-size: 14px; margin-top: 5px;">
                    Qubit ${blochVectors[i].qubit}
                </div>
            </div>`;
        }
        
        return `
            <div class="qipai-bloch-visualization" style="width: ${totalWidth}px; text-align: center; margin: 0 auto;">
                <div style="margin-bottom: 10px; color: white; font-family: sans-serif; font-size: 16px; text-shadow: 1px 1px 1px black;">
                    Bloch Sphere Representation
                </div>
                <div style="display: flex; justify-content: center;">
                    ${blochSpheres}
                </div>
                <script>${scriptContent}</script>
            </div>
        `;
    }
    
    /**
     * Prepare quantum state data for visualization
     * @param {QTensor} state - Quantum state
     * @param {number} numStates - Number of basis states to include
     * @returns {Array<Object>} Prepared state data
     * @private
     */
    _prepareStateData(state, numStates) {
        const stateData = [];
        
        // Calculate probabilities and phases for each basis state
        for (let i = 0; i < numStates; i++) {
            const amplitude = state.getAmplitude(i);
            const probability = qMath.squaredMagnitude(amplitude);
            const phase = qMath.phase(amplitude);
            
            if (probability > 0.0001) { // Only include non-zero amplitudes
                stateData.push({
                    index: i,
                    binary: i.toString(2).padStart(state.numQubits, '0'),
                    probability: probability,
                    phase: phase,
                    amplitude: amplitude
                });
            }
        }
        
        return stateData;
    }
    
    /**
     * Calculate Bloch vector for a single qubit
     * @param {QTensor} state - Full quantum state
     * @param {number} qubitIndex - Index of the qubit
     * @returns {Object} Bloch vector components {x, y, z}
     * @private
     */
    _calculateBlochVector(state, qubitIndex) {
        // For a pure state, calculate expectation values of Pauli operators
        let x = 0, y = 0, z = 0;
        
        // Number of states to consider
        const numStates = Math.min(1 << state.numQubits, 1024);
        
        // Calculate expectation value of X (σₓ)
        for (let i = 0; i < numStates; i++) {
            // Flip the bit at qubitIndex
            const j = i ^ (1 << qubitIndex);
            if (j < numStates) {
                const ampI = state.getAmplitude(i);
                const ampJ = state.getAmplitude(j);
                
                // <ψ|σₓ|ψ> contribution
                x += ampI.re * ampJ.re + ampI.im * ampJ.im;
                y += ampI.re * ampJ.im - ampI.im * ampJ.re;
            }
        }
        
        // Calculate expectation value of Z (σᵥ)
        for (let i = 0; i < numStates; i++) {
            const ampI = state.getAmplitude(i);
            const bitValue = (i >> qubitIndex) & 1;
            
            // <ψ|σᵥ|ψ> contribution
            z += (bitValue === 0 ? 1 : -1) * (ampI.re * ampI.re + ampI.im * ampI.im);
        }
        
        // Normalize if needed
        const norm = Math.sqrt(x*x + y*y + z*z);
        if (norm > 0.001) {
            x /= norm;
            y /= norm;
            z /= norm;
        }
        
        return { x, y, z };
    }
    
    /**
     * Calculate interference patterns between basis states
     * @param {Array<Object>} stateData - Prepared state data
     * @returns {Array<Object>} Interference data
     * @private
     */
    _calculateInterferencePatterns(stateData) {
        const interferences = [];
        
        // Calculate interference between pairs of states
        for (let i = 0; i < stateData.length; i++) {
            for (let j = i + 1; j < stateData.length; j++) {
                const stateI = stateData[i];
                const stateJ = stateData[j];
                
                // Calculate Hamming distance (number of different bits)
                let hammingDistance = 0;
                for (let k = 0; k < stateI.binary.length; k++) {
                    if (stateI.binary[k] !== stateJ.binary[k]) {
                        hammingDistance++;
                    }
                }
                
                // Calculate interference strength based on amplitudes and phase difference
                const phaseI = stateI.phase;
                const phaseJ = stateJ.phase;
                const phaseDifference = ((phaseJ - phaseI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
                
                // Interference is strongest when:
                // 1. Both states have significant probability
                // 2. Their phase difference is near 0 or π (constructive/destructive)
                // 3. They differ by few bits (more likely to interfere)
                const probProduct = Math.sqrt(stateI.probability * stateJ.probability);
                const phaseAlignment = Math.abs(Math.cos(phaseDifference));
                const bitProximity = 1 / (1 + hammingDistance);
                
                const strength = probProduct * phaseAlignment * bitProximity;
                
                if (strength > 0.01) { // Only include significant interferences
                    interferences.push({
                        from: stateI.index,
                        to: stateJ.index,
                        strength: strength,
                        constructive: Math.cos(phaseDifference) > 0,
                        phaseDifference: phaseDifference
                    });
                }
            }
        }
        
        return interferences;
    }
    
    /**
     * Generate Three.js script for state visualization
     * @param {Array<Object>} stateData - Prepared state data
     * @param {Object} options - Visualization options
     * @returns {string} JavaScript code
     * @private
     */
    _generateThreeJsScript(stateData, options) {
        // This is a simplified version - in a real implementation, this would be a complex Three.js script
        return `
            // This would be replaced with actual Three.js code
            // Placeholder for Three.js script that renders quantum state in 3D
            console.log('3D State visualization with', ${JSON.stringify(stateData)});
            
            // In a real implementation, this would:
            // 1. Initialize Three.js scene, camera, renderer
            // 2. Create 3D objects representing quantum states
            // 3. Add interactivity (rotation, zoom)
            // 4. Animate phase evolution
            
            document.getElementById('quantum-viz-info').innerHTML = 
                'Quantum State | ${stateData.length} basis states | ' +
                'Total probability: ' + stateData.reduce((sum, s) => sum + s.probability, 0).toFixed(2);
        `;
    }
    
    /**
     * Generate Three.js script for state evolution animation
     * @param {Array<Array<Object>>} evolutionData - Prepared state data for each time step
     * @param {Object} options - Visualization options
     * @returns {string} JavaScript code
     * @private
     */
    _generateAnimationScript(evolutionData, options) {
        // This is a simplified version - in a real implementation, this would be a complex Three.js script
        return `
            // This would be replaced with actual Three.js code
            // Placeholder for Three.js script that animates quantum state evolution
            console.log('3D Evolution visualization with', ${evolutionData.length}, 'steps');
            
            // In a real implementation, this would:
            // 1. Initialize Three.js scene, camera, renderer
            // 2. Create 3D objects representing quantum states
            // 3. Setup animation between different evolution steps
            // 4. Add UI controls for playback
            
            // Example slider functionality
            const slider = document.getElementById('evolution-slider');
            const stepIndicator = document.getElementById('step-indicator');
            const playPauseBtn = document.getElementById('play-pause-btn');
            
            let animating = false;
            let currentStep = 0;
            
            slider.addEventListener('input', function() {
                currentStep = parseInt(this.value);
                updateVisualization(currentStep);
            });
            
            playPauseBtn.addEventListener('click', function() {
                animating = !animating;
                if (animating) {
                    animate();
                }
            });
            
            function updateVisualization(step) {
                stepIndicator.textContent = 'Step: ' + step + '/' + (${evolutionData.length} - 1);
                // In a real implementation, this would update the 3D visualization
            }
            
            function animate() {
                if (!animating) return;
                
                currentStep = (currentStep + 1) % ${evolutionData.length};
                slider.value = currentStep;
                updateVisualization(currentStep);
                
                setTimeout(animate, 200); // Animation speed
            }
            
            updateVisualization(0);
        `;
    }
    
    /**
     * Generate Three.js script for interference visualization
     * @param {Array<Object>} stateData - Prepared state data
     * @param {Array<Object>} interferenceData - Interference patterns
     * @param {Object} options - Visualization options
     * @returns {string} JavaScript code
     * @private
     */
    _generateInterferenceScript(stateData, interferenceData, options) {
        // This is a simplified version - in a real implementation, this would be a complex Three.js script
        return `
            // This would be replaced with actual Three.js code
            // Placeholder for Three.js script that visualizes interference patterns
            console.log('3D Interference visualization with', ${interferenceData.length}, 'interference patterns');
            
            // In a real implementation, this would:
            // 1. Initialize Three.js scene, camera, renderer
            // 2. Create 3D objects representing quantum states
            // 3. Draw connections showing interference between states
            // 4. Color-code constructive vs destructive interference
            
            document.getElementById('quantum-interference-info').innerHTML = 
                'Phase Interference | ${stateData.length} basis states | ' +
                '${interferenceData.length} interference patterns';
        `;
    }
    
    /**
     * Generate Three.js script for Bloch sphere visualization
     * @param {Array<Object>} blochVectors - Bloch vectors for each qubit
     * @returns {string} JavaScript code
     * @private
     */
    _generateBlochScript(blochVectors) {
        // This is a simplified version - in a real implementation, this would be a complex Three.js script
        return `
            // This would be replaced with actual Three.js code
            // Placeholder for Three.js script that renders Bloch spheres
            console.log('Bloch sphere visualization for', ${blochVectors.length}, 'qubits');
            
            // In a real implementation, this would:
            // 1. Initialize Three.js scene, camera, renderer for each qubit
            // 2. Draw Bloch sphere with axes
            // 3. Draw state vector inside sphere
            // 4. Add labels and interactive elements
            
            // Example of how vectors would be used
            const vectors = ${JSON.stringify(blochVectors.map(b => b.vector))};
            
            // For each Bloch sphere
            for (let i = 0; i < ${blochVectors.length}; i++) {
                // In a real implementation, this would draw the Bloch sphere
                console.log('Drawing Bloch sphere for qubit', ${blochVectors.map(b => b.qubit)}[i], 
                           'with vector', vectors[i]);
            }
        `;
    }
}
