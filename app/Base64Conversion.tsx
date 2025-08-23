import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';

// ✅ Install expo-linear-gradient before running: expo install expo-linear-gradient

import Logo from '../assets/images/Logo.png';
 // path must exactly match file location and name
 // Adjust this path to your logo

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Base64ImageConverterScreen() {
  const [imageUri, setImageUri] = useState('');
  const [encodedBase64, setEncodedBase64] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [decodedUri, setDecodedUri] = useState('');
  const [error, setError] = useState('');
  const [imageSavedInfo, setImageSavedInfo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const logout = () => {
    router.replace('/');
  };

  const pickImage = async () => {
    setImageUri('');
    setEncodedBase64('');
    let result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri ?? '');
      setEncodedBase64(asset.base64 ?? '');
    }
  };

  const copyBase64 = async () => {
    if (encodedBase64) {
      await Clipboard.setStringAsync(encodedBase64);
      alert('Base64 copied to clipboard!');
    }
  };

  const downloadBase64 = async () => {
    if (!encodedBase64 || !imageUri) return;
    if (Platform.OS === 'web') {
      const blob = new Blob([encodedBase64], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'image.base64.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      alert('Base64 downloaded!');
    } else {
      const fileUri = FileSystem.cacheDirectory + 'image.base64.txt';
      await FileSystem.writeAsStringAsync(fileUri, encodedBase64);
      alert('Base64 text saved to: ' + fileUri);
    }
  };

  const pickBase64File = async () => {
    setError('');
    setDecodedUri('');
    setBase64Text('');
    setImageSavedInfo('');
    try {
      if (Platform.OS === 'web') {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: ['text/plain', 'application/octet-stream'],
        });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          const asset = res.assets[0];
          const fileContent = await FileSystem.readAsStringAsync(asset.uri);
          setBase64Text(fileContent.replace(/[\r\n\s]+/g, ''));
        }
      }
    } catch {
      setError('Could not load file.');
    }
  };

  const onWebBase64File = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setDecodedUri('');
    setImageSavedInfo('');
    const file = event.target?.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const raw = result.replace(/[\r\n\s]+/g, '');
        setBase64Text(raw);
      }
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  };

  const decodeBase64 = () => {
    setDecodedUri('');
    setError('');
    setImageSavedInfo('');
    if (!base64Text || base64Text.length < 100 || base64Text.startsWith('data:')) {
      setError('Please enter valid raw Base64 image data.');
      return;
    }
    try {
      setDecodedUri(`data:image/png;base64,${base64Text}`);
    } catch {
      setError('Invalid Base64 format. Could not decode.');
    }
  };

  const downloadImage = async () => {
    setImageSavedInfo('');
    if (!base64Text || !decodedUri) {
      alert('No image to download.');
      return;
    }
    if (Platform.OS === 'web') {
      try {
        const byteCharacters = window.atob(base64Text);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'decoded-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setImageSavedInfo('Image downloaded!');
      } catch {
        setImageSavedInfo('Failed to download image.');
      }
    } else {
      try {
        const imgUri = FileSystem.cacheDirectory + 'decoded-image.png';
        await FileSystem.writeAsStringAsync(imgUri, base64Text, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setImageSavedInfo('Image saved to: ' + imgUri);
      } catch {
        setImageSavedInfo('Failed to save image.');
      }
    }
  };

  return (

      <ParallaxScrollView
      >
        {/* Logo at top */}
        <Image
          source={Logo}
          style={{
            width: 120,
            height: 120,
            alignSelf: 'center',
            marginVertical: 24,
            borderRadius: 24,
          }}
          resizeMode="contain"
        />

        {/* ✅ Logout button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#b31b1bff' }]}
          onPress={logout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        <ThemedView style={styles.container}>
          {/* SECTION 1: IMAGE TO BASE64 */}
          <ThemedText type="title" style={styles.title}>Image to Base64</ThemedText>
          <ThemedView style={styles.section}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.buttonText}>Upload Image</Text>
            </TouchableOpacity>
            {encodedBase64 ? (
              <>
                <ScrollView style={styles.scrollView}>
                  <TextInput
                    value={encodedBase64}
                    editable={false}
                    multiline
                    numberOfLines={6}
                    style={styles.textInput}
                    placeholderTextColor="#aaa"
                  />
                </ScrollView>
                <TouchableOpacity style={styles.button} onPress={copyBase64}>
                  <Text style={styles.buttonText}>Copy Base64</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={downloadBase64}>
                  <Text style={styles.buttonText}>Download Base64 File</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ThemedView>

          {/* SECTION 2: BASE64 TO IMAGE */}
          <ThemedText type="title" style={styles.title}>Base64 to Image</ThemedText>
          <ThemedView style={styles.section}>
            {Platform.OS === 'web' && (
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.bytes,.base64"
                style={{ display: 'none' }}
                onChange={onWebBase64File}
              />
            )}
            <TouchableOpacity style={styles.button} onPress={pickBase64File}>
              <Text style={styles.buttonText}>Upload .txt/.bytes/.base64 File</Text>
            </TouchableOpacity>
            <ThemedText style={styles.subText}>Or paste Base64 below:</ThemedText>
            <TextInput
              style={styles.textInput}
              value={base64Text}
              onChangeText={setBase64Text}
              placeholder="Paste raw Base64 string (no headers)"
              placeholderTextColor="#fff"
              multiline
              numberOfLines={6}
            />
            <TouchableOpacity style={styles.button} onPress={decodeBase64}>
              <Text style={styles.buttonText}>Convert to Image</Text>
            </TouchableOpacity>

            {/* ✅ Show decoded image */}
            {decodedUri ? (
              <>
                <Image
                  source={{ uri: decodedUri }}
                  style={{
                    width: SCREEN_WIDTH * 0.8,
                    height: SCREEN_WIDTH * 0.8,
                    alignSelf: 'center',
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                  resizeMode="contain"
                />
                <TouchableOpacity style={styles.button} onPress={downloadImage}>
                  <Text style={styles.buttonText}>Download Image</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {imageSavedInfo ? <Text style={styles.savedInfo}>{imageSavedInfo}</Text> : null}
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'rgba(22,1,37,0.9)', // translucent dark card over gradient
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#6C1BB3',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subText: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#6C1BB3',
    borderRadius: 10,
    padding: 12,
    minHeight: 50,
    fontSize: 15,
    color: '#fff',
    marginBottom: 14,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6C1BB3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6C1BB3',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  savedInfo: {
    color: '#4ade80',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    color: '#f87171',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    maxHeight: 200,
    minHeight: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6C1BB3',
    marginTop: 10,
    padding: 8,
  },
});
