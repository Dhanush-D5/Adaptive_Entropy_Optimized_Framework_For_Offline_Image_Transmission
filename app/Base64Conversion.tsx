import * as Clipboard from "expo-clipboard";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Base64ImageConverterScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [encodedBase64, setEncodedBase64] = useState<string>("");
  const [pastedBase64, setPastedBase64] = useState<string>("");
  const [reconstructedUri, setReconstructedUri] = useState<string | null>(null);

  const { name } = useLocalSearchParams();

  // Pick image from library, compress and convert to base64
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        setImageUri(manipulated.uri);
        setEncodedBase64(manipulated.base64 ?? "");
        setReconstructedUri(null);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while picking the image.");
      console.error(error);
    }
  };

  // Copy encoded base64 string to clipboard
  const copyBase64 = async () => {
    if (encodedBase64) {
      await Clipboard.setStringAsync(encodedBase64);
      Alert.alert("Copied!", "Compressed Base64 string copied to clipboard.");
    }
  };

  // Reconstruct image from pasted base64 string
  const reconstructImage = () => {
    if (pastedBase64.trim().length > 0) {
      setReconstructedUri("data:image/jpeg;base64," + pastedBase64.trim());
    } else {
      Alert.alert("Invalid Input", "Please paste a valid Base64 string.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{name ?? "Base64 Image Converter"}</Text>

        {/* Upload & Compress Image */}
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Image
            source={require("../assets/images/up.png")}
            style={styles.buttonImage}
            resizeMode="contain"
          />
          <Text style={styles.imageButtonText}>Upload</Text>
        </TouchableOpacity>

        {/* Show compressed image */}
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}

        {/* Show encoded Base64 string */}
        {encodedBase64 ? (
          <>
            <Text style={styles.infoText}>Base64 length: {encodedBase64.length}</Text>
            <ScrollView style={styles.base64Container}>
              <TextInput
                value={encodedBase64}
                editable={false}
                multiline
                style={[styles.input, styles.base64Input]}
              />
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={copyBase64}>
              <Text style={styles.buttonText}>Copy Compressed String</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Paste Base64 input */}
        <Text style={[styles.title, { fontSize: 18, marginTop: 24 }]}>
          Paste Compressed String Below:
        </Text>
        <TextInput
          value={pastedBase64}
          onChangeText={setPastedBase64}
          placeholder="Paste Base64 string here..."
          placeholderTextColor="#999"
          multiline
          style={styles.input}
        />

        {/* Reconstruct Image */}
        <TouchableOpacity
          style={[styles.imageButton, { marginTop: 16 }]}
          onPress={reconstructImage}
        >
          <Image
            source={require("../assets/images/down.png")}
            style={styles.buttonImage}
            resizeMode="contain"
          />
          <Text style={styles.imageButtonText}>Download</Text>
        </TouchableOpacity>

        {/* Show reconstructed image */}
        {reconstructedUri && (
          <>
            <Text style={[styles.title, { fontSize: 18, marginTop: 24 }]}>
              Reconstructed Image:
            </Text>
            <Image
              source={{ uri: reconstructedUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#140028",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#1e1e2f",
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
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
    borderColor: "#6a0dad",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#2a2a3d",
    width: "100%",
    minHeight: 80,
    textAlignVertical: "top",
  },
  base64Container: {
    maxHeight: 150,
    width: "100%",
    borderWidth: 1,
    borderColor: "#6a0dad",
    borderRadius: 12,
    backgroundColor: "#2a2a3d",
    marginBottom: 15,
  },
  base64Input: {
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: "#6a0dad",
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
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  imageButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonImage: {
    width: 120,
    height: 120,
  },
  imageButtonText: {
    color: "#fff",
    marginTop: 6,
    fontSize: 20,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 16,
    color: "#d1c4e9",
    marginBottom: 10,
  },
  previewImage: {
    width: 220,
    height: 220,
    marginVertical: 20,
    borderRadius: 12,
  },
});
