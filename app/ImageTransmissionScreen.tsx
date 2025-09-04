import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { compressToTargetSize, createSmsChunks, reconstructFromSmsMessages, getEncryptionKey } from "./ImageHandler";

interface ChatMessage {
  id: string;
  type: "sent" | "received";
  text?: string;
  image?: string;
}

const TARGET_BYTES = 5500;
const CHUNK_SIZE = 90; // The size of the unencrypted Base64 chunk to be sent in each "SMS"

export default function ImageChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);
  
  // Initialize the encryption key on app start
  React.useEffect(() => {
    getEncryptionKey();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: false, quality: 1 });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      addMessage({ type: "sent", text: "Processing image..." });
      await processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    const compressed = await compressToTargetSize(uri, TARGET_BYTES);
    if (!compressed) return;

    addMessage({ type: "sent", text: `Base64 string ready. Size: ${compressed.base64.length} characters` });

    // Await the asynchronous function call to get the chunks
    const { chunks } = await createSmsChunks(compressed.base64, CHUNK_SIZE);
    addMessage({ type: "sent", text: `Image split into ${chunks.length} encrypted chunks.` });

    // Simulate sending and receiving encrypted chunks
    const tempChunks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = `Chunk ${i + 1}/${chunks.length}`;
      addMessage({ type: "sent", text: `Sending encrypted ${chunkText}` });
      addMessage({ type: "received", text: `Received encrypted ${chunkText}` });
      tempChunks.push(chunks[i]);
    }
    
    addMessage({ type: "received", text: "Chunks received. Reconstructing image..." });

    await reconstruct(tempChunks);
  };

  const reconstruct = async (chunks: string[]) => {
    const path = await reconstructFromSmsMessages(chunks);
    if (path) {
      addMessage({ type: "received", image: path });
    }
  };

  const addMessage = (msg: Partial<ChatMessage>) => {
    setMessages((prev) => {
      const updated = [...prev, { id: Date.now().toString() + Math.random(), type: msg.type!, text: msg.text, image: msg.image }];
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      return updated;
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={[styles.message, item.type === "sent" ? styles.sent : styles.received]}>
            {item.text && <Text style={styles.text}>{item.text}</Text>}
            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
          </View>
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 Send Image</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  button: {
    backgroundColor: "#25D366",
    padding: 35,
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
