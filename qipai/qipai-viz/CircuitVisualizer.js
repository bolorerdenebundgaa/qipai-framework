/**
 * CircuitVisualizer.js
 * Visualizes quantum circuits in HTML/SVG format.
 * 
 * This module renders quantum circuits as visual diagrams with gates, wires, and
 * measurements for better understanding and debugging quantum algorithms.
 */

import * as Gates from '../core/gates.js';

/**
 * Quantum Circuit Visualizer
 */
export class CircuitVisualizer {
    /**
     * Create a new circuit visualizer
     * @param {Object} options - Visualization options
     * @param {number} options.width - Canvas width (default: 800)
     * @param {number} options.height - Canvas height (default: auto)
     * @param {number} options.wireSpacing - Space between quantum wires (default: 40)
     * @param {number} options.gateWidth - Width of gate elements (default: 30)
     * @param {number} options.timeSliceWidth - Width of each time step (default: 60)
     * @param {Object} options.colors - Color scheme for different elements
     */
    constructor(options = {}) {
        // Canvas dimensions
        this.width = options.width || 800;
        this.height = options.height || null; // Auto determined based on qubit count
        
        // Layout parameters
        this.wireSpacing = options.wireSpacing || 40;
        this.gateWidth = options.gateWidth || 30;
        this.timeSliceWidth = options.timeSliceWidth || 60;
        this.margin = options.margin || 20;
        
        // Colors
        this.colors = {
            background: options.colors?.background || '#ffffff',
            wire: options.colors?.wire || '#888888',
            qubitLabel: options.colors?.qubitLabel || '#000000',
            gates: {
                standard: options.colors?.gates?.standard || '#e0e0ff',
                control: options.colors?.gates?.control || '#000000',
                target: options.colors?.gates?.target || '#ffffff',
                parameterized: options.colors?.gates?.parameterized || '#ffe0e0',
                measurement: options.colors?.gates?.measurement || '#e0ffe0'
            },
            text: options.colors?.text || '#000000'
        };
    }
    
    /**
     * Generate SVG representation of a quantum circuit
     * @param {QCircuit} circuit - Quantum circuit to visualize
     * @returns {string} SVG representation
     */
    generateSVG(circuit) {
        const numQubits = circuit.numQubits;
        const numTimeSlices = this._determineTimeSlices(circuit);
        
        // Auto-determine height if not specified
        const height = this.height || ((numQubits + 1) * this.wireSpacing + 2 * this.margin);
        
        // Calculate width based on time slices
        const width = numTimeSlices * this.timeSliceWidth + 2 * this.margin;
        
        // Start SVG
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add background
        svg += `<rect width="100%" height="100%" fill="${this.colors.background}" />`;
        
        // Add circuit elements
        svg += this._generateQubitWires(numQubits, numTimeSlices);
        svg += this._generateGates(circuit, numTimeSlices);
        
        // Close SVG
        svg += '</svg>';
        
        return svg;
    }
    
    /**
     * Generate HTML representation of a quantum circuit
     * @param {QCircuit} circuit - Quantum circuit to visualize
     * @returns {string} HTML representation
     */
    generateHTML(circuit) {
        const svg = this.generateSVG(circuit);
        
        // Wrap in HTML container
        return `
            <div class="qipai-circuit-visualization" style="padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                <h3 style="margin-top: 0;">Quantum Circuit (${circuit.numQubits} qubits)</h3>
                ${svg}
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    ${circuit.gates.length} gates, ${circuit.paramCount} parameters
                </div>
            </div>
        `;
    }
    
    /**
     * Generate qubit wires
     * @param {number} numQubits - Number of qubits
     * @param {number} numTimeSlices - Number of time slices
     * @returns {string} SVG elements for qubit wires
     * @private
     */
    _generateQubitWires(numQubits, numTimeSlices) {
        let elements = '';
        const wireWidth = numTimeSlices * this.timeSliceWidth;
        
        for (let i = 0; i < numQubits; i++) {
            const y = (i + 1) * this.wireSpacing + this.margin;
            
            // Qubit label
            elements += `
                <text x="${this.margin / 2}" y="${y}" 
                      fill="${this.colors.qubitLabel}" 
                      text-anchor="middle" 
                      alignment-baseline="middle"
                      font-size="14">
                    q${i}
                </text>
            `;
            
            // Wire
            elements += `
                <line x1="${this.margin}" y1="${y}" 
                      x2="${wireWidth + this.margin}" y2="${y}" 
                      stroke="${this.colors.wire}" 
                      stroke-width="1" />
            `;
        }
        
        return elements;
    }
    
    /**
     * Generate gate elements
     * @param {QCircuit} circuit - Quantum circuit
     * @param {number} numTimeSlices - Number of time slices
     * @returns {string} SVG elements for gates
     * @private
     */
    _generateGates(circuit, numTimeSlices) {
        let elements = '';
        
        // Group gates by time slices
        const timeSlices = this._organizeGatesByTime(circuit);
        
        // Render each time slice
        for (let t = 0; t < timeSlices.length; t++) {
            const gates = timeSlices[t];
            
            for (const operation of gates) {
                elements += this._renderGate(operation, t);
            }
        }
        
        return elements;
    }
    
    /**
     * Render a quantum gate
     * @param {Object} operation - Gate operation
     * @param {number} timeSlice - Time slice index
     * @returns {string} SVG elements for the gate
     * @private
     */
    _renderGate(operation, timeSlice) {
        const gate = operation.gate;
        const targets = operation.targets || [];
        const controls = operation.controls || [];
        const parameters = operation.parameters || [];
        
        let elements = '';
        const x = timeSlice * this.timeSliceWidth + this.margin + this.timeSliceWidth / 2;
        
        // Draw control points
        for (const control of controls) {
            const y = (control + 1) * this.wireSpacing + this.margin;
            elements += `
                <circle cx="${x}" cy="${y}" r="5" 
                        fill="${this.colors.gates.control}" 
                        stroke="none" />
            `;
        }
        
        // Draw control lines if there are both controls and targets
        if (controls.length > 0 && targets.length > 0) {
            const minQubit = Math.min(...controls, ...targets);
            const maxQubit = Math.max(...controls, ...targets);
            const y1 = (minQubit + 1) * this.wireSpacing + this.margin;
            const y2 = (maxQubit + 1) * this.wireSpacing + this.margin;
            
            elements += `
                <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" 
                      stroke="${this.colors.gates.control}" 
                      stroke-width="1" />
            `;
        }
        
        // Draw the gate on target qubits
        for (const target of targets) {
            const y = (target + 1) * this.wireSpacing + this.margin;
            let gateElement = '';
            
            switch (gate.name) {
                case 'H':
                    // Hadamard gate
                    gateElement = this._boxGate(x, y, 'H', this.colors.gates.standard);
                    break;
                case 'X':
                    if (controls.length > 0) {
                        // Controlled-X gate (CNOT)
                        gateElement = this._circleGate(x, y, '⊕', this.colors.gates.target);
                    } else {
                        // X gate (NOT)
                        gateElement = this._boxGate(x, y, 'X', this.colors.gates.standard);
                    }
                    break;
                case 'Y':
                    gateElement = this._boxGate(x, y, 'Y', this.colors.gates.standard);
                    break;
                case 'Z':
                    gateElement = this._boxGate(x, y, 'Z', this.colors.gates.standard);
                    break;
                case 'S':
                    gateElement = this._boxGate(x, y, 'S', this.colors.gates.standard);
                    break;
                case 'T':
                    gateElement = this._boxGate(x, y, 'T', this.colors.gates.standard);
                    break;
                case 'MEASURE':
                    gateElement = this._measureGate(x, y);
                    break;
                default:
                    // Check if it's a parameterized gate
                    if (operation.isParameterized) {
                        let label = gate.name;
                        if (parameters.length > 0) {
                            label += `(${parameters.map(p => p.toFixed(2)).join(',')})`;
                        }
                        gateElement = this._boxGate(x, y, label, this.colors.gates.parameterized);
                    } else {
                        // Generic gate
                        gateElement = this._boxGate(x, y, gate.name, this.colors.gates.standard);
                    }
            }
            
            elements += gateElement;
        }
        
        return elements;
    }
    
    /**
     * Create a box-style gate visualization
     * @param {number} x - X coordinate (center)
     * @param {number} y - Y coordinate (center)
     * @param {string} label - Gate label
     * @param {string} color - Gate color
     * @returns {string} SVG elements for the gate
     * @private
     */
    _boxGate(x, y, label, color) {
        const width = this.gateWidth;
        const height = this.gateWidth;
        
        return `
            <rect x="${x - width / 2}" y="${y - height / 2}" 
                  width="${width}" height="${height}" 
                  fill="${color}" stroke="#000000" stroke-width="1" />
            <text x="${x}" y="${y}" 
                  fill="${this.colors.text}" 
                  text-anchor="middle" 
                  alignment-baseline="middle"
                  font-size="12">
                ${label}
            </text>
        `;
    }
    
    /**
     * Create a circle-style gate visualization
     * @param {number} x - X coordinate (center)
     * @param {number} y - Y coordinate (center)
     * @param {string} label - Gate label
     * @param {string} color - Gate color
     * @returns {string} SVG elements for the gate
     * @private
     */
    _circleGate(x, y, label, color) {
        const radius = this.gateWidth / 2;
        
        return `
            <circle cx="${x}" cy="${y}" r="${radius}" 
                    fill="${color}" stroke="#000000" stroke-width="1" />
            <text x="${x}" y="${y}" 
                  fill="${this.colors.text}" 
                  text-anchor="middle" 
                  alignment-baseline="middle"
                  font-size="12">
                ${label}
            </text>
        `;
    }
    
    /**
     * Create a measurement gate visualization
     * @param {number} x - X coordinate (center)
     * @param {number} y - Y coordinate (center)
     * @returns {string} SVG elements for the gate
     * @private
     */
    _measureGate(x, y) {
        const width = this.gateWidth;
        const height = this.gateWidth;
        
        return `
            <rect x="${x - width / 2}" y="${y - height / 2}" 
                  width="${width}" height="${height}" 
                  fill="${this.colors.gates.measurement}" stroke="#000000" stroke-width="1" />
            <path d="M${x - width/4},${y + height/4} L${x},${y - height/4} L${x + width/4},${y + height/4}" 
                  stroke="#000000" stroke-width="1" fill="none" />
            <line x1="${x - width/4}" y1="${y + height/4}" x2="${x + width/4}" y2="${y + height/4}" 
                  stroke="#000000" stroke-width="1" />
        `;
    }
    
    /**
     * Determine time slices needed for the circuit
     * @param {QCircuit} circuit - Quantum circuit
     * @returns {number} Number of time slices
     * @private
     */
    _determineTimeSlices(circuit) {
        // Count gates grouped by time where dependencies are considered
        const timeSlices = this._organizeGatesByTime(circuit);
        return Math.max(1, timeSlices.length);
    }
    
    /**
     * Organize gates into time slices based on dependencies
     * @param {QCircuit} circuit - Quantum circuit
     * @returns {Array<Array<Object>>} Gates organized by time slices
     * @private
     */
    _organizeGatesByTime(circuit) {
        // For this simple visualizer, we'll assume each gate is a separate time slice
        // A more advanced visualizer would analyze dependencies between gates
        
        const timeSlices = [];
        for (const gate of circuit.gates) {
            timeSlices.push([gate]);
        }
        
        return timeSlices;
    }
}
