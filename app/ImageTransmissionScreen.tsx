import React, { useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { compressToTargetSize, createSmsChunks, reconstructFromSmsMessages } from "./ImageHandler";

interface ChatMessage {
  id: string;
  type: "sent" | "received";
  text?: string;
  image?: string;
}

const TARGET_BYTES = 5500; // ~5.5KB per compressed image target

export default function ImageChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: false, quality: 1 });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      await processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    const compressed = await compressToTargetSize(uri, TARGET_BYTES, 128, 32, 0.7, 0.2);
    if (!compressed) return;

    const { chunks } = createSmsChunks(compressed.base64, 50, 153);

    let tempChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = `Chunk ${i + 1}/${chunks.length}`;
      addMessage({ type: "sent", text: chunkText });
      addMessage({ type: "received", text: chunkText });

      tempChunks.push(chunks[i]);

      // Only reconstruct after last chunk
      if (i === chunks.length - 1) {
        setTimeout(() => reconstruct(tempChunks), 500);
      }
    }
  };

  const reconstruct = async (chunks: string[]) => {
    const path = await reconstructFromSmsMessages(chunks);
    if (path) {
      addMessage({ type: "received", image: path });
    }
  };

  const addMessage = (msg: Partial<ChatMessage>) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), type: msg.type!, text: msg.text, image: msg.image },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.type === "sent" ? styles.sent : styles.received,
            ]}
          >
            {item.text && <Text style={styles.text}>{item.text}</Text>}
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.image} />
            )}
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>📷 Send Image</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  message: {
    margin: 8,
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
  },
  sent: { backgroundColor: "#dcf8c6", alignSelf: "flex-end" },
  received: { backgroundColor: "#fff", alignSelf: "flex-start" },
  text: { fontSize: 14 },
  image: { width: 150, height: 150, borderRadius: 10, marginTop: 5 },
  button: {
    backgroundColor: "#25D366",
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
git checkout main
