import { apiClient } from "./client";

export const followsApi = {
  follow: async (userId: number): Promise<{ following: boolean; followers_count: number }> => {
    const response = await apiClient.post(`/api/v1/users/${userId}/follow`);
    return response.data;
  },

  unfollow: async (userId: number): Promise<{ following: boolean; followers_count: number }> => {
    const response = await apiClient.delete(`/api/v1/users/${userId}/follow`);
    return response.data;
  },
};
