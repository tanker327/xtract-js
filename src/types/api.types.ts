import { z } from "zod";

/**
 * Zod schemas and types for Twitter/X API responses
 */

/**
 * URL entity schema
 */
export const UrlEntitySchema = z.object({
  url: z.string(),
  expanded_url: z.string(),
  display_url: z.string().optional(),
  indices: z.tuple([z.number(), z.number()]),
});

/**
 * Hashtag entity schema
 */
export const HashtagEntitySchema = z.object({
  text: z.string(),
  indices: z.tuple([z.number(), z.number()]),
});

/**
 * Media entities in legacy post format
 */
export const MediaEntitiesSchema = z.object({
  media: z.array(z.any()).optional(),
  urls: z.array(UrlEntitySchema).optional(),
  hashtags: z.array(HashtagEntitySchema).optional(),
  user_mentions: z.array(z.any()).optional(),
});

/**
 * Legacy post data (common to all post types)
 */
export const LegacyPostSchema = z.object({
  full_text: z.string(),
  created_at: z.string(),
  favorite_count: z.number(),
  retweet_count: z.number(),
  reply_count: z.number(),
  entities: MediaEntitiesSchema.optional(),
});

export type UrlEntity = z.infer<typeof UrlEntitySchema>;
export type HashtagEntity = z.infer<typeof HashtagEntitySchema>;
export type MediaEntities = z.infer<typeof MediaEntitiesSchema>;
export type LegacyPost = z.infer<typeof LegacyPostSchema>;

/**
 * Forward declaration for recursive post schema (for quoted posts)
 */
export const PostSchema: z.ZodType<any> = z.lazy(() =>
  z.union([StandardPostSchema, ArticlePostSchema]),
);

/**
 * Base schema with common fields for all post types
 */
const BasePostSchema = z
  .object({
    rest_id: z.string(),
    core: z.object({
      user_results: z.object({
        result: z.object({
          is_blue_verified: z.boolean().optional(),
          legacy: z
            .object({
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
            })
            .passthrough(),
          core: z.object({
            name: z.string(),
            screen_name: z.string(),
          }),
        }),
      }),
    }),
    views: z
      .object({
        count: z.string().optional(),
      })
      .optional(),
    quoted_status_result: z
      .object({
        result: PostSchema,
      })
      .optional(),
  })
  .passthrough();

/**
 * Standard post schema (regular posts, including long-form notes)
 */
export const StandardPostSchema = BasePostSchema.extend({
  legacy: LegacyPostSchema,
  note_tweet: z
    .object({
      note_tweet_results: z
        .object({
          result: z
            .object({
              text: z.string().optional(),
            })
            .passthrough(),
        })
        .passthrough(),
    })
    .optional(),
});

/**
 * Article post schema (long-form articles with Draft.js content)
 */
export const ArticlePostSchema = BasePostSchema.extend({
  legacy: LegacyPostSchema,
  article: z.object({
    article_results: z.object({
      result: z
        .object({
          title: z.string(),
          content_state: z
            .object({
              blocks: z.array(
                z.object({
                  key: z.string(),
                  text: z.string(),
                  type: z.string(),
                  depth: z.number(),
                  inlineStyleRanges: z.array(z.any()),
                  entityRanges: z.array(z.any()),
                  data: z.any(),
                }),
              ),
              entityMap: z.any(),
            })
            .passthrough(),
          cover_media: z
            .object({
              media_info: z
                .object({
                  original_img_url: z.string(),
                })
                .optional(),
            })
            .optional(),
        })
        .passthrough(), // Use passthrough to allow media_entities
    }),
  }),
});

export type StandardPost = z.infer<typeof StandardPostSchema>;
export type ArticlePost = z.infer<typeof ArticlePostSchema>;
export type Post = z.infer<typeof PostSchema>;

/**
 * API response wrapper schema
 */
export const PostResultSchema = z.object({
  data: z.object({
    tweetResult: z.object({
      result: PostSchema.optional(),
    }),
  }),
});

export type PostResult = z.infer<typeof PostResultSchema>;
