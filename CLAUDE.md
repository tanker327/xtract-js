# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**x-tract** is a TypeScript library for extracting Twitter/X post data. It fetches posts using Twitter's GraphQL API with guest authentication and transforms them into simplified, typed structures. The library handles both standard posts and long-form articles with rich content.

## Common Commands

### Build & Development
- `npm run build` - Build library using tsup (outputs CJS + ESM to `dist/`)
- `npm run dev` - Build in watch mode
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run tests in watch mode with vitest
- `npm run test:run` - Run tests once (non-interactive)
- `npx vitest run test/url-expander.test.ts` - Run a single test file

### Running Examples
```bash
npx tsx examples/example.ts <post_id_or_url>
```

Example outputs are saved to `examples/results/{postId}/` (gitignored).

## Architecture

```
src/
├── client/              # API client layer (network + auth)
│   ├── api-client.ts    # Main API functions (getPost, fetchPost)
│   ├── guest-auth.ts    # Guest token authentication
│   └── constants.ts     # API constants and bearer token
├── parsers/             # Data parsing layer
│   ├── post-parser.ts   # Main post transformation logic
│   ├── article-parser.ts # Article parsing (Draft.js format)
│   └── media-resolver.ts # Media URL extraction and resolution
├── formatters/          # Output formatting
│   └── markdown-formatter.ts # Draft.js to markdown conversion
├── types/               # Type definitions (centralized)
│   ├── api.types.ts     # Zod schemas for API responses
│   ├── output.types.ts  # Public output types (PostData)
│   ├── domain.types.ts  # Internal domain types
│   └── draft.types.ts   # Draft.js type definitions
├── utils/               # Pure utility functions
│   ├── id-extractor.ts  # Post ID/URL parsing
│   ├── url-expander.ts  # t.co URL expansion
│   └── errors.ts        # Custom error classes
└── index.ts             # Public API surface
```

### Core Flow

1. **ID Extraction** (`utils/id-extractor.ts`): Parses post IDs from URLs or raw IDs, supports `/status/` and `/article/` paths

2. **Authentication** (`client/guest-auth.ts`): `activateGuest()` obtains guest token from Twitter API

3. **API Client** (`client/api-client.ts`): `getPost()` fetches raw post data via GraphQL with Zod validation

4. **Post Parsing** (`parsers/post-parser.ts`): `parsePost()` transforms raw API data to `PostData`, handles quoted posts

5. **Article Parsing** (`parsers/article-parser.ts`): Parses Draft.js content from article posts

6. **Media Resolution** (`parsers/media-resolver.ts`): Extracts images/videos, selects best quality

7. **URL Expansion** (`utils/url-expander.ts`): Replaces t.co shortened URLs with originals, removes media links from text

8. **Markdown Formatting** (`formatters/markdown-formatter.ts`): Converts Draft.js styles to markdown

### Key Data Structures

**API Layer (Zod-validated)**:
- `Post` = `StandardPost | ArticlePost` (discriminated union)
- `StandardPost` - Regular posts with legacy data and optional note_tweet
- `ArticlePost` - Long-form articles with Draft.js content_state

**Output Layer**:
- `PostData` - Simplified format with `type` ('post' | 'article'), `textType` ('text' | 'markdown'), `author`, `stats`, `images`, `videos`, `quotedPost`

### Twitter API Details

- **Authentication**: Guest token (no credentials needed)
- **Endpoint**: `https://twitter.com/i/api/graphql/{queryId}/TweetResultByRestId`
- **Bearer Token**: Hardcoded in `client/constants.ts`

See `docs/x_post_loading_process.md` for detailed API documentation.

## Development Notes

- Tests located in `/test` directory
- All API responses validated with Zod schemas
- Articles use Draft.js format (blocks with inline styles and entity ranges)
- Atomic blocks represent media/embeds, resolved via `media_entities` array
