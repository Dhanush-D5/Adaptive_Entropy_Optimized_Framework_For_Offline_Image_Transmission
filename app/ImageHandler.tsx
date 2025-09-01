import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

export async function compressToTargetSize(
  uri: string,
  targetBytes = 5500, // max clarity within ~50 SMS
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
        console.log(`🔍 Trying width=${width}, quality=${quality}, size=${sizeInBytes}`);

        if (sizeInBytes <= targetBytes) {
          console.log(`✅ Compression success: ${sizeInBytes} bytes`);
          return { base64: manipResult.base64 };
        }
      }

      // Adjust gradually
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

export function createSmsChunks(
  base64: string,
  maxSms = 50,
  chunkSize = 110 // tuned for 50 SMS max
): { chunks: string[] } {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += chunkSize) {
    chunks.push(base64.substring(i, i + chunkSize));
  }

  if (chunks.length > maxSms) {
    console.warn(`⚠️ Too many chunks: ${chunks.length}, exceeds SMS limit (${maxSms})`);
  }

  return { chunks };
}

export async function reconstructFromSmsMessages(chunks: string[]): Promise<string | null> {
  try {
    if (!chunks || chunks.length === 0) return null;

    const allData = chunks.join("");
    const filePath = FileSystem.documentDirectory + `reconstructed_${Date.now()}.jpg`;

    await FileSystem.writeAsStringAsync(filePath, allData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (err) {
    console.error("❌ Reconstruction failed:", err);
    return null;
  }
}