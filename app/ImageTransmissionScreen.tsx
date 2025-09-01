import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { compressToTargetSize, createSmsChunks, reconstructFromSmsMessages } from "./ImageHandler";

interface ChatMessage {
  id: string;
  type: "sent" | "received";
  text?: string;
  image?: string;
}

const TARGET_BYTES = 5500;
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function ImageTransmissionScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams<{ contactName?: string }>();
  const contactName = params.contactName;

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Send typed text message
  const sendTextMessage = () => {
    if (inputText.trim() === "") return;
    addMessage({ type: "sent", text: inputText.trim() });
    setInputText("");
  };

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

      if (i === chunks.length - 1) {
        setTimeout(() => reconstruct(tempChunks), 500);
      }
    }
  };

  const reconstruct = async (chunks: string[]) => {
    const path = await reconstructFromSmsMessages(chunks);
    if (path) addMessage({ type: "received", image: path });
  };

  const addMessage = (msg: Partial<ChatMessage>) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), type: msg.type!, text: msg.text, image: msg.image },
    ]);
  };

  const openPreview = (uri: string) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewUri(null);
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#6a0dad" />
        </TouchableOpacity>
        <Text style={styles.topBarText}>{contactName ?? "Image Transmission"}</Text>
      </View>

      {/* Message list */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.type === "sent" ? styles.sent : styles.received,
            ]}
          >
            {item.text && <Text style={styles.messageText}>{item.text}</Text>}
            {item.image && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => openPreview(item.image!)}>
                <Image source={{ uri: item.image }} style={styles.image} />
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Input area with text box and attach image button */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Write a message..."
          placeholderTextColor="#bbb"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Ionicons name="attach" size={28} color="#6a0dad" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, { opacity: inputText.trim() === "" ? 0.5 : 1 }]}
          disabled={inputText.trim() === ""}
          onPress={sendTextMessage}
        >
          <Ionicons name="send" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackground} onPress={closePreview}>
          <Image source={{ uri: previewUri || undefined }} style={styles.previewImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeButton} onPress={closePreview}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181824", paddingTop: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#181824",
    borderBottomWidth: 1,
    borderBottomColor: "#292144",
    marginBottom: 8,
  },
  topBarText: {
    color: "#6a0dad",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  message: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sent: {
    backgroundColor: "#9612ae",
    alignSelf: "flex-end",
  },
  received: {
    backgroundColor: "#6f42c1",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
    color: "#fff",
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#1e1e2f",
    borderTopWidth: 1,
    borderTopColor: "#292144",
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#292144",
    marginRight: 8,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#6a0dad",
    padding: 10,
    borderRadius: 20,
  },

  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.75,
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
  },
});
