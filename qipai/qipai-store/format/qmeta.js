/**
 * qmeta.js
 * Handles encoding and decoding of metadata associated with quantum states.
 * Could use JSON, MsgPack, or a custom format.
 */

// Using JSON for simplicity initially. Consider MsgPack for more efficiency.
// import msgpack from '@msgpack/msgpack'; // Example if using MsgPack

export function encodeMetadata(metadataObject) {
    try {
        // TODO: Add validation for metadata structure?
        const jsonString = JSON.stringify(metadataObject);
        // Convert string to ArrayBuffer (UTF-8 encoding)
        const buffer = new TextEncoder().encode(jsonString).buffer;
        return buffer;
    } catch (error) {
        console.error("Error encoding metadata:", error);
        return new ArrayBuffer(0); // Return empty buffer on error
    }
}

export function decodeMetadata(buffer) {
    try {
        if (!buffer || buffer.byteLength === 0) {
            return {}; // Return empty object if no metadata
        }
        // Convert ArrayBuffer to string (UTF-8 encoding)
        const jsonString = new TextDecoder().decode(buffer);
        const metadataObject = JSON.parse(jsonString);
        return metadataObject;
    } catch (error) {
        console.error("Error decoding metadata:", error);
        return {}; // Return empty object on error
    }
}
