import { getPostSimplified } from '../src/index';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const postId = args[0] || '20'; // Default to Jack's first tweet if no ID provided

  console.log(`Fetching post: ${postId}...`);

  try {
    const post = await getPostSimplified(postId);
    if (post) {
      console.log('Successfully fetched post:');
      console.log(JSON.stringify(post, null, 2));

      // Save text to markdown file
      const filename = `${post.id}.md`;
      let fileContent = post.text;
      if (post.quotedStatus) {
        fileContent += `\n\n> Quoted Tweet from @${post.quotedStatus.author.screenName}:\n> ${post.quotedStatus.text.replace(/\n/g, '\n> ')}`;
      }
      fs.writeFileSync(filename, fileContent);
      console.log(`\nSaved article text to ${filename}`);
    } else {
      console.log('Post not found or null result.');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

main();
