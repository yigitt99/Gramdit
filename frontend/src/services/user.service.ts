import apiClient from '../api/client';

export interface UpdateProfileData {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email?: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt?: string;
}

const UserService = {
  async getMe(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/users/me');
  },

  async getProfileByUsername(username: string): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>(`/users/${username}`);
  },

  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    return apiClient.patch<ProfileResponse>('/users/profile', data);
  },

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    return apiClient.post<{ avatarUrl: string }>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getUsers(search?: string): Promise<any[]> {
    return apiClient.get<any[]>('/users', { params: { search } });
  },

  async follow(userId: string): Promise<any> {
    return apiClient.post(`/users/${userId}/follow`);
  },

  async unfollow(userId: string): Promise<any> {
    return apiClient.delete(`/users/${userId}/follow`);
  },

  async getFollowing(userId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/users/${userId}/following`);
  },
};

export default UserService;
