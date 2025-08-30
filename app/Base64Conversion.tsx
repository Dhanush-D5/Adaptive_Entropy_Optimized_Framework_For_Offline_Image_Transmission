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

  const { name } = useLocalSearchParams();

  const pickImage = async () => {
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
      <View style={styles.card}>
        <Text style={styles.title}>{name ?? "Unknown"}</Text>

        {/* Upload & Compress Image button replaced by up.png image */}
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
<Image
  source={require("../assets/images/up.png")}
  style={styles.buttonImage}
  resizeMode="contain"
/>
<Text style={styles.imageButtonText}>Upload</Text>
        </TouchableOpacity>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: 220, height: 220, marginVertical: 20, borderRadius: 12 }}
            resizeMode="contain"
          />
        )}

        {encodedBase64 ? (
          <>
            <Text style={[styles.title, { fontSize: 16, marginBottom: 10 }]}>
              Base64 length: {encodedBase64.length}
            </Text>
            <ScrollView
              style={{
                maxHeight: 150,
                width: "100%",
                borderWidth: 1,
                borderColor: "#6a0dad",
                borderRadius: 12,
                backgroundColor: "#2a2a3d",
                marginBottom: 15,
              }}
            >
              <TextInput
                value={encodedBase64}
                editable={false}
                multiline
                style={[styles.input, { borderWidth: 0 }]}
              />
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={copyBase64}>
              <Text style={styles.buttonText}>Copy Compressed String</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <Text style={[styles.title, { fontSize: 16, marginTop: 20 }]}>
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

        {/* Reconstruct Image button replaced by down.png image */}
        <TouchableOpacity
          style={[styles.imageButton, { marginTop: 15 }]}
          onPress={reconstructImage}
        >
<Image
  source={require("../assets/images/down.png")}
  style={styles.buttonImage}
  resizeMode="contain"
/>
<Text style={styles.imageButtonText}>Download</Text>
        </TouchableOpacity>

        {reconstructedUri && (
          <>
            <Text style={[styles.title, { fontSize: 16, marginTop: 20 }]}>
              Reconstructed Image:
            </Text>
            <Image
              source={{ uri: reconstructedUri }}
              style={{ width: 220, height: 220, marginTop: 15, borderRadius: 12 }}
              resizeMode="contain"
            />
          </>
        )}
      </View>
    </View>
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
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  imageButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonImage: {
    width: 120,
    height:120,
  },
imageButtonText: {
  color: "#fff",
  marginTop: 6,
  fontSize: 36,   // increased from 14 to 20
  fontWeight: "600",
},

});
