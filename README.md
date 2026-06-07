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
<img width="2251" height="1257" alt="image" src="https://github.com/user-attachments/assets/5d7d8fb7-8fba-4615-acf4-562d2f8ae670" />

### Car Insurance
<img width="2247" height="1204" alt="image" src="https://github.com/user-attachments/assets/d2b1ac4a-da9d-4391-b705-2342ef821f38" />

### Travel Insurance
<img width="2247" height="1253" alt="image" src="https://github.com/user-attachments/assets/87f46782-49ec-48a5-8597-f1014f76be1e" />

### Dialogue When User Uploads Proper Insurance Document
<img width="2518" height="501" alt="d28cdbe660dbfb6e1bc16491fd4811bb" src="https://github.com/user-attachments/assets/4a235933-a7d1-4f7b-9367-cc25dc592f3a" />


