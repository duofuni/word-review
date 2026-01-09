# 单词复习应用

一个用于复习英语单词的响应式 Web 应用，支持 PC 和移动端。

## 功能特性

- 📚 **课程列表**：按课程分组显示单词（每课20个单词）
- 🎮 **单词匹配游戏**：通过点击连线匹配英文单词和中文释义
- 📖 **单词卡片**：逐页浏览单词，支持左右翻页

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
word-review/
├── public/
│   └── word.json          # 单词数据文件
├── src/
│   ├── pages/             # 页面组件
│   │   ├── LessonList.tsx # 课程列表页
│   │   ├── MatchGame.tsx  # 单词匹配游戏页
│   │   └── WordReview.tsx # 单词卡片页
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 入口文件
└── package.json
```

## 响应式设计

- **移动端** (< 768px)：单列布局，触摸友好的按钮尺寸
- **平板** (768px - 1024px)：双列布局
- **桌面** (> 1024px)：多列布局，更大的间距和字体

## 数据格式

`word.json` 文件格式：
```json
[
  {
    "no": 1,
    "word": "grief",
    "meaning": "n. 悲伤,悲痛;悲痛的缘由,伤心事;担心,忧虑"
  }
]
```

## 使用说明

1. 在课程列表页选择要复习的课程
2. 在匹配游戏页通过点击连线匹配单词和释义
3. 点击"显示答案"查看所有正确答案
4. 点击"进入复习"进入单词卡片页逐页浏览
5. 使用左右箭头在单词卡片间导航
