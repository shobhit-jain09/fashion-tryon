import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { fetchTryOnResult, requestTryOn } from "./src/api";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [stylePrompt, setStylePrompt] = useState("minimal streetwear look");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!pick.canceled) setImageUri(pick.assets[0].uri);
  };

  const onGenerate = async () => {
    if (!imageUri) return;
    setLoading(true);
    setResult(null);
    try {
      // For local MVP, backend expects a URL. Replace with real upload endpoint.
      const payload = await requestTryOn(
        "https://picsum.photos/800/1200",
        stylePrompt,
        "casual"
      );
      const job = await fetchTryOnResult(payload.job_id);
      setResult(job);
    } catch (error) {
      setResult({ status: "failed", error_message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>AI Fashion Try-On</Text>
        <Button title="Pick Your Photo" onPress={pickImage} />
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        <TextInput
          style={styles.input}
          placeholder="Describe your style"
          value={stylePrompt}
          onChangeText={setStylePrompt}
        />
        <Button title="Generate Outfit" onPress={onGenerate} />

        {loading ? <ActivityIndicator style={styles.loader} /> : null}

        {result?.generated_image_url ? (
          <View style={styles.resultBlock}>
            <Text style={styles.subtitle}>Try-On Result</Text>
            <Image source={{ uri: result.generated_image_url }} style={styles.preview} />
            <Text style={styles.subtitle}>Shop The Look</Text>
            {result.products?.map((item) => (
              <View key={item.id} style={styles.product}>
                <Text>{item.title}</Text>
                <Text>
                  {item.currency} {item.price}
                </Text>
                <Button title="Buy Now" onPress={() => Linking.openURL(item.purchase_url)} />
              </View>
            ))}
          </View>
        ) : null}

        {result?.status === "failed" ? <Text>{result.error_message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 18, fontWeight: "600", marginTop: 10 },
  preview: { width: "100%", height: 360, borderRadius: 10, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  loader: { marginTop: 12 },
  resultBlock: { marginTop: 14, gap: 10 },
  product: { borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 10, gap: 6 },
});
