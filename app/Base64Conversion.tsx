import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";

export default function Base64ImageConverterScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [encodedBase64, setEncodedBase64] = useState<string>("");
  const [pastedBase64, setPastedBase64] = useState<string>("");
  const [reconstructedUri, setReconstructedUri] = useState<string | null>(null);

  // ✅ Get the selected contact name
  const { name } = useLocalSearchParams();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      // ✅ Compress before converting to Base64
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
    }
  };

  const copyBase64 = async () => {
    if (encodedBase64) {
      await Clipboard.setStringAsync(encodedBase64);
      alert("Compressed string copied to clipboard!");
    }
  };

  const reconstructImage = () => {
    if (pastedBase64.trim().length > 0) {
      setReconstructedUri("data:image/jpeg;base64," + pastedBase64.trim());
    } else {
      alert("Please paste a valid Base64 string.");
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ Contact name header */}
      <Text style={styles.contactName}>
        {name ?? "Unknown"}
      </Text>

      {/* Upload Button */}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Upload & Compress Image</Text>
      </TouchableOpacity>

      {/* Compressed preview from URI */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.imagePreview}
          resizeMode="contain"
        />
      )}

      {/* Show compressed Base64 string + copy option */}
      {encodedBase64 ? (
        <>
          <Text style={styles.lengthText}>
            Base64 length: {encodedBase64.length}
          </Text>
          <ScrollView style={styles.scrollView}>
            <TextInput
              value={encodedBase64}
              editable={false}
              multiline
              style={styles.textInput}
            />
          </ScrollView>

          <TouchableOpacity style={styles.copyButton} onPress={copyBase64}>
            <Text style={styles.buttonText}>Copy Compressed String</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {/* Paste and reconstruct */}
      <Text style={styles.sectionTitle}>Paste Compressed String Below:</Text>
      <TextInput
        value={pastedBase64}
        onChangeText={setPastedBase64}
        placeholder="Paste Base64 string here..."
        multiline
        style={styles.inputBox}
      />
      <TouchableOpacity style={styles.button} onPress={reconstructImage}>
        <Text style={styles.buttonText}>Reconstruct Image</Text>
      </TouchableOpacity>

      {reconstructedUri && (
        <>
          <Text style={styles.sectionTitle}>Reconstructed Image:</Text>
          <Image
            source={{ uri: reconstructedUri }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, backgroundColor: "#fff" },
  contactName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#6C1BB3",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#6C1BB3",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
  },
  copyButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  imagePreview: { width: 200, height: 200, marginTop: 20 },
  lengthText: { marginBottom: 10, fontWeight: "bold", color: "#333" },
  scrollView: { maxHeight: 150, width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
  textInput: { padding: 10, color: "#333" },
  sectionTitle: { marginTop: 20, fontWeight: "bold", color: "#333" },
  inputBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    minHeight: 100,
    marginTop: 10,
    textAlignVertical: "top",
  },
});
