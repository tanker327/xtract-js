# LLM Usage Guide for x-tract

This document is specifically designed for Large Language Models (LLMs) to understand and effectively use the x-tract library for extracting Twitter/X post data.

## Library Overview

**x-tract** is a TypeScript library that fetches and parses Twitter/X posts without requiring API keys or user authentication. It automatically expands shortened URLs, extracts media, and handles both regular posts and long-form articles.

## Core Capabilities

### What This Library Does

1. **Fetches Twitter/X posts** using guest authentication (no credentials needed)
2. **Extracts clean text** with t.co URLs automatically expanded to original URLs
3. **Parses media** (images and videos) with best quality selection
4. **Handles articles** (long-form posts) and converts them to markdown
5. **Provides type-safe data** with full TypeScript definitions
6. **Processes quoted posts** recursively

### What This Library Does NOT Do

- Does NOT post/tweet content
- Does NOT require user authentication or API keys
- Does NOT support authenticated operations (likes, follows, etc.)
- Does NOT stream real-time data
- Does NOT search or filter posts

## Installation

```bash
npm install x-tract
```

## Primary Functions

### 1. `getPostData(idOrUrl: string): Promise<PostData | null>`

**Purpose:** Fetch and parse a post in one step (recommended for most use cases)

**Input Formats:**
- Post ID: `"1996005472114278776"`
- Full URL: `"https://x.com/jack/status/20"`
- Twitter URL: `"https://twitter.com/jack/status/20"`
- Article URL: `"https://x.com/user/article/1234567890"`

**Returns:** Simplified `PostData` object or `null` if not found

**Example:**
```typescript
import { getPostData } from 'x-tract';

const post = await getPostData('20');

if (post) {
  console.log('Text:', post.text);
  console.log('Author:', post.author.screenName);
  console.log('Likes:', post.stats.likes);
  console.log('Images:', post.images);
}
```

### 2. `getPost(idOrUrl: string): Promise<Post | null>`

**Purpose:** Fetch raw API data (use when you need full API response)

**Returns:** Raw validated API response

**Example:**
```typescript
import { getPost } from 'x-tract';

const rawPost = await getPost('20');
// Returns full API structure with all metadata
```

### 3. `transformPost(post: Post): PostData`

**Purpose:** Convert raw API data to simplified format

**Use case:** When you already have raw post data from `getPost()`

**Example:**
```typescript
import { getPost, transformPost } from 'x-tract';

const raw = await getPost('20');
if (raw) {
  const parsed = transformPost(raw);
  console.log(parsed.text);
}
```

## Data Structure Reference

### PostData (Main Output Format)

```typescript
interface PostData {
  id: string;                    // Post ID
  type: 'post' | 'article';      // Post type
  textType: 'text' | 'markdown'; // Text format
  text: string;                  // Post content (with expanded URLs)
  createdAt: string;             // ISO timestamp
  author: PostAuthor;            // Author information
  stats: PostStats;              // Engagement metrics
  images: string[];              // Image URLs (best quality)
  videos: string[];              // Video URLs (best quality)
  quotedPost?: PostData;         // Quoted post (if any)
}
```

### PostAuthor

```typescript
interface PostAuthor {
  name: string;              // Display name
  screenName: string;        // @username
  avatar?: string;           // Profile image URL
  banner?: string;           // Profile banner URL
  isBlueVerified?: boolean;  // Verification status
  description?: string;      // Bio
  location?: string;         // Location
  url?: string;              // Profile URL
  joined?: string;           // Account creation date
  stats: {
    followers: number;
    following: number;
    posts: number;
    listed: number;
    media: number;
  };
}
```

### PostStats

```typescript
interface PostStats {
  likes: number;
  reposts: number;
  replies: number;
  views?: number;  // May be undefined for older posts
}
```

## Common Use Cases

### Use Case 1: Extract Post Text with Expanded URLs

**Scenario:** You need the clean text content with all t.co links expanded

```typescript
import { getPostData } from 'x-tract';

async function getExpandedText(postUrl: string) {
  const post = await getPostData(postUrl);
  return post?.text; // t.co URLs automatically expanded
}

// Example:
const text = await getExpandedText('https://x.com/user/status/123');
// Returns: "Check this article: https://example.com/full-url"
// Instead of: "Check this article: https://t.co/abc123"
```

### Use Case 2: Download All Images from a Post

**Scenario:** Extract all image URLs for downloading

```typescript
import { getPostData } from 'x-tract';

async function getPostImages(postId: string) {
  const post = await getPostData(postId);

  if (!post) return [];

  return post.images; // Array of full-resolution image URLs
}

// Example:
const images = await getPostImages('1996005472114278776');
// Returns: ["https://pbs.twimg.com/media/G7M8ZiMasAA9hB-.jpg"]
```

### Use Case 3: Get Author Information

**Scenario:** Extract author profile data

```typescript
import { getPostData } from 'x-tract';

async function getAuthorInfo(postId: string) {
  const post = await getPostData(postId);

  if (!post) return null;

  return {
    username: post.author.screenName,
    displayName: post.author.name,
    followers: post.author.stats.followers,
    verified: post.author.isBlueVerified,
    bio: post.author.description,
  };
}
```

### Use Case 4: Extract Long-Form Article

**Scenario:** Get markdown content from Twitter/X articles

```typescript
import { getPostData } from 'x-tract';

async function getArticleContent(articleUrl: string) {
  const post = await getPostData(articleUrl);

  if (!post || post.type !== 'article') {
    return null;
  }

  return {
    title: post.text.split('\n\n')[0], // First line is title
    markdown: post.text,                // Full markdown content
    images: post.images,                // Article images
  };
}
```

### Use Case 5: Get Engagement Metrics

**Scenario:** Track post performance

```typescript
import { getPostData } from 'x-tract';

async function getEngagement(postId: string) {
  const post = await getPostData(postId);

  if (!post) return null;

  return {
    likes: post.stats.likes,
    retweets: post.stats.reposts,
    replies: post.stats.replies,
    views: post.stats.views,
    engagementRate: post.stats.views
      ? (post.stats.likes + post.stats.reposts + post.stats.replies) / post.stats.views
      : 0,
  };
}
```

### Use Case 6: Handle Quoted Posts

**Scenario:** Extract both main post and quoted post

```typescript
import { getPostData } from 'x-tract';

async function getPostWithQuote(postId: string) {
  const post = await getPostData(postId);

  if (!post) return null;

  return {
    mainPost: {
      author: post.author.screenName,
      text: post.text,
    },
    quotedPost: post.quotedPost ? {
      author: post.quotedPost.author.screenName,
      text: post.quotedPost.text,
    } : null,
  };
}
```

### Use Case 7: Batch Process Multiple Posts

**Scenario:** Fetch and analyze multiple posts

```typescript
import { getPostData } from 'x-tract';

async function analyzePosts(postIds: string[]) {
  const results = await Promise.all(
    postIds.map(id => getPostData(id))
  );

  return results
    .filter(post => post !== null)
    .map(post => ({
      id: post.id,
      author: post.author.screenName,
      text: post.text,
      engagement: post.stats.likes + post.stats.reposts,
    }));
}

// Example:
const analysis = await analyzePosts(['20', '123', '456']);
```

## Error Handling

### Error Types

```typescript
import {
  getPostData,
  PostNotFoundError,
  AuthenticationError,
  InvalidPostIdError,
  ParseError,
  XtractError, // Base error class
} from 'x-tract';
```

### Recommended Error Handling Pattern

```typescript
import { getPostData, PostNotFoundError, InvalidPostIdError } from 'x-tract';

async function safeGetPost(idOrUrl: string) {
  try {
    const post = await getPostData(idOrUrl);

    if (!post) {
      return { success: false, error: 'Post not found or deleted' };
    }

    return { success: true, data: post };

  } catch (error) {
    if (error instanceof InvalidPostIdError) {
      return { success: false, error: 'Invalid post ID or URL format' };
    }

    if (error instanceof PostNotFoundError) {
      return { success: false, error: 'Post does not exist' };
    }

    return { success: false, error: 'Unknown error occurred' };
  }
}
```

## Utility Functions

### Extract Post ID from URL

```typescript
import { extractPostId, isValidPostId, isValidPostUrl } from 'x-tract';

// Extract ID from various formats
extractPostId('https://x.com/jack/status/20');        // Returns: '20'
extractPostId('20');                                   // Returns: '20'
extractPostId('https://twitter.com/user/status/123'); // Returns: '123'

// Validate formats
isValidPostId('20');                                   // true
isValidPostId('not-a-number');                        // false

isValidPostUrl('https://x.com/jack/status/20');       // true
isValidPostUrl('https://example.com');                // false
```

## Key Behavioral Notes for LLMs

### URL Expansion

**Important:** The library automatically expands ALL t.co URLs to their original destinations:

- Regular t.co links → Expanded to full URL
- Media t.co links → Removed from text (images/videos available in separate arrays)

**Example:**
```
Input:  "Check this out https://t.co/abc123 https://t.co/img456"
Output: "Check this out https://example.com/full-article"
        + images: ["https://pbs.twimg.com/media/..."]
```

### Post Types

The library handles two distinct post types:

1. **Regular Posts** (`type: 'post'`)
   - `textType: 'text'`
   - Plain text content
   - May have images/videos

2. **Article Posts** (`type: 'article'`)
   - `textType: 'markdown'`
   - Markdown formatted content
   - Rich formatting (headers, bold, lists, etc.)
   - Cover images and inline media

### Null Returns

Functions return `null` when:
- Post doesn't exist (404)
- Post was deleted
- Post is private/restricted
- Network errors occur

Always check for null before accessing properties.

### Performance Considerations

- Each request requires guest authentication (adds ~200-500ms)
- Rate limits apply (guest token based)
- Batch requests carefully (use Promise.all for concurrent fetches)
- Cache results when possible

## Testing Your Implementation

### Reliable Test Posts

```typescript
// Jack's first tweet (guaranteed to exist)
const test1 = await getPostData('20');

// Post with media
const test2 = await getPostData('1996005472114278776');

// Invalid post (should return null)
const test3 = await getPostData('999999999999999999');
```

## Common Pitfalls for LLMs

### ❌ Don't Do This

```typescript
// Don't assume post exists without checking
const post = await getPostData('123');
console.log(post.text); // ERROR if post is null

// Don't forget to handle errors
const post = await getPostData('invalid'); // Throws InvalidPostIdError
```

### ✅ Do This Instead

```typescript
// Always check for null
const post = await getPostData('123');
if (post) {
  console.log(post.text);
}

// Handle errors properly
try {
  const post = await getPostData(userInput);
  if (post) {
    // Use post data
  }
} catch (error) {
  // Handle error
}
```

## Integration Examples

### With Web Scraping Workflows

```typescript
import { getPostData } from 'x-tract';

// Extract post, download images, save text
async function archivePost(postUrl: string) {
  const post = await getPostData(postUrl);

  if (!post) return null;

  // Download images (pseudo-code)
  for (const imageUrl of post.images) {
    await downloadImage(imageUrl, `${post.id}_${index}.jpg`);
  }

  // Save metadata
  await saveToFile(`${post.id}.json`, JSON.stringify(post, null, 2));

  return post;
}
```

### With Data Analysis

```typescript
import { getPostData } from 'x-tract';

// Analyze sentiment of multiple posts
async function analyzeSentiment(postIds: string[]) {
  const posts = await Promise.all(postIds.map(id => getPostData(id)));

  return posts
    .filter(p => p !== null)
    .map(post => ({
      id: post.id,
      text: post.text,
      engagement: post.stats.likes + post.stats.reposts,
      // Add your sentiment analysis here
    }));
}
```

### With Content Summarization

```typescript
import { getPostData } from 'x-tract';

// Get thread and summarize
async function summarizeThread(postIds: string[]) {
  const posts = await Promise.all(postIds.map(id => getPostData(id)));

  const threadText = posts
    .filter(p => p !== null)
    .map(p => p.text)
    .join('\n\n');

  // Feed to your summarization model
  return summarizeText(threadText);
}
```

## Quick Reference Cheat Sheet

```typescript
// Basic usage
import { getPostData } from 'x-tract';
const post = await getPostData('POST_ID_OR_URL');

// Access common fields
post?.text           // Post content (URLs expanded)
post?.author.screenName  // @username
post?.stats.likes    // Like count
post?.images         // Array of image URLs
post?.videos         // Array of video URLs
post?.quotedPost     // Quoted post (if any)

// Check post type
if (post?.type === 'article') {
  // It's a long-form article with markdown
}

// Extract post ID from URL
import { extractPostId } from 'x-tract';
const id = extractPostId(url);

// Validate input
import { isValidPostId, isValidPostUrl } from 'x-tract';
if (isValidPostId(input)) { /* ... */ }
if (isValidPostUrl(input)) { /* ... */ }
```

## Limitations & Constraints

1. **Guest Authentication Only**
   - Cannot access protected/private posts
   - Subject to Twitter's rate limits
   - May occasionally fail if guest token generation fails

2. **Read-Only**
   - Cannot post, like, retweet, or follow
   - Cannot access user timelines or search

3. **Single Post Focus**
   - Fetches one post at a time
   - No built-in threading/conversation support
   - Must handle batching manually

4. **Network Dependent**
   - Requires active internet connection
   - Twitter API must be accessible
   - No offline mode

## Troubleshooting

### Post Returns Null

**Possible causes:**
- Post doesn't exist
- Post is private/protected
- Post was deleted
- Invalid post ID format

**Solution:**
```typescript
const post = await getPostData(id);
if (!post) {
  console.log('Post not found or inaccessible');
}
```

### Authentication Errors

**Cause:** Guest token generation failed

**Solution:**
```typescript
import { getPostData, AuthenticationError } from 'x-tract';

try {
  const post = await getPostData(id);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Retry after a delay
    await sleep(2000);
    const post = await getPostData(id);
  }
}
```

### Invalid Post ID Errors

**Cause:** Malformed input

**Solution:**
```typescript
import { extractPostId, isValidPostId } from 'x-tract';

// Validate before fetching
if (isValidPostId(input)) {
  const post = await getPostData(input);
}
```

## Summary for LLMs

When using x-tract:

1. ✅ Use `getPostData()` for most cases
2. ✅ Always check for null returns
3. ✅ Handle errors with try-catch
4. ✅ URLs are automatically expanded
5. ✅ Media is in separate arrays
6. ✅ Check `post.type` for articles
7. ❌ Don't assume posts exist
8. ❌ Don't forget error handling
9. ❌ Don't use for posting content
10. ❌ Don't expect real-time updates

---

**Library Version:** 0.0.1
**Documentation Last Updated:** December 2025
**GitHub:** https://github.com/tanker327/x-tract
**npm:** https://www.npmjs.com/package/x-tract
