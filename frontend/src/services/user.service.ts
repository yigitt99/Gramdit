import apiClient from '../api/client';

export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  bio?: string;
  website?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isPrivate?: boolean;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email?: string;
  fullName: string | null;
  bio: string | null;
  website: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt?: string;
  followerCount?: number;
  followingCount?: number;
  isPrivate?: boolean;
}

export interface FollowUserResponse {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isRequestSent: boolean;
  isRequestReceived: boolean;
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

  async uploadBanner(formData: FormData): Promise<{ bannerUrl: string }> {
    return apiClient.post<{ bannerUrl: string }>('/users/banner', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getUsers(search?: string): Promise<FollowUserResponse[]> {
    return apiClient.get<FollowUserResponse[]>('/users', { params: { search } });
  },

  /** POST /users/:id/follow */
  async follow(userId: string): Promise<{ success: boolean; isFollowing: boolean; isRequestSent: boolean }> {
    return apiClient.post(`/users/${userId}/follow`);
  },

  /** DELETE /users/:id/follow */
  async unfollow(userId: string): Promise<{ success: boolean; isFollowing: boolean; isRequestSent: boolean }> {
    return apiClient.delete(`/users/${userId}/follow`);
  },

  /** GET /users/:id/followers */
  async getFollowers(userId: string): Promise<FollowUserResponse[]> {
    return apiClient.get<FollowUserResponse[]>(`/users/${userId}/followers`);
  },

  /** GET /users/:id/following */
  async getFollowing(userId: string): Promise<FollowUserResponse[]> {
    return apiClient.get<FollowUserResponse[]>(`/users/${userId}/following`);
  },

  /** GET /users/:id/follow-status */
  async getFollowStatus(userId: string): Promise<FollowStatusResponse> {
    return apiClient.get<FollowStatusResponse>(`/users/${userId}/follow-status`);
  },

  /** GET /users/me/follow-requests */
  async getFollowRequests(): Promise<any[]> {
    return apiClient.get<any[]>('/users/me/follow-requests');
  },

  /** POST /users/me/follow-requests/:requestId/accept */
  async acceptFollowRequest(requestId: string): Promise<any> {
    return apiClient.post(`/users/me/follow-requests/${requestId}/accept`);
  },

  /** POST /users/me/follow-requests/:requestId/reject */
  async rejectFollowRequest(requestId: string): Promise<any> {
    return apiClient.post(`/users/me/follow-requests/${requestId}/reject`);
  },
};

export default UserService;
