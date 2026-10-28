# BookLeaf Author Support & Communication Portal
## Technical Approach & Engineering Philosophy (1-Page Executive Summary)

**Candidate Position:** Full-Stack Developer  
**Assignment:** Author Support & Communication Portal (Assignment 1 of 2)  
**Deliverable:** Architectural Approach, Trade-Offs, and Production Evolution Note

---

### 1. What We Prioritised

1. **Strict Data Segregation & Multi-Tenant Security:**
   - Author isolation was treated as an immutable security boundary. Even if an author tampers with client-side state or parameter IDs, the backend explicitly verifies `authorId` ownership at the database query layer.
   - Internal notes (`internalNotes`) are structurally stripped from all author-facing endpoints. Author responses undergo server-side sanitization so private operational deliberation never crosses the wire.
2. **Reliable, Human-in-the-Loop AI Integration (25% Evaluation Weight):**
   - Non-blocking ticket ingestion: Ticket creation never awaits external LLM HTTP latencies; tickets are persisted immediately to MongoDB, returning HTTP 201 before AI classification runs asynchronously.
   - Grounded Policy Prompting: AI drafts and classifications strictly inject the BookLeaf Knowledge Base (80/20 royalty split, 45-day quarterly cycle, ₹1,000 rollover threshold, ISBN high-priority 48h SLA, 5–7 day print reprint policy).
   - Zero hallucinations dispatched: AI outputs are provided exclusively as editable drafts to support agents. No AI output is ever automatically sent to an author.
   - Resilient Graceful Degradation: If an LLM provider times out, hits rate limits, or lacks an API key, the system seamlessly activates a deterministic keyword-based heuristic fallback engine tagged as mock mode.
3. **Data Integrity & Realistic Edge Cases:**
   - Seeded the exact 10 authors and 18 books from `bookleaf_sample_data.json` with 100% field preservation.
   - Handled production books with zero sales (`BK013`, `BK015`), null ISBNs, and null publication dates without UI crashes or NaN outputs.
4. **Restrained, Professional Business UI:**
   - Replaced generic SaaS gradients, neon colors, and pill-shaped containers with a warm neutral editorial palette (`#f8f9fa`), deep navy navigation (`#0f172a`), 4px modest radii, and structured tabular ledgers.

---

### 2. Trade-Offs Made (Time-Boxed 3-Day Scope)

| Feature | Production Approach | MVP Trade-Off Made | Justification |
| :--- | :--- | :--- | :--- |
| **Real-Time Transport** | WebSocket / SSE bidirectional mesh | **8-Second Polling Loop** | Polling is stateless, works across restrictive proxies and serverless environments, avoids connection leak bugs, and achieves sub-8s response latency without WebSocket infrastructure overhead. |
| **Attachment Storage** | S3 / Cloudflare R2 presigned URLs | **Interactive Dropzone + Metadata** | Implemented drag-and-drop UI with client validation and Ticket metadata persistence; cloud binary upload deferred per PDF (*"UI only—actual upload is bonus"*). |
| **AI Ingestion Queue** | BullMQ / Redis worker queue | **Node.js `setImmediate` async execution** | Eliminates Redis infrastructure dependency for local reviewer evaluation while guaranteeing non-blocking HTTP 201 ticket returns. |
| **LLM Provider SDK** | Vendor-locked SDK packages | **Native Zero-Dependency HTTP Adapter** | Supports Google Gemini (`gemini-3.5-flash-lite`), OpenAI (`gpt-4o-mini`), Groq (`llama3-8b-8192`), and Anthropic (`claude-3-haiku`) with native timeout guards. |

---

### 3. How We Would Evolve This in Production

1. **Async Job Processing & Event-Driven Architecture:**
   - Migrate background AI classification and outbound email notifications to Redis-backed queues (BullMQ/Kafka) with automated retry with exponential backoff and dead-letter queues.
2. **Streaming AI Responses (SSE):**
   - Stream AI draft generation character-by-character into the admin composer using Server-Sent Events to provide instant visual feedback on longer policy drafts.
3. **Vector Retrieval-Augmented Generation (RAG):**
   - Replace static policy injection with a vector embeddings store (e.g., MongoDB Atlas Vector Search or Pinecone) indexing the full BookLeaf author handbook, publisher agreements, and historical high-quality support resolutions.
4. **Enhanced Audit Logging & SLA Escalation:**
   - Add automated cron monitors that escalate unresolved Critical tickets approaching the 48-hour SLA mark to operations supervisors.
