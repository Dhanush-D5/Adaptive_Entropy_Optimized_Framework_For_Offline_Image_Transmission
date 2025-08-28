// app/PhoneLoginScreen.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleNext = () => {
    if (/^\d{10}$/.test(phone)) {
      router.replace("/FetchContacts"); 
    } else {
      Alert.alert("Invalid Phone Number", "Phone number must be exactly 10 digits.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo on top */}
      <Image
        source={require("@/assets/images/1.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Card */}
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
    backgroundColor: "#140028", // extracted deep purple background
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 500,  // increased size for visibility
    height: 500,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  card: {
    backgroundColor: "#1e1e2f", // dark but softer than bg
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#6a0dad", // lighter purple for contrast
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#2a2a3d",
  },
  button: {
    backgroundColor: "#6a0dad", // purple button
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
