export class CommunityListItemDto {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount?: number;
}
