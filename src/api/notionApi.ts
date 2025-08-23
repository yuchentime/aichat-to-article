import { Client } from '@notionhq/client';
import {
  CreatePageParameters,
  AppendBlockChildrenParameters,
  BlockObjectRequest,
  RichTextItemRequest
} from '@notionhq/client/build/src/api-endpoints';

export class NotionAPI {
  private client: Client;

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
  }

  async createPage(params: CreatePageParameters): Promise<{ id: string; url: string }> {
    const response = await this.client.pages.create(params);
    
    return {
      id: response.id,
      url: response.url
    };
  }

  async appendBlockChildren(blockId: string, children: BlockObjectRequest[]): Promise<void> {
    const params: AppendBlockChildrenParameters = {
      block_id: blockId,
      children: children
    };
    
    await this.client.blocks.children.append(params);
  }

  static createMarkdownBlock(content: string): BlockObjectRequest {
    return {
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content }
          }
        ]
      }
    };
  }

  static createHeadingBlock(content: string, level: 1 | 2 | 3 | 4| 5 = 1): BlockObjectRequest {
    return {
      type: `heading_${level}`,
      [`heading_${level}`]: {
        rich_text: [
          {
            type: 'text',
            text: { content }
          }
        ]
      }
    };
  }

  static createCodeBlock(content: string, language: string = 'plain text'): BlockObjectRequest {
    return {
      type: 'code',
      code: {
        rich_text: [
          {
            type: 'text',
            text: { content }
          }
        ],
        language: language
      }
    };
  }

  static createRichText(content: string): RichTextItemRequest[] {
    return [
      {
        type: 'text',
        text: { content }
      }
    ];
  }
}