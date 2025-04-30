/**
 * qstate.bin.js
 * Handles encoding and decoding the binary format for a single quantum state.
 * Format includes sparse complex vector, entanglement map, and metadata.
 */

import { QTensor } from '../../core/qTensor.js'; // Needed for return type eventually
import * as qmeta from './qmeta.js';

// Define header structure offsets and types (example)
const HEADER_LAYOUT = {
    magic: { offset: 0, size: 4, type: 'Uint32' }, // Example magic number
    version: { offset: 4, size: 1, type: 'Uint8' },
    numQubits: { offset: 5, size: 2, type: 'Uint16' },
    sparseCount: { offset: 7, size: 4, type: 'Uint32' },
    entanglementCount: { offset: 11, size: 2, type: 'Uint16' },
    metadataLength: { offset: 13, size: 2, type: 'Uint16' }
};
const HEADER_SIZE = 15; // Total size based on above layout

// Example Magic Number (replace with something meaningful)
const MAGIC_NUMBER = 0x51495041; // "QIPA" in ASCII hex

/**
 * Encodes a QTensor and metadata into the binary format.
 * @param {QTensor} qTensor - The quantum state to encode.
 * @param {object} metadata - Metadata to include.
 * @returns {ArrayBuffer} The encoded binary data.
 */
export function encodeState(qTensor, metadata = {}) {
    if (!(qTensor instanceof QTensor)) {
        throw new Error("encodeState requires a valid QTensor object.");
    }

    // 1. Encode Metadata first to know its length
    const metadataBuffer = qmeta.encodeMetadata(metadata);
    const metadataLength = metadataBuffer.byteLength;

    // 2. Prepare Sparse Amplitude Data
    const sparseAmplitudes = [];
    const fullAmplitudes = qTensor.amplitudes;
    for (let i = 0; i < fullAmplitudes.length; i++) {
        const amp = fullAmplitudes[i];
        // Define a threshold for sparsity (ignore very small amplitudes)
        const threshold = 1e-9;
        if (qMath.magnitude(amp) > threshold) {
            sparseAmplitudes.push({ index: i, re: amp.re, im: amp.im });
        }
    }
    const sparseCount = sparseAmplitudes.length;
    const amplitudeDataSize = sparseCount * (2 + 4 + 4); // uint16 index, float32 real, float32 imag

    // 3. Prepare Entanglement Data (Simple Placeholder Format)
    // Store unique groups. Assumes group format: [count(uint16), idx1(uint16), idx2(uint16), ...]
    // TODO: Implement a more robust entanglement encoding.
    const uniqueGroups = new Set();
    if (qTensor.entanglement) {
         qTensor.entanglement.forEach(group => uniqueGroups.add(group));
    }
    const entanglementCount = uniqueGroups.size;
    let entanglementDataSize = 0;
    const entanglementBuffers = [];
    for (const group of uniqueGroups) {
        const groupSize = group.size;
        const groupBufferSize = 2 + groupSize * 2; // count + indices
        const groupBuffer = new ArrayBuffer(groupBufferSize);
        const groupView = new DataView(groupBuffer);
        groupView.setUint16(0, groupSize, true); // littleEndian = true
        let offset = 2;
        for (const qubitIndex of group) {
            groupView.setUint16(offset, qubitIndex, true);
            offset += 2;
        }
        entanglementBuffers.push(groupBuffer);
        entanglementDataSize += groupBufferSize;
    }


    // 4. Calculate Total Size and Allocate Buffer
    const totalSize = HEADER_SIZE + amplitudeDataSize + entanglementDataSize + metadataLength;
    const buffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(buffer);
    let currentOffset = 0;
    const littleEndian = true;

    // 5. Write Header
    try {
        dataView.setUint32(HEADER_LAYOUT.magic.offset, MAGIC_NUMBER, littleEndian);
        dataView.setUint8(HEADER_LAYOUT.version.offset, 1); // Version 1
        dataView.setUint16(HEADER_LAYOUT.numQubits.offset, qTensor.qubitCount, littleEndian);
        dataView.setUint32(HEADER_LAYOUT.sparseCount.offset, sparseCount, littleEndian);
        dataView.setUint16(HEADER_LAYOUT.entanglementCount.offset, entanglementCount, littleEndian);
        dataView.setUint16(HEADER_LAYOUT.metadataLength.offset, metadataLength, littleEndian);
        currentOffset = HEADER_SIZE;
    } catch (e) {
        console.error("encodeState: Error writing header.", e);
        return new ArrayBuffer(0); // Return empty on error
    }


    // 6. Write Sparse Amplitudes
    try {
        for (const { index, re, im } of sparseAmplitudes) {
            dataView.setUint16(currentOffset, index, littleEndian);
            currentOffset += 2;
            dataView.setFloat32(currentOffset, re, littleEndian);
            currentOffset += 4;
            dataView.setFloat32(currentOffset, im, littleEndian);
            currentOffset += 4;
        }
    } catch (e) {
         console.error("encodeState: Error writing amplitude data.", e);
         return new ArrayBuffer(0);
    }

    // 7. Write Entanglement Data
     try {
        for (const groupBuffer of entanglementBuffers) {
            new Uint8Array(buffer, currentOffset, groupBuffer.byteLength).set(new Uint8Array(groupBuffer));
            currentOffset += groupBuffer.byteLength;
        }
    } catch (e) {
         console.error("encodeState: Error writing entanglement data.", e);
         return new ArrayBuffer(0);
    }


    // 8. Write Metadata
    try {
        if (metadataLength > 0) {
            new Uint8Array(buffer, currentOffset, metadataLength).set(new Uint8Array(metadataBuffer));
            currentOffset += metadataLength;
        }
    } catch (e) {
         console.error("encodeState: Error writing metadata.", e);
         return new ArrayBuffer(0);
    }

    // Final check
    if (currentOffset !== totalSize) {
         console.error(`encodeState: Size mismatch! Calculated ${totalSize}, wrote ${currentOffset}`);
         return new ArrayBuffer(0);
    }

    console.log(`Encoded state (${qTensor.qubitCount} qubits, ${sparseCount} sparse) into ${totalSize} bytes.`);
    return buffer;
}

/**
 * Decodes a buffer into state data (partially implemented: header and metadata only).
 * @param {ArrayBuffer} buffer - The buffer containing the binary state data.
 * @returns {{qTensor: QTensor | null, metadata: object}}
 */
export function decodeState(buffer) {
    if (!buffer || buffer.byteLength < HEADER_SIZE) {
        console.error("decodeState: Buffer is too small or invalid.");
        return { qTensor: null, metadata: {} };
    }

    const dataView = new DataView(buffer);
    let littleEndian = true; // Assume little endian for now, could check magic number

    // --- Read Header ---
    const header = {};
    try {
        for (const [key, layout] of Object.entries(HEADER_LAYOUT)) {
            const getter = `get${layout.type}`;
            header[key] = dataView[getter](layout.offset, littleEndian);
        }
    } catch (e) {
         console.error("decodeState: Error reading header.", e);
         return { qTensor: null, metadata: {} };
    }


    // --- Validate Magic Number ---
    if (header.magic !== MAGIC_NUMBER) {
         console.error(`decodeState: Invalid magic number. Expected ${MAGIC_NUMBER}, got ${header.magic}`);
         // Optionally check for reversed endianness here
         return { qTensor: null, metadata: {} };
    }

    // --- Decode Metadata ---
    let metadata = {};
    if (header.metadataLength > 0) {
        // Calculate metadata offset (after header and body data)
        // Body size = sparseCount * (index_size + real_size + imag_size) + entanglement_data_size
        // For now, we only need metadata, so calculate its start position directly
        // Assuming entanglement data comes after amplitudes
        const amplitudeDataSize = header.sparseCount * (2 + 4 + 4); // uint16 index, float32 real, float32 imag
        // TODO: Calculate entanglementDataSize accurately based on its format
        const entanglementDataSize = 0; // Placeholder!
        const metadataOffset = HEADER_SIZE + amplitudeDataSize + entanglementDataSize;

        if (metadataOffset + header.metadataLength > buffer.byteLength) {
             console.error("decodeState: Metadata length exceeds buffer size based on calculated offset.");
             return { qTensor: null, metadata: {} };
        }

        const metadataBuffer = buffer.slice(metadataOffset, metadataOffset + header.metadataLength);
        metadata = qmeta.decodeMetadata(metadataBuffer);
    }

    // --- Decode State Vector & Entanglement (Placeholder) ---
    // --- Decode State Vector (Sparse Amplitudes) ---
    const amplitudes = new Array(2 ** header.numQubits).fill({ re: 0, im: 0 }); // Initialize dense vector with zeros
    let currentOffset = HEADER_SIZE;
    const amplitudeEntrySize = 2 + 4 + 4; // index (uint16), real (float32), imag (float32)

    if (currentOffset + header.sparseCount * amplitudeEntrySize > buffer.byteLength) {
        console.error("decodeState: Buffer too small for sparse amplitude data.");
        return { qTensor: null, metadata: {} };
    }

    try {
        for (let i = 0; i < header.sparseCount; i++) {
            const index = dataView.getUint16(currentOffset, littleEndian);
            currentOffset += 2;
            const real = dataView.getFloat32(currentOffset, littleEndian);
            currentOffset += 4;
            const imag = dataView.getFloat32(currentOffset, littleEndian);
            currentOffset += 4;

            if (index < amplitudes.length) {
                amplitudes[index] = { re: real, im: imag };
            } else {
                console.warn(`decodeState: Sparse index ${index} out of bounds for dimension ${amplitudes.length}.`);
            }
        }
    } catch (e) {
        console.error("decodeState: Error reading amplitude data.", e);
        return { qTensor: null, metadata: {} };
    }


    // --- Decode Entanglement Map (Simple Placeholder Format) ---
    // Assumes entanglementCount is the number of groups, and each group starts
    // with a uint16 count of qubits in the group, followed by uint16 indices.
    // TODO: Define and implement a more robust entanglement encoding.
    const entanglementMap = new Map();
    let entanglementDataSize = 0; // Calculate actual size while reading

    try {
        let tempOffset = currentOffset; // Use temp offset to calculate size
        for (let i = 0; i < header.entanglementCount; i++) {
             if (tempOffset + 2 > buffer.byteLength) throw new Error("Buffer too small for entanglement group size.");
             const groupSize = dataView.getUint16(tempOffset, littleEndian);
             tempOffset += 2;
             entanglementDataSize += 2;

             if (tempOffset + groupSize * 2 > buffer.byteLength) throw new Error("Buffer too small for entanglement group indices.");

             const group = new Set();
             const groupIndices = [];
             for (let j = 0; j < groupSize; j++) {
                 const qubitIndex = dataView.getUint16(tempOffset, littleEndian);
                 tempOffset += 2;
                 entanglementDataSize += 2;
                 group.add(qubitIndex);
                 groupIndices.push(qubitIndex);
             }
             // Map each qubit in the group to the same Set object
             for(const index of groupIndices) {
                 entanglementMap.set(index, group);
             }
        }
        currentOffset = tempOffset; // Update main offset after successful read
    } catch (e) {
         console.error("decodeState: Error reading entanglement data.", e);
         // Continue without entanglement map? Or return error? For now, continue.
         entanglementMap.clear();
         // We might need to recalculate metadata offset if entanglement read failed partially
         // For simplicity now, assume it either fully succeeds or fully fails before metadata read.
    }


    // --- Re-check Metadata Offset & Decode ---
    // Metadata should start right after entanglement data
    const calculatedMetadataOffset = HEADER_SIZE + header.sparseCount * amplitudeEntrySize + entanglementDataSize;
     if (calculatedMetadataOffset + header.metadataLength > buffer.byteLength) {
         console.error(`decodeState: Metadata offset mismatch or buffer too small. Expected offset ${calculatedMetadataOffset}, Metadata length ${header.metadataLength}, Buffer size ${buffer.byteLength}`);
         // Clear potentially wrong metadata read earlier if offsets were wrong
         metadata = {};
         // return { qTensor: null, metadata: {} }; // Stricter: fail if offset is wrong
     } else {
         const metadataBuffer = buffer.slice(calculatedMetadataOffset, calculatedMetadataOffset + header.metadataLength);
         metadata = qmeta.decodeMetadata(metadataBuffer);
     }


    // --- Construct QTensor ---
    // Use the decoded amplitudes and entanglement map
    // We assume the state read from the file *should* be normalized, so set isNormalized: true
    const qTensorOptions = {
        isNormalized: true, // Assume stored state is normalized
        entanglementMap: entanglementMap
    };
    const qTensor = new QTensor(amplitudes, qTensorOptions);

    // Validate qubit count if possible
    if (qTensor.qubitCount !== header.numQubits) {
         console.warn(`decodeState: Reconstructed qubit count (${qTensor.qubitCount}) does not match header (${header.numQubits}).`);
    }

    console.log(`Decoded state with ${header.numQubits} qubits, ${header.sparseCount} sparse entries.`);
    return { qTensor, metadata };
}
