# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**xtract** is a TypeScript library for extracting X/Twitter post data. It fetches tweets/articles using Twitter's GraphQL API with guest authentication and transforms them into simplified, typed structures. The library handles both standard tweets and long-form articles with rich content.

## Common Commands

### Build & Development
- `npm run build` - Build library using tsup (outputs CJS + ESM to `dist/`)
- `npm run dev` - Build in watch mode
- `npm run lint` - Lint source code with ESLint
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run tests in watch mode with vitest
- `npm run test:run` - Run tests once (non-interactive)

### Running Examples
```bash
npx tsx examples/example.ts <tweet_id_or_url>
```

## Architecture

### Core Flow
1. **API Layer** (`src/api/api.ts`): Handles Twitter API interactions
   - `extractTweetId()` - Parses tweet IDs from URLs or raw IDs
   - `activateGuest()` - Obtains guest authentication token
   - `fetchTweet()` - Fetches tweet data via GraphQL
   - `getTweet()` - Main entry point combining above steps

2. **Type System** (`src/types/`):
   - `raw-types.ts` - Zod schemas for Twitter API responses (uses discriminated union for StandardTweet vs ArticleTweet)
   - `output-types.ts` - Simplified output interface (`SimplifiedTweet`)

3. **Transform Layer** (`src/transform/transform.ts`):
   - Converts raw Twitter data to simplified format
   - Handles both standard tweets and article tweets differently
   - Extracts media (images/videos), stats, author info, quoted tweets

4. **Article Parsing** (`src/article/article.ts`):
   - Parses Draft.js content state from article tweets
   - Converts blocks to structured format (text, image, video, divider, etc.)
   - Resolves media URLs from media_entities
   - Applies inline styles (bold, italic) and entity ranges (links) to markdown

### Key Data Structures

**Tweet Types (Union)**:
- `StandardTweet` - Regular tweets with legacy data and optional note_tweet
- `ArticleTweet` - Long-form articles with Draft.js content_state

**SimplifiedTweet Output**:
- `type`: 'post' | 'article'
- `textType`: 'text' | 'markdown' (articles are markdown)
- Includes author details, stats (likes, retweets, replies, views), media arrays, quoted status

### Twitter API Details

The library uses Twitter's public GraphQL API:
- **Authentication**: Guest token (public, no user credentials needed)
- **Endpoint**: `https://twitter.com/i/api/graphql/{queryId}/{operationName}`
- **Operation**: `TweetResultByRestId` (query ID: `kLXoXTloWpv9d2FSXRg-Tg`)
- **Bearer Token**: Hardcoded public token in `src/utils/constants.ts`

See `docs/x_post_loading_process.md` for detailed API documentation.

## Development Notes

### Type Safety
- All API responses validated with Zod schemas
- Strict TypeScript enabled in tsconfig.json
- Parse errors logged with full JSON for debugging

### Article Processing
Article tweets use Draft.js format:
- Blocks contain text with inline styles and entity ranges
- Atomic blocks represent media/embeds
- Transform layer applies markdown formatting for bold, italic, links, headers, blockquotes, lists
- Media resolution happens via `media_entities` array mapping `mediaId` to URLs

### Testing
Tests live alongside source files (e.g., `src/index.test.ts`, `src/article/article.test.ts`)
