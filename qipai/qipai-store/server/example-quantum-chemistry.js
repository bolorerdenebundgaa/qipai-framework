/**
 * example-quantum-chemistry.js
 * Demonstrates using QiPAI-Store database for a quantum chemistry application.
 * 
 * This example simulates storing and analyzing quantum states representing different
 * molecular configurations, demonstrating how QiPAI-Store could be used as a
 * specialized database for quantum chemistry applications.
 */

import { QStoreClient } from './client.js';

/**
 * Runs a quantum chemistry example using QiPAI-Store DB
 */
async function quantumChemistryExample() {
    const client = new QStoreClient();
    console.log('Connected to QiPAI-Store Database');
    
    // Step 1: Store quantum states representing different molecular configurations
    console.log('\n--- Step 1: Storing molecular quantum states ---');
    
    // H2 molecule ground state (simplified representation)
    const h2GroundState = await client.createState({
        id: 'H2_ground_state',
        numQubits: 8, // 8 qubits encoding molecular orbitals
        metadata: {
            molecule: 'H2',
            configuration: 'ground_state',
            bond_length: 0.74, // Angstroms
            energy: -1.137, // Hartree
            method: 'VQE',
            description: 'Hydrogen molecule ground state'
        },
        // Simplified quantum state representation (in reality would have many more amplitudes)
        amplitudes: {
            0: { re: 0.97, im: 0 },   // |00000000⟩ - Dominant configuration
            17: { re: 0.12, im: 0 },  // |00010001⟩ - Small contribution from excited state
            68: { re: 0.15, im: 0 }   // |01000100⟩ - Another small contribution
        },
        sparse: true
    });
    console.log('Stored H2 ground state:', h2GroundState);
    
    // H2 excited state
    const h2ExcitedState = await client.createState({
        id: 'H2_excited_state',
        numQubits: 8,
        metadata: {
            molecule: 'H2',
            configuration: 'excited_state',
            bond_length: 0.74, // Angstroms
            energy: -0.697, // Hartree
            method: 'VQE',
            description: 'Hydrogen molecule first excited state'
        },
        amplitudes: {
            17: { re: 0.94, im: 0 },  // |00010001⟩ - Dominant configuration in excited state
            0: { re: 0.12, im: 0 },   // |00000000⟩ - Small contribution from ground state
            68: { re: 0.22, im: 0 }   // |01000100⟩ - Another contribution
        },
        sparse: true
    });
    console.log('Stored H2 excited state:', h2ExcitedState);
    
    // Water molecule ground state
    const h2oGroundState = await client.createState({
        id: 'H2O_ground_state',
        numQubits: 12, // 12 qubits for more complex molecule
        metadata: {
            molecule: 'H2O',
            configuration: 'ground_state',
            bond_length_OH: 0.96, // Angstroms
            bond_angle_HOH: 104.5, // Degrees
            energy: -76.26, // Hartree
            method: 'UCCSD',
            description: 'Water molecule ground state'
        },
        // In reality, would have many more amplitudes
        amplitudes: {
            0: { re: 0.92, im: 0 },       // Dominant configuration
            128: { re: 0.15, im: 0 },     // Minor contribution
            1095: { re: 0.08, im: 0.12 }  // Complex amplitude contribution
        },
        sparse: true
    });
    console.log('Stored H2O ground state:', h2oGroundState);
    
    // Step 2: Query states by molecule type
    console.log('\n--- Step 2: Querying states by molecule type ---');
    const states = await client.listStates();
    
    // Filter states by molecule (normally this would be handled by the server)
    const h2States = states.filter(state => state.metadata.molecule === 'H2');
    console.log(`Found ${h2States.length} H2 molecular states:`);
    h2States.forEach(state => {
        console.log(`- ${state.id}: ${state.metadata.configuration}, Energy: ${state.metadata.energy} Hartree`);
    });
    
    // Step 3: Perform quantum operations using QQL
    console.log('\n--- Step 3: Performing quantum operations with QQL ---');
    
    // Calculate energy difference between ground and excited states
    console.log('Calculating energy difference between H2 states...');
    const energyDiff = Math.abs(h2States[0].metadata.energy - h2States[1].metadata.energy);
    console.log(`Energy difference: ${energyDiff.toFixed(3)} Hartree (${(energyDiff * 27.211).toFixed(3)} eV)`);
    
    // Simulate measurement of orbital occupation
    console.log('\nSimulating measurement of orbital occupation...');
    const measurementResult = await client.executeQQL({
        qql: `
            LOAD STATE s
            WHERE s.metadata.molecule = "H2" AND s.metadata.configuration = "ground_state"
            USING STORE { strategy: 'flatfile', path: '' }
            
            -- Measure multiple qubits representing orbital occupation
            MEASURE s ON QUBITS [0, 1, 2, 3]
            
            -- Return measurement results
            RETURN LAST_RESULT
        `,
        contextStates: []
    });
    
    console.log('Measurement outcomes:', measurementResult.result.outcomes);
    console.log('Updated state ID:', measurementResult.updatedStates.s.id);
    
    // Step 4: Simulate entanglement between states for bond analysis
    console.log('\n--- Step 4: Bond analysis via state entanglement ---');
    
    // Create a superposition of ground and excited states to analyze bond dynamics
    const bondAnalysisResult = await client.executeQQL({
        qql: `
            -- Load both states
            LOAD STATE ground
            WHERE ground.metadata.molecule = "H2" AND ground.metadata.configuration = "ground_state"
            USING STORE { strategy: 'flatfile', path: '' }
            
            LOAD STATE excited
            WHERE excited.metadata.molecule = "H2" AND excited.metadata.configuration = "excited_state"
            USING STORE { strategy: 'flatfile', path: '' }
            
            -- Create interference between states (superposition)
            INTERFERE ground WITH excited
            
            -- Mark this superposition as conceptually entangled with a "bond_vibration" symbol
            -- This represents that this state models the H-H bond vibration
            ENTANGLE ground WITH "bond_vibration"
            
            -- Measure the superposition in X-basis for phase information
            MEASURE ground IN BASIS_X ON QUBITS [0, 1]
            
            -- Return the collapsed state representing one possible bond configuration
            RETURN COLLAPSE ground
        `,
        contextStates: []
    });
    
    console.log('Bond analysis result:', bondAnalysisResult.result.type);
    console.log('Updated state ID:', bondAnalysisResult.updatedStates.ground.id);
    
    // Step 5: Retrieve the final superposition state and display info
    console.log('\n--- Step 5: Retrieving final superposition state ---');
    
    if (bondAnalysisResult.updatedStates && bondAnalysisResult.updatedStates.ground) {
        const superpositionState = await client.getState(bondAnalysisResult.updatedStates.ground.id);
        
        console.log('Superposition state details:');
        console.log(`- ID: ${superpositionState.id}`);
        console.log(`- Qubits: ${superpositionState.numQubits}`);
        console.log(`- Sparsity: ${superpositionState.sparsity.toFixed(2)}%`);
        console.log(`- Non-zero amplitudes: ${Object.keys(superpositionState.nonzeroAmplitudes).length}`);
        
        // In a real application, this would be analyzed for bond properties
        console.log('\nThis state represents a superposition of molecular configurations');
        console.log('that could be used to study bond vibration dynamics and potential energy surfaces.');
    }
    
    console.log('\nQuantum chemistry database example completed.');
}

// Run the example if this module is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    quantumChemistryExample().catch(console.error);
}

export { quantumChemistryExample };
