export type PostVisibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  isDemoAccount: boolean;
  createdAt: string;
};

export type PostAuthor = Pick<PublicUser, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'isDemoAccount'>;

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
  savedByMe: boolean;
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
  | 'SHARE'
  | 'MENTION'
  | 'GROUP_POST'
  | 'GROUP_JOIN'
  | 'LESSON_RECOMMENDED'
  | 'LEADERBOARD';

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
  groupId: string | null;
};

export type SavedPostDTO = {
  id: string;
  savedAt: string;
  post: PostDTO;
};

export type ContactPermission = 'EVERYONE' | 'FRIENDS' | 'NOBODY';
export type ThemePreference = 'LIGHT' | 'DARK';
export type FeedDensity = 'COMFORTABLE' | 'COMPACT';

export type SettingsDTO = {
  profile: {
    firstName: string;
    lastName: string;
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
  };
  account: {
    email: string;
    createdAt: string;
    source: 'USER' | 'GOOGLE' | 'DEMO_BOT';
  };
  privacy: {
    profileVisibility: PostVisibility;
    defaultPostVisibility: PostVisibility;
    whoCanSendFriendRequest: ContactPermission;
    whoCanMessage: ContactPermission;
  };
  notifications: {
    notifyOnMessage: boolean;
    notifyOnFriendRequest: boolean;
    notifyOnComment: boolean;
    notifyOnGroupActivity: boolean;
    notifyOnEvent: boolean;
  };
  appearance: {
    themePreference: ThemePreference;
    feedDensity: FeedDensity;
  };
};

export type GroupDTO = {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  isMember: boolean;
  role: 'OWNER' | 'MEMBER' | null;
};

export type GroupPostDTO = {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
};

export type LearningCategoryValue = 'WEB_DEVELOPMENT' | 'UI_UX_DESIGN' | 'GAME_DEVELOPMENT' | 'CAREER_SKILLS';

export type LearningLessonDTO = {
  id: string;
  title: string;
  content: string;
  order: number;
  durationMin: number;
  completed: boolean;
};

export type LearningCourseDTO = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  category: LearningCategoryValue;
  lessonCount: number;
  completedLessonCount: number;
  progressPercent: number;
  isSaved: boolean;
  lessons: LearningLessonDTO[];
};

export type GameType = 'TIC_TAC_TOE' | 'MEMORY_MATCH' | 'REACTION_TIMER';

export type GameLeaderboardEntryDTO = {
  user: PostAuthor;
  score: number;
  isMe: boolean;
};

export type InsightsDTO = {
  totalPosts: number;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  messagesSent: number;
  unreadNotifications: number;
  eventsJoined: number;
  savedPostsCount: number;
  profileCompletionPercent: number;
  weeklyActivity: { date: string; posts: number; likes: number; comments: number }[];
  topPost: PostDTO | null;
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
  bio: string | null;
  mutualFriendCount: number;
  friendshipStatus: FriendshipStatus;
  friendRequestId: string | null;
  isFollowedByMe: boolean;
};

export type SearchResultsDTO = {
  users: PostAuthor[];
  posts: PostDTO[];
  events: EventDTO[];
};
