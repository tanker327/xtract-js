import { getPost, getPostData, PostData } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively format quoted posts with indentation
 */
function formatQuotedPosts(post: PostData, depth: number): string {
  if (!post.quotedPost) {
    return '';
  }

  const indent = '  '.repeat(depth);
  let result = '\n\n';
  result += `${indent}> **Quoted Post from @${post.quotedPost.author.screenName}:**\n`;
  result += `${indent}> ${post.quotedPost.text.replace(/\n/g, `\n${indent}> `)}`;

  // Recursively format nested quotes
  result += formatQuotedPosts(post.quotedPost, depth + 1);

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const postId = args[0] || '20'; // Default to Jack's first tweet if no ID provided

  console.log(`Fetching post: ${postId}...`);

  try {
    // Fetch both raw and parsed data
    const [rawPost, post] = await Promise.all([
      getPost(postId),
      getPostData(postId),
    ]);

    if (post) {
      console.log('Successfully fetched post:');
      console.log(JSON.stringify(post, null, 2));

      // Create results directory structure: examples/results/{postId}/
      const resultsDir = path.join(__dirname, 'results', post.id);
      fs.mkdirSync(resultsDir, { recursive: true });

      // Save text to markdown file with recursive quotes
      const mdFilename = path.join(resultsDir, `${post.id}.md`);
      let fileContent = post.text;
      fileContent += formatQuotedPosts(post, 0);
      fs.writeFileSync(mdFilename, fileContent);

      // Save parsed JSON response
      const jsonFilename = path.join(resultsDir, `${post.id}.json`);
      fs.writeFileSync(jsonFilename, JSON.stringify(post, null, 2));

      // Save raw API response
      if (rawPost) {
        const rawJsonFilename = path.join(resultsDir, `${post.id}.raw.json`);
        fs.writeFileSync(rawJsonFilename, JSON.stringify(rawPost, null, 2));
        console.log(`\nSaved results to ${resultsDir}/`);
        console.log(`  - ${post.id}.md (text content)`);
        console.log(`  - ${post.id}.json (parsed data)`);
        console.log(`  - ${post.id}.raw.json (raw API response)`);
      } else {
        console.log(`\nSaved results to ${resultsDir}/`);
        console.log(`  - ${post.id}.md (text content)`);
        console.log(`  - ${post.id}.json (parsed data)`);
      }
    } else {
      console.log('Post not found or null result.');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

main();
