import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Base64ImageConverterScreen() {
  const [imageUri, setImageUri] = useState('');
  const [encodedBase64, setEncodedBase64] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [decodedUri, setDecodedUri] = useState('');
  const [error, setError] = useState('');
  const [imageSavedInfo, setImageSavedInfo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        await FileSystem.writeAsStringAsync(imgUri, base64Text, { encoding: FileSystem.EncodingType.Base64 });
        setImageSavedInfo('Image saved to: ' + imgUri);
      } catch {
        setImageSavedInfo('Failed to save image.');
      }
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#000', dark: '#000' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
          resizeMode="cover"
        />
      }
    >
      <ThemedView style={styles.container}>
        {/* SECTION 1: IMAGE TO BASE64 */}
        <ThemedText type="title" style={styles.title}>Image to Base64</ThemedText>
        <ThemedView style={styles.sectionBlack}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" /> : null}
          {encodedBase64 ? (
            <>
              <ScrollView style={styles.scrollView}>
                <TextInput
                  value={encodedBase64}
                  editable={false}
                  multiline
                  numberOfLines={6}
                  style={styles.textInput}
                  placeholderTextColor="#888"
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
        <ThemedView style={styles.sectionBlack}>
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
            placeholder="Paste raw Base64 string (no data:image/... headers)"
            placeholderTextColor="#888"
            multiline
            numberOfLines={6}
          />
          <TouchableOpacity style={styles.button} onPress={decodeBase64}>
            <Text style={styles.buttonText}>Convert to Image</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {decodedUri ? (
            <>
              <Image source={{ uri: decodedUri }} style={styles.image} resizeMode="contain" />
              <TouchableOpacity style={styles.button} onPress={downloadImage}>
                <Text style={styles.buttonText}>Download Image</Text>
              </TouchableOpacity>
              {imageSavedInfo ? <Text style={styles.savedInfo}>{imageSavedInfo}</Text> : null}
            </>
          ) : null}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#000',
    flex: 1,
  },
  sectionBlack: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)', // Use boxShadow for web shadows
  },
  title: {
    color: '#fff',
  },
  subText: {
    color: '#ccc',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    padding: 8,
    minHeight: 56,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#222',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  savedInfo: {
    color: '#22c55e',
    fontWeight: 'bold',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignSelf: 'center',
    marginBottom: 8,
    backgroundColor: '#000',
  },
  error: {
    color: '#F43F5E',
    fontWeight: 'bold',
    marginTop: 6,
  },
  scrollView: {
    maxHeight: 200,
    minHeight: 56,
    backgroundColor: '#222',
    borderRadius: 6,
    marginVertical: 4,
  },
  reactLogo: {
    width: SCREEN_WIDTH,
    height: 180,
    alignSelf: 'center',
    backgroundColor: '#000',
  },
});
