import { apiClient } from "./client";

export interface Post {
  id: number;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_current_user: boolean;
  image_url: string | null;
  user: {
    id: number;
    username: string;
  };
}

export interface PaginatedPosts {
  posts: Post[];
  meta: {
    current_page: number;
    total_pages: number;
    has_next: boolean;
  };
}

export const postsApi = {
  getFeed: async (page = 1): Promise<PaginatedPosts> => {
    const response = await apiClient.get(`/api/v1/posts?page=${page}`);
    return response.data;
  },

  explore: async (page = 1): Promise<PaginatedPosts> => {
    const response = await apiClient.get(`/api/v1/explore?page=${page}`);
    return response.data;
  },

  createPost: async (caption: string, imageUri?: string): Promise<Post> => {
    const form = new FormData();
    form.append("post[caption]", caption);
    if (imageUri) {
      form.append("post[image]", {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);
    }
    const response = await apiClient.post("/api/v1/posts", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  likePost: async (postId: number): Promise<void> => {
    await apiClient.post(`/api/v1/posts/${postId}/like`);
  },

  unlikePost: async (postId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/posts/${postId}/like`);
  },
};
