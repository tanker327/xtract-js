/**
 * Public output types for the xtract library
 */

/**
 * Post author information
 */
export interface PostAuthor {
  name: string;
  screenName: string;
  avatar?: string;
  banner?: string;
  isBlueVerified?: boolean;
  description?: string;
  location?: string;
  url?: string;
  joined?: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
    listed: number;
    media: number;
  };
}

/**
 * Post engagement statistics
 */
export interface PostStats {
  likes: number;
  reposts: number;
  replies: number;
  views?: number;
}

/**
 * Simplified post data structure
 * This is the main output format for the library
 */
export interface PostData {
  /** Post ID */
  id: string;

  /** Type of post: 'post' for regular posts, 'article' for long-form articles */
  type: "post" | "article";

  /** Text format: 'text' for plain text, 'markdown' for articles */
  textType: "text" | "markdown";

  /** Post content (markdown for articles, plain text for regular posts) */
  text: string;

  /** ISO timestamp of when post was created */
  createdAt: string;

  /** Author information */
  author: PostAuthor;

  /** Engagement statistics */
  stats: PostStats;

  /** Array of image URLs */
  images: string[];

  /** Array of video URLs */
  videos: string[];

  /** Array of hashtags (without the # symbol) */
  hashtags: string[];

  /** Quoted/embedded post (if present) */
  quotedPost?: PostData;
}
