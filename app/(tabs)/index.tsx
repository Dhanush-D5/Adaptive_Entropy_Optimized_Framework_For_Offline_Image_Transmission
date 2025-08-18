// app/PhoneLoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleNext = () => {
    if (/^\d{10}$/.test(phone)) {
      router.replace("/Base64Conversion"); // replace so user can't go back to login
    } else {
      Alert.alert("Invalid Phone Number", "Phone number must be exactly 10 digits.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Enter Your Phone Number</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="1234567890"
          placeholderTextColor="#aaa"
          value={phone}
          onChangeText={setPhone}
        />
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4f46e5",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
