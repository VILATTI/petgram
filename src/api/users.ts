import { apiClient } from "./client";
import { Post } from "./posts";

export interface Profile {
  id: number;
  username: string;
  email: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  posts: Post[];
}

export interface SearchUser {
  id: number;
  username: string;
  posts_count: number;
  followers_count: number;
  is_following: boolean;
}

export const usersApi = {
  getMe: async (): Promise<Profile> => {
    const response = await apiClient.get("/api/v1/me");
    return response.data;
  },

  getUser: async (id: number): Promise<Profile> => {
    const response = await apiClient.get(`/api/v1/users/${id}`);
    return response.data;
  },

  search: async (query: string): Promise<SearchUser[]> => {
    const response = await apiClient.get(`/api/v1/search/users?q=${query}`);
    return response.data;
  },
};
