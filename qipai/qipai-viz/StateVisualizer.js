/**
 * StateVisualizer.js
 * Visualizes quantum states in various formats (Bloch sphere, bar charts, etc.).
 * 
 * This module provides tools to visualize quantum states for better understanding
 * and debugging of quantum algorithms.
 */

import * as qMath from '../math/qmath.js';
import { QTensor } from '../core/qTensor.js'; // Import QTensor

/**
 * Quantum State Visualizer
 */
export class StateVisualizer {
    /**
     * Create a new state visualizer
     * @param {Object} options - Visualization options
     * @param {number} options.width - Canvas width (default: 600)
     * @param {number} options.height - Canvas height (default: 400)
     * @param {Object} options.colors - Color scheme for different elements
     */
    constructor(options = {}) {
        // Canvas dimensions
        this.width = options.width || 600;
        this.height = options.height || 400;
        
        // Colors
        this.colors = {
            background: options.colors?.background || '#ffffff',
            primary: options.colors?.primary || '#4285f4',
            secondary: options.colors?.secondary || '#ea4335',
            tertiary: options.colors?.tertiary || '#fbbc05',
            quaternary: options.colors?.quaternary || '#34a853',
            bars: {
                amplitude: options.colors?.bars?.amplitude || '#4285f4',
                probability: options.colors?.bars?.probability || '#34a853',
                phase: options.colors?.bars?.phase || '#fbbc05'
            },
            axis: options.colors?.axis || '#888888',
            text: options.colors?.text || '#000000'
        };
    }
    
    /**
     * Generate SVG representation of a quantum state as a probability bar chart
     * @param {QTensor} state - Quantum state to visualize
     * @param {Object} options - Visualization options
     * @param {boolean} options.showPhase - Whether to show phase information (default: false)
     * @param {boolean} options.logScale - Whether to use logarithmic scale (default: false)
     * @returns {string} SVG representation
     */
    generateProbabilityBarsSVG(state, options = {}) {
        // Removed previous debug logging

        const showPhase = options.showPhase !== undefined ? options.showPhase : false;
        const logScale = options.logScale !== undefined ? options.logScale : false;

        // Check if state is valid before proceeding
        if (!state || typeof state.getAmplitude !== 'function' || typeof state.numQubits !== 'number') {
             console.error('Invalid state object passed to generateProbabilityBarsSVG:', state);
             return '<div style="color: red; padding: 10px; border: 1px solid red;">Error: Invalid state object received by visualizer.</div>';
        }

        const numQubits = state.numQubits; // Use numQubits after validation
        const numStates = 2 ** numQubits;
        const barWidth = Math.min(30, Math.max(10, (this.width - 100) / numStates));
        const maxHeight = this.height - 100;
        
        // Calculate probabilities
        const probabilities = [];
        const phases = [];
        for (let i = 0; i < numStates; i++) {
            // Removed loop debug logging
            const amplitude = state.getAmplitude(i);
            const probability = qMath.squaredMagnitude(amplitude);
            const phase = qMath.phase(amplitude);

            probabilities.push(probability);
            phases.push(phase);
        }
        
        // Start SVG
        let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add background
        svg += `<rect width="100%" height="100%" fill="${this.colors.background}" />`;
        
        // Add title
        svg += `<text x="${this.width / 2}" y="30" text-anchor="middle" font-size="18" fill="${this.colors.text}">Quantum State Probabilities</text>`;
        
        // Add axes
        svg += `<line x1="50" y1="${this.height - 50}" x2="${this.width - 50}" y2="${this.height - 50}" stroke="${this.colors.axis}" stroke-width="2" />`;
        svg += `<line x1="50" y1="${this.height - 50}" x2="50" y2="50" stroke="${this.colors.axis}" stroke-width="2" />`;
        
        // Add axis labels
        svg += `<text x="${this.width / 2}" y="${this.height - 10}" text-anchor="middle" font-size="14" fill="${this.colors.text}">Basis States</text>`;
        svg += `<text x="20" y="${this.height / 2}" text-anchor="middle" font-size="14" fill="${this.colors.text}" transform="rotate(-90, 20, ${this.height / 2})">Probability</text>`;
        
        // Add bars
        const startX = 70;
        for (let i = 0; i < numStates; i++) {
            const probability = probabilities[i];
            let barHeight;
            
            // Apply logarithmic scale if needed
            if (logScale && probability > 0) {
                barHeight = maxHeight * (Math.log10(probability) / Math.log10(1e-16));
                barHeight = Math.max(0, barHeight); // Ensure non-negative
            } else {
                barHeight = maxHeight * probability;
            }
            
            const x = startX + i * (barWidth + 2);
            const y = this.height - 50 - barHeight;
            
            // Draw probability bar
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${this.colors.bars.probability}" />`;
            
            // Add state label
            const label = i.toString(2).padStart(state.numQubits, '0');
            svg += `<text x="${x + barWidth / 2}" y="${this.height - 35}" text-anchor="middle" font-size="10" fill="${this.colors.text}" transform="rotate(45, ${x + barWidth / 2}, ${this.height - 35})">|${label}⟩</text>`;
            
            // Add probability value
            svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="${this.colors.text}">${probability.toFixed(3)}</text>`;
            
            // Add phase indicator if requested
            if (showPhase && probability > 0.001) {
                const phase = phases[i];
                const phaseColor = this._getPhaseColor(phase);
                const phaseX = x + barWidth / 2;
                const phaseY = y - 15;
                
                svg += `<circle cx="${phaseX}" cy="${phaseY}" r="5" fill="${phaseColor}" />`;
                svg += `<text x="${phaseX + 10}" y="${phaseY + 3}" font-size="8" fill="${this.colors.text}">${(phase * 180 / Math.PI).toFixed(0)}°</text>`;
            }
        }
        
        // Close SVG
        svg += '</svg>';
        
        return svg;
    }
    
    /**
     * Generate SVG representation of a single qubit state as a Bloch sphere
     * @param {QTensor} state - Single qubit state to visualize
     * @returns {string} SVG representation
     */
    generateBlochSphereSVG(state) {
        // Ensure it's a single qubit state
        if (state.numQubits !== 1) {
            throw new Error('Bloch sphere visualization requires a single qubit state');
        }
        
        // Extract state amplitudes
        const alpha = state.getAmplitude(0);
        const beta = state.getAmplitude(1);
        
        // Calculate Bloch sphere coordinates
        const { x, y, z } = this._stateToBlochCoordinates(alpha, beta);
        
        // Sphere parameters
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 3;
        
        // Start SVG
        let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add background
        svg += `<rect width="100%" height="100%" fill="${this.colors.background}" />`;
        
        // Add title
        svg += `<text x="${this.width / 2}" y="30" text-anchor="middle" font-size="18" fill="${this.colors.text}">Bloch Sphere Representation</text>`;
        
        // Draw Bloch sphere (simple representation)
        // Circle outline (equator)
        svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${this.colors.axis}" stroke-width="1" />`;
        
        // XY-plane (equator)
        svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="${this.colors.axis}" stroke-width="1" stroke-dasharray="5,5" />`;
        
        // X, Y, Z axes
        const axisLength = radius * 1.2;
        
        // X axis (red)
        svg += `<line x1="${centerX - axisLength}" y1="${centerY}" x2="${centerX + axisLength}" y2="${centerY}" stroke="${this.colors.secondary}" stroke-width="1" />`;
        svg += `<text x="${centerX + axisLength + 10}" y="${centerY}" text-anchor="start" font-size="12" fill="${this.colors.text}">X</text>`;
        
        // Y axis (green)
        svg += `<line x1="${centerX}" y1="${centerY - axisLength}" x2="${centerX}" y2="${centerY + axisLength}" stroke="${this.colors.quaternary}" stroke-width="1" />`;
        svg += `<text x="${centerX}" y="${centerY - axisLength - 10}" text-anchor="middle" font-size="12" fill="${this.colors.text}">Z</text>`;
        
        // Z axis (blue, appearing as ellipsis due to perspective)
        svg += `<line x1="${centerX}" y1="${centerY - radius * 0.3}" x2="${centerX}" y2="${centerY + radius * 0.3}" stroke="${this.colors.primary}" stroke-width="1" transform="rotate(90, ${centerX}, ${centerY})"/>`;
        svg += `<text x="${centerX + radius * 0.3 + 10}" y="${centerY}" text-anchor="start" font-size="12" fill="${this.colors.text}" transform="rotate(90, ${centerX}, ${centerY})">Y</text>`;
        
        // State vector
        const stateX = centerX + radius * x * 0.9;
        const stateY = centerY - radius * z * 0.9;
        
        // Draw state vector
        svg += `<line x1="${centerX}" y1="${centerY}" x2="${stateX}" y2="${stateY}" stroke="${this.colors.primary}" stroke-width="2" />`;
        svg += `<circle cx="${stateX}" cy="${stateY}" r="5" fill="${this.colors.primary}" />`;
        
        // Add state information
        const stateInfo = `|ψ⟩ = ${this._formatComplex(alpha)}|0⟩ + ${this._formatComplex(beta)}|1⟩`;
        svg += `<text x="${this.width / 2}" y="${this.height - 50}" text-anchor="middle" font-size="14" fill="${this.colors.text}">${stateInfo}</text>`;
        
        // Add Bloch coordinates
        const coordInfo = `(x, y, z) = (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`;
        svg += `<text x="${this.width / 2}" y="${this.height - 30}" text-anchor="middle" font-size="14" fill="${this.colors.text}">${coordInfo}</text>`;
        
        // Close SVG
        svg += '</svg>';
        
        return svg;
    }
    
    /**
     * Generate HTML representation of a quantum state
     * @param {QTensor} state - Quantum state to visualize
     * @param {Object} options - Visualization options
     * @param {string} options.type - Visualization type ('probabilities', 'bloch', 'amplitude')
     * @returns {string} HTML representation
     */
    generateHTML(state, options = {}) {
        const type = options.type || 'probabilities';
        let svg;
        
        switch (type) {
            case 'bloch':
                if (state.numQubits === 1) {
                    svg = this.generateBlochSphereSVG(state);
                } else {
                    svg = this.generateProbabilityBarsSVG(state);
                    console.warn('Bloch sphere visualization only works for single qubit states, falling back to probability bars');
                }
                break;
            case 'amplitude':
                svg = this.generateProbabilityBarsSVG(state, { showPhase: true });
                break;
            case 'probabilities':
            default:
                svg = this.generateProbabilityBarsSVG(state);
        }
        
        // Wrap in HTML container
        return `
            <div class="qipai-state-visualization" style="padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                <h3 style="margin-top: 0;">Quantum State (${state.numQubits} qubits)</h3>
                ${svg}
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    ${2**state.numQubits} basis states
                </div>
            </div>
        `;
    }
    
    /**
     * Generate color based on phase angle
     * @param {number} phase - Phase angle (in radians)
     * @returns {string} CSS color
     * @private
     */
    _getPhaseColor(phase) {
        // Normalize phase to [0, 2π)
        const normalizedPhase = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        
        // Map phase to hue [0, 360)
        const hue = (normalizedPhase / (2 * Math.PI)) * 360;
        
        // Use HSL color model
        return `hsl(${hue}, 100%, 50%)`;
    }
    
    /**
     * Convert quantum state to Bloch sphere coordinates
     * @param {Object} alpha - Amplitude of |0⟩ state (complex number)
     * @param {Object} beta - Amplitude of |1⟩ state (complex number)
     * @returns {Object} Bloch sphere coordinates {x, y, z}
     * @private
     */
    _stateToBlochCoordinates(alpha, beta) {
        // Calculate probabilities
        const prob0 = qMath.squaredMagnitude(alpha);
        const prob1 = qMath.squaredMagnitude(beta);
        
        // Get phases
        const phaseAlpha = qMath.phase(alpha);
        const phaseBeta = qMath.phase(beta);
        
        // Calculate relative phase
        const phaseRelative = phaseBeta - phaseAlpha;
        
        // Calculate Bloch sphere coordinates
        const z = prob0 - prob1;
        const x = 2 * Math.sqrt(prob0 * prob1) * Math.cos(phaseRelative);
        const y = 2 * Math.sqrt(prob0 * prob1) * Math.sin(phaseRelative);
        
        return { x, y, z };
    }
    
    /**
     * Format complex number for display
     * @param {Object} complex - Complex number { re: real, im: imaginary }
     * @returns {string} Formatted string
     * @private
     */
    _formatComplex(complex) {
        const re = complex.re.toFixed(2);
        const im = complex.im.toFixed(2);
        
        if (Math.abs(complex.im) < 0.01) {
            return re; // Just real part if imaginary is very small
        } else if (Math.abs(complex.re) < 0.01) {
            return `${im}i`; // Just imaginary part if real is very small
        } else if (complex.im < 0) {
            return `${re} - ${Math.abs(im)}i`;
        } else {
            return `${re} + ${im}i`;
        }
    }
}
