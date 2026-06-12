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
};

export default CommunityService;
