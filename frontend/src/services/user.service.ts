import apiClient from '../api/client';

export interface UpdateProfileData {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

const UserService = {
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
};

export default UserService;
