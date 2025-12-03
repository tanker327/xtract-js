import { Tweet, SimplifiedTweet, ArticleTweet, StandardTweet, LegacyTweet } from '../types/types';
import { parseArticle, resolveMediaUrls } from '../article/article';

export function transformTweet(tweet: Tweet): SimplifiedTweet {
  let text = '';
  let images: string[] = [];
  let videos: string[] = [];
  let stats = {
    likes: 0,
    retweets: 0,
    replies: 0,
    views: tweet.views?.count ? parseInt(tweet.views.count, 10) : undefined,
  };
  let createdAt = '';

  if ('article' in tweet && tweet.article) {
    // Handle ArticleTweet
    const articleTweet = tweet as ArticleTweet;
    const articleResult = articleTweet.article.article_results;

    // Use the new parser
    let parsed = parseArticle(articleResult);

    // Resolve media URLs if media_entities exist
    // Note: The schema might need adjustment if media_entities is not strictly typed yet, 
    // but we know it exists in the data.
    const mediaEntities = (articleResult.result as any).media_entities;
    if (mediaEntities) {
      parsed = resolveMediaUrls(parsed, mediaEntities);
    }

    // Construct text from blocks
    const title = parsed.title;

    // Helper to apply inline styles and entities
    const applyInlineStyles = (text: string, inlineStyles: any[] = [], entityRanges: any[] = [], entityMap: any) => {
      if (!text) return '';

      // Create a map of character indices to style tags
      // We'll use a simple approach: split text into chars, apply tags, join back
      // But for efficiency and correctness with overlapping styles, we need to be careful.
      // A simpler approach for now:
      // 1. Sort ranges by offset
      // 2. Insert tags. 
      // But overlapping tags (e.g. bold and italic) need to be nested correctly.
      // Given the complexity, let's try a simpler approach first:
      // Just handle entities (links) and basic styles if they don't overlap too much.

      // Actually, let's build a proper segmenter.
      // Or, since this is a "transform" function, maybe we can keep it simple.

      let chars = text.split('').map(c => ({ char: c, styles: [] as string[], entity: null as any }));

      // Apply inline styles
      if (inlineStyles) {
        inlineStyles.forEach(range => {
          for (let i = range.offset; i < range.offset + range.length; i++) {
            if (i < chars.length) {
              chars[i].styles.push(range.style);
            }
          }
        });
      }

      // Apply entities (links)
      if (entityRanges && entityMap) {
        entityRanges.forEach(range => {
          // Find the entity
          let entity: any;
          if (Array.isArray(entityMap)) {
            entity = entityMap.find((e: any) => e.key === String(range.key))?.value;
          } else {
            entity = entityMap[String(range.key)];
          }

          if (entity && entity.type === 'LINK') {
            for (let i = range.offset; i < range.offset + range.length; i++) {
              if (i < chars.length) {
                chars[i].entity = entity;
              }
            }
          }
        });
      }

      // Reconstruct string with markdown
      let result = '';
      let currentStyles: string[] = [];
      let currentEntity: any = null;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];

        // Check for entity change
        if (char.entity !== currentEntity) {
          if (currentEntity) {
            result += `](${currentEntity.data.url})`;
          }
          if (char.entity) {
            result += '[';
          }
          currentEntity = char.entity;
        }

        // Check for style change
        // This is tricky with multiple styles. 
        // Let's handle BOLD and ITALIC.
        const isBold = char.styles.includes('BOLD');
        const isItalic = char.styles.includes('ITALIC');
        const wasBold = currentStyles.includes('BOLD');
        const wasItalic = currentStyles.includes('ITALIC');

        if (wasBold && !isBold) result += '**';
        if (wasItalic && !isItalic) result += '*';
        if (!wasItalic && isItalic) result += '*';
        if (!wasBold && isBold) result += '**';

        currentStyles = char.styles;
        result += char.char;
      }

      // Close remaining tags
      if (currentStyles.includes('BOLD')) result += '**';
      if (currentStyles.includes('ITALIC')) result += '*';
      if (currentEntity) result += `](${currentEntity.data.url})`;

      return result;
    };

    const body = parsed.blocks
      .map((block: any) => {
        if (block.type === 'text') {
          let text = applyInlineStyles(block.text, block.inlineStyleRanges, block.entityRanges, parsed.entityMap);

          // Apply block styles
          switch (block.style) {
            case 'header-one': return `# ${text}`;
            case 'header-two': return `## ${text}`;
            case 'header-three': return `### ${text}`;
            case 'blockquote': return `> ${text}`;
            case 'unordered-list-item': return `- ${text}`;
            case 'ordered-list-item': return `1. ${text}`; // Simplified, doesn't track index
            case 'code-block': return `\`\`\`\n${text}\n\`\`\``;
            default: return text;
          }
        }
        if (block.type === 'image') return `![Image](${block.url || 'Unresolved'})`;
        if (block.type === 'video') return `[Video: ${block.url || 'Unresolved'}]`;
        if (block.type === 'divider') return '---';
        return '';
      })
      .join('\n\n');

    text = `${title}\n\n${body}`;

    if (parsed.coverImage) {
      images.push(parsed.coverImage);
    }

    // Add inline images to the images array
    parsed.blocks.forEach((block: any) => {
      if (block.type === 'image' && block.url) {
        images.push(block.url);
      }
    });

    // Article tweets also have legacy field for stats
    // We assume legacy exists based on observation
    if ((tweet as any).legacy) {
      const legacy = (tweet as any).legacy as LegacyTweet;
      stats.likes = legacy.favorite_count;
      stats.retweets = legacy.retweet_count;
      stats.replies = legacy.reply_count;
      createdAt = legacy.created_at;
    }

  } else {
    // Handle StandardTweet
    // We can cast or just rely on the fact that if it's not article, it's standard
    // But TS might need help. 
    // Since Tweet is a union, and we checked 'article', the else branch should be StandardTweet
    // BUT StandardTweet doesn't have 'article' property, so 'article' in tweet check works.
    // However, StandardTweet has 'note_tweet' which is optional.

    const standardTweet = tweet as StandardTweet;

    text = standardTweet.note_tweet?.note_tweet_results?.result?.text || standardTweet.legacy.full_text;

    const mediaEntities = standardTweet.legacy.entities?.media || [];
    for (const entity of mediaEntities) {
      if (entity.type === 'photo') {
        images.push(entity.media_url_https);
      } else if (entity.type === 'video' || entity.type === 'animated_gif') {
        // Find best quality video
        const variants = entity.video_info?.variants || [];
        let bestVariant = null;
        let maxBitrate = -1;

        for (const variant of variants) {
          if (variant.content_type === 'application/x-mpegURL') continue; // Skip m3u8
          if (variant.bitrate && variant.bitrate > maxBitrate) {
            maxBitrate = variant.bitrate;
            bestVariant = variant;
          }
        }

        // Fallback if no bitrate (e.g. gif)
        if (!bestVariant && variants.length > 0) {
          bestVariant = variants[0];
        }

        if (bestVariant) {
          videos.push(bestVariant.url);
        }
      }
    }

    stats.likes = standardTweet.legacy.favorite_count;
    stats.retweets = standardTweet.legacy.retweet_count;
    stats.replies = standardTweet.legacy.reply_count;
    createdAt = standardTweet.legacy.created_at;
  }

  // Common author info
  const userResult = tweet.core.user_results.result;
  const author = {
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
      tweets: userResult.legacy?.statuses_count || 0,
      listed: userResult.legacy?.listed_count || 0,
      media: userResult.legacy?.media_count || 0,
    },
  };

  // If it's an article tweet, we might need to get stats/createdAt from somewhere.
  // If ArticleTweetSchema doesn't have legacy, we can't get them easily in TS.
  // I will need to update types.ts to include legacy in ArticleTweetSchema.

  // Handle quoted status
  let quotedStatus: SimplifiedTweet | undefined;
  if (tweet.quoted_status_result?.result) {
    const quotedResult = tweet.quoted_status_result.result;
    // Check if it's a valid tweet (sometimes it can be empty or restricted)
    if (quotedResult.rest_id) {
      quotedStatus = transformTweet(quotedResult);
    }
  }

  return {
    id: tweet.rest_id,
    type: 'article' in tweet && tweet.article ? 'article' : 'post',
    textType: 'article' in tweet && tweet.article ? 'markdown' : 'text',
    text,
    createdAt, // This might be empty for ArticleTweet if I don't fix the type
    author,
    stats,
    images,
    videos,
    quotedStatus,
  };
}
