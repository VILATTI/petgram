import { apiClient } from "./client";

export interface Notification {
  id: number;
  action: "liked" | "commented" | "followed";
  read: boolean;
  created_at: string;
  actor: {
    id: number;
    username: string;
  };
  post_id: number | null;
}

export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get("/api/v1/notifications");
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch("/api/v1/notifications/mark_all_read");
  },
};
