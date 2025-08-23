## 产品名称
AIChat-to-Notion

## 产品形态
Chrome Extension

## 功能描述
将Chatgpt、Grok的对话记录，通过大模型生成文章，然后同步到Notion

## 愿景
<待补充>

## 主要文件
src/background/index.ts    -- 后台脚本
src/content/index.ts    -- content script
src/pages/sidepanel/main.ts   -- 主界面。展示生成的文章，设置提供文章生成功能的大模型，同步Notion的入口

## 交互流程
1. 用户进入Chatgpt或Grok
2. 选择聊天界面
3. 右键菜单，点击“Save to Notion”
4. 文章生成完成后，浏览器会发出通知
5. 用户点击图标打开Sidepanel，看到生成好的文章列表
6. 用户点击任一文章，然后点击“保存到Notion”