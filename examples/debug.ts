import { getPostSimplified, getPost } from '../src/index';
import fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const postId = args[0] || '1994480371061469306';

  console.log(`Fetching raw post: ${postId}...`);

  try {
    const post = await getPost(postId);
    if (post) {
      console.log('Successfully fetched post:');
      // console.log(JSON.stringify(post, null, 2));
      //save to file

      fs.writeFileSync(`./post-${postId}.json`, JSON.stringify(post, null, 2));
    } else {
      console.log('Post not found or null result.');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

main();
