import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius } from "../theme";
import { postsApi, Post } from "../api/posts";
import { useAuthStore } from "../store/authStore";
import { Alert } from "react-native";
import { apiClient } from "../api/client";

export default function FeedScreen({ navigation }: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const { user } = useAuthStore();

  const loadPosts = useCallback(async (page = 1) => {
    try {
      const data = await postsApi.getFeed(page);
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasNext(data.meta.has_next);
      setCurrentPage(data.meta.current_page);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts(1);
  };

  const onLoadMore = () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    loadPosts(currentPage + 1);
  };

  const toggleLike = async (post: Post) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_current_user: !p.liked_by_current_user,
              likes_count: p.liked_by_current_user ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p,
      ),
    );
    try {
      if (post.liked_by_current_user) {
        await postsApi.unlikePost(post.id);
      } else {
        await postsApi.likePost(post.id);
      }
    } catch (err) {
      // відкочуємо
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                liked_by_current_user: post.liked_by_current_user,
                likes_count: post.likes_count,
              }
            : p,
        ),
      );
    }
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert("Delete post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/api/v1/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (err) {
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Petgram</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Petgram</Text>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="paw" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Follow someone or create a post!</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        renderItem={({ item: post }) => (
          <View style={styles.post}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <Ionicons name="paw" size={20} color={colors.primary} />
              </View>
              <TouchableOpacity
                style={{ flex: 1, justifyContent: "center" }}
                onPress={() => navigation.navigate("UserProfile", { userId: post.user.id })}
              >
                <Text style={styles.postUsername}>{post.user.username}</Text>
              </TouchableOpacity>
              {post.user.id === user?.id && (
                <TouchableOpacity style={styles.moreBtn} onPress={() => handleDeletePost(post.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Image */}
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.postImage} />
            ) : (
              <View style={styles.noImage}>
                <Ionicons name="image-outline" size={48} color={colors.border} />
              </View>
            )}

            {/* Actions — тільки like і comment */}
            <View style={styles.actions}>
              <View style={styles.actionsLeft}>
                <TouchableOpacity onPress={() => toggleLike(post)} style={styles.actionBtn}>
                  <Ionicons
                    name={post.liked_by_current_user ? "heart" : "heart-outline"}
                    size={26}
                    color={post.liked_by_current_user ? colors.like : colors.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate("Comments", { postId: post.id })}
                >
                  <Ionicons name="chatbubble-outline" size={26} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.likes}>{post.likes_count} likes</Text>
            <Text style={styles.caption}>
              <Text style={styles.boldText}>{post.user.username} </Text>
              {post.caption}
            </Text>
            {post.comments_count > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate("Comments", { postId: post.id })}>
                <Text style={styles.viewComments}>View all {post.comments_count} comments</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boldText: {
    fontWeight: "700",
    color: colors.text,
  },
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
  logo: { fontSize: 22, fontWeight: "800", color: colors.primary },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  post: { backgroundColor: colors.surface, marginBottom: spacing.sm },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  postUsername: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreBtn: { padding: spacing.xs },
  postImage: { width: "100%", aspectRatio: 1 },
  noImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionsLeft: { flexDirection: "row", gap: spacing.md },
  actionBtn: { padding: spacing.xs },
  likes: {
    paddingHorizontal: spacing.md,
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  caption: {
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  viewComments: {
    paddingHorizontal: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  footer: { padding: spacing.md, alignItems: "center" },
});
