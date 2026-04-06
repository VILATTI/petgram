import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius } from "../theme";
import { postsApi } from "../api/posts";

export default function UploadScreen({ navigation }: any) {
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      Alert.alert("Error", "Please add a caption");
      return;
    }

    setLoading(true);
    try {
      await postsApi.createPost(caption, imageUri ?? undefined);
      setCaption("");
      setImageUri(null);
      Alert.alert("Success", "Post created!", [{ text: "OK", onPress: () => navigation.navigate("Feed") }]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.errors?.join("\n") || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.shareBtn, loading && styles.shareBtnDisabled]}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.shareBtnText}>Share</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color={colors.textMuted} />
              <Text style={styles.imagePlaceholderText}>Tap to select photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption */}
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={300}
        />
        <Text style={styles.charCount}>{caption.length}/300</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 70,
    alignItems: "center",
  },
  shareBtnDisabled: { opacity: 0.6 },
  shareBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  content: { padding: spacing.md },
  imagePicker: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  previewImage: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    aspectRatio: 1,
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 15,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
