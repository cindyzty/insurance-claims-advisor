# Insurance Claims Advisor

An AI-powered web app that helps users prepare for insurance claims. Users can choose an insurance type, describe their claim situation, upload policy documents, and receive guidance on coverage, required materials, and next steps.

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vite

## AI Stack

- Large Language Model API: SiliconFlow / Nex-N2-Pro
- AI-assisted development tools: Codex, Cursor
- PDF understanding: PDF.js text extraction + AI-based policy analysis
- AI-generated outputs:
  - Claim consultation responses
  - Insurance coverage analysis
  - Required document checklist
  - Claim process suggestions
  - Claim preparation report

## Project Structure

```text
client/
  src/
    pages/        Main app pages
    components/   Reusable UI components
    contexts/     App context providers
    hooks/        Custom React hooks
    lib/          API and helper functions
    App.tsx       App routes
    main.tsx      App entry point
    index.css     Global styles

server/           Server placeholder
shared/           Shared constants and types
```

## Functionality

Insurance Claims Advisor helps users organize and understand their insurance claim situation through an AI-guided consultation.

Main features include:

- Select an insurance type, such as health, life, accident, property, liability, travel, or other insurance.
- Chat with an AI advisor to describe the claim situation and answer follow-up questions.
- Upload an insurance policy PDF so the system can extract key policy details.
- Generate a claim preparation report with:
  - Current situation summary
  - Insurance coverage analysis
  - Required claim documents
  - Suggested claim process
  - Claim probability assessment
- Switch insurance types during consultation.
- Export the report as a PDF.

## Workflow

1. The user selects an insurance type from the home page.
2. The user enters the consultation page and describes their claim situation.
3. The AI advisor asks follow-up questions to collect important claim details.
4. If the user uploads a policy PDF, the system extracts policy information such as coverage, waiting period, and exclusions.
5. As enough information is collected, the system generates a claim preparation report. (This may take some time. Before the report is generated, users are not able to export the report and only see limited information)
6. The user reviews the report through the overview, documents, and process sections.
7. The user can export it as a PDF. (The web version of the project does not support the exporting function, as the deployment was not compatible with the function used to generate PDF)

## Sample 
### Health Insurance
<img width="80%" height="1257" alt="image" src="https://github.com/user-attachments/assets/5d7d8fb7-8fba-4615-acf4-562d2f8ae670" />

### Car Insurance
<img width="80%" height="1204" alt="image" src="https://github.com/user-attachments/assets/d2b1ac4a-da9d-4391-b705-2342ef821f38" />

### Travel Insurance
<img width="80%" height="1253" alt="image" src="https://github.com/user-attachments/assets/87f46782-49ec-48a5-8597-f1014f76be1e" />

### Dialogue When User Uploads Proper Insurance Document
<img width="80%" height="501" alt="d28cdbe660dbfb6e1bc16491fd4811bb" src="https://github.com/user-attachments/assets/4a235933-a7d1-4f7b-9367-cc25dc592f3a" />


# 保险理赔顾问

这是一个基于 AI 的保险理赔咨询网页应用，帮助用户在申请理赔前整理信息、了解保障范围、准备所需材料，并获得后续理赔流程建议。用户可以选择保险类型、描述理赔情况、上传保险条款文件，并生成一份理赔准备报告。

## 技术栈

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vite

## AI 技术栈

- 大语言模型 API：SiliconFlow / Nex-N2-Pro
- AI 辅助开发工具：Codex、Cursor
- PDF 理解：PDF.js 文本提取 + AI 保单分析
- AI 生成内容：
  - 理赔咨询回复
  - 保险范围分析
  - 所需材料清单
  - 理赔流程建议
  - 理赔准备报告

## 项目结构

```text
client/
  src/
    pages/        主要页面
    components/   可复用 UI 组件
    contexts/     应用上下文
    hooks/        自定义 React Hooks
    lib/          API 与工具函数
    App.tsx       应用路由
    main.tsx      应用入口
    index.css     全局样式

server/           服务端占位目录
shared/           共享常量与类型

## 功能介绍
保险理赔顾问通过 AI 引导式对话，帮助用户整理并理解自己的保险理赔情况。

主要功能包括：

- 选择保险类型，例如健康险、寿险、意外险、财产险、责任险、旅行险或其他保险。
- 与 AI 理赔顾问对话，描述理赔情况并回答追问。
- 上传保险条款 PDF，使系统能够提取关键保单信息。
- 生成理赔准备报告，内容包括：
    - 当前情况整理
    - 保险范围分析
    - 所需理赔材料
    - 建议理赔流程
    - 理赔可能性评估
- 在咨询过程中切换保险类型。
- 将报告导出为 PDF。

## 使用流程
1. 用户在首页选择保险类型。
2. 用户进入咨询页面，并描述自己的理赔情况。
3. AI 顾问通过追问收集关键理赔信息。
4. 如果用户上传保险条款 PDF，系统会提取保障范围、等待期、除外责任等保单信息。
5. 当系统收集到足够信息后，会生成理赔准备报告。（报告生成可能需要一些时间。在报告生成前，用户无法导出报告，只能看到有限的信息。）
6. 用户可以通过“概览”“材料”“流程”等区域查看报告内容。
7. 用户可以将报告导出为 PDF。（网页部署版本暂不支持导出功能，因为部署环境与当前 PDF 生成功能不完全兼容。）
