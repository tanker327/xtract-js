import { describe, it, expect } from 'vitest';
import { getPost, getPostSimplified } from './index';
import { extractTweetId } from './api/api';
import { Tweet } from './types/types';

describe('utils', () => {
  it('should extract tweet ID from URL', () => {
    expect(extractTweetId('https://twitter.com/user/status/123456')).toBe('123456');
    expect(extractTweetId('https://x.com/user/status/123456?s=20')).toBe('123456');
    expect(extractTweetId('https://x.com/i/article/1863039430268506540')).toBe('1863039430268506540');
    expect(extractTweetId('123456')).toBe('123456');
  });

  it('should throw on invalid input', () => {
    expect(() => extractTweetId('invalid')).toThrow();
    expect(() => extractTweetId('https://google.com')).toThrow();
  });
});

describe('xtract', () => {
  it('should fetch a real tweet', async () => {
    // Jack's first tweet
    const tweetId = '20';
    const tweet = await getPost(tweetId);

    expect(tweet).toBeDefined();
    expect(tweet?.rest_id).toBe(tweetId);
    expect(tweet?.legacy.full_text).toContain('just setting up my twttr');
    expect(tweet?.core.user_results.result.core.screen_name).toBe('jack');
  });
});

