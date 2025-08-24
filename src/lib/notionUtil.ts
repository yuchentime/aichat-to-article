
import {markdownToBlocks} from '@tryfabric/martian';

export const convertMarkdownToNotionBlocks = (markdown: string) => {
    let title: string = '';
    const lines = markdown.split('\n');

    for (const line of lines) {
        if (line && line.trim().startsWith('#')) {
            title = line.replace(/#/g, "").trim();
            break;
        }
    }

    const blocks = markdownToBlocks(markdown);
    return {title, blocks};
}
