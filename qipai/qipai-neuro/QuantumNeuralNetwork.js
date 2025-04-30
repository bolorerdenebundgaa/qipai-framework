/**
 * QuantumNeuralNetwork.js
 * Implementation of a quantum neural network that combines multiple quantum layers.
 * 
 * This provides a full neural network architecture that leverages quantum
 * computing principles for potentially enhanced learning capabilities.
 */

import { QuantumLayer } from './QuantumLayer.js';
import { VariationalQuantumLayer } from './VariationalQuantumLayer.js';
import { QTensor } from '../core/qTensor.js';

/**
 * Quantum Neural Network - combines multiple quantum layers into a trainable model
 */
export class QuantumNeuralNetwork {
    /**
     * Create a new quantum neural network
     * @param {Object} options - Configuration options
     * @param {Array<QuantumLayer>} options.layers - Array of quantum layers (optional)
     * @param {string} options.name - Network name
     * @param {Object} options.optimizer - Optimizer configuration
     */
    constructor(options = {}) {
        this.layers = options.layers || [];
        this.name = options.name || `qnn_${Date.now()}`;
        
        // Configure optimizer
        this.optimizer = {
            type: options.optimizer?.type || 'adam',
            learningRate: options.optimizer?.learningRate || 0.01,
            beta1: options.optimizer?.beta1 || 0.9,
            beta2: options.optimizer?.beta2 || 0.999,
            epsilon: options.optimizer?.epsilon || 1e-8
        };
        
        // Training state
        this.isTraining = false;
        this.epoch = 0;
        this.iterations = 0;
        this.history = {
            loss: [],
            accuracy: [],
            valLoss: [],
            valAccuracy: []
        };
        
        // Momentum and second moment for Adam optimizer
        this.momentums = [];
        this.secondMoments = [];
        this._initializeOptimizer();
    }
    
    /**
     * Add a layer to the network
     * @param {QuantumLayer} layer - Layer to add
     * @returns {QuantumNeuralNetwork} this (for chaining)
     */
    addLayer(layer) {
        if (!(layer instanceof QuantumLayer)) {
            throw new Error('Layer must be an instance of QuantumLayer');
        }
        
        // Check compatibility with previous layer
        if (this.layers.length > 0) {
            const prevLayer = this.layers[this.layers.length - 1];
            if (prevLayer.outputQubits !== layer.inputQubits) {
                throw new Error(`Layer input qubits (${layer.inputQubits}) must match previous layer output qubits (${prevLayer.outputQubits})`);
            }
        }
        
        this.layers.push(layer);
        this._initializeOptimizer(); // Reinitialize optimizer state
        
        return this;
    }
    
    /**
     * Forward pass through the network
     * @param {QTensor|Array<number>} input - Input quantum state or classical data
     * @param {Object} options - Forward pass options
     * @returns {QTensor|Array<number>} Output quantum state or measurement results
     */
    forward(input, options = {}) {
        if (this.layers.length === 0) {
            throw new Error('Network has no layers');
        }
        
        // Set all layers to training mode if in training
        if (this.isTraining) {
            this._setTrainingMode(true);
        }
        
        // Forward through each layer
        let output = input;
        
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const isLastLayer = i === this.layers.length - 1;
            
            // For the last layer, respect the measure option
            // For intermediate layers, always keep quantum state
            const layerOptions = {
                ...options,
                measure: isLastLayer ? options.measure : false
            };
            
            output = layer.forward(output, layerOptions);
        }
        
        return output;
    }
    
    /**
     * Train the network on a dataset
     * @param {Object} dataset - Training dataset
     * @param {Array<Array<number>>} dataset.x - Input data
     * @param {Array<Array<number>>} dataset.y - Target outputs
     * @param {Object} options - Training options
     * @param {number} options.epochs - Number of epochs
     * @param {number} options.batchSize - Batch size
     * @param {Function} options.onEpochEnd - Callback after each epoch
     * @param {Object} options.validation - Validation dataset {x, y}
     * @returns {Object} Training history
     */
    async train(dataset, options = {}) {
        const { x, y } = dataset;
        if (!x || !y || x.length !== y.length) {
            throw new Error('Dataset must contain equal length x and y arrays');
        }
        
        const epochs = options.epochs || 10;
        const batchSize = options.batchSize || 32;
        const validation = options.validation;
        const onEpochEnd = options.onEpochEnd;
        
        // Set training mode
        this.isTraining = true;
        this._setTrainingMode(true);
        
        console.log(`Training ${this.name} for ${epochs} epochs with ${x.length} samples`);
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            this.epoch = epoch;
            
            // Shuffle dataset
            const indices = this._shuffle(x.length);
            
            let epochLoss = 0;
            let correct = 0;
            
            // Train in batches
            for (let batchStart = 0; batchStart < x.length; batchStart += batchSize) {
                const batchEnd = Math.min(batchStart + batchSize, x.length);
                const batchIndices = indices.slice(batchStart, batchEnd);
                
                // Prepare batch
                const batchX = batchIndices.map(i => x[i]);
                const batchY = batchIndices.map(i => y[i]);
                
                // Train on batch
                const batchLoss = this._trainOnBatch(batchX, batchY);
                epochLoss += batchLoss * (batchEnd - batchStart);
                
                this.iterations++;
            }
            
            // Calculate epoch metrics
            epochLoss /= x.length;
            
            // Evaluate on training set
            const trainEval = this.evaluate(x, y);
            
            // Store metrics
            this.history.loss.push(epochLoss);
            this.history.accuracy.push(trainEval.accuracy);
            
            // Optionally evaluate on validation set
            if (validation && validation.x && validation.y) {
                const valEval = this.evaluate(validation.x, validation.y);
                this.history.valLoss.push(valEval.loss);
                this.history.valAccuracy.push(valEval.accuracy);
                
                console.log(`Epoch ${epoch + 1}/${epochs}: loss=${epochLoss.toFixed(4)}, accuracy=${trainEval.accuracy.toFixed(4)}, val_loss=${valEval.loss.toFixed(4)}, val_accuracy=${valEval.accuracy.toFixed(4)}`);
            } else {
                console.log(`Epoch ${epoch + 1}/${epochs}: loss=${epochLoss.toFixed(4)}, accuracy=${trainEval.accuracy.toFixed(4)}`);
            }
            
            // Call epoch end callback if provided
            if (onEpochEnd) {
                onEpochEnd({
                    epoch: epoch + 1,
                    loss: epochLoss,
                    accuracy: trainEval.accuracy,
                    valLoss: this.history.valLoss[epoch],
                    valAccuracy: this.history.valAccuracy[epoch]
                });
            }
            
            // Optional: break if loss is low enough
            if (epochLoss < 1e-6) {
                console.log('Reached target loss. Early stopping.');
                break;
            }
        }
        
        // Reset training mode
        this.isTraining = false;
        this._setTrainingMode(false);
        
        return this.history;
    }
    
    /**
     * Evaluate the network on a dataset
     * @param {Array<Array<number>>} x - Input data
     * @param {Array<Array<number>>} y - Target outputs
     * @returns {Object} Evaluation metrics
     */
    evaluate(x, y) {
        if (x.length !== y.length) {
            throw new Error('x and y must have the same length');
        }
        
        // Set to evaluation mode
        const wasTraining = this.isTraining;
        this.isTraining = false;
        this._setTrainingMode(false);
        
        let totalLoss = 0;
        let correct = 0;
        
        // Evaluate each sample
        for (let i = 0; i < x.length; i++) {
            const input = x[i];
            const target = y[i];
            
            // Forward pass
            const prediction = this.forward(input);
            
            // Calculate loss
            const loss = this._calculateLoss(prediction, target);
            totalLoss += loss;
            
            // Check if prediction is correct (for classification)
            // Assuming prediction and target are arrays of probabilities
            if (this._isCorrectPrediction(prediction, target)) {
                correct++;
            }
        }
        
        // Calculate metrics
        const avgLoss = totalLoss / x.length;
        const accuracy = correct / x.length;
        
        // Restore training mode
        this.isTraining = wasTraining;
        this._setTrainingMode(wasTraining);
        
        return {
            loss: avgLoss,
            accuracy: accuracy
        };
    }
    
    /**
     * Predict outputs for inputs
     * @param {Array<Array<number>>} x - Input data
     * @returns {Array<Array<number>>} Predictions
     */
    predict(x) {
        // Set to evaluation mode
        const wasTraining = this.isTraining;
        this.isTraining = false;
        this._setTrainingMode(false);
        
        // Make predictions
        const predictions = [];
        for (const input of x) {
            const prediction = this.forward(input);
            predictions.push(prediction);
        }
        
        // Restore training mode
        this.isTraining = wasTraining;
        this._setTrainingMode(wasTraining);
        
        return predictions;
    }
    
    /**
     * Save the network to a JSON object
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            name: this.name,
            layers: this.layers.map(layer => layer.toJSON()),
            optimizer: { ...this.optimizer },
            epoch: this.epoch,
            iterations: this.iterations
        };
    }
    
    /**
     * Create a network from a JSON object
     * @param {Object} json - JSON representation
     * @returns {QuantumNeuralNetwork} Reconstructed network
     */
    static fromJSON(json) {
        // Create layers
        const layers = json.layers.map(layerJson => {
            // Determine the layer class
            let layerClass;
            switch (layerJson.type) {
                case 'VariationalQuantumLayer':
                    layerClass = VariationalQuantumLayer;
                    break;
                case 'QuantumLayer':
                default:
                    layerClass = QuantumLayer;
            }
            
            // Create the layer
            return layerClass.fromJSON(layerJson);
        });
        
        // Create network
        const network = new QuantumNeuralNetwork({
            name: json.name,
            layers,
            optimizer: json.optimizer
        });
        
        // Restore training state
        network.epoch = json.epoch || 0;
        network.iterations = json.iterations || 0;
        
        return network;
    }
    
    /**
     * Train the network on a single batch
     * @param {Array<Array<number>>} batchX - Batch inputs
     * @param {Array<Array<number>>} batchY - Batch targets
     * @returns {number} Average batch loss
     * @private
     */
    _trainOnBatch(batchX, batchY) {
        let batchLoss = 0;
        
        // Forward and backward pass for each sample
        for (let i = 0; i < batchX.length; i++) {
            const input = batchX[i];
            const target = batchY[i];
            
            // Forward pass
            const prediction = this.forward(input);
            
            // Calculate loss
            const loss = this._calculateLoss(prediction, target);
            batchLoss += loss;
            
            // Backward pass (update parameters)
            this._backward(prediction, target);
        }
        
        return batchLoss / batchX.length;
    }
    
    /**
     * Backward pass (update parameters)
     * @param {Array<number>} prediction - Model prediction
     * @param {Array<number>} target - Target values
     * @private
     */
    _backward(prediction, target) {
        // Calculate loss gradient
        const lossGradient = this._calculateLossGradient(prediction, target);
        
        // Backward pass through layers in reverse order
        let gradOutput = lossGradient;
        
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            
            // Backward pass through layer
            gradOutput = layer.backward(gradOutput, this.optimizer.learningRate);
            
            // For advanced optimizers like Adam, we would update parameters here
            // using the optimizer state (momentums, second moments)
            this._updateLayerParams(i, layer);
        }
    }
    
    /**
     * Calculate loss (MSE loss)
     * @param {Array<number>} prediction - Model prediction
     * @param {Array<number>} target - Target values
     * @returns {number} Loss value
     * @private
     */
    _calculateLoss(prediction, target) {
        // Mean Squared Error loss
        let loss = 0;
        for (let i = 0; i < prediction.length; i++) {
            const error = prediction[i] - target[i];
            loss += error * error;
        }
        return loss / prediction.length;
    }
    
    /**
     * Calculate loss gradient (MSE loss gradient)
     * @param {Array<number>} prediction - Model prediction
     * @param {Array<number>} target - Target values
     * @returns {Array<number>} Loss gradient
     * @private
     */
    _calculateLossGradient(prediction, target) {
        // Gradient of Mean Squared Error loss
        const gradient = [];
        for (let i = 0; i < prediction.length; i++) {
            gradient.push(2 * (prediction[i] - target[i]) / prediction.length);
        }
        return gradient;
    }
    
    /**
     * Update layer parameters using the optimizer
     * @param {number} layerIndex - Layer index
     * @param {QuantumLayer} layer - Layer to update
     * @private
     */
    _updateLayerParams(layerIndex, layer) {
        // Get layer parameters and gradients
        const params = layer.getParameters();
        const gradients = layer.gradients;
        
        // Get optimizer state for this layer
        const momentums = this.momentums[layerIndex];
        const secondMoments = this.secondMoments[layerIndex];
        
        // Update parameters using Adam optimizer
        const updated = this._adamUpdate(params, gradients, momentums, secondMoments);
        
        // Set updated parameters and optimizer state
        layer.setParameters(updated.params);
        this.momentums[layerIndex] = updated.momentums;
        this.secondMoments[layerIndex] = updated.secondMoments;
    }
    
    /**
     * Update parameters using Adam optimizer
     * @param {Array<number>} params - Parameters
     * @param {Array<number>} gradients - Gradients
     * @param {Array<number>} momentums - Momentum states
     * @param {Array<number>} secondMoments - Second moment states
     * @returns {Object} Updated parameters and optimizer states
     * @private
     */
    _adamUpdate(params, gradients, momentums, secondMoments) {
        // Adam optimizer implementation
        const { learningRate, beta1, beta2, epsilon } = this.optimizer;
        const t = this.iterations + 1;
        
        // Bias correction
        const biasCorrection1 = 1 - Math.pow(beta1, t);
        const biasCorrection2 = 1 - Math.pow(beta2, t);
        const alpha = learningRate * Math.sqrt(biasCorrection2) / biasCorrection1;
        
        // Update parameters
        const newParams = [];
        const newMomentums = [];
        const newSecondMoments = [];
        
        for (let i = 0; i < params.length; i++) {
            // Update momentum (moving average of gradients)
            const momentum = beta1 * momentums[i] + (1 - beta1) * gradients[i];
            
            // Update second moment (moving average of squared gradients)
            const secondMoment = beta2 * secondMoments[i] + (1 - beta2) * gradients[i] * gradients[i];
            
            // Update parameter
            const param = params[i] - alpha * momentum / (Math.sqrt(secondMoment) + epsilon);
            
            newParams.push(param);
            newMomentums.push(momentum);
            newSecondMoments.push(secondMoment);
        }
        
        return {
            params: newParams,
            momentums: newMomentums,
            secondMoments: newSecondMoments
        };
    }
    
    /**
     * Check if a prediction is correct
     * @param {Array<number>} prediction - Model prediction
     * @param {Array<number>} target - Target values
     * @returns {boolean} Whether the prediction is correct
     * @private
     */
    _isCorrectPrediction(prediction, target) {
        // For multi-class classification
        // Assuming prediction and target are arrays of probabilities
        
        // Find index of max value in prediction and target
        let maxPredIdx = 0;
        let maxTargetIdx = 0;
        
        for (let i = 1; i < prediction.length; i++) {
            if (prediction[i] > prediction[maxPredIdx]) {
                maxPredIdx = i;
            }
            if (target[i] > target[maxTargetIdx]) {
                maxTargetIdx = i;
            }
        }
        
        return maxPredIdx === maxTargetIdx;
    }
    
    /**
     * Set training mode for all layers
     * @param {boolean} isTraining - Whether in training mode
     * @private
     */
    _setTrainingMode(isTraining) {
        for (const layer of this.layers) {
            layer.setTraining(isTraining);
        }
    }
    
    /**
     * Initialize optimizer state
     * @private
     */
    _initializeOptimizer() {
        this.momentums = [];
        this.secondMoments = [];
        
        for (const layer of this.layers) {
            const paramCount = layer.getParameterCount();
            
            // Initialize momentum and second moment
            this.momentums.push(Array(paramCount).fill(0));
            this.secondMoments.push(Array(paramCount).fill(0));
        }
    }
    
    /**
     * Shuffle array indices
     * @param {number} length - Array length
     * @returns {Array<number>} Shuffled indices
     * @private
     */
    _shuffle(length) {
        const indices = Array.from({ length }, (_, i) => i);
        
        // Fisher-Yates shuffle
        for (let i = length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        return indices;
    }
}
