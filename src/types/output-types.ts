export interface SimplifiedTweet {
  id: string;
  type: 'post' | 'article';
  textType: 'text' | 'markdown';
  text: string;
  createdAt: string;
  author: {
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
      tweets: number;
      listed: number;
      media: number;
    };
  };
  stats: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  images: string[];
  videos: string[];
  quotedStatus?: SimplifiedTweet;
}
