import { describe, it, expect } from 'vitest';
import { parseArticle, resolveMediaUrls } from './article';
import fs from 'fs';
import path from 'path';

describe('Article Parser', () => {
  it('should parse a real article JSON', () => {
    // Load the sample JSON
    const jsonPath = path.resolve(__dirname, '../../post-1994480371061469306.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const tweetData = JSON.parse(jsonContent);

    // Navigate to the article result
    const articleResult = tweetData.article.article_results;
    const mediaEntities = tweetData.article.article_results.result.media_entities;

    // Parse the article
    let parsed = parseArticle(articleResult);

    // Resolve media URLs
    parsed = resolveMediaUrls(parsed, mediaEntities);

    // Assertions
    expect(parsed.title).toBe('The Complete Guide to Nano Banana Pro: 10 Tips for Professional Asset Production');
    expect(parsed.blocks.length).toBeGreaterThan(0);

    // Check for specific blocks we know exist
    const imageBlocks = parsed.blocks.filter(b => b.type === 'image');
    expect(imageBlocks.length).toBeGreaterThan(0);

    // Check if URLs were resolved
    const resolvedImages = imageBlocks.filter(b => (b as any).url && (b as any).url.startsWith('http'));
    expect(resolvedImages.length).toBe(imageBlocks.length);

    // Check for text blocks
    const textBlocks = parsed.blocks.filter(b => b.type === 'text');
    expect(textBlocks.length).toBeGreaterThan(0);
    expect((textBlocks[0] as any).text).toContain('Nano-Banana Pro is a significant leap forward');
  });
});
