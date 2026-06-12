import apiClient from '../api/client';

export interface CommunityResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
  };
}

export interface CommunityMemberResponse {
  id: string;
  communityId: string;
  userId: string;
  role: 'founder' | 'moderator' | 'vip' | 'member';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface CommunityBanResponse {
  id: string;
  communityId: string;
  userId: string;
  bannedById: string;
  reason: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  bannedBy: {
    id: string;
    username: string;
    fullName: string | null;
  };
}

const CommunityService = {
  async getBySlug(slug: string): Promise<CommunityResponse> {
    return apiClient.get<CommunityResponse>(`/communities/${slug}`);
  },

  async getAll(): Promise<CommunityResponse[]> {
    return apiClient.get<CommunityResponse[]>('/communities');
  },

  async getMembers(communityId: string): Promise<CommunityMemberResponse[]> {
    return apiClient.get<CommunityMemberResponse[]>(`/communities/${communityId}/members`);
  },

  async getMember(communityId: string, userId: string): Promise<CommunityMemberResponse> {
    return apiClient.get<CommunityMemberResponse>(`/communities/${communityId}/members/${userId}`);
  },

  async banUser(communityId: string, userId: string, reason?: string): Promise<CommunityBanResponse> {
    return apiClient.post<CommunityBanResponse>(`/communities/${communityId}/ban`, { userId, reason });
  },

  async unbanUser(communityId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(`/communities/${communityId}/ban/${userId}`);
  },

  async updateMemberRole(communityId: string, userId: string, role: string): Promise<CommunityMemberResponse> {
    return apiClient.patch<CommunityMemberResponse>(`/communities/${communityId}/members/${userId}/role`, { role });
  },

  async kickMember(communityId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(`/communities/${communityId}/members/${userId}`);
  },

  async getBans(communityId: string): Promise<CommunityBanResponse[]> {
    return apiClient.get<CommunityBanResponse[]>(`/communities/${communityId}/bans`);
  },

  async join(communityId: string): Promise<CommunityMemberResponse> {
    return apiClient.post<CommunityMemberResponse>(`/communities/${communityId}/join`, {});
  },

  async leave(communityId: string): Promise<void> {
    return apiClient.delete<void>(`/communities/${communityId}/leave`);
  },
};

export default CommunityService;
