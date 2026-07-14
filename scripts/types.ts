export interface CurrentUser {
  image: {
    png: string;
    webp: string;
  };
  username: string;
}

export interface UserComment {
  id: number;
  content: string;
  createdAt: string;
  score: number;
  user: CurrentUser;
  replyingTo?: string;
  replies: UserComment[];
}
