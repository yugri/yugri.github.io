#!/usr/bin/env node

import 'dotenv/config';
import { Client } from '@notionhq/client';
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const DEFAULT_LANG = 'en';
const SUPPORTED_LANGS = new Set(['en', 'uk']);

// Notion configuration
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Debug: Show the database ID being used (first and last 8 characters for security)
if (DATABASE_ID) {
  const maskedId = DATABASE_ID.length > 16 
    ? `${DATABASE_ID.slice(0, 8)}...${DATABASE_ID.slice(-8)}`
    : DATABASE_ID;
  console.log(`🔗 Using database ID: ${maskedId}`);
} else {
  console.log('❌ No DATABASE_ID found in environment variables');
}

/**
 * Convert Notion rich text to markdown
 */
function richTextToMarkdown(richTextArray) {
  return richTextArray.map(block => {
    let text = block.text.content;
    
    if (block.annotations.bold && block.annotations.italic) {
      text = `***${text}***`;
    } else if (block.annotations.bold) {
      text = `**${text}**`;
    } else if (block.annotations.italic) {
      text = `*${text}*`;
    }
    
    if (block.annotations.code) {
      text = `\`${text}\``;
    }
    
    if (block.text.link) {
      text = `[${text}](${block.text.link.url})`;
    }
    
    return text;
  }).join('');
}

/**
 * Convert Notion blocks to markdown
 */
function blocksToMarkdown(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        const paragraphText = richTextToMarkdown(block.paragraph.rich_text);
        return paragraphText ? `${paragraphText}\n\n` : '';
        
      case 'heading_1':
        const h1Text = richTextToMarkdown(block.heading_1.rich_text);
        return `# ${h1Text}\n\n`;
        
      case 'heading_2':
        const h2Text = richTextToMarkdown(block.heading_2.rich_text);
        return `## ${h2Text}\n\n`;
        
      case 'heading_3':
        const h3Text = richTextToMarkdown(block.heading_3.rich_text);
        return `### ${h3Text}\n\n`;
        
      case 'bulleted_list_item':
        const bulletText = richTextToMarkdown(block.bulleted_list_item.rich_text);
        return `- ${bulletText}\n`;
        
      case 'numbered_list_item':
        const numberText = richTextToMarkdown(block.numbered_list_item.rich_text);
        return `1. ${numberText}\n`;
        
      case 'code':
        const codeText = block.code.rich_text.map(t => t.text.content).join('');
        return `\`\`\`${block.code.language}\n${codeText}\n\`\`\`\n\n`;
        
      case 'image':
        const imageUrl = block.image.external?.url || block.image.file?.url;
        return `![Image](${imageUrl})\n\n`;
        
      default:
        return '';
    }
  }).join('');
}

/**
 * Get all pages from Notion database
 */
async function getNotionPages() {
  try {
    console.log('🔍 Searching for pages in your Notion database...');
    
    // Use search API to find all pages, then filter for our database
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    console.log(`📄 Found ${searchResponse.results.length} pages total in your workspace`);
    
    // Filter for pages in our specific database
    console.log(`🔍 Checking ${searchResponse.results.length} pages against database ID: ${DATABASE_ID}`);
    
    const databasePages = searchResponse.results.filter(page => {
      // Debug: Show info about each page
      const parentDbId = page.parent?.database_id;
      const pageTitle = page.properties?.Title?.title?.[0]?.text?.content || 'Untitled';
      
      // Normalize database IDs (remove dashes for comparison)
      const normalizedParentId = parentDbId?.replace(/-/g, '');
      const normalizedExpectedId = DATABASE_ID.replace(/-/g, '');
      
      console.log(`📄 Page: "${pageTitle}"`);
      console.log(`   Parent DB ID: ${parentDbId} → ${normalizedParentId}`);
      console.log(`   Expected DB ID: ${DATABASE_ID} → ${normalizedExpectedId}`);
      console.log(`   Match: ${normalizedParentId === normalizedExpectedId ? '✅' : '❌'}`);
      
      // Check if page belongs to our database
      if (!parentDbId || normalizedParentId !== normalizedExpectedId) {
        return false;
      }
      return true;
    });
    
    console.log(`📋 Found ${databasePages.length} pages in your database`);
    
    if (databasePages.length === 0) {
      console.log('❗ No pages found in your database. Make sure:');
      console.log('   1. You have created at least one page in your database');
      console.log('   2. Your NOTION_DATABASE_ID is correct');
      console.log('   3. Your integration has access to the database');
      return [];
    }
    
    console.log(`🗂️ Returning ${databasePages.length} pages (published + drafts) for processing`);
    
    return databasePages;
    
  } catch (error) {
    console.error('❌ Error searching for pages:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.log('🔐 Authentication failed. Please check:');
      console.log('   1. Your NOTION_TOKEN is correct');
      console.log('   2. Your integration is still active');
    } else if (error.message.includes('notion.errors.rest_error')) {
      console.log('🚫 API error. Please check:');
      console.log('   1. Your NOTION_DATABASE_ID is correct');
      console.log('   2. Your integration has access to the database');
      console.log('   3. The database exists and is shared with your integration');
    }
    
    return [];
  }
}

/**
 * Get page content blocks
 */
async function getPageBlocks(pageId) {
  try {
    const allBlocks = [];
    let cursor = undefined;

    do {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100, // Maximum allowed by Notion API
      });

      allBlocks.push(...response.results);
      cursor = response.next_cursor;
    } while (cursor);

    return allBlocks;
  } catch (error) {
    console.error('Error fetching page blocks:', error);
    return [];
  }
}

function extractMetadata(properties) {
  const title = properties.Title?.title?.[0]?.text?.content || 'Untitled';
  const description = properties.Description?.rich_text?.[0]?.text?.content || '';
  const pubDate = properties['Published Date']?.date?.start || new Date().toISOString().split('T')[0];
  const heroImage = properties['Hero Image']?.url || '';
  const slug =
    properties.Slug?.rich_text?.[0]?.text?.content ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const tags = properties.Tags?.multi_select?.map((tag) => tag.name) || [];
  const languageRaw = properties.Language?.select?.name?.toLowerCase() ?? DEFAULT_LANG;
  const lang = SUPPORTED_LANGS.has(languageRaw) ? languageRaw : DEFAULT_LANG;
  const published = properties.Published?.checkbox ?? false;

  return {
    title,
    description,
    pubDate,
    heroImage,
    slug,
    tags,
    lang,
    published,
  };
}

async function convertPageToMarkdown(page, metadata = extractMetadata(page.properties)) {
  const { title, description, pubDate, heroImage, slug, tags, lang } = metadata;

  const blocks = await getPageBlocks(page.id);
  const content = blocksToMarkdown(blocks);

  const frontmatter = `---
title: '${title.replace(/'/g, "\\'")}'
description: '${description.replace(/'/g, "\\'")}'
publishDate: '${pubDate}'${heroImage ? `\ncoverImage:\n  src: '${heroImage}'\n  alt: '${title}'` : ''}${tags.length > 0 ? `\ntags:\n${tags.map((tag) => `  - ${tag}`).join('\n')}` : ''}
lang: '${lang}'
notionId: '${page.id}'
---
`;

  return {
    slug,
    content: frontmatter + '\n' + content,
    lang,
  };
}

function getOutputPaths(postDir, slug, lang) {
  if (lang === DEFAULT_LANG) {
    return {
      target: join(postDir, `${slug}.md`),
      dirToEnsure: postDir,
    };
  }

  const localizedDir = join(postDir, lang, slug);
  return {
    target: join(localizedDir, 'index.md'),
    dirToEnsure: localizedDir,
  };
}

function deleteFileAndEmptyDirs(filePath, postDir) {
  if (!existsSync(filePath)) {
    return;
  }

  rmSync(filePath, { force: true });

  const stopDir = resolve(postDir);
  let currentDir = dirname(filePath);

  while (currentDir.startsWith(stopDir) && currentDir !== stopDir) {
    try {
      if (readdirSync(currentDir).length === 0) {
        rmSync(currentDir, { recursive: true });
        currentDir = dirname(currentDir);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

function extractFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  return match ? match[1] : null;
}

function readNotionIdFromFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter) {
      return null;
    }

    const idMatch = frontmatter.match(/notionId:\s*['"]?([0-9a-f-]{32,})['"]?/i);
    return idMatch ? idMatch[1] : null;
  } catch {
    return null;
  }
}

function buildNotionFileIndex(rootDir) {
  const index = new Map();

  if (!existsSync(rootDir)) {
    return index;
  }

  const stack = [rootDir];
  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const notionId = readNotionIdFromFile(entryPath);
        if (notionId) {
          index.set(notionId, entryPath);
        }
      }
    }
  }

  return index;
}

/**
 * Main sync function
 */
async function syncFromNotion() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.error('Please set NOTION_TOKEN and NOTION_DATABASE_ID environment variables');
    process.exit(1);
  }

  console.log('🔄 Syncing posts from Notion...');

  const pages = await getNotionPages();
  const postDir = './src/content/post';
  const notionFileIndex = buildNotionFileIndex(postDir);

  // Ensure post directory exists
  if (!existsSync(postDir)) {
    mkdirSync(postDir, { recursive: true });
  }

  for (const page of pages) {
    try {
      const metadata = extractMetadata(page.properties);
      const { slug, lang, published } = metadata;
      const { target, dirToEnsure } = getOutputPaths(postDir, slug, lang);
      const existingPath = notionFileIndex.get(page.id);

      if (!published) {
        if (existingPath) {
          deleteFileAndEmptyDirs(existingPath, postDir);
          notionFileIndex.delete(page.id);
          console.log(`🗑️ Removed unpublished post: ${slug}`);
        } else {
          console.log(`ℹ️ Skipped unpublished post with no file: ${slug}`);
        }
        continue;
      }

      if (!existsSync(dirToEnsure)) {
        mkdirSync(dirToEnsure, { recursive: true });
      }

      const { content } = await convertPageToMarkdown(page, metadata);

      if (existingPath && existingPath !== target) {
        deleteFileAndEmptyDirs(existingPath, postDir);
      }

      if (!existingPath && existsSync(target)) {
        const occupantId = readNotionIdFromFile(target);
        if (occupantId && occupantId !== page.id) {
          deleteFileAndEmptyDirs(target, postDir);
          notionFileIndex.delete(occupantId);
        } else if (!occupantId) {
          console.warn(
            `ℹ️ Overwriting existing file at ${target} because slug "${slug}" matches a Notion entry.`,
          );
        }
      }

      writeFileSync(target, content);
      notionFileIndex.set(page.id, target);
      console.log(`✅ Synced (${lang}): ${target}`);
    } catch (error) {
      console.error(`❌ Error processing page ${page.id}:`, error);
    }
  }

  console.log(`🎉 Sync complete! Generated ${pages.length} posts.`);
}

syncFromNotion().catch(console.error);
