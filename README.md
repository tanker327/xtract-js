# x-tract

A TypeScript library for extracting Twitter/X post data with automatic URL expansion and rich content support.

## Features

- 🔗 **Automatic URL Expansion** - Converts Twitter's t.co shortened URLs to original URLs
- 📝 **Rich Content Support** - Handles both standard posts and long-form articles
- 🎨 **Markdown Formatting** - Converts article posts to clean markdown with inline styles
- 🖼️ **Media Extraction** - Extracts images and videos with best quality selection
- 🔒 **Type Safe** - Full TypeScript support with Zod schema validation
- 🚀 **Zero Dependencies** - Only requires `zod` for runtime validation
- 🌐 **Guest Authentication** - No API keys or user credentials needed

## Installation

```bash
npm install x-tract
```

## Quick Start

```typescript
import { getPostData } from "x-tract";

// Fetch a post by ID or URL
const post = await getPostData("1996005472114278776");

console.log(post.text);
console.log(post.author.screenName);
console.log(post.images);
```

## API Reference

### `getPostData(idOrUrl: string): Promise<PostData | null>`

Fetches and parses a post into a simplified format.

**Parameters:**

- `idOrUrl` - Post ID or full Twitter/X URL

**Returns:** `PostData` object or `null` if not found

```typescript
const post = await getPostData("https://x.com/jack/status/20");
```

### `getPost(idOrUrl: string): Promise<Post | null>`

Fetches raw post data from Twitter API.

**Returns:** Raw API response (validated with Zod)

### `transformPost(post: Post): PostData`

Transforms raw post data into simplified format.

```typescript
const rawPost = await getPost("20");
const postData = transformPost(rawPost);
```

### Utility Functions

```typescript
import { extractPostId, isValidPostId, isValidPostUrl } from "x-tract";

extractPostId("https://x.com/jack/status/20"); // '20'
isValidPostId("20"); // true
isValidPostUrl("https://x.com/jack/status/20"); // true
```

## Data Types

### `PostData`

```typescript
interface PostData {
  id: string;
  type: "post" | "article";
  textType: "text" | "markdown";
  text: string;
  createdAt: string;
  author: PostAuthor;
  stats: PostStats;
  images: string[];
  videos: string[];
  quotedPost?: PostData;
}
```

### `PostAuthor`

```typescript
interface PostAuthor {
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
```

### `PostStats`

```typescript
interface PostStats {
  likes: number;
  reposts: number;
  replies: number;
  views?: number;
}
```

## Examples

### Fetch a Standard Post

```typescript
import { getPostData } from "x-tract";

const post = await getPostData("20"); // Jack's first tweet

console.log(post.text); // "just setting up my twttr"
console.log(post.author.screenName); // "jack"
console.log(post.stats.likes); // 262541
```

### Fetch a Post with Media

```typescript
const post = await getPostData("1996005472114278776");

console.log(post.text); // Text without t.co media links
console.log(post.images); // Array of image URLs
```

### Fetch a Long-Form Article

```typescript
const article = await getPostData("1234567890"); // Article post

console.log(article.type); // "article"
console.log(article.textType); // "markdown"
console.log(article.text); // Full markdown content
```

### Handle Quoted Posts

```typescript
const post = await getPostData("...");

if (post.quotedPost) {
  console.log("Quote from:", post.quotedPost.author.screenName);
  console.log("Quote text:", post.quotedPost.text);
}
```

### Extract URLs with Expansion

```typescript
// t.co URLs are automatically expanded
const post = await getPostData("1996097194655637809");

// Original: https://t.co/A2X05wF8uK
// Expanded: https://x.com/AmirMushich/status/1995542490049290680?s=20
console.log(post.text);
```

### Error Handling

```typescript
import {
  getPostData,
  PostNotFoundError,
  AuthenticationError,
  InvalidPostIdError,
} from "x-tract";

try {
  const post = await getPostData("invalid-id");
} catch (error) {
  if (error instanceof InvalidPostIdError) {
    console.error("Invalid post ID format");
  } else if (error instanceof PostNotFoundError) {
    console.error("Post not found");
  } else if (error instanceof AuthenticationError) {
    console.error("Authentication failed");
  }
}
```

## Features in Detail

### URL Expansion

Automatically replaces Twitter's t.co shortened URLs with original URLs:

- ✅ Regular links (tweets, external URLs)
- ✅ Note tweets (long-form posts)
- ✅ Media links (removed from text, available in `images`/`videos`)

### Article Support

Long-form articles are converted to markdown with:

- Text formatting (bold, italic, links)
- Headers and block quotes
- Ordered and unordered lists
- Embedded images and videos
- Cover images

### Media Resolution

Extracts media with:

- Best quality image URLs
- Highest quality video variants
- Multiple images support
- Video thumbnail extraction

## Architecture

```
x-tract/
├── client/       # API client and authentication
├── parsers/      # Post and article parsing
├── formatters/   # Markdown conversion
├── utils/        # URL expansion, ID extraction, errors
└── types/        # TypeScript type definitions
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build

# Format code
npm run format

# Run example
npx tsx examples/example.ts <post_id_or_url>
```

Example outputs are saved to `examples/results/{postId}/`:

- `{postId}.md` - Text content
- `{postId}.json` - Full data structure

## Requirements

- Node.js 18+ (for fetch API)
- TypeScript 5.0+ (for development)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Uses Twitter's GraphQL API with guest authentication
- Built with TypeScript and Zod for type safety
- Inspired by the need for clean Twitter data extraction

## Support

For issues and questions, please [open an issue](https://github.com/yourusername/x-tract/issues).

---

Made with ❤️ by Eric Wu
