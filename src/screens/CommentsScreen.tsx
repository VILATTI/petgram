import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius } from "../theme";
import { commentsApi, Comment } from "../api/comments";
import { useAuthStore } from "../store/authStore";

export default function CommentsScreen({ route, navigation }: any) {
  const { postId } = route.params;
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const data = await commentsApi.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;

    setSending(true);
    try {
      const comment = await commentsApi.createComment(postId, text.trim());
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch (err) {
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (comment: Comment) => {
    if (comment.user.id !== user?.id) return;

    Alert.alert("Delete comment", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await commentsApi.deleteComment(postId, comment.id);
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
          } catch (err) {
            Alert.alert("Error", "Failed to delete comment");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Comments list */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment!</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.comment} onLongPress={() => handleDelete(item)}>
                <View style={styles.commentAvatar}>
                  <Ionicons name="paw" size={16} color={colors.primary} />
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUsername}>{item.user.username}</Text>
                  <Text style={styles.commentBody}>{item.body}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <View style={styles.inputAvatar}>
            <Ionicons name="paw" size={16} color={colors.primary} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending} style={styles.sendBtn}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="send" size={22} color={text.trim() ? colors.primary : colors.border} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listContent: { padding: spacing.md, flexGrow: 1 },
  comment: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  commentContent: { flex: 1 },
  commentUsername: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 13,
    marginBottom: 2,
  },
  commentBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    maxHeight: 80,
  },
  sendBtn: { padding: spacing.xs, marginLeft: spacing.sm },
});
