import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from 'expo-secure-store';

const PERSISTENT_KEY_STORAGE_KEY = "my_app_secure_key";

// A global variable to hold the parsed key once it's loaded
let PERSISTENT_AES_KEY: CryptoJS.lib.WordArray | null = null;

/**
 * Generates a new cryptographically secure key and stores it securely.
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
 * Retrieves the stored key or generates a new one if it doesn't exist.
 */
export async function getEncryptionKey(): Promise<CryptoJS.lib.WordArray> {
  if (PERSISTENT_AES_KEY) {
    return PERSISTENT_AES_KEY;
  }
  
  try {
    const keyBase64 = await SecureStore.getItemAsync(PERSISTENT_KEY_STORAGE_KEY);
    if (keyBase64) {
      console.log("✅ Retrieved existing secure key.");
      const secureKey = CryptoJS.enc.Base64.parse(keyBase64);
      PERSISTENT_AES_KEY = secureKey;
      return secureKey;
    } else {
      // Key doesn't exist, generate a new one
      const newKey = await generateAndStoreKey();
      PERSISTENT_AES_KEY = newKey;
      return newKey;
    }
  } catch (error) {
    console.error("❌ Failed to retrieve or generate a key:", error);
    // As a fallback, generate a new key but don't store it
    const secureBytes = Crypto.getRandomBytes(32);
    const newKey = CryptoJS.lib.WordArray.create(secureBytes);
    PERSISTENT_AES_KEY = newKey;
    return newKey;
  }
}

/**
 * Encrypt a single chunk of text and prepend the IV to the ciphertext.
 */
function encryptChunk(plainText: string, key: CryptoJS.lib.WordArray): string {
  const newIv = CryptoJS.lib.WordArray.create(Crypto.getRandomBytes(16));
  const cipher = CryptoJS.AES.encrypt(plainText, key, {
    iv: newIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const ivBase64 = CryptoJS.enc.Base64.stringify(newIv);
  return `${ivBase64}:${cipher.toString()}`;
}

/**
 * Decrypt a single chunk back into text by splitting the IV from the ciphertext.
 */
function decryptChunk(encryptedText: string, key: CryptoJS.lib.WordArray): string | null {
  try {
    if (!encryptedText || encryptedText.length === 0 || encryptedText.indexOf(':') === -1) {
      console.warn("Skipping a corrupted or invalid chunk.");
      return null;
    }
    const [ivBase64, cipherText] = encryptedText.split(':');
    const receivedIv = CryptoJS.enc.Base64.parse(ivBase64);
    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
      iv: receivedIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      console.warn("Decryption failed for a chunk, returning null.");
      return null;
    }
    return decryptedText;
  } catch (err) {
    console.error("❌ Error during decryption of a chunk:", err);
    return null;
  }
}

/**
 * Compresses an image to a target file size in bytes.
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
        const sizeInBytes = (manipResult.base64.length * 3) / 4;
        console.log(`🔍 Trying width=${width}, quality=${quality}, size=${sizeInBytes} bytes`);
        if (sizeInBytes <= targetBytes) {
          console.log(`✅ Compression success: ${sizeInBytes} bytes`);
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
 * Split Base64 string into encrypted chunks for SMS.
 */
export async function createSmsChunks(base64: string, chunkSize: number): Promise<{ chunks: string[] }> {
  const key = await getEncryptionKey();
  const chunks: string[] = [];
  const totalLength = base64.length;
  console.log(`\nOriginal Base64 size: ${totalLength} characters`);
  for (let i = 0; i < totalLength; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const encryptedChunk = encryptChunk(chunk, key);
    chunks.push(encryptedChunk);
    console.log(`--- Chunk ${chunks.length} ---`);
    console.log(`Original Chunk Size: ${chunk.length} chars`);
    console.log(`Encrypted Chunk Size: ${encryptedChunk.length} chars`);
  }
  return { chunks };
}

/**
 * Reconstruct image from encrypted SMS chunks.
 */
export async function reconstructFromSmsMessages(chunks: string[]): Promise<string | null> {
  try {
    const key = await getEncryptionKey();
    if (!chunks || chunks.length === 0) {
      return null;
    }
    let allDecryptedStrings: string[] = [];
    let hasValidData = false;
    for (const encryptedChunk of chunks) {
      const decryptedString = decryptChunk(encryptedChunk, key);
      if (decryptedString) {
        allDecryptedStrings.push(decryptedString);
        hasValidData = true;
      } else {
        console.warn("Skipping a corrupted or invalid chunk.");
      }
    }
    if (!hasValidData) {
      console.error("❌ No valid data could be decrypted. Reconstruction aborted.");
      return null;
    }
    const finalBase64String = allDecryptedStrings.join("");
    const filePath = FileSystem.documentDirectory + `reconstructed_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(filePath, finalBase64String, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log(`✅ Reconstruction success. File saved at: ${filePath}`);
    return filePath;
  } catch (err) {
    console.error("❌ Reconstruction failed:", err);
    return null;
  }
}

// ✅ Dummy default export so TSX module is valid
export default {};
