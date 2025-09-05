import { useLocalSearchParams } from "expo-router";
import * as SMS from "expo-sms";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const { name, number } = useLocalSearchParams<{ name: string; number: string }>();
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages update
    if (messages.length) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add new message locally
    setMessages((prev) => [...prev, { text: input.trim(), sender: "me" }]);
    Keyboard.dismiss();

    // Send SMS if available
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      try {
        await SMS.sendSMSAsync([number], input.trim());
      } catch (e) {
        alert("Failed to send SMS.");
      }
    } else {
      alert("SMS not available on this device.");
    }

    setInput("");
  };

  const renderItem = ({ item }: { item: { text: string; sender: string } }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "me" ? styles.myMessage : styles.theirMessage,
      ]}
      accessible={true}
      accessibilityLabel={`${item.sender === "me" ? "You" : name} said: ${item.text}`}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Text style={styles.header}>Chat with {name}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          multiline
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !input.trim() }}
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#140028", padding: 10 },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  chatContent: {
    paddingBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: "75%",
    alignSelf: "flex-start",
  },
  myMessage: {
    backgroundColor: "#6a0dad",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#2a2a3d",
    alignSelf: "flex-start",
  },
  messageText: { color: "#fff", fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#6a0dad",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#6a0dad",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#6a0dad",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#4a1b7a",
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
