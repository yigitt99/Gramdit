import apiClient from '../api/client';

export interface DmMember {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface DmMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface DmConversationResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: DmMember[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      username: string;
    };
  } | null;
}

const DmService = {
  /** GET /dm/conversations */
  async getConversations(): Promise<DmConversationResponse[]> {
    return apiClient.get<DmConversationResponse[]>('/dm/conversations');
  },

  /** POST /dm/conversations */
  async createConversation(userIds: string[]): Promise<DmConversationResponse> {
    return apiClient.post<DmConversationResponse>('/dm/conversations', { userIds });
  },

  /** GET /dm/conversations/:id/messages */
  async getMessages(conversationId: string): Promise<DmMessageResponse[]> {
    return apiClient.get<DmMessageResponse[]>(`/dm/conversations/${conversationId}/messages`);
  },

  /** POST /dm/conversations/:id/messages */
  async sendMessage(conversationId: string, content: string): Promise<DmMessageResponse> {
    return apiClient.post<DmMessageResponse>(`/dm/conversations/${conversationId}/messages`, { content });
  },
};

export default DmService;
