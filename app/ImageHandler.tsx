import * as FileSystem from "expo-file-system/legacy"; // legacy import for Expo 54
import * as ImageManipulator from "expo-image-manipulator";
import CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Buffer } from "buffer";

const PERSISTENT_KEY_STORAGE_KEY = "my_app_secure_key";

// Global variable to cache the key
let PERSISTENT_AES_KEY: CryptoJS.lib.WordArray | null = null;

/**
 * Generates a new cryptographically secure AES key and stores it in SecureStore
 */
async function generateAndStoreKey(): Promise<CryptoJS.lib.WordArray> {
  const secureBytes = Crypto.getRandomBytes(32);
  const secureKey = CryptoJS.lib.WordArray.create(secureBytes);
  const keyBase64 = CryptoJS.enc.Base64.stringify(secureKey);

  await SecureStore.setItemAsync(PERSISTENT_KEY_STORAGE_KEY, keyBase64);
  console.log("✅ New secure key generated and stored.");
  return secureKey;
}

/**
 * Retrieves the AES key from SecureStore, or generates one if not available
 */
export async function getEncryptionKey(): Promise<CryptoJS.lib.WordArray> {
  if (PERSISTENT_AES_KEY) return PERSISTENT_AES_KEY;

  try {
    const keyBase64 = await SecureStore.getItemAsync(PERSISTENT_KEY_STORAGE_KEY);
    if (keyBase64) {
      const secureKey = CryptoJS.enc.Base64.parse(keyBase64);
      PERSISTENT_AES_KEY = secureKey;
      console.log("✅ Retrieved existing secure key.");
      return secureKey;
    } else {
      const newKey = await generateAndStoreKey();
      PERSISTENT_AES_KEY = newKey;
      return newKey;
    }
  } catch (err) {
    console.error("❌ Failed to retrieve key:", err);
    const fallbackBytes = Crypto.getRandomBytes(32);
    const fallbackKey = CryptoJS.lib.WordArray.create(fallbackBytes);
    PERSISTENT_AES_KEY = fallbackKey;
    return fallbackKey;
  }
}

/**
 * Encrypt a chunk of text using AES-CBC with a random IV
 */
function encryptChunk(plainText: string, key: CryptoJS.lib.WordArray): string {
  const iv = CryptoJS.lib.WordArray.create(Crypto.getRandomBytes(16));
  const cipher = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
  return `${ivBase64}:${cipher.toString()}`;
}

/**
 * Decrypt a single chunk
 */
function decryptChunk(encryptedText: string, key: CryptoJS.lib.WordArray): string | null {
  try {
    if (!encryptedText || encryptedText.indexOf(":") === -1) return null;
    const [ivBase64, cipherText] = encryptedText.split(":");
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (err) {
    console.error("❌ Decryption error:", err);
    return null;
  }
}

/**
 * Compress an image to a target size (in bytes)
 */
export async function compressToTargetSize(
  uri: string,
  targetBytes = 5500,
  initialWidth = 128,
  minWidth = 64,
  initialQuality = 0.8,
  minQuality = 0.35
): Promise<{ base64: string } | null> {
  try {
    let quality = initialQuality;
    let width = initialWidth;

    while (width >= minWidth && quality >= minQuality) {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipResult.base64) {
        const size = Buffer.byteLength(manipResult.base64, "base64");
        console.log(`🔍 Trying width=${width}, quality=${quality}, size=${size} bytes`);
        if (size <= targetBytes) {
          console.log(`✅ Compression success: ${size} bytes`);
          return { base64: manipResult.base64 };
        }
      }
      quality -= 0.1;
      width = Math.floor(width * 0.85);
    }

    console.warn("⚠️ Could not reach target size, returning smallest version");
    const fallback = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: minWidth } }],
      { compress: minQuality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    return { base64: fallback.base64 || "" };
  } catch (err) {
    console.error("❌ Compression failed:", err);
    return null;
  }
}

/**
 * Split Base64 into encrypted SMS chunks
 */
export async function createSmsChunks(base64: string, chunkSize: number): Promise<{ chunks: string[] }> {
  const key = await getEncryptionKey();
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const encrypted = encryptChunk(chunk, key);
    chunks.push(encrypted);
    console.log(`--- Chunk ${chunks.length} ---`);
    console.log(`Original: ${chunk.length} chars, Encrypted: ${encrypted.length} chars`);
  }
  return { chunks };
}

/**
 * Reconstruct image from encrypted SMS chunks
 */
export async function reconstructFromSmsMessages(chunks: string[]): Promise<string | null> {
  try {
    const key = await getEncryptionKey();
    if (!chunks || chunks.length === 0) return null;

    const decryptedChunks: string[] = [];
    for (const encrypted of chunks) {
      const decrypted = decryptChunk(encrypted, key);
      if (decrypted) decryptedChunks.push(decrypted);
    }

    if (decryptedChunks.length === 0) {
      console.error("❌ No valid chunks decrypted");
      return null;
    }

    const finalBase64 = decryptedChunks.join("");
    const fileUri = FileSystem.documentDirectory + `reconstructed_${Date.now()}.png`;

    await FileSystem.writeAsStringAsync(fileUri, finalBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`✅ Reconstruction success: ${fileUri}`);
    return fileUri;
  } catch (err) {
    console.error("❌ Reconstruction failed:", err);
    return null;
  }
}

// Dummy default export so TSX module is valid
export default {};
