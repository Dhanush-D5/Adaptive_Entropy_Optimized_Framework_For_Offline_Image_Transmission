import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function Base64ImageConverterScreen() {
  // Image to Base64
  const [imageUri, setImageUri] = useState('');
  const [encodedBase64, setEncodedBase64] = useState('');
  // Base64 to Image
  const [base64Text, setBase64Text] = useState('');
  const [decodedUri, setDecodedUri] = useState('');
  const [error, setError] = useState('');
  const [imageSavedInfo, setImageSavedInfo] = useState('');

  // For web file input
  const fileInputRef = useRef(null);

  // Upload image & encode to base64
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
      setImageUri(asset.uri || '');
      setEncodedBase64(asset.base64 || '');
    }
  };

  // Copy base64 to clipboard
  const copyBase64 = async () => {
    if (encodedBase64) {
      await Clipboard.setStringAsync(encodedBase64);
      alert('Base64 copied to clipboard!');
    }
  };

  // Download base64 as txt file
  const downloadBase64 = async () => {
    if (!encodedBase64 || !imageUri) return;
    if (Platform.OS === 'web') {
      const blob = new Blob([encodedBase64], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'image.base64.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Base64 downloaded!');
    } else {
      const fileUri = FileSystem.cacheDirectory + 'image.base64.txt';
      await FileSystem.writeAsStringAsync(fileUri, encodedBase64);
      alert('Base64 text saved to: ' + fileUri);
    }
  };

  // Upload .txt/.bytes/.base64 & decode to image
  const pickBase64File = async () => {
    setError('');
    setDecodedUri('');
    setBase64Text('');
    setImageSavedInfo('');
    try {
      if (Platform.OS === 'web') {
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
          fileInputRef.current.click();
        }
      } else {
        const res = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'application/octet-stream'] });
        if (res.type === 'success') {
          const fileContent = await FileSystem.readAsStringAsync(res.uri);
          setBase64Text(fileContent.replace(/[\r\n\s]+/g, ''));
        }
      }
    } catch (err) {
      setError('Could not load file.');
    }
  };

  // Web: Handler for file input change
  const onWebBase64File = (event) => {
    setError('');
    setDecodedUri('');
    setImageSavedInfo('');
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const raw = (e.target.result || '').replace(/[\r\n\s]+/g, '');
      setBase64Text(raw);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  };

  // Decode base64 to image
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

  // Download decoded image (PNG) from base64
  const downloadImage = async () => {
    setImageSavedInfo('');
    if (!base64Text || !decodedUri) {
      alert('No image to download.');
      return;
    }
    if (Platform.OS === 'web') {
      try {
        // Create Blob and trigger download
        const byteCharacters = atob(base64Text);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'decoded-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setImageSavedInfo('Image downloaded!');
      } catch (e) {
        setImageSavedInfo('Failed to download image.');
      }
    } else {
      try {
        // Save the image as PNG in cacheDirectory
        const imgUri = FileSystem.cacheDirectory + 'decoded-image.png';
        await FileSystem.writeAsStringAsync(imgUri, base64Text, { encoding: FileSystem.EncodingType.Base64 });
        setImageSavedInfo('Image saved to: ' + imgUri);
      } catch (e) {
        setImageSavedInfo('Failed to save image.');
      }
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.container}>

        {/* SECTION 1: IMAGE TO BASE64 */}
        <ThemedText type="title">Image to Base64</ThemedText>
        <ThemedView style={styles.sectionWhite}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          ) : null}
          {encodedBase64 ? (
            <>
              <ScrollView style={styles.scrollView}>
                <TextInput
                  value={encodedBase64}
                  editable={false}
                  multiline
                  numberOfLines={6}
                  style={styles.textInput}
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
        <ThemedText type="title">Base64 to Image</ThemedText>
        <ThemedView style={styles.sectionWhite}>
          {/* For web: hidden file input */}
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
          <ThemedText>Or paste Base64 below:</ThemedText>
          <TextInput
            style={styles.textInput}
            value={base64Text}
            onChangeText={setBase64Text}
            placeholder="Paste raw Base64 string (no data:image/... headers)"
            multiline
            numberOfLines={6}
          />
          <TouchableOpacity style={styles.button} onPress={decodeBase64}>
            <Text style={styles.buttonText}>Convert to Image</Text>
          </TouchableOpacity>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}
          {decodedUri ? (
            <>
              <Image
                source={{ uri: decodedUri }}
                style={styles.image}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.button} onPress={downloadImage}>
                <Text style={styles.buttonText}>Download Image</Text>
              </TouchableOpacity>
              {imageSavedInfo ? (
                <Text style={styles.savedInfo}>{imageSavedInfo}</Text>
              ) : null}
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
    gap: 24,
  },
  sectionWhite: {
    gap: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 8,
    minHeight: 56,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F7F7F7',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  savedInfo: {
    color: '#16a34a',
    fontWeight: 'bold',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 8,
  },
  error: {
    color: '#DB2777',
    fontWeight: 'bold',
    marginTop: 6,
  },
  scrollView: {
    maxHeight: 200,
    minHeight: 56,
    backgroundColor: '#F7F7F7',
    borderRadius: 6,
    marginVertical: 4,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
