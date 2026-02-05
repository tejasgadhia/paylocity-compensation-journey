// ========================================
// CRYPTO MODULE
// AES-256-GCM encryption for file downloads
// ========================================

import { CONSTANTS } from './constants.js';

// ========================================
// CUSTOM ERROR CLASS
// ========================================

/**
 * Custom error for crypto operations.
 * Helps distinguish between wrong password vs corrupted data.
 */
export class CryptoError extends Error {
    constructor(message, type = 'generic') {
        super(message);
        this.name = 'CryptoError';
        this.type = type; // 'wrong_password', 'corrupted', 'unsupported', 'generic'
    }
}

// ========================================
// BROWSER SUPPORT CHECK
// ========================================

/**
 * Checks if the browser supports Web Crypto API.
 * @returns {boolean} True if crypto is available
 */
export function isCryptoSupported() {
    return !!(
        window.crypto &&
        window.crypto.subtle &&
        typeof window.crypto.subtle.deriveKey === 'function' &&
        typeof window.crypto.subtle.encrypt === 'function' &&
        typeof window.crypto.subtle.decrypt === 'function'
    );
}

// ========================================
// FORMAT DETECTION
// ========================================

/**
 * Checks if data is in encrypted v2 format.
 * @param {Object} data - Parsed JSON data
 * @returns {boolean} True if data is encrypted
 */
export function isEncrypted(data) {
    return (
        data &&
        typeof data === 'object' &&
        data.encrypted === true &&
        data.version === CONSTANTS.CRYPTO_VERSION &&
        data.algorithm === 'AES-256-GCM' &&
        data.payload &&
        typeof data.payload.salt === 'string' &&
        typeof data.payload.iv === 'string' &&
        typeof data.payload.ciphertext === 'string'
    );
}

// ========================================
// KEY DERIVATION
// ========================================

/**
 * Derives an AES-256 key from password using PBKDF2.
 * @param {string} password - User password
 * @param {Uint8Array} salt - Random salt
 * @returns {Promise<CryptoKey>} Derived key for AES-GCM
 */
export async function deriveKey(password, salt) {
    // Import password as raw key material
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive AES-256 key using PBKDF2
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: CONSTANTS.CRYPTO_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ========================================
// ENCRYPTION
// ========================================

/**
 * Encrypts plaintext data with password using AES-256-GCM.
 * @param {string} plaintext - Data to encrypt (JSON string)
 * @param {string} password - User password
 * @returns {Promise<Object>} Encrypted data in v2 format
 */
export async function encryptData(plaintext, password) {
    if (!isCryptoSupported()) {
        throw new CryptoError('Encryption not supported in this browser', 'unsupported');
    }

    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(CONSTANTS.CRYPTO_SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(CONSTANTS.CRYPTO_IV_LENGTH));

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Encrypt the plaintext
    const encodedData = new TextEncoder().encode(plaintext);
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedData
    );

    // Return v2 encrypted format
    return {
        encrypted: true,
        version: CONSTANTS.CRYPTO_VERSION,
        algorithm: 'AES-256-GCM',
        kdf: 'PBKDF2',
        kdfIterations: CONSTANTS.CRYPTO_ITERATIONS,
        exportDate: new Date().toISOString(),
        payload: {
            salt: arrayBufferToBase64(salt),
            iv: arrayBufferToBase64(iv),
            ciphertext: arrayBufferToBase64(ciphertext)
        }
    };
}

// ========================================
// DECRYPTION
// ========================================

/**
 * Decrypts data encrypted with encryptData().
 * @param {Object} encryptedData - Data in v2 encrypted format
 * @param {string} password - User password
 * @returns {Promise<string>} Decrypted plaintext
 * @throws {CryptoError} If password is wrong or data is corrupted
 */
export async function decryptData(encryptedData, password) {
    if (!isCryptoSupported()) {
        throw new CryptoError('Encryption not supported in this browser', 'unsupported');
    }

    if (!isEncrypted(encryptedData)) {
        throw new CryptoError('File appears corrupted. Cannot decrypt.', 'corrupted');
    }

    try {
        // Decode base64 values
        const salt = base64ToArrayBuffer(encryptedData.payload.salt);
        const iv = base64ToArrayBuffer(encryptedData.payload.iv);
        const ciphertext = base64ToArrayBuffer(encryptedData.payload.ciphertext);

        // Derive key from password
        const key = await deriveKey(password, new Uint8Array(salt));

        // Decrypt the ciphertext
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            ciphertext
        );

        // Decode and return plaintext
        return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
        // AES-GCM throws on wrong password (authentication tag mismatch)
        if (error.name === 'OperationError') {
            throw new CryptoError('Wrong password or corrupted file', 'wrong_password');
        }
        throw new CryptoError('File appears corrupted. Cannot decrypt.', 'corrupted');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Converts ArrayBuffer to base64 string.
 * @param {ArrayBuffer|Uint8Array} buffer - Buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converts base64 string to ArrayBuffer.
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} Decoded buffer
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
