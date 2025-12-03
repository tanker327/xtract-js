import { getTweet } from './api/api';
import { Tweet, SimplifiedTweet } from './types/types';
import { transformTweet } from './transform/transform';

export type { Tweet, SimplifiedTweet };
export { transformTweet };

export async function getPost(idOrUrl: string): Promise<Tweet | null> {
  const tweet = await getTweet(idOrUrl);
  return tweet;
}

export async function getPostSimplified(idOrUrl: string): Promise<SimplifiedTweet | null> {
  const tweet = await getPost(idOrUrl);
  return tweet ? transformTweet(tweet) : null;
}

