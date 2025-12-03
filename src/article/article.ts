import { DraftEntity, DraftContentState, DraftBlock, DraftEntityMap } from '../types/types';

// --- Parsed Output Types ---

export type ArticleBlockType = 'text' | 'image' | 'video' | 'tweet' | 'divider' | 'unknown';

export interface BaseArticleBlock {
  type: ArticleBlockType;
  key: string;
}

export interface InlineStyleRange {
  offset: number;
  length: number;
  style: string;
}

export interface EntityRange {
  offset: number;
  length: number;
  key: number | string;
}

export interface TextArticleBlock extends BaseArticleBlock {
  type: 'text';
  text: string;
  style?: string; // 'header-one', 'blockquote', etc.
  inlineStyleRanges?: InlineStyleRange[];
  entityRanges?: EntityRange[];
}

export interface ImageArticleBlock extends BaseArticleBlock {
  type: 'image';
  url: string;
  width?: number;
  height?: number;
  mediaId?: string;
}

export interface VideoArticleBlock extends BaseArticleBlock {
  type: 'video';
  url: string;
  poster?: string;
  mediaId?: string;
}

export interface TweetArticleBlock extends BaseArticleBlock {
  type: 'tweet';
  tweetId: string;
}

export interface DividerArticleBlock extends BaseArticleBlock {
  type: 'divider';
}

export interface UnknownArticleBlock extends BaseArticleBlock {
  type: 'unknown';
}

export type ParsedArticleBlock =
  | TextArticleBlock
  | ImageArticleBlock
  | VideoArticleBlock
  | TweetArticleBlock
  | DividerArticleBlock
  | UnknownArticleBlock;

export interface ParsedArticle {
  title: string;
  blocks: ParsedArticleBlock[];
  coverImage?: string;
  entityMap?: DraftEntityMap;
}

// --- Parsing Logic ---

export function parseArticle(articleResult: { result: any } | any): ParsedArticle {
  const result = articleResult.result || articleResult;
  const title = result.title || '';
  const coverImage = result.cover_media?.media_info?.original_img_url;

  const contentState = result.content_state as DraftContentState;
  const blocks: ParsedArticleBlock[] = [];

  if (!contentState || !contentState.blocks) {
    return { title, blocks: [], coverImage };
  }

  // Helper to get entity
  const getEntity = (key: string | number): DraftEntity | undefined => {
    if (!contentState.entityMap) return undefined;

    if (Array.isArray(contentState.entityMap)) {
      const item = contentState.entityMap.find(e => e.key === String(key));
      return item ? item.value : undefined;
    }

    return contentState.entityMap[String(key)];
  };

  for (const block of contentState.blocks) {
    if (block.type === 'atomic') {
      // Atomic blocks usually have an entity associated with them
      // The entity key is often in entityRanges, but sometimes the block text is just a placeholder char
      // and the entity is at offset 0.

      let entityKey: string | number | undefined;
      if (block.entityRanges.length > 0) {
        entityKey = block.entityRanges[0].key;
      }

      if (entityKey !== undefined) {
        const entity = getEntity(entityKey);
        if (entity) {
          const parsedBlock = parseAtomicEntity(block.key, entity);
          if (parsedBlock) {
            blocks.push(parsedBlock);
          }
        }
      }
    } else {
      // Text block
      blocks.push({
        type: 'text',
        key: block.key,
        text: block.text,
        style: block.type !== 'unstyled' ? block.type : undefined,
        inlineStyleRanges: block.inlineStyleRanges,
        entityRanges: block.entityRanges,
      });
    }
  }

  return {
    title,
    blocks,
    coverImage,
    entityMap: contentState.entityMap,
  };
}

function parseAtomicEntity(blockKey: string, entity: DraftEntity): ParsedArticleBlock | null {
  const { type, data } = entity;

  if (type === 'MEDIA') {
    // Check for specific media types in data
    // Based on analysis: mediaItems array contains objects with mediaCategory
    if (data.mediaItems && Array.isArray(data.mediaItems) && data.mediaItems.length > 0) {
      const mediaItem = data.mediaItems[0];

      if (mediaItem.mediaCategory === 'DraftTweetImage') {
        return {
          type: 'image',
          key: blockKey,
          mediaId: mediaItem.mediaId,
          url: '', // Needs resolution from media_entities
        };
      }

      if (mediaItem.mediaCategory === 'DraftTweetGif' || mediaItem.mediaCategory === 'DraftTweetVideo') {
        return {
          type: 'video',
          key: blockKey,
          mediaId: mediaItem.mediaId,
          url: '', // Needs resolution
        };
      }
    }
  }

  if (type === 'TWEMOJI') {
    // Treat as image or text? Usually inline, but if atomic block, maybe image.
    if (data.url) {
      return {
        type: 'image',
        key: blockKey,
        url: data.url,
      };
    }
  }

  if (type === 'DIVIDER') {
    return {
      type: 'divider',
      key: blockKey,
    };
  }

  // Fallback for unknown entities
  return {
    type: 'unknown',
    key: blockKey,
  };
}

// Helper to resolve media URLs using the top-level media_entities
export function resolveMediaUrls(parsedArticle: ParsedArticle, mediaEntities: Array<{ media_id: string; media_info?: { original_img_url: string } }>): ParsedArticle {
  if (!mediaEntities || !Array.isArray(mediaEntities)) return parsedArticle;

  const mediaMap = new Map<string, string>();
  for (const media of mediaEntities) {
    if (media.media_id && media.media_info?.original_img_url) {
      mediaMap.set(media.media_id, media.media_info.original_img_url);
    }
    // Handle video variants if needed, for now just images
  }

  const newBlocks = parsedArticle.blocks.map(block => {
    if (block.type === 'image' && block.mediaId) {
      const url = mediaMap.get(block.mediaId);
      if (url) {
        return { ...block, url };
      }
    }
    return block;
  });

  return {
    ...parsedArticle,
    blocks: newBlocks,
  };
}
