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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"; // Correct hook import
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import {
  compressToTargetSize,
  createSmsChunks,
  getEncryptionKey,
  reconstructFromSmsMessages, // Correct function name consistent with usage
} from "./ImageHandler";

interface ChatMessage {
  id: string;
  type: "sent" | "received";
  text?: string;
  image?: string;
  time?: string;
}

const TARGET_BYTES = 5500;
const CHUNK_SIZE = 90;

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
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: false,
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0 &&
        typeof result.assets[0].uri === "string"
      ) {
        const uri = result.assets[0].uri;
        addMessage({ type: "sent", text: "Processing image..." });
        await processImage(uri);
      } else {
        addMessage({ type: "sent", text: "Invalid image selection." });
      }
    } catch (e) {
      addMessage({ type: "sent", text: "Image picking failed." });
      console.error(e);
    }
  };

  const takePhoto = async () => {
    try {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) {
        addMessage({ type: "sent", text: "Camera permission denied." });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        base64: false,
        quality: 1,
      });
      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0 &&
        typeof result.assets[0].uri === "string"
      ) {
        const uri = result.assets[0].uri;
        addMessage({ type: "sent", text: "Processing captured image..." });
        await processImage(uri);
      } else {
        addMessage({ type: "sent", text: "Invalid image capture." });
      }
    } catch (e) {
      addMessage({ type: "sent", text: "Camera failed." });
      console.error(e);
    }
  };

  const processImage = async (uri: string) => {
    if (typeof uri !== "string" || !uri) {
      addMessage({ type: "sent", text: "Compression failed: No valid URI." });
      return;
    }
    const compressed = await compressToTargetSize(uri, TARGET_BYTES);
    if (!compressed) {
      addMessage({ type: "sent", text: "Failed image compression." });
      return;
    }

    addMessage({ type: "sent", text: `Ready: size ${compressed.base64.length}` });

    const { chunks } = await createSmsChunks(compressed.base64, CHUNK_SIZE);
    addMessage({ type: "sent", text: `Split into ${chunks.length} chunks.` });

    const tempChunks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = `Chunk ${i + 1}/${chunks.length}`;
      addMessage({ type: "sent", text: `Sending ${chunkText}` });
      addMessage({ type: "received", text: `Received ${chunkText}` });
      tempChunks.push(chunks[i]);
    }

    addMessage({ type: "received", text: "Reconstructing image..." });
    await reconstruct(tempChunks);
  };

  const reconstruct = async (chunks: string[]) => {
    const path = await reconstructFromSmsMessages(chunks);
    if (path) {
      addMessage({ type: "received", image: path });
    } else {
      addMessage({ type: "received", text: "Image reconstruction failed." });
    }
  };

  const onSend = () => {
    if (!input.trim()) return;
    addMessage({ type: "sent", text: input.trim() });
    setInput("");
  };

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
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Back">
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Image source={require("../assets/images/1.jpg")} style={styles.headerAvatar} />
          <Text style={styles.headerName} numberOfLines={1}>{contactName}</Text>
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
                <TouchableOpacity onPress={() => handleImagePress(item.image, item.type)} accessibilityRole="imagebutton">
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

        {/* Footer */}
        <View style={[styles.inputSection, { paddingBottom: insets.bottom ?? 12 }]}>
          <TextInput
            ref={inputRef}
            style={styles.chatInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${contactName}`}
            placeholderTextColor="#bbb"
            multiline
            maxLength={1000}
            accessibilityLabel="Chat Text Input"
          />

          <TouchableOpacity onPress={pickImage} style={styles.iconButton} accessibilityLabel="Attach Image">
            <MaterialCommunityIcons name="paperclip" size={26} color="#65666a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto} style={styles.iconButton} accessibilityLabel="Open Camera">
            <MaterialCommunityIcons name="camera-outline" size={26} color="#65666a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSend} style={styles.sendButton} accessibilityLabel="Send Message" disabled={!input.trim()}>
            <MaterialCommunityIcons name="send" size={27} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)} accessible accessibilityViewIsModal={true}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose} accessibilityLabel="Close Image" accessibilityRole="button">
              <Text style={{ fontSize: 28, color: "#fff" }}>✖</Text>
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
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopColor: "#eee",
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#222",
    maxHeight: 120,
    marginHorizontal: 5,
  },
  iconButton: {
    marginHorizontal: 6,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    backgroundColor: "#25D366",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
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
