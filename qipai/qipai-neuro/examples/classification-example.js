/**
 * classification-example.js
 * 
 * Example demonstrating a quantum neural network for binary classification.
 * This example creates a simple 2D classification problem and trains a
 * quantum neural network to separate the two classes.
 */

import { QuantumNeuralNetwork, VariationalQuantumLayer, createSimpleQNN } from '../index.js';

/**
 * Generate a simple binary classification dataset
 * Points are in a 2D space, with two circular clusters
 * @param {number} numSamples - Number of samples to generate
 * @returns {Object} Dataset with x (features) and y (labels)
 */
function generateCircleDataset(numSamples = 100) {
    const x = [];
    const y = [];
    
    // Generate two circular clusters
    for (let i = 0; i < numSamples; i++) {
        // Random angle and radius
        const angle = Math.random() * 2 * Math.PI;
        const clusterIndex = Math.random() > 0.5 ? 0 : 1;
        
        let radius, centerX, centerY;
        if (clusterIndex === 0) {
            // First cluster: centered at (0.3, 0.3) with radius 0.2
            radius = 0.2 * Math.sqrt(Math.random());
            centerX = 0.3;
            centerY = 0.3;
        } else {
            // Second cluster: centered at (0.7, 0.7) with radius 0.2
            radius = 0.2 * Math.sqrt(Math.random());
            centerX = 0.7;
            centerY = 0.7;
        }
        
        // Calculate point coordinates
        const pointX = centerX + radius * Math.cos(angle);
        const pointY = centerY + radius * Math.sin(angle);
        
        // Add to dataset (normalized to [0,1] range)
        x.push([pointX, pointY]);
        
        // One-hot encoding of labels
        y.push(clusterIndex === 0 ? [1, 0] : [0, 1]);
    }
    
    return { x, y };
}

/**
 * Run the quantum classification example
 */
async function runClassificationExample() {
    console.log('Quantum Neural Network - Binary Classification Example');
    console.log('====================================================');
    
    // Generate dataset
    const numSamples = 100;
    const splitRatio = 0.8; // 80% training, 20% testing
    const { x, y } = generateCircleDataset(numSamples);
    
    // Split into training and testing sets
    const numTraining = Math.floor(numSamples * splitRatio);
    const trainX = x.slice(0, numTraining);
    const trainY = y.slice(0, numTraining);
    const testX = x.slice(numTraining);
    const testY = y.slice(numTraining);
    
    console.log(`Generated dataset with ${numSamples} samples`);
    console.log(`- Training set: ${trainX.length} samples`);
    console.log(`- Testing set: ${testX.length} samples`);
    
    // Display some samples
    console.log('\nSample data:');
    for (let i = 0; i < 5; i++) {
        console.log(`- Sample ${i+1}: x=[${trainX[i][0].toFixed(2)}, ${trainX[i][1].toFixed(2)}], y=[${trainY[i][0]}, ${trainY[i][1]}]`);
    }
    
    // Create a quantum neural network
    console.log('\nCreating quantum neural network...');
    
    const qnn = createSimpleQNN({
        inputQubits: 2,     // 2D data points
        hiddenLayers: 1,    // One hidden layer
        outputQubits: 2,    // Two output qubits for binary classification
        depth: 3,           // Circuit depth
        encoding: 'angle',  // Angle encoding for input data
        entanglement: 'full'// Full entanglement between qubits
    });
    
    console.log('Network architecture:');
    console.log(`- Input qubits: 2`);
    console.log(`- Hidden layers: 1`);
    console.log(`- Output qubits: 2`);
    console.log(`- Circuit depth: 3`);
    console.log(`- Encoding: angle`);
    console.log(`- Entanglement: full`);
    
    // Train the network
    console.log('\nTraining quantum neural network...');
    
    const history = await qnn.train(
        { x: trainX, y: trainY },
        {
            epochs: 20,
            batchSize: 10,
            onEpochEnd: (epoch) => {
                console.log(`Epoch ${epoch.epoch}: loss=${epoch.loss.toFixed(4)}, accuracy=${epoch.accuracy.toFixed(4)}`);
            },
            validation: {
                x: testX,
                y: testY
            }
        }
    );
    
    // Evaluate the model
    console.log('\nEvaluating on test set...');
    const evaluation = qnn.evaluate(testX, testY);
    console.log(`Test loss: ${evaluation.loss.toFixed(4)}`);
    console.log(`Test accuracy: ${evaluation.accuracy.toFixed(4)}`);
    
    // Make predictions for a few samples
    console.log('\nPredictions for a few test samples:');
    const predictions = qnn.predict(testX.slice(0, 5));
    
    for (let i = 0; i < 5; i++) {
        const point = testX[i];
        const trueLabel = testY[i][0] === 1 ? 'Class 0' : 'Class 1';
        const predictedClass = predictions[i][0] > predictions[i][1] ? 'Class 0' : 'Class 1';
        const confidence = Math.max(predictions[i][0], predictions[i][1]);
        
        console.log(`- Point (${point[0].toFixed(2)}, ${point[1].toFixed(2)}): `);
        console.log(`  True label: ${trueLabel}`);
        console.log(`  Predicted: ${predictedClass} with ${(confidence * 100).toFixed(1)}% confidence`);
    }
    
    console.log('\nQuantum neural network classification example completed!');
    
    return {
        network: qnn,
        history: history,
        evaluation: evaluation
    };
}

// Run the example if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runClassificationExample().catch(console.error);
}

export { generateCircleDataset, runClassificationExample };
