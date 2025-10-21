#!/usr/bin/env node

import 'dotenv/config';
import { Client } from '@notionhq/client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

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
    
    // Now filter for published pages and show property info
    const publishedPages = databasePages.filter(page => {
      if (!page.properties) {
        console.log(`⚠️  Page ${page.id} has no properties`);
        return false;
      }
      
      const availableProps = Object.keys(page.properties);
      console.log(`📝 Page "${page.properties.Title?.title?.[0]?.text?.content || 'Untitled'}" has properties:`, availableProps);
      
      if (!page.properties.Published) {
        console.log(`    ❌ Missing "Published" property`);
        return false;
      }
      
      const published = page.properties.Published.checkbox;
      console.log(`    📊 Published status: ${published}`);
      return published === true;
    });
    
    console.log(`✅ Found ${publishedPages.length} published pages ready to sync`);
    
    if (publishedPages.length === 0 && databasePages.length > 0) {
      console.log('\n🎯 To publish your posts, make sure each page has:');
      console.log('   1. A "Published" checkbox property');
      console.log('   2. The checkbox is checked (true)');
      console.log('   3. All required properties: Title, Description, Published Date, Hero Image');
    }
    
    return publishedPages;
    
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
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    return response.results;
  } catch (error) {
    console.error('Error fetching page blocks:', error);
    return [];
  }
}

/**
 * Convert Notion page to markdown file with AstroCactus frontmatter format
 */
async function convertPageToMarkdown(page) {
  const properties = page.properties;
  
  // Extract frontmatter - adapting for AstroCactus schema
  const title = properties.Title?.title?.[0]?.text?.content || 'Untitled';
  const description = properties.Description?.rich_text?.[0]?.text?.content || '';
  const pubDate = properties['Published Date']?.date?.start || new Date().toISOString().split('T')[0];
  const heroImage = properties['Hero Image']?.url || '';
  const slug = properties.Slug?.rich_text?.[0]?.text?.content || 
               title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const tags = properties.Tags?.multi_select?.map(tag => tag.name) || [];

  // Get page content
  const blocks = await getPageBlocks(page.id);
  const content = blocksToMarkdown(blocks);

  // Create frontmatter in AstroCactus format
  const frontmatter = `---
title: '${title.replace(/'/g, "\\'")}'
description: '${description.replace(/'/g, "\\'")}'
publishDate: '${pubDate}'${heroImage ? `\ncoverImage:\n  src: '${heroImage}'\n  alt: '${title}'` : ''}${tags.length > 0 ? `\ntags:\n${tags.map(tag => `  - ${tag}`).join('\n')}` : ''}
---
`;

  return {
    slug,
    content: frontmatter + '\n' + content
  };
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

  // Ensure post directory exists
  if (!existsSync(postDir)) {
    mkdirSync(postDir, { recursive: true });
  }

  for (const page of pages) {
    try {
      const { slug, content } = await convertPageToMarkdown(page);
      const filePath = join(postDir, `${slug}.md`);
      
      writeFileSync(filePath, content);
      console.log(`✅ Generated: ${slug}.md`);
    } catch (error) {
      console.error(`❌ Error processing page ${page.id}:`, error);
    }
  }

  console.log(`🎉 Sync complete! Generated ${pages.length} posts.`);
}

syncFromNotion().catch(console.error);
