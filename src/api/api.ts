import {
  PUBLIC_BEARER_TOKEN,
  GUEST_ACTIVATE_URL,
  GRAPHQL_URL,
  TWEET_RESULT_BY_REST_ID,
  USER_AGENT,
} from '../utils/constants';
import { GuestTokenSchema, TweetResultSchema, Tweet } from '../types/types';

export function extractTweetId(idOrUrl: string): string {
  // If it's just numbers, assume it's an ID
  if (/^\d+$/.test(idOrUrl)) {
    return idOrUrl;
  }

  // Try to parse as URL
  try {
    const url = new URL(idOrUrl);
    // Path should be like /user/status/123456
    const parts = url.pathname.split('/');
    const statusIndex = parts.indexOf('status');
    if (statusIndex !== -1 && parts[statusIndex + 1]) {
      return parts[statusIndex + 1];
    }
    const articleIndex = parts.indexOf('article');
    if (articleIndex !== -1 && parts[articleIndex + 1]) {
      return parts[articleIndex + 1];
    }
  } catch (e) {
    // Not a valid URL, maybe a partial path?
    const match = idOrUrl.match(/(?:status|article)\/(\d+)/);
    if (match) {
      return match[1];
    }
  }

  throw new Error('Invalid tweet ID or URL');
}

export async function activateGuest(): Promise<string> {
  const response = await fetch(GUEST_ACTIVATE_URL, {
    headers: {
      Authorization: `Bearer ${PUBLIC_BEARER_TOKEN}`,
      'User-Agent': USER_AGENT,
    },
    method: 'POST',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to activate guest: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  const result = GuestTokenSchema.parse(data);
  return result.guest_token;
}

export async function fetchTweet(tweetId: string, guestToken: string): Promise<Tweet | null> {
  const { queryId, operationName, features, fieldToggles } = TWEET_RESULT_BY_REST_ID;

  const variables = {
    tweetId,
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
  };

  const url = new URL(`${GRAPHQL_URL}/${queryId}/${operationName}`);
  url.searchParams.append('variables', JSON.stringify(variables));
  url.searchParams.append('features', JSON.stringify(features));
  url.searchParams.append('fieldToggles', JSON.stringify(fieldToggles));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${PUBLIC_BEARER_TOKEN}`,
      'Content-Type': 'application/json',
      'x-twitter-active-user': 'yes',
      'x-twitter-client-language': 'en',
      'x-guest-token': guestToken,
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch tweet: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  const parsed = TweetResultSchema.safeParse(data);

  if (!parsed.success) {
    console.error('Failed to parse tweet data:', JSON.stringify(data, null, 2));
    throw parsed.error;
  }

  return parsed.data.data.tweetResult.result || null;
}

export async function getTweet(idOrUrl: string): Promise<Tweet | null> {
  const tweetId = extractTweetId(idOrUrl);
  const guestToken = await activateGuest();
  return fetchTweet(tweetId, guestToken);
}
