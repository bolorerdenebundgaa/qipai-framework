# QiPAI: Quantum-inspired AI Framework

QiPAI is a comprehensive JavaScript framework that combines quantum computing principles with modern AI techniques, designed to bridge the gap between classical computation and quantum algorithms.

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=QiPAI+Framework" alt="QiPAI Framework" width="800" />
</p>

## 🌟 Core Features

- **Quantum Circuit Simulation**: Full simulation of quantum circuits with support for all standard gates
- **Quantum Neural Networks**: Integration of quantum computing with neural network architectures
- **Autonomous Agents**: Quantum-inspired reasoning agents with planning capabilities
- **Quantum Language (QL)**: Domain-specific language for quantum programming
- **3D Visualization**: Advanced visualization of quantum states, evolution, and interference
- **Hardware Integration**: Connect to real quantum computers through IBM Quantum Experience

## 🚀 Getting Started

### Setup

```bash
# Clone the repository
git clone https://github.com/qipai/qipai.git
cd qipai

# Install dependencies
npm install
```

### Running Examples

```bash
# Run the getting started example (Bell state)
npm start

# Start the browser demo server
npm run demo
# Then visit http://localhost:8000/examples/browser-demo.html in your browser

# Run specific examples
npm run qft-demo      # Quantum Fourier Transform
npm run agent-demo    # Autonomous Agent
npm run qnn-demo      # Quantum Neural Network
npm run lang-demo     # Quantum Language
npm run viz-demo      # 3D Visualization
```

### Basic Usage

```javascript
import { createCircuit, createState, visualizeCircuit } from './index.js';
import * as Gates from './core/gates.js';

// Create a Bell state circuit
const circuit = createCircuit(2);
circuit.addGate(Gates.H, [0]);       // Hadamard on qubit 0
circuit.addGate(Gates.CNOT, [1], [0]); // CNOT: qubit 0 controls qubit 1

// Execute circuit
const initialState = createState(2);   // |00⟩ state
const bellState = circuit.run(initialState);

// Visualize results (in browser environment)
const circuitVisual = visualizeCircuit(circuit);
const stateVisual = visualizeState(bellState);
```

### Running in Browser

For visualization features, run the browser demo:

```bash
npm run demo
```

Then open `http://localhost:8000/examples/browser-demo.html` in your browser to see the interactive demos.

## 🧩 Architecture

QiPAI follows a modular architecture organized into logical components:

```
qipai/
├── qipai-agent/      # Autonomous reasoning with quantum-inspired planning
├── qipai-neuro/      # Neural network integration for hybrid models
├── qipai-hardware/   # Real quantum hardware adapters
├── qipai-lang/       # Quantum programming language (QL)
├── qipai-rl/         # Quantum reinforcement learning
├── qipai-viz/        # Visualization tools
├── qipai-store/      # State and model storage
├── core/             # Core quantum components
├── math/             # Quantum mathematics layer
├── layers/           # High-level quantum modeling components
├── models/           # Pre-built quantum models
├── memory/           # Quantum-inspired memory systems
├── reasoning/        # Symbolic inference and phase logic
├── training/         # Quantum-aware learning algorithms
├── runtime/          # Execution backends
├── io/               # I/O and external interfaces
├── api/              # Developer-facing API
└── examples/         # Example applications
```

## 🔬 Quantum Computing Concepts

QiPAI implements core quantum computing concepts:

- **Superposition**: Quantum states existing in multiple states simultaneously
- **Entanglement**: Quantum correlation between particles
- **Interference**: Wave-like behavior of quantum amplitudes
- **Measurement**: Probabilistic observation of quantum states

These concepts are available both through direct simulation and quantum-inspired classical approximations.

## 💡 Usage Examples

### Quantum Neural Networks

```javascript
import { createQuantumNeuralNetwork } from 'qipai';

// Create a quantum neural network
const qnn = createQuantumNeuralNetwork({
  inputQubits: 2,
  hiddenLayers: 1,
  outputQubits: 2,
  depth: 3
});

// Train network
await qnn.train({ x: trainingData, y: trainingLabels });

// Make predictions
const predictions = qnn.predict(testData);
```

### Quantum Programming Language

```javascript
import { compileQiPAICode } from 'qipai';

// Define circuit in QiPAI language
const code = `
  circuit QFT {
    register q[3];
    
    // Apply QFT
    apply h to q[0];
    apply cphase(pi/2) to q[0] controlled by q[1];
    apply cphase(pi/4) to q[0] controlled by q[2];
    apply h to q[1];
    apply cphase(pi/2) to q[1] controlled by q[2];
    apply h to q[2];
  }
`;

// Compile to executable circuit
const circuits = compileQiPAICode(code);
const qftCircuit = circuits.QFT;
```

### Autonomous Agents

```javascript
import { createAgent } from 'qipai';

// Create quantum-inspired agent
const agent = createAgent({
  stateSize: 8,
  actionSize: 3
});

// Connect to environment and set goal
agent.connect(environment);
agent.setGoal(goalState);

// Plan and execute actions
const result = await agent.plan({ maxSteps: 20 });
```

### Hardware Integration

```javascript
import { connectToQuantumHardware } from 'qipai';

// Connect to IBM Quantum hardware
const hardware = await connectToQuantumHardware({
  token: 'YOUR_IBM_QUANTUM_TOKEN',
  backend: 'ibmq_qasm_simulator' // or real hardware like 'ibmq_manila'
});

// Execute circuit on quantum hardware
const result = await hardware.executeCircuit(circuit, {
  shots: 1024
});
```

## 🧪 Running Examples

Explore ready-made examples showcasing various capabilities:

```bash
# Run a quantum neural network example
node examples/qneuro-example.js

# Run an autonomous agent example
node examples/agent-example.js

# Run a 3D visualization example
node examples/visualization3d-example.js
```

## 📊 Performance Considerations

- **Simulation Limits**: Classical simulation is efficient for circuits up to ~20-25 qubits
- **GPU Acceleration**: WebGPU backend provides significant speedup for tensor operations
- **Hardware Integration**: Real quantum hardware has different constraints (coherence time, error rates)

## 🔧 Advanced Configuration

QiPAI can be customized for different performance and accuracy needs:

```javascript
import { config } from 'qipai';

// Configure framework behavior
config.set({
  precision: 'double',        // 'single' or 'double' floating point
  defaultBackend: 'webgpu',   // 'cpu', 'webgpu', or 'wasm'
  optimizationLevel: 2,       // 0-3, higher means more aggressive optimization
  debugMode: false,           // Enable debug logging
  hardwareSimulation: true    // Simulate noise and errors from real hardware
});
```

## 🛠️ Framework Extensibility

QiPAI is designed to be extendable:

- **Custom Gates**: Implement your own quantum gates
- **Custom Layers**: Create specialized quantum neural network layers
- **Backend Extensions**: Develop adapters for other quantum providers
- **Algorithm Plugins**: Contribute implementations of quantum algorithms

## 🚀 Future Roadmap

- **Enhanced Hardware Support**: Additional quantum hardware providers
- **Extended Algorithm Library**: More quantum algorithms and applications
- **Improved Optimizers**: Better classical optimizers for quantum-classical hybrid algorithms
- **Distributed Quantum Computing**: Support for distributed quantum operations
- **Quantum Internet Integration**: Tools for quantum network operations

## 📚 Additional Resources

- [QiPAI Architecture](docs/architecture.md)
- [QiPAI Philosophy](docs/philosophy.md)
- [Quantum Computing Basics](docs/quantum-basics.md)

## 📄 License

MIT

## 🙏 Acknowledgements

Built upon pioneering work in quantum computing, the QiPAI framework aims to bring quantum computing principles to a wider audience of developers and researchers.
