import { apiClient } from "./client";

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  username: string;
}

export const authApi = {
  login: async (params: LoginParams) => {
    const response = await apiClient.post("/users/login", { user: params });
    const token = response.headers["authorization"]?.replace("Bearer ", "");
    return { user: response.data.user, token };
  },

  register: async (params: RegisterParams) => {
    const response = await apiClient.post("/users/signup", { user: params });
    const token = response.headers["authorization"]?.replace("Bearer ", "");
    return { user: response.data.user, token };
  },

  logout: async () => {
    await apiClient.delete("/users/logout");
  },
};
