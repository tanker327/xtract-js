import { z } from 'zod';

export const GuestTokenSchema = z.object({
  guest_token: z.string(),
});

export type GuestToken = z.infer<typeof GuestTokenSchema>;

export const TweetEntitiesSchema = z.object({
  media: z.array(z.any()).optional(),
  urls: z.array(z.any()).optional(),
  hashtags: z.array(z.any()).optional(),
  user_mentions: z.array(z.any()).optional(),
});

export const LegacyTweetSchema = z.object({
  full_text: z.string(),
  created_at: z.string(),
  favorite_count: z.number(),
  retweet_count: z.number(),
  reply_count: z.number(),
  entities: TweetEntitiesSchema.optional(),
});

export type TweetEntities = z.infer<typeof TweetEntitiesSchema>;
export type LegacyTweet = z.infer<typeof LegacyTweetSchema>;

// Basic schema for Tweet, can be expanded as needed
// Common fields shared by both types
// Forward declaration for recursion
export const TweetSchema: z.ZodType<any> = z.lazy(() => z.union([StandardTweetSchema, ArticleTweetSchema]));

// Basic schema for Tweet, can be expanded as needed
// Common fields shared by both types
const BaseTweetSchema = z.object({
  rest_id: z.string(),
  core: z.object({
    user_results: z.object({
      result: z.object({
        is_blue_verified: z.boolean().optional(),
        legacy: z.object({
          // name: z.string(),
          // screen_name: z.string(),
          profile_image_url_https: z.string().optional(),
          profile_banner_url: z.string().optional(),
          followers_count: z.number().optional(),
          friends_count: z.number().optional(),
          statuses_count: z.number().optional(),
          listed_count: z.number().optional(),
          media_count: z.number().optional(),
          description: z.string().optional(),
          url: z.string().optional(),
          location: z.string().optional(),
          created_at: z.string().optional(),
        }).passthrough(),
        core: z.object({
          name: z.string(),
          screen_name: z.string(),
        }),
      }),
    }),
  }),
  views: z.object({
    count: z.string().optional(),
  }).optional(),
  quoted_status_result: z.object({
    result: TweetSchema,
  }).optional(),
}).passthrough();

export const StandardTweetSchema = BaseTweetSchema.extend({
  legacy: LegacyTweetSchema,
  note_tweet: z.object({
    note_tweet_results: z.object({
      result: z.object({
        text: z.string().optional(),
      }).passthrough(),
    }).passthrough(),
  }).optional(),
});

export const ArticleTweetSchema = BaseTweetSchema.extend({
  legacy: LegacyTweetSchema,
  article: z.object({
    article_results: z.object({
      result: z.object({
        title: z.string(),
        content_state: z.object({
          blocks: z.array(z.object({
            key: z.string(),
            text: z.string(),
            type: z.string(),
            depth: z.number(),
            inlineStyleRanges: z.array(z.any()),
            entityRanges: z.array(z.any()),
            data: z.any(),
          })),
        }),
        cover_media: z.object({
          media_info: z.object({
            original_img_url: z.string(),
          }).optional(),
        }).optional(),
      }),
    }),
  }),
});

export type StandardTweet = z.infer<typeof StandardTweetSchema>;
export type ArticleTweet = z.infer<typeof ArticleTweetSchema>;
export type Tweet = z.infer<typeof TweetSchema>;

export const TweetResultSchema = z.object({
  data: z.object({
    tweetResult: z.object({
      result: TweetSchema.optional(),
    }),
  }),
});
export interface DraftEntity {
  type: string;
  mutability: 'MUTABLE' | 'IMMUTABLE' | 'SEGMENTED';
  data: any;
}

export interface DraftEntityMapItem {
  key: string;
  value: DraftEntity;
}

export type DraftEntityMap = DraftEntityMapItem[] | { [key: string]: DraftEntity };

export interface DraftBlock {
  key: string;
  text: string;
  type: string; // 'unstyled', 'header-one', 'atomic', etc.
  depth: number;
  inlineStyleRanges: Array<{
    offset: number;
    length: number;
    style: string;
  }>;
  entityRanges: Array<{
    offset: number;
    length: number;
    key: number | string;
  }>;
  data?: any;
}

export interface DraftContentState {
  blocks: DraftBlock[];
  entityMap: DraftEntityMap;
}
