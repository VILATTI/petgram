import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius } from "../theme";
import { notificationsApi, Notification } from "../api/notifications";

const ACTION_TEXT = {
  liked: "liked your post",
  commented: "commented on your post",
  followed: "started following you",
};

const ACTION_ICON = {
  liked: { name: "heart", color: colors.like },
  commented: { name: "chatbubble", color: colors.secondary },
  followed: { name: "person-add", color: colors.primary },
};

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handlePress = (notification: Notification) => {
    if (notification.action === "followed") {
      navigation.navigate("UserProfile", { userId: notification.actor.id });
    } else if (notification.post_id) {
      navigation.navigate("Comments", { postId: notification.post_id });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
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
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="notifications-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const icon = ACTION_ICON[item.action];
          return (
            <TouchableOpacity style={[styles.item, !item.read && styles.itemUnread]} onPress={() => handlePress(item)}>
              {/* Unread dot */}
              {!item.read && <View style={styles.unreadDot} />}

              {/* Actor avatar */}
              <View style={styles.avatar}>
                <Ionicons name="paw" size={18} color={colors.primary} />
              </View>

              {/* Text */}
              <View style={styles.content}>
                <Text style={styles.text}>
                  <Text style={styles.username}>{item.actor.username} </Text>
                  <Text>{ACTION_TEXT[item.action]}</Text>
                </Text>
                <Text style={styles.time}>{formatTime(item.created_at)}</Text>
              </View>

              {/* Action icon */}
              <View style={[styles.actionIcon, { backgroundColor: icon.color + "20" }]}>
                <Ionicons name={icon.name as any} size={16} color={icon.color} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  title: { fontSize: 22, fontWeight: "800", color: colors.primary },
  markRead: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  itemUnread: {
    backgroundColor: "#FFF5F0",
  },
  unreadDot: {
    position: "absolute",
    left: 6,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  content: { flex: 1 },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
  username: { fontWeight: "700" },
  time: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
});
