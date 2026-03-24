import React, { useEffect, useState } from "react";
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
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  fetchCatalog,
  fetchProviderStatus,
  fetchTryOnResult,
  requestTryOn,
  uploadPersonImage,
} from "./src/api";

const CATEGORIES = ["casual", "formal", "streetwear", "sportswear"];

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [stylePrompt, setStylePrompt] = useState("minimal streetwear look");
  const [category, setCategory] = useState("casual");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [providerStatus, setProviderStatus] = useState(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProviderStatus = async () => {
    setProviderLoading(true);
    try {
      const status = await fetchProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      setProviderStatus({
        provider: "unknown",
        configured: false,
        warnings: [String(error)],
      });
    } finally {
      setProviderLoading(false);
    }
  };

  useEffect(() => {
    loadProviderStatus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchCatalog(category, 16);
        if (!cancelled) {
          setCatalog(items);
          setSelectedProduct(null);
        }
      } catch {
        if (!cancelled) {
          setCatalog([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

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

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const shot = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!shot.canceled) setImageUri(shot.assets[0].uri);
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollResult = async (jobId) => {
    for (let i = 0; i < 45; i += 1) {
      const job = await fetchTryOnResult(jobId);
      setStatusText(`Job status: ${job.status}`);
      if (job.status === "completed" || job.status === "failed") return job;
      await wait(1000);
    }
    throw new Error("Try-on timed out. Please try again.");
  };

  const onGenerate = async () => {
    if (!imageUri) return;
    setLoading(true);
    setResult(null);
    setStatusText("Uploading your image...");
    try {
      const upload = await uploadPersonImage(imageUri);
      setStatusText("Creating try-on job...");
      const payload = await requestTryOn(upload.image_url, stylePrompt, category, selectedProduct);
      setStatusText("Generating outfit...");
      const job = await pollResult(payload.job_id);
      setResult(job);
      setStatusText("");
    } catch (error) {
      setResult({ status: "failed", error_message: String(error) });
      setStatusText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>AI Fashion Try-On</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Provider Status</Text>
          {providerLoading ? <ActivityIndicator /> : null}
          {providerStatus ? (
            <>
              <Text>Provider: {providerStatus.provider}</Text>
              <Text>
                Configured: {providerStatus.configured ? "Yes" : "No"}
              </Text>
              {providerStatus.warnings?.map((w) => (
                <Text key={w} style={styles.warningText}>
                  - {w}
                </Text>
              ))}
            </>
          ) : null}
          <Button title="Refresh Provider Status" onPress={loadProviderStatus} />
        </View>
        <View style={styles.actions}>
          <Button title="Pick Photo" onPress={pickImage} />
          <Button title="Take Photo" onPress={takePhoto} />
        </View>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        <TextInput
          style={styles.input}
          placeholder="Describe your style"
          value={stylePrompt}
          onChangeText={setStylePrompt}
        />
        <Button title="Generate Outfit" onPress={onGenerate} />

        {loading ? <ActivityIndicator style={styles.loader} /> : null}
        {statusText ? <Text>{statusText}</Text> : null}

        <Text style={styles.subtitle}>Category</Text>
        <View style={styles.categories}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, category === item ? styles.chipActive : null]}
              onPress={() => setCategory(item)}
            >
              <Text style={category === item ? styles.chipTextActive : styles.chipText}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subtitle}>Outfit (Myntra / Flipkart–style)</Text>
        <Text style={styles.hint}>Tap a dress to use its photo for try-on.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogScroll}>
          {catalog.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.catalogCard,
                selectedProduct?.id === item.id ? styles.catalogCardSelected : null,
              ]}
              onPress={() => setSelectedProduct(item)}
            >
              <Image source={{ uri: item.image_url }} style={styles.catalogImage} />
              <Text style={styles.catalogTitle} numberOfLines={2}>
                {item.retailer ? `${item.retailer} · ` : ""}
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {result?.generated_image_url ? (
          <View style={styles.resultBlock}>
            <Text style={styles.subtitle}>Try-On Result</Text>
            <Image source={{ uri: result.generated_image_url }} style={styles.preview} />
            <Text style={styles.subtitle}>Shop The Look</Text>
            {result.products?.map((item) => (
              <View key={item.id} style={styles.product}>
                <Text>{item.title}</Text>
                <Text>
                  {[item.retailer, item.brand].filter(Boolean).join(" · ")} · {item.currency}{" "}
                  {item.price}
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
  actions: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  statusCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  statusTitle: { fontSize: 16, fontWeight: "600" },
  warningText: { color: "#b91c1c" },
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
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#ddd", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#333" },
  chipTextActive: { color: "#fff" },
  hint: { fontSize: 13, color: "#666" },
  catalogScroll: { marginTop: 6, maxHeight: 200 },
  catalogCard: {
    width: 120,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  catalogCardSelected: { borderColor: "#111", borderWidth: 2 },
  catalogImage: { width: "100%", height: 120 },
  catalogTitle: { fontSize: 11, padding: 6, color: "#333" },
});
