# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Hashtag extraction: `PostData` now includes a `hashtags` array containing hashtag text (without the `#` symbol)
- Example script now saves raw API response as `{postId}.raw.json` for debugging

### Changed
- Streamlined CLAUDE.md documentation

## [0.1.2] - 2024-12-14

### Added
- Recursive quote post fetching with full nested quote support

## [0.1.1] - 2024-12-03

### Fixed
- Add prepare script for GitHub installs

## [0.1.0] - 2024-12-03

### Added
- Initial release
- Fetch Twitter/X posts by ID or URL
- Support for standard posts and long-form articles
- Automatic t.co URL expansion
- Article parsing with Draft.js to Markdown conversion
- Media extraction (images and videos)
- Guest authentication (no API keys required)
- Full TypeScript support with Zod schema validation
- Quoted post support

### Supported Content Types
- Standard posts (tweets)
- Long-form posts (note tweets)
- Articles with rich content (Draft.js format)
- Posts with images and videos
- Posts with quoted/embedded posts
