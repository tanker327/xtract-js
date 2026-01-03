import {
  Post,
  StandardPost,
  ArticlePost,
  LegacyPost,
} from "../types/api.types";
import { PostData, PostAuthor, PostStats } from "../types/output.types";
import { ParsedArticleBlock } from "../types/domain.types";
import { parseArticle } from "./article-parser";
import { extractMediaUrls, resolveArticleMediaUrls } from "./media-resolver";
import {
  applyInlineStyles,
  applyBlockStyle,
} from "../formatters/markdown-formatter";
import { expandUrls } from "../utils/url-expander";

/**
 * Transforms raw post data from API into simplified PostData format
 *
 * @param post - Raw post data from API
 * @returns Simplified post data
 */
export function parsePost(post: Post): PostData {
  let text = "";
  let images: string[] = [];
  let videos: string[] = [];
  let stats: PostStats = {
    likes: 0,
    reposts: 0,
    replies: 0,
    views: post.views?.count ? parseInt(post.views.count, 10) : undefined,
  };
  let createdAt = "";

  // Extract hashtags from legacy entities
  const legacy = (post as any).legacy as LegacyPost;
  const hashtags: string[] =
    legacy?.entities?.hashtags?.map((h: any) => h.text) || [];

  // Check if this is an article post or standard post
  if ("article" in post && post.article) {
    // Handle article posts
    const result = parseArticlePost(post as ArticlePost);
    text = result.text;
    images = result.images;
    createdAt = result.createdAt;
  } else {
    // Handle standard posts
    const result = parseStandardPost(post as StandardPost);
    text = result.text;
    images = result.images;
    videos = result.videos;
    createdAt = result.createdAt;
  }

  // Extract common author info
  const author = extractAuthorInfo(post);

  // Extract stats from legacy field
  if (legacy) {
    stats.likes = legacy.favorite_count;
    stats.reposts = legacy.retweet_count;
    stats.replies = legacy.reply_count;
  }

  // Handle quoted posts
  let quotedPost: PostData | undefined;
  if (
    post.quoted_status_result?.result &&
    post.quoted_status_result.result.rest_id
  ) {
    try {
      quotedPost = parsePost(post.quoted_status_result.result);
    } catch (error) {
      console.error(
        `[ERROR] Failed to parse quoted post for ${post.rest_id}:`,
        {
          quotedPostId: post.quoted_status_result.result.rest_id,
          error: error instanceof Error ? error.message : error,
        },
      );
      quotedPost = undefined;
    }
  }

  return {
    id: post.rest_id,
    type: "article" in post && post.article ? "article" : "post",
    textType: "article" in post && post.article ? "markdown" : "text",
    text,
    createdAt,
    author,
    stats,
    images,
    videos,
    hashtags,
    quotedPost,
  };
}

/**
 * Parses standard (non-article) posts
 */
function parseStandardPost(post: StandardPost): {
  text: string;
  images: string[];
  videos: string[];
  createdAt: string;
} {
  // Get text content (note_tweet takes precedence over legacy)
  let text =
    post.note_tweet?.note_tweet_results?.result?.text || post.legacy.full_text;

  // Expand t.co URLs to original URLs
  // For note_tweets, URL entities are in entity_set, not legacy.entities
  const noteTweetUrls =
    post.note_tweet?.note_tweet_results?.result?.entity_set?.urls || [];
  const legacyUrls = post.legacy.entities?.urls || [];
  const urlEntities = noteTweetUrls.length > 0 ? noteTweetUrls : legacyUrls;

  const mediaEntities = post.legacy.entities?.media || [];
  text = expandUrls(text, urlEntities as any, mediaEntities);

  // Extract media
  const { images, videos } = extractMediaUrls(mediaEntities as any);

  return {
    text,
    images,
    videos,
    createdAt: post.legacy.created_at,
  };
}

/**
 * Parses article posts
 */
function parseArticlePost(post: ArticlePost): {
  text: string;
  images: string[];
  createdAt: string;
} {
  const articleResult = post.article.article_results;
  let parsed = parseArticle(articleResult);

  // Resolve media URLs if media_entities exist
  const mediaEntities = (articleResult.result as any).media_entities;
  if (mediaEntities) {
    parsed = resolveArticleMediaUrls(parsed, mediaEntities);
  }

  // Build markdown text from parsed article
  const title = parsed.title;
  const body = parsed.blocks
    .map((block: ParsedArticleBlock) =>
      formatArticleBlock(block, parsed.entityMap),
    )
    .join("\n\n");

  let text = `${title}\n\n${body}`;

  // Expand t.co URLs in article text (articles can also have URL entities in legacy)
  const urlEntities = post.legacy.entities?.urls || [];
  const legacyMediaEntities = post.legacy.entities?.media || [];
  text = expandUrls(text, urlEntities, legacyMediaEntities);

  // Collect images
  const images: string[] = [];
  if (parsed.coverImage) {
    images.push(parsed.coverImage);
  }

  // Add inline images
  parsed.blocks.forEach((block: ParsedArticleBlock) => {
    if (block.type === "image" && block.url) {
      images.push(block.url);
    }
  });

  return {
    text,
    images,
    createdAt: post.legacy.created_at,
  };
}

/**
 * Formats an article block into markdown
 */
function formatArticleBlock(block: ParsedArticleBlock, entityMap: any): string {
  if (block.type === "text") {
    let text = applyInlineStyles(
      block.text,
      block.inlineStyleRanges,
      block.entityRanges,
      entityMap,
    );
    return applyBlockStyle(text, block.style);
  }

  if (block.type === "image") {
    return `![Image](${block.url || "Unresolved"})`;
  }

  if (block.type === "video") {
    return `[Video: ${block.url || "Unresolved"}]`;
  }

  if (block.type === "divider") {
    return "---";
  }

  return "";
}

/**
 * Extracts author information from post
 */
function extractAuthorInfo(post: Post): PostAuthor {
  const userResult = post.core.user_results.result;
  return {
    name: userResult.core.name,
    screenName: userResult.core.screen_name,
    avatar: userResult.legacy?.profile_image_url_https,
    banner: userResult.legacy?.profile_banner_url,
    isBlueVerified: userResult.is_blue_verified,
    description: userResult.legacy?.description,
    location: userResult.legacy?.location,
    url: userResult.legacy?.url,
    joined: userResult.legacy?.created_at,
    stats: {
      followers: userResult.legacy?.followers_count || 0,
      following: userResult.legacy?.friends_count || 0,
      posts: userResult.legacy?.statuses_count || 0,
      listed: userResult.legacy?.listed_count || 0,
      media: userResult.legacy?.media_count || 0,
    },
  };
}
