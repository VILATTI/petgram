import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius } from "../theme";
import { useAuthStore } from "../store/authStore";
import { usersApi, Profile } from "../api/users";
import { followsApi } from "../api/follows";
import { apiClient } from "../api/client";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_WIDTH - 3) / 3;

interface Props {
  navigation: any;
  route?: any;
  userId?: number; // якщо передано — чужий профіль
}

export default function ProfileScreen({ navigation, route }: Props) {
  const { user, logout } = useAuthStore();
  const userId = route?.params?.userId; // є якщо чужий профіль
  const isOwnProfile = !userId || userId === user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = isOwnProfile ? await usersApi.getMe() : await usersApi.getUser(userId);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        const res = await followsApi.unfollow(profile.id);
        setProfile((p) => (p ? { ...p, is_following: false, followers_count: res.followers_count } : p));
      } else {
        const res = await followsApi.follow(profile.id);
        setProfile((p) => (p ? { ...p, is_following: true, followers_count: res.followers_count } : p));
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert("Delete post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/api/v1/posts/${postId}`);
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    posts: prev.posts.filter((p) => p.id !== postId),
                    posts_count: prev.posts_count - 1,
                  }
                : prev,
            );
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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={profile?.posts ?? []}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              {!isOwnProfile && (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
              <Text style={styles.username}>@{profile?.username}</Text>
              {isOwnProfile && (
                <TouchableOpacity onPress={logout}>
                  <Ionicons name="log-out-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Avatar + Stats */}
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Ionicons name="paw" size={36} color={colors.primary} />
              </View>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile?.posts_count ?? 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile?.followers_count ?? 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile?.following_count ?? 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            {/* Follow button — тільки для чужого профілю */}
            {!isOwnProfile && (
              <TouchableOpacity
                style={[styles.followBtn, profile?.is_following && styles.followingBtn]}
                onPress={toggleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.followBtnText}>{profile?.is_following ? "Following" : "Follow"}</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Grid header */}
            <View style={styles.gridHeader}>
              <Ionicons name="grid" size={22} color={colors.primary} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="camera-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onLongPress={() => handleDeletePost(item.id)} // ← long press
            delayLongPress={500}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            ) : (
              <View style={styles.gridNoImage}>
                <Ionicons name="paw" size={24} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.gridOverlay}>
              <Ionicons name="heart" size={12} color="#fff" />
              <Text style={styles.gridLikes}>{item.likes_count}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
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
  username: { fontSize: 18, fontWeight: "800", color: colors.text },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.lg,
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  followBtn: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  followingBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 15,
  },
  gridHeader: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 1,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: 1,
    position: "relative",
    overflow: "hidden",
  },
  gridImage: { width: ITEM_SIZE, height: ITEM_SIZE },
  gridNoImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  gridOverlay: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  gridLikes: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyText: { fontSize: 16, color: colors.textMuted, marginTop: spacing.md },
});
