import { apiClient } from "./client";

export interface Comment {
  id: number;
  body: string;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
}

export const commentsApi = {
  getComments: async (postId: number): Promise<Comment[]> => {
    const response = await apiClient.get(`/api/v1/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (postId: number, body: string): Promise<Comment> => {
    const response = await apiClient.post(`/api/v1/posts/${postId}/comments`, {
      comment: { body },
    });
    return response.data;
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/posts/${postId}/comments/${commentId}`);
  },
};
