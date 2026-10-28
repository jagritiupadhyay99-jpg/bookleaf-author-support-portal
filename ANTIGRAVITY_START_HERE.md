# Antigravity Starter Prompt — BookLeaf Assignment

Read all 15 Markdown files inside `docs/` before coding, especially `1. PRD.md`, `3. ARCHITECTURE.md`, `4. DATABASE.md`, `5. API.md`, and `6. AGENTS.md`.

Also locate and use the supplied `bookleaf_sample_data(1).json` as the source of truth for the seed dataset. Do not publish this confidential hiring assignment or its solution publicly.

Implement the project in the current workspace. First inspect existing files and avoid overwriting existing work. If the workspace is empty, create the project structure specified in `docs/3. ARCHITECTURE.md`.

Use the recommended stack: React + Vite + CSS, Node.js + Express, MongoDB, bcrypt/JWT, a server-side LLM adapter, and polling. If a dependency or service is unavailable, choose the simplest maintainable alternative and document the decision.

Work in this order:
1. Scaffold frontend/backend and verify they start.
2. Implement idempotent seed for exactly 10 authors and 18 books from the provided JSON.
3. Implement secure author/admin authentication and server-side authorization.
4. Implement author books/royalty dashboard, ticket creation, ticket list/detail.
5. Implement admin queue, filters, assignment, category/priority overrides, internal notes, status updates, and public responses.
6. Implement LLM classification, priority assessment, and response drafting with schema validation, a compact BookLeaf policy context, timeout, and graceful fallback. Never send AI drafts automatically.
7. Implement polling so authors see new public replies without refreshing.
8. Add meaningful tests, run the client build, fix errors, and document actual test results.
9. Prepare a README and a one-page approach note.
10. Provide exact local run commands, demo credentials created by the seed, environment variable names, and deployment steps.

Do not stop after writing a plan or generating placeholder pages. Implement working features and run checks after each milestone. Do not claim tests passed unless you ran them. Never put API keys in frontend code or commit `.env` files. Keep the repository private. Focus on a working, explainable MVP within the three-day deadline.
