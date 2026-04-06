import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius } from "../theme";
import { postsApi, Post } from "../api/posts";
import { usersApi, SearchUser } from "../api/users";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_WIDTH - 3) / 3;

export default function ExploreScreen({ navigation }: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await postsApi.explore();
      setPosts(data.posts);
    } catch (err) {
      console.error("Failed to load explore:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }

    setIsSearchMode(true);
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await usersApi.search(query);
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {isSearchMode ? (
        searching ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            key="list"
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="person-outline" size={48} color={colors.border} />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
              >
                <View style={styles.userAvatar}>
                  <Ionicons name="paw" size={22} color={colors.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userUsername}>@{item.username}</Text>
                  <Text style={styles.userMeta}>
                    {item.posts_count} posts · {item.followers_count} followers
                  </Text>
                </View>
                {item.is_following && (
                  <View style={styles.followingBadge}>
                    <Text style={styles.followingBadgeText}>Following</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )
      ) : /* Grid posts */
      loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          key="grid"
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="paw" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem}>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.primary },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    height: 42,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: { fontSize: 16, color: colors.textMuted, marginTop: spacing.md },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  userInfo: { flex: 1 },
  userUsername: { fontWeight: "700", color: colors.text, fontSize: 15 },
  userMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  followingBadge: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  followingBadgeText: { fontSize: 12, color: colors.text, fontWeight: "600" },
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
});
