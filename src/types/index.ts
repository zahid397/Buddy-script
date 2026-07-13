export type PostVisibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export type PostAuthor = Pick<PublicUser, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;

export type SharedPostSummary = {
  id: string;
  content: string;
  imageUrl: string | null;
  imageBlurHash: string | null;
  createdAt: string;
  author: PostAuthor;
} | null;

export type PostDTO = {
  id: string;
  content: string;
  imageUrl: string | null;
  imageBlurHash: string | null;
  visibility: PostVisibility;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  isMine: boolean;
  sharedFrom: SharedPostSummary;
};

export type CommentDTO = {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  replyCount: number;
};

export type ReplyDTO = {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
};

export type LikeUserDTO = PostAuthor;

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export type FriendshipStatus = 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export type FriendRequestDTO = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: PostAuthor; // the other party (sender if incoming, receiver if outgoing)
};

export type FollowUserDTO = PostAuthor & {
  followerCount: number;
  isFollowedByMe: boolean;
};

export type EventDTO = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  location: string | null;
  eventDate: string;
  createdBy: PostAuthor;
  attendeeCount: number;
  isGoing: boolean;
};

export type ConversationDTO = {
  user: PostAuthor;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    readAt: string | null;
  } | null;
  unreadCount: number;
};

export type MessageDTO = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'REPLY'
  | 'MESSAGE'
  | 'EVENT'
  | 'SHARE';

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: PostAuthor | null;
  postId: string | null;
  commentId: string | null;
  replyId: string | null;
  eventId: string | null;
};

export type ProfileDTO = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  createdAt: string;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  isMe: boolean;
  friendshipStatus: FriendshipStatus;
  friendRequestId: string | null;
  isFollowedByMe: boolean;
};

export type SuggestedUserDTO = PostAuthor & {
  friendshipStatus: FriendshipStatus;
  friendRequestId: string | null;
  isFollowedByMe: boolean;
};

export type SearchResultsDTO = {
  users: PostAuthor[];
  posts: PostDTO[];
  events: EventDTO[];
};
