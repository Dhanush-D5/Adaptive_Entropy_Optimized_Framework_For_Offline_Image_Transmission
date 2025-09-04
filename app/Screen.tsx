import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as SMS from "expo-sms";

export default function ChatScreen() {
  const { name, number } = useLocalSearchParams<{ name: string; number: string }>();
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add to chat UI
    setMessages((prev) => [...prev, { text: input, sender: "me" }]);

    // Try sending SMS
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync([number], input);
    } else {
      alert("SMS not available on this device");
    }

    setInput("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat with {name}</Text>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === "me" ? styles.myMessage : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#140028", padding: 10 },
  header: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 10, textAlign: "center" },
  messageBubble: { padding: 10, borderRadius: 10, marginVertical: 5, maxWidth: "75%" },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#6a0dad" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#2a2a3d" },
  messageText: { color: "#fff" },
  inputContainer: { flexDirection: "row", alignItems: "center", marginTop: "auto" },
  input: { flex: 1, borderWidth: 1, borderColor: "#6a0dad", borderRadius: 20, paddingHorizontal: 15, color: "#fff" },
  sendButton: { marginLeft: 10, backgroundColor: "#6a0dad", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  sendText: { color: "#fff", fontWeight: "bold" },
});
