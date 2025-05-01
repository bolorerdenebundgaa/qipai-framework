# Running QiPAI Locally

This guide provides instructions for running the QiPAI framework on your local machine.

## Prerequisites

To run QiPAI locally, you'll need:

- Node.js (v14.0.0 or later)
- A modern web browser (for visualization features)
- An HTTP server (for browser examples)

## Setup

1. Clone the QiPAI repository:
   ```bash
   git clone https://github.com/yourusername/qipai.git
   cd qipai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Examples

### Command Line Examples

You can run many of the QiPAI examples directly from the command line using Node.js:

```bash
# Run the getting started example
node examples/getting-started.js

# Run the quantum reinforcement learning example
node qipai-rl/examples/GridWorldExample.js

# Run the quantum language example
node qipai-lang/examples/language-example.js
```

### Browser Examples

For examples that include visualization or require a DOM environment:

1. Start a local HTTP server in the project directory:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

2. Open a web browser and navigate to:
   ```
   http://localhost:8000/examples/browser-demo.html
   ```

3. You should see the QiPAI interactive demo with several tabs for different quantum computing examples.

## Browser Demo Features

The browser demo includes multiple examples:

1. **Bell State Example**: Creates and visualizes a Bell state (entangled qubits)
2. **Quantum Fourier Transform**: Demonstrates the QFT algorithm with visualization
3. **Quantum Neural Network**: Shows quantum machine learning capabilities
4. **Autonomous Agent**: Demonstrates quantum-inspired planning and reasoning
5. **Quantum Language**: Shows the QiPAI quantum programming language in action

Each tab has a "Run" button that executes the demo and displays the results.

## Connecting to Real Quantum Hardware (Optional)

To run examples on real quantum hardware:

1. Create an account at [IBM Quantum Experience](https://quantum-computing.ibm.com/)
2. Get your API token from the IBM Quantum platform
3. Set your token in your environment:

   ```bash
   export IBMQ_TOKEN="your_token_here"
   ```

4. Run the hardware integration example:
   ```bash
   node qipai-hardware/examples/ibmq-example.js
   ```

## Troubleshooting

If you encounter issues:

### Module Import Errors

Ensure you're using the correct import syntax. QiPAI uses ES modules, so:

```javascript
// Use this:
import { QCircuit } from '../core/qCircuit.js';

// Not this:
const { QCircuit } = require('../core/qCircuit.js');
```

### Browser Visualization Issues

- Make sure you're accessing the demo through an HTTP server, not direct file access
- Check the browser console for any error messages
- Try a different browser if visualizations don't render correctly

### Performance Issues

For large quantum simulations (>20 qubits):

- Use the sparse tensor representation: `new QTensor(numQubits, { sparse: true })`
- Enable the WebGPU backend if your browser supports it:
  ```javascript
  import { config } from '../api/config.js';
  config.set({ defaultBackend: 'webgpu' });
  ```

## Creating Your Own Examples

To create your own quantum applications with QiPAI:

1. Import the required components:
   ```javascript
   import { createCircuit, createState } from '../index.js';
   import * as Gates from '../core/gates.js';
   ```

2. Create a quantum circuit:
   ```javascript
   const circuit = createCircuit(2);
   circuit.addGate(Gates.H, [0]);
   circuit.addGate(Gates.CNOT, [1], [0]);
   ```

3. Run the circuit:
   ```javascript
   const initialState = createState(2);
   const outputState = circuit.run(initialState);
   ```

4. Analyze or visualize the results:
   ```javascript
   console.log(outputState.getProbabilities());
   // or
   const visualization = visualizeState(outputState);
   ```

For more advanced examples, refer to the provided example files in the framework.

## Next Steps

After getting familiar with the basic examples, explore:

- Creating your own quantum algorithms
- Building quantum neural networks for machine learning tasks
- Experimenting with the autonomous agent in custom environments
- Developing new applications using the QiPAI quantum language

Happy quantum computing!
