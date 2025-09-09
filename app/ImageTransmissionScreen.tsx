import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  compressToTargetSize,
  createSmsChunks,
  getEncryptionKey,
  reconstructFromSmsMessages,
} from "./ImageHandler";

interface ChatMessage {
  id: string;
  type: "sent" | "received";
  text?: string;
  image?: string;
  time?: string;
}

const TARGET_BYTES = 5500;   // ~5.5 KB target after compression (tune for your SMS budget)
const CHUNK_SIZE = 90;       // characters per SMS chunk payload (post-encryption/encoding)

export default function ImageChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const contactName = typeof params?.name === "string" ? params.name : "Contact Name";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Prepare / derive encryption key once
    getEncryptionKey();
  }, []);

  const addMessage = (msg: Partial<ChatMessage>) => {
    setMessages((prev) => {
      const updated = [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          type: msg.type!,
          text: msg.text,
          image: msg.image,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return updated;
    });
  };

  /** ---------- Image Selection (Gallery) ---------- **/
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: false,
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        addMessage({ type: "sent", text: "Processing image..." });
        await processImage(uri);
      }
    } catch (error) {
      addMessage({ type: "sent", text: "Image picking failed." });
      console.error(error);
    }
  };

  /** ---------- Image Capture (Camera) ---------- **/
  const takePhoto = async () => {
    try {
      // Ask permission explicitly (good UX & avoids silent failures)
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) {
        addMessage({ type: "sent", text: "Camera permission denied." });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        base64: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        addMessage({ type: "sent", text: "Processing captured image..." });
        await processImage(uri);
      }
    } catch (error) {
      addMessage({ type: "sent", text: "Camera failed." });
      console.error(error);
    }
  };

  /** ---------- Compression → Chunking → Simulated Tx/Rx ---------- **/
  const processImage = async (uri: string) => {
    // compress to target size and produce base64 for downstream AES+encoding (inside helpers)
    const compressed = await compressToTargetSize(uri, TARGET_BYTES);
    if (!compressed) {
      addMessage({ type: "sent", text: "Failed to compress image." });
      return;
    }

    addMessage({
      type: "sent",
      text: `Base64 string ready. Size: ${compressed.base64.length} characters.`,
    });

    const { chunks } = await createSmsChunks(compressed.base64, CHUNK_SIZE);
    addMessage({ type: "sent", text: `Image split into ${chunks.length} encrypted chunks.` });

    // Simulate sending/receiving each chunk (replace with SMS send/receive on device)
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

  /** ---------- Reassembly & Display ---------- **/
  const reconstruct = async (chunks: string[]) => {
    const path = await reconstructFromSmsMessages(chunks);
    if (path) {
      addMessage({ type: "received", image: path });
    } else {
      addMessage({ type: "received", text: "Reconstruction failed." });
    }
  };

  /** ---------- Text Chat ---------- **/
  const onSend = () => {
    if (!input.trim()) return;
    addMessage({ type: "sent", text: input.trim() });
    setInput("");
  };

  /** ---------- Nav & Image Modal ---------- **/
  const handleBack = () => {
    router.replace("/FetchContacts");
  };

  const handleImagePress = (image?: string, type?: string) => {
    if (image && type === "received") {
      setModalImage(image);
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#140028" }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : insets.top}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to contacts"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Image
            source={require("../assets/images/1.jpg")}
            style={styles.headerAvatar}
            accessibilityIgnoresInvertColors
            accessibilityLabel="Contact Avatar"
          />
          <Text
            numberOfLines={1}
            style={styles.headerName}
            accessibilityRole="header"
            accessibilityLabel={`Chat with ${contactName}`}
          >
            {contactName}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.type === "sent" ? styles.sentBubble : styles.receivedBubble,
                item.image ? { padding: 6 } : {},
              ]}
              accessible
              accessibilityLabel={item.image ? "Image message" : `Text message: ${item.text}`}
            >
              {item.image && (
                <TouchableOpacity
                  onPress={() => handleImagePress(item.image, item.type)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="Tap to enlarge image"
                >
                  <Image source={{ uri: item.image }} style={styles.image} />
                </TouchableOpacity>
              )}
              {item.text && <Text style={styles.chatText}>{item.text}</Text>}
              <Text style={styles.chatTime}>{item.time}</Text>
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          inverted={false}
        />

        {/* Input area */}
        <View style={[styles.inputSection, { paddingBottom: insets.bottom ? insets.bottom : 12 }]}>
          <TextInput
            style={styles.chatInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${contactName}`}
            placeholderTextColor="#bbb"
            multiline
            maxLength={1000}
            accessibilityLabel="Chat message input"
          />

          {/* Attach from gallery */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={pickImage}
            accessibilityLabel="Attach image from gallery"
            accessibilityRole="button"
          >
            <Text style={styles.icon}>📎</Text>
          </TouchableOpacity>

          {/* Capture from camera */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={takePhoto}
            accessibilityLabel="Open camera"
            accessibilityRole="button"
          >
            <Text style={styles.icon}>📷</Text>
          </TouchableOpacity>

          {/* Send text */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={onSend}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Image modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
          accessible
          accessibilityViewIsModal={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
              accessibilityLabel="Close image preview"
              accessibilityRole="button"
            >
              <Text style={{ color: "#fff", fontSize: 28 }}>✖</Text>
            </TouchableOpacity>
            {modalImage && <Image source={{ uri: modalImage }} style={styles.largeImage} resizeMode="contain" />}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: "#140028",
  },
  backButton: {
    marginRight: 12,
    padding: 6,
  },
  backIcon: {
    fontSize: 26,
    color: "#fff",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  headerName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#3a0a59",
    marginBottom: 6,
    marginHorizontal: 14,
  },
  messageContainer: {
    borderRadius: 10,
    marginVertical: 6,
    maxWidth: "80%",
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
  },
  receivedBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  chatText: {
    fontSize: 16,
    color: "#222",
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: "#eee",
  },
  chatTime: {
    fontSize: 11,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#1e1e2f",
    borderTopColor: "#3a0a59",
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#2c2c3f",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#fff",
    maxHeight: 120,
  },
  iconButton: {
    marginLeft: 8,
    paddingBottom: 6,
  },
  icon: {
    fontSize: 24,
    color: "#25d366",
  },
  sendButton: {
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
    backgroundColor: "#6a0dad",
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  largeImage: {
    width: "100%",
    height: "70%",
    borderRadius: 20,
    backgroundColor: "#fff",
  },
});
