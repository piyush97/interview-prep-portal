import type {
  AppData, Application, InterviewPrep, Skill, CompanyResearch, ResumeVersion,
  LearningPath, Flashcard, CuratedResource, UserProfile, StandaloneContact, Offer, JournalEntry, Reminder, ApplicationDocument,
  DashboardAction, DashboardStats, StoryBankEntry
} from "./types";

const STORAGE_KEY = "interview-prep-portal-data";

const defaultLearningPaths: LearningPath[] = [
  {
    id: "lp0", title: "Universal Interview Readiness",
    description: "Core prep that works for healthcare, education, sales, operations, trades, tech, and leadership roles",
    category: "soft-skills", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp0m1", title: "Role Scorecard", description: "Turn the JD into must-haves, nice-to-haves, proof points, and open questions", duration: "45m", resources: [] },
      { id: "lp0m2", title: "STAR Story Bank", description: "Build reusable stories with situation, task, action, result, reflection, and metrics", duration: "1hr", resources: [] },
      { id: "lp0m3", title: "Recruiter Screen", description: "Practice role fit, compensation range, availability, work authorization, and deal-breaker answers", duration: "45m", resources: [] },
      { id: "lp0m4", title: "Company Research Brief", description: "Map products, customers, culture, competitors, risks, and thoughtful questions", duration: "1hr", resources: [] },
      { id: "lp0m5", title: "Follow-Up System", description: "Prepare thank-you notes, timeline checks, referral nudges, and decision reminders", duration: "30m", resources: [] },
    ],
  },
  {
    id: "lp1", title: "System Design for AI & Full-Stack",
    description: "Design scalable systems, microservices, event-driven architectures, and AI-infused platforms",
    category: "soft-skills", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp1m1", title: "Foundations: Scalability & Reliability", description: "Load balancing, caching, CDN, horizontal vs vertical scaling", duration: "2hrs", resources: [
        { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "repo" },
        { title: "Grokking System Design", url: "https://www.designgurus.io/course/grokking-system-design-interview", type: "course" },
      ]},
      { id: "lp1m2", title: "Microservices & Event-Driven Architecture", description: "Service decomposition, message queues, event sourcing, CQRS", duration: "3hrs", resources: [
        { title: "Microservices Patterns (Richardson)", url: "https://microservices.io/patterns/index.html", type: "doc" },
        { title: "Event-Driven Architecture Guide", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven", type: "article" },
      ]},
      { id: "lp1m3", title: "AI System Design", description: "LLM serving, RAG architecture, agent orchestration, prompt caching", duration: "4hrs", resources: [
        { title: "Building LLM Apps for Production (Chip Huyen)", url: "https://huyenchip.com/2025/04/07/llm-apps.html", type: "article" },
        { title: "RAG Architecture Patterns", url: "https://www.pinecone.io/learn/rag-architecture/", type: "article" },
      ]},
      { id: "lp1m4", title: "Data Stores: SQL, NoSQL, Vector", description: "When to use which DB, indexing strategies, vector search", duration: "2hrs", resources: [
        { title: "NoSQL Databases Overview", url: "https://www.mongodb.com/resources/basics/nosql-explained", type: "article" },
        { title: "Vector Database Comparison", url: "https://www.pinecone.io/blog/vector-database-comparison/", type: "article" },
      ]},
      { id: "lp1m5", title: "Practice: Design a Chatbot Platform", description: "End-to-end design from API gateway to LLM inference", duration: "3hrs", resources: [
        { title: "ChatGPT System Design (Forrest Brazeal)", url: "https://www.youtube.com/watch?v=xE4k82I7aJc", type: "video" },
        { title: "Designing a Customer Support Agent", url: "https://github.com/openai/openai-cookbook", type: "repo" },
      ]},
    ],
  },
  {
    id: "lp2", title: "MCP & Agentic Workflows",
    description: "Master Model Context Protocol, tool-use agents, multi-agent orchestration",
    category: "ai-ml", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp2m1", title: "MCP Protocol Deep Dive", description: "Transport, lifecycle, tool registration, resource management", duration: "2hrs", resources: [
        { title: "MCP Specification", url: "https://spec.modelcontextprotocol.io", type: "doc" },
        { title: "MCP Quickstart (Python)", url: "https://modelcontextprotocol.io/quickstart/server", type: "doc" },
      ]},
      { id: "lp2m2", title: "Building MCP Servers", description: "Stdio vs HTTP transport, tool schemas, error handling, auth", duration: "3hrs", resources: [
        { title: "Building MCP Servers Guide", url: "https://modelcontextprotocol.io/tutorials/building-mcp-servers", type: "doc" },
        { title: "MCP Server Examples (GitHub)", url: "https://github.com/modelcontextprotocol/servers", type: "repo" },
      ]},
      { id: "lp2m3", title: "Agent Orchestration Patterns", description: "ReAct, Plan-and-Execute, Supervisor, Swarm, Multi-agent", duration: "3hrs", resources: [
        { title: "Anthropic Agent Design Guide", url: "https://docs.anthropic.com/en/docs/build-with-claude/agentic", type: "doc" },
        { title: "Multi-Agent Orchestration (LangChain)", url: "https://langchain-ai.github.io/langgraph/concepts/agentic_concepts/", type: "doc" },
      ]},
      { id: "lp2m4", title: "Tool-Use & Function Calling", description: "Schema design, parallel tool calls, error recovery, streaming", duration: "2hrs", resources: [
        { title: "OpenAI Function Calling Guide", url: "https://platform.openai.com/docs/guides/function-calling", type: "doc" },
        { title: "OpenAI Agents SDK", url: "https://github.com/openai/openai-agents-python", type: "repo" },
      ]},
    ],
  },
  {
    id: "lp3", title: "RAG & Vector Databases",
    description: "Retrieval-augmented generation — chunking, embedding, retrieval, re-ranking, evaluation",
    category: "ai-ml", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp3m1", title: "RAG Fundamentals", description: "Chunking strategies, embedding models, vector search, retrieval pipeline", duration: "2hrs", resources: [
        { title: "RAG from Scratch (LlamaIndex)", url: "https://www.youtube.com/playlist?list=PLcTqyOao6hMbTjw3__-7LVVqLxSBgSzUB", type: "video" },
        { title: "Advanced RAG Techniques (Pinecone)", url: "https://www.pinecone.io/learn/advanced-rag/", type: "article" },
      ]},
      { id: "lp3m2", title: "Chunking & Embedding Strategies", description: "Semantic chunking, overlap strategies, embedding model selection, fine-tuning embeddings", duration: "2hrs", resources: [
        { title: "Chunking Strategies (LlamaIndex)", url: "https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/", type: "doc" },
        { title: "Embedding Models Leaderboard (MTEB)", url: "https://huggingface.co/spaces/mteb/leaderboard", type: "tool" },
      ]},
      { id: "lp3m3", title: "Retrieval & Re-ranking", description: "Hybrid search, BM25, re-ranking models, fusion retrieval", duration: "2hrs", resources: [
        { title: "Hybrid Search in Practice", url: "https://www.llamaindex.ai/blog/hybrid-search", type: "article" },
        { title: "Re-ranking Explained (Cohere)", url: "https://txt.cohere.com/rerank/", type: "article" },
      ]},
      { id: "lp3m4", title: "RAG Evaluation & Production", description: "Ragas, faithfulness, answer relevance, monitoring, caching", duration: "2hrs", resources: [
        { title: "RAG Evaluation with Ragas", url: "https://docs.ragas.io/en/latest/", type: "doc" },
        { title: "RAG Production Patterns (Anthropic)", url: "https://docs.anthropic.com/en/docs/build-with-claude/embeddings", type: "doc" },
      ]},
    ],
  },
  {
    id: "lp4", title: "LangChain & LLM Frameworks",
    description: "LangChain, LangGraph, LlamaIndex — chains, agents, graphs, memory, streaming",
    category: "ai-ml", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp4m1", title: "LangChain Core Concepts", description: "Chains, prompts, output parsers, memory, callbacks", duration: "3hrs", resources: [
        { title: "LangChain Docs", url: "https://python.langchain.com/docs", type: "doc" },
        { title: "LangChain Academy", url: "https://academy.langchain.com/", type: "course" },
      ]},
      { id: "lp4m2", title: "LangGraph for Agents", description: "State graphs, nodes, edges, checkpointing, human-in-the-loop", duration: "3hrs", resources: [
        { title: "LangGraph Documentation", url: "https://langchain-ai.github.io/langgraph/", type: "doc" },
        { title: "LangGraph Hands-On Tutorial", url: "https://www.youtube.com/watch?v=bkUfkcBzsVU", type: "video" },
      ]},
      { id: "lp4m3", title: "LlamaIndex for RAG", description: "Index types, query engines, agents, routing, observability", duration: "2hrs", resources: [
        { title: "LlamaIndex Docs", url: "https://docs.llamaindex.ai/", type: "doc" },
        { title: "LlamaIndex Agent Guide", url: "https://docs.llamaindex.ai/en/stable/use_cases/agents/", type: "doc" },
      ]},
      { id: "lp4m4", title: "Streaming & Production", description: "Streaming tokens, observability (LangSmith), caching, rate limits", duration: "2hrs", resources: [
        { title: "LangSmith Docs", url: "https://docs.smith.langchain.com/", type: "doc" },
        { title: "LLM App Observability Guide", url: "https://www.braintrust.dev/docs/guides/observability", type: "article" },
      ]},
    ],
  },
  {
    id: "lp5", title: "Azure AI Services",
    description: "Azure OpenAI, AI Search, AI Studio, prompt flow, RAG on Azure",
    category: "cloud", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp5m1", title: "Azure OpenAI", description: "Deployment, fine-tuning, safety system, quotas, regional availability", duration: "2hrs", resources: [
        { title: "Azure OpenAI Service Docs", url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/", type: "doc" },
        { title: "Azure OpenAI Hands-On", url: "https://learn.microsoft.com/en-us/training/modules/use-azure-openai/", type: "course" },
      ]},
      { id: "lp5m2", title: "Azure AI Search", description: "Vector index, hybrid search, semantic ranking, integrated vectorization", duration: "2hrs", resources: [
        { title: "Azure AI Search Vector Index", url: "https://learn.microsoft.com/en-us/azure/search/vector-search-overview", type: "doc" },
        { title: "RAG with Azure AI Search", url: "https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview", type: "doc" },
      ]},
      { id: "lp5m3", title: "Azure AI Studio & Prompt Flow", description: "Building AI apps, prompt flow evaluation, content safety", duration: "3hrs", resources: [
        { title: "Azure AI Studio Overview", url: "https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio", type: "doc" },
        { title: "Prompt Flow in Azure", url: "https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/overview-what-is-prompt-flow", type: "doc" },
      ]},
    ],
  },
  {
    id: "lp6", title: "Advanced TypeScript & React Patterns",
    description: "Advanced generics, state management, performance, testing patterns",
    category: "frontend", priority: "medium",
    completedModules: [],
    modules: [
      { id: "lp6m1", title: "TypeScript Advanced Generics", description: "Conditional types, mapped types, template literals, infer", duration: "2hrs", resources: [
        { title: "TypeScript Handbook (Advanced Types)", url: "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html", type: "doc" },
        { title: "Type Challenges (Practice)", url: "https://github.com/type-challenges/type-challenges", type: "repo" },
      ]},
      { id: "lp6m2", title: "React Performance & Patterns", description: "Suspense, useTransition, useOptimistic, server components, lazy loading", duration: "2hrs", resources: [
        { title: "React 19 Docs", url: "https://react.dev/blog/2024/12/05/react-19", type: "doc" },
        { title: "React Patterns (2025)", url: "https://www.patterns.dev/react/", type: "article" },
      ]},
      { id: "lp6m3", title: "State Management & Architecture", description: "Zustand, TanStack Query, atomic state, state machines with XState", duration: "2hrs", resources: [
        { title: "TanStack Query Docs", url: "https://tanstack.com/query/latest", type: "doc" },
        { title: "Zustand Guide", url: "https://docs.pmnd.rs/zustand/getting-started/introduction", type: "doc" },
      ]},
    ],
  },
  {
    id: "lp7", title: "Technical & Behavioral Interview Prep",
    description: "STAR framework, negotiation, salary talk, common behavioral questions",
    category: "soft-skills", priority: "high",
    completedModules: [],
    modules: [
      { id: "lp7m1", title: "STAR Framework Mastery", description: "Situation-Task-Action-Result with real examples from your career", duration: "1hr", resources: [
        { title: "STAR Method Guide", url: "https://www.themuse.com/advice/star-interview-method", type: "article" },
      ]},
      { id: "lp7m2", title: "Salary & Rate Negotiation", description: "Market positioning, rate anchoring, C2C vs W2, equity evaluation", duration: "1hr", resources: [
        { title: "C2C Contracting Guide", url: "https://www.toptal.com/freelance/how-to-calculate-your-freelance-rate", type: "article" },
      ]},
      { id: "lp7m3", title: "Tell Me About a Time Questions", description: "Conflict resolution, failure, leadership, difficult stakeholder scenarios", duration: "1.5hrs", resources: [
        { title: "Common Behavioral Questions", url: "https://www.educative.io/blog/behavioral-interview-questions", type: "article" },
      ]},
    ],
  },
];

const defaultFlashcards: Flashcard[] = [
  // System Design
  { id: "fc1", question: "How would you design a URL shortener?", answer: "Core: hash function (base62), DB shard by hash prefix, cache hot URLs in Redis, 301 redirect. Scale: consistent hashing for DB shards, CDN for cached redirects, analytics pipeline via Kafka.", category: "system-design", deck: "System Design", difficulty: "medium", level: 3 },
  { id: "fc2", question: "Design a real-time chat system", answer: "WebSocket gateway cluster, pub/sub (Redis/ Kafka) for message routing, message DB (Cassandra for write scale), presence service (Redis), last-seen index. For group chats: fan-out on write vs on read.", category: "system-design", deck: "System Design", difficulty: "hard", level: 2 },
  { id: "fc3", question: "How do you design a RAG system?", answer: "Ingest pipeline: chunk docs → embed → vector DB. Query: embed question → hybrid search (vector + keyword) → re-rank → LLM with context. Production: caching, rate limiting, monitoring (Ragas), A/B eval.", category: "system-design", deck: "System Design", difficulty: "medium", level: 3 },
  { id: "fc4", question: "What is eventual consistency and when do you use it?", answer: "Strong: after write, all reads see latest (CP systems). Eventual: writes propagate async, reads may be stale briefly (AP systems). Use eventual for social feeds, analytics, logs. Use strong for payments, inventory.", category: "system-design", deck: "System Design", difficulty: "easy", level: 4 },
  { id: "fc5", question: "How would you design a rate limiter?", answer: "Algorithms: token bucket, sliding window, leaky bucket. Distribute: Redis sorted sets per user+window. Use local counter + sync for high-throughput. Return 429 + Retry-After header.", category: "system-design", deck: "System Design", difficulty: "medium", level: 3 },

  // MCP & Agents
  { id: "fc6", question: "What is MCP and how does it work?", answer: "Model Context Protocol — standard for LLM ↔ tool communication. Client sends JSON-RPC requests describing available tools/resources. Server responds with tool schemas. LLM decides which tools to call. Supports stdio and HTTP transport.", category: "ai-ml", deck: "MCP & Agents", difficulty: "medium", level: 3 },
  { id: "fc7", question: "Explain the ReAct agent pattern", answer: "Reasoning + Acting loop: 1) LLM reasons about current state, 2) Decides action (tool call or response), 3) Observes tool output, 4) Repeats. Combines chain-of-thought with tool use. Stops when final answer is produced.", category: "ai-ml", deck: "MCP & Agents", difficulty: "medium", level: 3 },
  { id: "fc8", question: "How do multi-agent systems coordinate?", answer: "Patterns: Supervisor (one agent delegates), Swarm (agents handoff), Debate (agents critique each other), Tool-based (agents share a tool bus). LangGraph implements as state machines with edges between agent nodes.", category: "ai-ml", deck: "MCP & Agents", difficulty: "hard", level: 2 },
  { id: "fc9", question: "What is function calling in LLMs?", answer: "LLM outputs structured JSON instead of text when given tool schemas. Dev: define functions with name/description/parameters (JSON Schema). LLM returns function_call. Your code executes it and returns result. Streaming: delta tokens for function args.", category: "ai-ml", deck: "MCP & Agents", difficulty: "medium", level: 4 },

  // RAG
  { id: "fc10", question: "What are the key RAG failure modes?", answer: "1) Missing content — retrieval misses relevant docs. 2) Irrelevant context — LLM ignores or hallucinates. 3) Stale data — index out of date. 4) Format issues — LLM can't parse chunks. Fix: hybrid search, re-ranking, chunk optimization, eval pipeline.", category: "ai-ml", deck: "RAG & Vector DBs", difficulty: "medium", level: 3 },
  { id: "fc11", question: "Compare different chunking strategies", answer: "Fixed-size (simple, may break context), Sentence-based (better boundaries), Recursive (LangChain: split by (\n\n → \n → . → char)), Semantic (LlamaIndex: split by embedding similarity). Best: semantic chunking with 20% overlap.", category: "ai-ml", deck: "RAG & Vector DBs", difficulty: "medium", level: 3 },
  { id: "fc12", question: "What is hybrid search?", answer: "Combines keyword search (BM25) with vector search. BM25 catches exact matches (names, IDs). Vector catches semantic similarity. Weighted fusion (RRF) combines scores. Azure AI Search, Pinecone, Weaviate support natively.", category: "ai-ml", deck: "RAG & Vector DBs", difficulty: "medium", level: 3 },

  // Behavioral
  { id: "fc13", question: "Tell me about a time you had a conflict with a team member", answer: "STAR: Situation: A teammate and I disagreed about the best way to solve a customer-impacting workflow issue. Task: Keep the project moving without turning the disagreement into a blocker. Action: I scheduled a focused 1:1, wrote down both options, compared them against data and constraints, and proposed a short experiment. Result: We chose the stronger approach, shipped on time, and kept trust intact. Lesson: make tradeoffs visible; do not let opinions stay abstract.", category: "behavioral", deck: "Behavioral", difficulty: "easy", level: 4 },
  { id: "fc14", question: "Describe a project where you had to learn a new technology quickly", answer: "STAR: Situation: A project needed a tool or domain I had not used before. Task: Become useful fast without pretending to be an expert. Action: I identified the smallest production-like use case, studied official docs, built a prototype, asked one expert to review assumptions, and documented the repeatable steps. Result: The team had a working path within days and a cleaner handoff for future work. Lesson: learn through a scoped outcome, not passive reading.", category: "behavioral", deck: "Behavioral", difficulty: "easy", level: 4 },
  { id: "fc15", question: "Tell me about a time you failed", answer: "STAR: Situation: I committed to a change that was too large for the available time. Task: Recover trust and still deliver value. Action: I named the miss early, cut scope to the highest-impact slice, set a checkpoint cadence, and captured what should wait. Result: The team shipped the most valuable part on schedule and avoided a half-finished rollout. Lesson: smaller verified releases beat heroic overreach.", category: "behavioral", deck: "Behavioral", difficulty: "medium", level: 3 },
  { id: "fc16", question: "Why do you want to work here?", answer: "Research the company before. Structure: 1) Their tech/product (I've used X, impressed by Y). 2) Alignment (my experience in AI/agents matches your Z initiative). 3) Impact (I want to solve the specific problems you're tackling). Always specific, never generic.", category: "behavioral", deck: "Behavioral", difficulty: "easy", level: 4 },
  { id: "fc17", question: "Tell me about your most challenging technical problem", answer: "STAR: Situation: A critical workflow depended on slow, fragmented, or unreliable data. Task: Design a solution that improved speed without sacrificing correctness. Action: I mapped the data path, isolated failure modes, added validation and retry behavior, and made status visible to stakeholders. Result: The workflow became faster, easier to support, and safer to change. Lesson: hard technical problems usually need both architecture and operational clarity.", category: "behavioral", deck: "Behavioral", difficulty: "medium", level: 3 },

  // Universal role decks
  { id: "fc36", question: "How do you answer 'walk me through your background' for any role?", answer: "Use a 60-second arc: current role or skill base, 2 relevant proof points, why this role is the logical next step, and one sentence tying your strengths to the employer's needs.", category: "general", deck: "Universal Interview Basics", difficulty: "easy", level: 3 },
  { id: "fc37", question: "What should you confirm in a recruiter screen?", answer: "Role scope, interview stages, must-have requirements, schedule, compensation range, work location, work authorization, start date, and next-step timeline. End by asking what a strong candidate shows in the next round.", category: "general", deck: "Universal Interview Basics", difficulty: "easy", level: 3 },
  { id: "fc38", question: "How do you turn a job description into a prep checklist?", answer: "Extract must-haves, repeated keywords, responsibilities, tools or certifications, stakeholder groups, success metrics, and interview signals. For each item, write one proof story, one resume line, and one question.", category: "general", deck: "Universal Interview Basics", difficulty: "medium", level: 2 },
  { id: "fc39", question: "Healthcare: how do you discuss patient safety without sounding generic?", answer: "Use one concrete example: risk spotted, protocol followed, communication with patient/family/team, escalation path, documentation, and outcome. Mention judgment, empathy, and compliance together.", category: "behavioral", deck: "Healthcare", difficulty: "medium", level: 2 },
  { id: "fc40", question: "Education: how do you show classroom or learner impact?", answer: "Anchor on learner baseline, intervention, differentiation, family/team communication, measurement, and improvement. Use numbers when possible: attendance, assessment lift, engagement, retention, or completion.", category: "behavioral", deck: "Education", difficulty: "medium", level: 2 },
  { id: "fc41", question: "Marketing/Sales: how do you explain a campaign or pipeline win?", answer: "State target segment, insight, channel or motion, experiment, conversion metric, revenue/pipeline impact, and what changed after the result. Separate your contribution from team baseline.", category: "behavioral", deck: "Marketing & Sales", difficulty: "medium", level: 2 },
  { id: "fc42", question: "Operations: how do you describe process improvement?", answer: "Name the bottleneck, baseline metric, root cause, constraints, process change, adoption plan, and resulting time/cost/quality improvement. Include how you kept service quality stable during change.", category: "behavioral", deck: "Operations", difficulty: "medium", level: 2 },
  { id: "fc43", question: "Customer Success: how do you handle an unhappy customer?", answer: "Acknowledge impact, clarify facts, define ownership, propose next steps, communicate cadence, and close the loop. Include retention, expansion, satisfaction, or resolution-time metrics when possible.", category: "behavioral", deck: "Customer Success", difficulty: "medium", level: 2 },
  { id: "fc44", question: "Trades/Field: how do you show safety and quality discipline?", answer: "Describe site conditions, hazard assessment, standard or code followed, tool/material choice, communication, inspection, and final outcome. Show that speed never outranked safety or workmanship.", category: "behavioral", deck: "Trades & Field", difficulty: "medium", level: 2 },

  // Technical
  { id: "fc18", question: "What's the difference between var, let, const?", answer: "var: function-scoped, hoisted, can redeclare. let: block-scoped, hoisted (TDZ), can reassign. const: block-scoped, cannot reassign (but object properties can mutate). Always use const by default, let when reassigning. Never var.", category: "technical", deck: "TypeScript/JS", difficulty: "easy", level: 5 },
  { id: "fc19", question: "Explain React Suspense and useTransition", answer: "Suspense lets components wait for async data. useTransition marks state updates as non-urgent — React keeps showing old UI until new data loads. Pending flag for loading state. Use for navigation/filter transitions to avoid spinners.", category: "technical", deck: "React", difficulty: "medium", level: 3 },
  { id: "fc20", question: "How does React 19's use() hook work?", answer: "use(promise) — reads async value inside render. use(context) — same as useContext. Key: use can be called conditionally/early-return (unlike hooks). Works with Suspense boundaries. Simplifies data fetching in components.", category: "technical", deck: "React", difficulty: "medium", level: 2 },
  { id: "fc21", question: "What is the Event Loop in JS?", answer: "1) Call stack runs sync code. 2) Microtasks (Promises, queueMicrotask) run after each macrotask. 3) Macrotasks (setTimeout, I/O) run next. Render step happens between task cycles. Blocking the stack freezes UI. Use Web Workers for heavy computation.", category: "technical", deck: "JavaScript", difficulty: "medium", level: 4 },
  { id: "fc22", question: "What is TypeScript's satisfies operator?", answer: "satisfies checks that a value conforms to a type WITHOUT changing its inferred narrow type. Use case: const palette = { red: [255, 0, 0] } satisfies Record<string, number[]> — palette.red is number[] tuple, not number[] | string.", category: "technical", deck: "TypeScript/JS", difficulty: "hard", level: 2 },
  { id: "fc23", question: "Explain dependency injection and why it matters", answer: "DI: passing dependencies into a component rather than creating them internally. Benefits: testability (mock deps), flexibility (swap implementations), loose coupling. Patterns: constructor injection, property injection, service locator. In React: prop drilling → context → DI containers.", category: "technical", deck: "Architecture", difficulty: "medium", level: 3 },
  { id: "fc24", question: "What is CORS and how do you fix it?", answer: "Browser prevents JS from fetching cross-origin unless server allows. Fix server: set Access-Control-Allow-Origin header. Preflight: browser sends OPTIONS for non-simple requests. For dev: proxy in vite.config.ts. For prod: API gateway handles CORS.", category: "technical", deck: "Architecture", difficulty: "easy", level: 4 },
  { id: "fc25", question: "Explain the CAP theorem", answer: "Distributed systems can have at most 2 of: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network splits). Reality: P is mandatory (networks fail). You choose CP or AP. Examples: MongoDB (CP), Cassandra (AP).", category: "technical", deck: "System Design", difficulty: "medium", level: 3 },
  // Kubernetes & Docker
  { id: "fc26", question: "What is a Pod in Kubernetes?", answer: "Smallest deployable unit in K8s. One or more containers sharing network namespace, storage, and lifecycle. Pods are ephemeral — replaced, not repaired. Use Deployments for stateless apps, StatefulSets for stateful.", category: "technical", deck: "DevOps", difficulty: "medium", level: 2 },
  { id: "fc27", question: "What's the difference between a Service and an Ingress?", answer: "Service: internal L4 load balancer exposing Pods within the cluster (ClusterIP, NodePort, LoadBalancer). Ingress: external L7 HTTP/HTTPS routing to Services based on host/path. Ingress requires an Ingress Controller (nginx, Traefik, AWS ALB).", category: "technical", deck: "DevOps", difficulty: "medium", level: 2 },
  { id: "fc28", question: "Explain Docker multi-stage builds", answer: "Use multiple FROM statements in one Dockerfile. Build stage: compile/bundle with full SDK. Runtime stage: copy only the artifact to a slim base image. Benefit: 10x smaller images, fewer vulnerabilities.", category: "technical", deck: "DevOps", difficulty: "medium", level: 3 },
  { id: "fc29", question: "What is a ConfigMap vs Secret?", answer: "Both inject configuration into Pods. ConfigMap: non-sensitive data (env vars, config files). Secret: sensitive (base64 encoded, encryption at rest). Secrets support encryption providers, external secret stores.", category: "technical", deck: "DevOps", difficulty: "easy", level: 3 },
  // Azure
  { id: "fc30", question: "What is Azure AI Studio?", answer: "Unified platform to build, evaluate, and deploy AI applications. Features: prompt flow for orchestration, content safety, model catalog (OpenAI, Llama, Mistral), evaluation tools, monitoring.", category: "ai-ml", deck: "Azure", difficulty: "medium", level: 2 },
  { id: "fc31", question: "How does Azure AI Search implement hybrid search?", answer: "Combines BM25 keyword search with vector search (cosine similarity). Uses Reciprocal Rank Fusion (RRF) to merge results. Supports semantic ranking (deep learning reranker). Configure through search index with vector fields + search profiles.", category: "ai-ml", deck: "Azure", difficulty: "hard", level: 2 },
  { id: "fc32", question: "What are Azure OpenAI deployment types?", answer: "Provisioned throughput (PTU): reserved capacity, predictable latency. Standard: pay-per-token, shared pool, may have rate limits. Global standard: routes to available global capacity. Choose PTU for production, Standard for dev.", category: "cloud", deck: "Azure", difficulty: "medium", level: 2 },
  // More System Design
  { id: "fc33", question: "How does a Distributed Cache work?", answer: "Redis/Memcached cluster with sharding (consistent hashing). Reads: check cache first (O(1)). Misses: fetch from DB, populate cache. TTL eviction, LRU/LFU policies. Write strategies: write-through, write-behind, cache-aside.", category: "system-design", deck: "System Design", difficulty: "medium", level: 3 },
  { id: "fc34", question: "Design a Notification System", answer: "Ingestion: API gateway → message queue (Kafka/RabbitMQ). Processing: fan-out to channel handlers (email, push, SMS, in-app). Each handler: template rendering, rate limiting, retry with exponential backoff.", category: "system-design", deck: "System Design", difficulty: "hard", level: 2 },
  { id: "fc35", question: "What is a Message Queue and when to use it?", answer: "Async communication between services. Producer sends message, consumer processes. Benefits: decoupling, load leveling, fault tolerance, buffering. Good for: background jobs, event notifications, task distribution.", category: "system-design", deck: "System Design", difficulty: "easy", level: 3 },
];

const defaultResources: CuratedResource[] = [
  // AI/ML
  { id: "r1", title: "Anthropic Agent Design Guide", url: "https://docs.anthropic.com/en/docs/build-with-claude/agentic", description: "Best practices for building AI agents — patterns, pitfalls, architecture", category: "ai-ml", type: "doc", tags: ["agents", "anthropic", "patterns"] },
  { id: "r2", title: "Building LLM Apps for Production (Chip Huyen)", url: "https://huyenchip.com/2025/04/07/llm-apps.html", description: "Comprehensive guide: prompt engineering, RAG, agents, evaluation, cost optimization", category: "ai-ml", type: "article", tags: ["llm", "production", "guide"] },
  { id: "r3", title: "OpenAI Cookbook", url: "https://github.com/openai/openai-cookbook", description: "Official recipes for GPT, embeddings, function calling, RAG patterns", category: "ai-ml", type: "repo", tags: ["openai", "cookbook", "patterns"] },
  { id: "r4", title: "LangSmith", url: "https://smith.langchain.com/", description: "Observability, testing, and evaluation for LLM applications", category: "ai-ml", type: "tool", tags: ["observability", "monitoring", "langchain"] },
  { id: "r5", title: "MCP Specification", url: "https://spec.modelcontextprotocol.io", description: "Official spec for the Model Context Protocol — transport, lifecycle, security", category: "ai-ml", type: "doc", tags: ["mcp", "protocol", "spec"] },
  { id: "r6", title: "RAGAS Documentation", url: "https://docs.ragas.io/", description: "RAG evaluation metrics: faithfulness, answer relevance, context precision", category: "ai-ml", type: "doc", tags: ["evaluation", "rag", "metrics"] },
  { id: "r7", title: "OpenAI Agents SDK", url: "https://github.com/openai/openai-agents-python", description: "Official OpenAI SDK for building multi-agent systems with handoffs and guardrails", category: "ai-ml", type: "repo", tags: ["agents", "openai", "sdk"] },
  { id: "r8", title: "MLOps Course (Made with ML)", url: "https://madewithml.com/", description: "Full-stack ML: data ops, training, serving, monitoring, LLMOps", category: "ai-ml", type: "course", tags: ["mlops", "course", "production"] },
  { id: "r32", title: "Prompt Engineering Guide (DAIR.AI)", url: "https://www.promptingguide.ai/", description: "Comprehensive guide to prompt engineering — zero-shot, few-shot, chain-of-thought, RAG prompting", category: "ai-ml", type: "doc", tags: ["prompt-engineering", "guide", "llm"] },
  { id: "r33", title: "OpenAI GPT Best Practices", url: "https://platform.openai.com/docs/guides/optimizing-llm-accuracy", description: "Official guide: prompt engineering, system messages, function calling patterns, rate limiting", category: "ai-ml", type: "doc", tags: ["openai", "best-practices", "llm"] },
  // Frontend
  { id: "r9", title: "React 19 Release Notes", url: "https://react.dev/blog/2024/12/05/react-19", description: "use(), Actions, useOptimistic, useFormStatus, ref as prop, assets loading", category: "frontend", type: "doc", tags: ["react", "v19", "new"] },
  { id: "r10", title: "Patterns.dev", url: "https://www.patterns.dev/", description: "Modern design patterns for React, TypeScript, and web performance", category: "frontend", type: "article", tags: ["patterns", "react", "performance"] },
  { id: "r11", title: "TypeScript Type Challenges", url: "https://github.com/type-challenges/type-challenges", description: "Practice TypeScript type system with 300+ exercises", category: "frontend", type: "repo", tags: ["typescript", "practice", "exercises"] },
  { id: "r12", title: "Web.dev Performance", url: "https://web.dev/fast/", description: "Core Web Vitals optimization, lazy loading, resource hints, CDN strategies", category: "frontend", type: "article", tags: ["performance", "web-vitals", "optimization"] },
  { id: "r13", title: "TanStack Query Essentials", url: "https://tanstack.com/query/latest/docs/framework/react/overview", description: "Server state management — caching, stale-while-revalidate, optimistic updates", category: "frontend", type: "doc", tags: ["data-fetching", "caching", "react"] },
  { id: "r35", title: "React 19 Deep Dive", url: "https://www.youtube.com/watch?v=6iVgNw9TpS8", description: "Video covering use(), Actions, useOptimistic, Server Components, and asset loading in React 19", category: "frontend", type: "video", tags: ["react", "v19", "video"] },
  // Cloud
  { id: "r14", title: "Azure AI Search Vector Index", url: "https://learn.microsoft.com/en-us/azure/search/vector-search-overview", description: "Vector search, hybrid retrieval, semantic ranking in Azure", category: "cloud", type: "doc", tags: ["azure", "vector-search", "rag"] },
  { id: "r15", title: "Azure OpenAI Service Docs", url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/", description: "Deployment, fine-tuning, safety, quotas, regional models", category: "cloud", type: "doc", tags: ["azure", "openai", "deployment"] },
  { id: "r16", title: "Azure Well-Architected Framework", url: "https://learn.microsoft.com/en-us/azure/well-architected/", description: "Cost, reliability, performance, security, operational excellence pillars", category: "cloud", type: "doc", tags: ["azure", "architecture", "best-practices"] },
  { id: "r17", title: "HashiCorp Terraform Azure Tutorial", url: "https://developer.hashicorp.com/terraform/tutorials/azure", description: "Infrastructure as code for Azure — networking, AKS, AI services", category: "cloud", type: "course", tags: ["terraform", "iac", "azure"] },
  { id: "r30", title: "Azure Cost Optimization Best Practices", url: "https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-mgt-best-practices", description: "Right-sizing, reserved instances, auto-scaling, governance policies to keep cloud costs low", category: "cloud", type: "doc", tags: ["azure", "cost", "optimization"] },
  { id: "r34", title: "AWS Solutions Architect Learning Path", url: "https://aws.amazon.com/training/learn-about/solutions-architect/", description: "Free digital training for AWS solutions architecture — compute, storage, networking, security", category: "cloud", type: "course", tags: ["aws", "solutions-architect", "free"] },
  // DevOps
  { id: "r18", title: "Docker Best Practices for Node.js", url: "https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md", description: "Multi-stage builds, layer caching, security hardening", category: "devops", type: "doc", tags: ["docker", "nodejs", "best-practices"] },
  { id: "r19", title: "Docker Compose in Production", url: "https://docs.docker.com/compose/production/", description: "Scaling Compose apps, health checks, secrets, logging", category: "devops", type: "doc", tags: ["docker", "compose", "production"] },
  { id: "r20", title: "GitHub Actions CI/CD Guide", url: "https://docs.github.com/en/actions/guides", description: "Build, test, and deploy pipelines — caching, matrix builds, environments", category: "devops", type: "doc", tags: ["github-actions", "cicd", "automation"] },
  { id: "r29", title: "Kubernetes in Action (2nd Ed)", url: "https://www.manning.com/books/kubernetes-in-action-second-edition", description: "The definitive guide to K8s — Pods, controllers, services, security, operators", category: "devops", type: "book", tags: ["kubernetes", "book", "containers"] },
  // System Design & Career
  { id: "r21", title: "System Design Primer (GitHub)", url: "https://github.com/donnemartin/system-design-primer", description: "Anki flashcards, distributed systems patterns, case studies (design Uber, Twitter, etc.)", category: "soft-skills", type: "repo", tags: ["system-design", "interview", "distributed"] },
  { id: "r22", title: "Microservices.io Patterns", url: "https://microservices.io/patterns/index.html", description: "Chris Richardson's catalog of microservices patterns with explanations", category: "soft-skills", type: "article", tags: ["microservices", "patterns", "architecture"] },
  { id: "r23", title: "Byte Byte Go Newsletter", url: "https://blog.bytebytego.com/", description: "System design illustrations and deep dives — great for visual learners", category: "soft-skills", type: "newsletter", tags: ["system-design", "newsletter", "visual"] },
  { id: "r24", title: "Designing Data-Intensive Applications", url: "https://dataintensive.net/", description: "The bible of distributed systems — replication, partitioning, transactions, consensus", category: "soft-skills", type: "book", tags: ["distributed-systems", "database", "book"] },
  { id: "r31", title: "Distributed Systems (Martin Kleppmann)", url: "https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB", description: "Video series by author of DDIA — replication, consensus, transactions, stream processing", category: "soft-skills", type: "video", tags: ["distributed-systems", "video", "ddia"] },
  { id: "r25", title: "Levels.fyi Salary Data", url: "https://www.levels.fyi/", description: "Real salary ranges by company, level, location — use for negotiation prep", category: "soft-skills", type: "tool", tags: ["salary", "negotiation", "market-data"] },
  { id: "r26", title: "C2C Contracting Calculator", url: "https://www.hellobonsai.com/freelance-rate-calculator", description: "Calculate your hourly rate from desired salary, overhead, and vacation", category: "soft-skills", type: "tool", tags: ["c2c", "rate", "calculator"] },
  { id: "r27", title: "Tech Interview Handbook", url: "https://www.techinterviewhandbook.org/", description: "Complete interview prep — coding, system design, behavioral, negotiation", category: "soft-skills", type: "article", tags: ["interview", "handbook", "comprehensive"] },
  { id: "r28", title: "High Growth Engineer Newsletter", url: "https://careercutler.substack.com/", description: "Jordan Cutler's newsletter on engineering career growth, promotions, and strategy", category: "soft-skills", type: "newsletter", tags: ["career", "growth", "advice"] },
];

const defaultProfile: UserProfile = {
  name: "",
  title: "",
  summary: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  website: "",
  location: "",
  targetRate: 0,
  targetSalary: 0,
  workAuthorization: "",
  relocation: "",
  availability: "",
  preferences: [],
};

const defaultData: AppData = {
  version: "1.0.0",
  profile: defaultProfile,
  theme: "system",
  applications: [],
  interviews: [],
  stories: [],
  skills: [
    { id: "s1", name: "Role-specific fundamentals", category: "soft-skills", level: 2, targetLevel: 5, priority: "high", notes: "Core skills for the target role", resources: [] },
    { id: "s2", name: "Interview storytelling", category: "soft-skills", level: 2, targetLevel: 5, priority: "high", notes: "STAR stories with metrics and reflection", resources: [] },
    { id: "s3", name: "Company research", category: "soft-skills", level: 2, targetLevel: 4, priority: "high", notes: "Products, customers, values, competitors, recent news", resources: [] },
    { id: "s4", name: "Resume targeting", category: "tools", level: 2, targetLevel: 4, priority: "high", notes: "Role-specific resume versions and keywords", resources: [] },
    { id: "s5", name: "Networking and follow-up", category: "soft-skills", level: 2, targetLevel: 4, priority: "medium", notes: "Recruiter, referral, and hiring-manager touchpoints", resources: [] },
    { id: "s6", name: "Offer negotiation", category: "soft-skills", level: 1, targetLevel: 4, priority: "medium", notes: "Compensation, scope, benefits, and deadline strategy", resources: [] },
    { id: "s7", name: "AI-assisted job search", category: "ai-ml", level: 2, targetLevel: 4, priority: "medium", notes: "Use AI tools for research, drafts, and practice while preserving judgment", resources: [] },
  ],
  companies: [],
  resumes: [],
  learningPaths: defaultLearningPaths,
  flashcards: defaultFlashcards,
  resources: defaultResources,
  contacts: [],
  offers: [],
  journal: [],
  reminders: [],
  lastBackup: undefined,
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return migrateData(parsed);
    }
  } catch { /* ignore */ }
  return deepClone(defaultData);
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function ensureId<T extends { id: string }>(obj: T, prefix: string): T {
  if (!obj.id) obj.id = genId(prefix);
  return obj;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function migrateData(parsed: Partial<AppData>): AppData {
  const migrated: AppData = {
    ...defaultData,
    ...parsed,
    version: parsed.version || defaultData.version,
    profile: parsed.profile || defaultData.profile,
    theme: parsed.theme || defaultData.theme,
    skills: parsed.skills?.length ? parsed.skills : defaultData.skills,
    learningPaths: parsed.learningPaths?.length ? parsed.learningPaths : defaultData.learningPaths,
    flashcards: parsed.flashcards?.length ? parsed.flashcards : defaultData.flashcards,
    resources: parsed.resources?.length ? parsed.resources : defaultData.resources,
    stories: parsed.stories || defaultData.stories,
    contacts: parsed.contacts || defaultData.contacts,
    offers: parsed.offers || defaultData.offers,
    journal: parsed.journal || defaultData.journal,
    reminders: parsed.reminders || defaultData.reminders,
  };
  if (migrated.applications?.length) {
    migrated.applications = migrated.applications.map(ensureApplicationDefaults);
  }
  if (migrated.stories?.length) {
    migrated.stories = migrated.stories.map(ensureStoryDefaults);
  }
  return migrated;
}

function ensureStoryDefaults(story: StoryBankEntry): StoryBankEntry {
  if (!Array.isArray(story.metrics)) story.metrics = [];
  if (!Array.isArray(story.tags)) story.tags = [];
  if (!Array.isArray(story.targetRoles)) story.targetRoles = [];
  return story;
}

function ensureApplicationDefaults(app: Application): Application {
  if (!Array.isArray(app.contacts)) app.contacts = [];
  if (!Array.isArray(app.documents)) app.documents = [];
  if (!Array.isArray(app.timeline)) app.timeline = [];
  return app;
}



// Mirror the portal's localStorage to a JSON file the Hermes plugin can read.
// Only runs in Node (Vite dev/preview sets PREP_PORTAL_DIR). Browser side no-ops.
const DATA_FILE: string | null = (() => {
  if (typeof globalThis !== "undefined") {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    if (env?.PREP_PORTAL_DIR) return env.PREP_PORTAL_DIR + "/data.json";
  }
  return null;
})();

function mirrorToFilesystem(data: AppData): void {
  if (!DATA_FILE) return;
  if (typeof window !== "undefined") return; // browser: skip
  try {
    // Lazy-require node:fs to keep browser bundle clean
    const req = (globalThis as { require?: (m: string) => { writeFileSync: (p: string, c: string) => void } }).require;
    if (req) req("fs").writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {
    // ignore: missing fs or read-only
  }
}


function saveData(data: AppData): void {
  const json = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY, json);
  mirrorToFilesystem(data);
}

let _data: AppData | null = null;

function getData(): AppData {
  if (!_data) _data = loadData();
  return _data;
}

function persist(): void {
  if (_data) saveData(_data);
}

// --- Application CRUD ---
export function getApplications(): Application[] {
  return [...getData().applications].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
export function addApplication(app: Application): Application {
  if (!isNonEmptyString(app.company)) throw new Error("Application requires a company name");
  if (!isNonEmptyString(app.role)) throw new Error("Application requires a role");
  const a = ensureApplicationDefaults(ensureId(app, "app"));
  getData().applications.push(a);
  persist();
  return a;
}
export function updateApplication(id: string, updates: Partial<Application>): boolean {
  const data = getData();
  const idx = data.applications.findIndex(a => a.id === id);
  if (idx === -1) return false;
  data.applications[idx] = { ...data.applications[idx], ...updates, id, updatedAt: new Date().toISOString() };
  persist();
  return true;
}
export function deleteApplication(id: string): boolean {
  const data = getData();
  const before = data.applications.length;
  data.applications = data.applications.filter(a => a.id !== id);
  if (data.applications.length === before) return false;
  persist();
  return true;
}

// --- Interview Prep CRUD ---
export function getInterviews(): InterviewPrep[] {
  return [...getData().interviews].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
export function addInterview(interview: InterviewPrep): InterviewPrep {
  const i = ensureId(interview, "int");
  getData().interviews.push(i);
  persist();
  return i;
}
export function updateInterview(id: string, updates: Partial<InterviewPrep>): boolean {
  const data = getData();
  const idx = data.interviews.findIndex(i => i.id === id);
  if (idx === -1) return false;
  data.interviews[idx] = { ...data.interviews[idx], ...updates, id, updatedAt: new Date().toISOString() };
  persist();
  return true;
}
export function deleteInterview(id: string): boolean {
  const data = getData();
  const before = data.interviews.length;
  data.interviews = data.interviews.filter(i => i.id !== id);
  if (data.interviews.length === before) return false;
  persist();
  return true;
}

// --- Story Bank CRUD ---
export function getStories(): StoryBankEntry[] {
  return [...getData().stories].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
export function addStory(story: StoryBankEntry): StoryBankEntry {
  if (!isNonEmptyString(story.title)) throw new Error("Story requires a title");
  const now = new Date().toISOString();
  const s = ensureStoryDefaults(ensureId({
    ...story,
    createdAt: story.createdAt || now,
    updatedAt: story.updatedAt || now,
  }, "stry"));
  getData().stories.push(s);
  persist();
  return s;
}
export function updateStory(id: string, updates: Partial<StoryBankEntry>): boolean {
  const data = getData();
  const idx = data.stories.findIndex(s => s.id === id);
  if (idx === -1) return false;
  data.stories[idx] = ensureStoryDefaults({ ...data.stories[idx], ...updates, id, updatedAt: new Date().toISOString() });
  persist();
  return true;
}
export function deleteStory(id: string): boolean {
  const data = getData();
  const before = data.stories.length;
  data.stories = data.stories.filter(s => s.id !== id);
  if (data.stories.length === before) return false;
  persist();
  return true;
}

// --- Skills CRUD ---
export function getSkills(): Skill[] { return getData().skills; }
export function updateSkill(id: string, updates: Partial<Skill>): boolean {
  const data = getData(); const idx = data.skills.findIndex(s => s.id === id);
  if (idx === -1) return false;
  data.skills[idx] = { ...data.skills[idx], ...updates, id };
  persist();
  return true;
}
export function addSkill(skill: Skill): Skill {
  if (!isNonEmptyString(skill.name)) throw new Error("Skill requires a name");
  const s = ensureId(skill, "skl");
  getData().skills.push(s);
  persist();
  return s;
}

// --- Company Research CRUD ---
export function getCompanies(): CompanyResearch[] {
  return [...getData().companies].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
export function addCompany(company: CompanyResearch): CompanyResearch {
  if (!isNonEmptyString(company.company)) throw new Error("Company requires a name");
  const c = ensureId(company, "co");
  getData().companies.push(c);
  persist();
  return c;
}
export function updateCompany(id: string, updates: Partial<CompanyResearch>): boolean {
  const data = getData(); const idx = data.companies.findIndex(c => c.id === id);
  if (idx === -1) return false;
  data.companies[idx] = { ...data.companies[idx], ...updates, id, updatedAt: new Date().toISOString() };
  persist();
  return true;
}
export function deleteCompany(id: string): boolean {
  const data = getData(); const before = data.companies.length;
  data.companies = data.companies.filter(c => c.id !== id);
  if (data.companies.length === before) return false;
  persist();
  return true;
}

// --- Resume CRUD ---
export function getResumes(): ResumeVersion[] { return getData().resumes; }
export function addResume(resume: ResumeVersion): ResumeVersion {
  if (!isNonEmptyString(resume.title)) throw new Error("Resume requires a title");
  const r = ensureId(resume, "res");
  getData().resumes.push(r);
  persist();
  return r;
}
export function updateResume(id: string, updates: Partial<ResumeVersion>): boolean {
  const data = getData(); const idx = data.resumes.findIndex(r => r.id === id);
  if (idx === -1) return false;
  data.resumes[idx] = { ...data.resumes[idx], ...updates, id, lastUpdated: new Date().toISOString() };
  persist();
  return true;
}
export function deleteResume(id: string): boolean {
  const data = getData(); const before = data.resumes.length;
  data.resumes = data.resumes.filter(r => r.id !== id);
  if (data.resumes.length === before) return false;
  persist();
  return true;
}

// --- Learning Paths CRUD ---
export function getLearningPaths(): LearningPath[] { return getData().learningPaths; }
export function addLearningPath(path: LearningPath): LearningPath {
  if (!isNonEmptyString(path.title)) throw new Error("Learning path requires a title");
  const p = ensureId(path, "lp");
  if (!Array.isArray(p.modules)) p.modules = [];
  if (!Array.isArray(p.completedModules)) p.completedModules = [];
  getData().learningPaths.push(p);
  persist();
  return p;
}
export function toggleModuleComplete(pathId: string, moduleId: string): boolean {
  const path = getData().learningPaths.find(p => p.id === pathId);
  if (!path) return false;
  const idx = path.completedModules.indexOf(moduleId);
  if (idx === -1) path.completedModules.push(moduleId);
  else path.completedModules.splice(idx, 1);
  persist();
  return true;
}
export function getLearningPathProgress(pathId: string): { completed: number; total: number; percent: number } {
  const path = getData().learningPaths.find(p => p.id === pathId);
  if (!path) return { completed: 0, total: 0, percent: 0 };
  const total = path.modules.length;
  const completed = path.completedModules.length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// --- Flashcards CRUD ---
export function getFlashcards(): Flashcard[] { return getData().flashcards; }
export function addFlashcards(cards: Flashcard[]): Flashcard[] {
  const saved = cards
    .filter((card) => isNonEmptyString(card.question) && isNonEmptyString(card.answer))
    .map((card) => ensureId(card, "fc"));
  if (saved.length === 0) return [];
  getData().flashcards.push(...saved);
  persist();
  return saved;
}
export function getFlashcardDecks(): string[] {
  return Array.from(new Set(getData().flashcards.map(f => f.deck))).sort();
}
export function getFlashcardsByDeck(deck: string): Flashcard[] {
  return getData().flashcards.filter(f => f.deck === deck);
}
export function updateFlashcardLevel(id: string, level: number): boolean {
  const f = getData().flashcards.find(f => f.id === id);
  if (!f) return false;
  f.level = Math.max(1, Math.min(5, level));
  persist();
  return true;
}
export function getDueFlashcards(): Flashcard[] {
  return getData().flashcards.filter(f => f.level < 5).sort((a, b) => a.level - b.level);
}

// --- Curated Resources CRUD ---
export function getResources(): CuratedResource[] { return getData().resources; }
export function getResourcesByCategory(category: string): CuratedResource[] {
  if (category === "all") return getData().resources;
  return getData().resources.filter(r => r.category === category);
}

// --- Profile & Settings ---
export function getProfile(): UserProfile { return getData().profile; }
export function updateProfile(profile: Partial<UserProfile>): void {
  const data = getData(); data.profile = { ...data.profile, ...profile }; persist();
}
export function getTheme(): "light" | "dark" | "system" { return getData().theme; }
export function setTheme(theme: "light" | "dark" | "system"): void { getData().theme = theme; persist(); }

// --- Contacts CRUD ---
export function getContacts(): StandaloneContact[] {
  return [...getData().contacts].sort((a, b) => new Date(b.lastContacted).getTime() - new Date(a.lastContacted).getTime());
}
export function addContact(contact: StandaloneContact): StandaloneContact {
  if (!isNonEmptyString(contact.name)) throw new Error("Contact requires a name");
  const c = ensureId(contact, "ctc");
  getData().contacts.push(c);
  persist();
  return c;
}
export function updateContact(id: string, updates: Partial<StandaloneContact>): boolean {
  const data = getData(); const idx = data.contacts.findIndex(c => c.id === id);
  if (idx === -1) return false;
  data.contacts[idx] = { ...data.contacts[idx], ...updates, id };
  persist();
  return true;
}
export function deleteContact(id: string): boolean {
  const data = getData(); const before = data.contacts.length;
  data.contacts = data.contacts.filter(c => c.id !== id);
  if (data.contacts.length === before) return false;
  persist();
  return true;
}

// --- Offers CRUD ---
export function getOffers(): Offer[] {
  return [...getData().offers].sort((a, b) => b.score - a.score);
}
export function addOffer(offer: Offer): Offer {
  if (!isNonEmptyString(offer.company)) throw new Error("Offer requires a company name");
  if (!isNonEmptyString(offer.role)) throw new Error("Offer requires a role");
  const o = ensureId(offer, "ofr");
  o.score = calculateOfferScore(o);
  getData().offers.push(o);
  persist();
  return o;
}
export function updateOffer(id: string, updates: Partial<Offer>): boolean {
  const data = getData(); const idx = data.offers.findIndex(o => o.id === id);
  if (idx === -1) return false;
  data.offers[idx] = { ...data.offers[idx], ...updates, id };
  data.offers[idx].score = calculateOfferScore(data.offers[idx]);
  persist();
  return true;
}
export function deleteOffer(id: string): boolean {
  const data = getData(); const before = data.offers.length;
  data.offers = data.offers.filter(o => o.id !== id);
  if (data.offers.length === before) return false;
  persist();
  return true;
}
export function calculateOfferScore(offer: Offer): number {
  const totalComp = offer.baseSalary + offer.bonus * 1.5 + offer.equity * 0.5;
  const remoteBonus = offer.remote === "fully-remote" ? 5000 : offer.remote === "hybrid" ? 2500 : 0;
  const ptoValue = offer.pto * 2000;
  return Math.round(totalComp + remoteBonus + ptoValue);
}

// --- Journal CRUD ---
export function getJournal(): JournalEntry[] {
  return [...getData().journal].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export function addJournal(entry: JournalEntry): JournalEntry {
  const e = ensureId(entry, "jrn");
  getData().journal.push(e);
  persist();
  return e;
}
export function updateJournal(id: string, updates: Partial<JournalEntry>): boolean {
  const data = getData(); const idx = data.journal.findIndex(j => j.id === id);
  if (idx === -1) return false;
  data.journal[idx] = { ...data.journal[idx], ...updates, id };
  persist();
  return true;
}
export function deleteJournal(id: string): boolean {
  const data = getData(); const before = data.journal.length;
  data.journal = data.journal.filter(j => j.id !== id);
  if (data.journal.length === before) return false;
  persist();
  return true;
}
export function needsBackup(): boolean {
  return isBackupNeeded(getData());
}
export function recordBackup(): void { getData().lastBackup = new Date().toISOString(); persist(); }


// --- Reminders CRUD ---
export function getReminders(): Reminder[] {
  return [...getData().reminders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
export function addReminder(reminder: Reminder): Reminder {
  if (!isNonEmptyString(reminder.title)) throw new Error("Reminder requires a title");
  if (!isNonEmptyString(reminder.date)) throw new Error("Reminder requires a date");
  const r = ensureId(reminder, "rm");
  getData().reminders.push(r);
  persist();
  return r;
}
export function updateReminder(id: string, updates: Partial<Reminder>): boolean {
  const data = getData(); const idx = data.reminders.findIndex(r => r.id === id);
  if (idx === -1) return false;
  data.reminders[idx] = { ...data.reminders[idx], ...updates, id };
  persist();
  return true;
}
export function deleteReminder(id: string): boolean {
  const data = getData(); const before = data.reminders.length;
  data.reminders = data.reminders.filter(r => r.id !== id);
  if (data.reminders.length === before) return false;
  persist();
  return true;
}


// --- Application Documents ---
export function addApplicationDocument(appId: string, doc: ApplicationDocument): ApplicationDocument | null {
  const data = getData();
  const app = data.applications.find(a => a.id === appId);
  if (!app) return null;
  const d = ensureId(doc, "doc");
  app.documents.push(d);
  persist();
  return d;
}
export function updateApplicationDocument(appId: string, docId: string, updates: Partial<ApplicationDocument>): boolean {
  const app = getData().applications.find(a => a.id === appId);
  if (!app) return false;
  const idx = app.documents.findIndex(d => d.id === docId);
  if (idx === -1) return false;
  app.documents[idx] = { ...app.documents[idx], ...updates, id: docId };
  persist();
  return true;
}
export function deleteApplicationDocument(appId: string, docId: string): boolean {
  const app = getData().applications.find(a => a.id === appId);
  if (!app) return false;
  const before = app.documents.length;
  app.documents = app.documents.filter(d => d.id !== docId);
  if (app.documents.length === before) return false;
  persist();
  return true;
}

// --- Export / Import ---
export function exportData(): string {
  return JSON.stringify(getData(), null, 2);
}
export function importData(json: string): boolean {
  if (typeof json !== "string" || !json.trim()) return false;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return false;
    if (!isRecord(parsed) || !Array.isArray(parsed.applications) || !Array.isArray(parsed.skills)) return false;
    _data = migrateData(parsed as Partial<AppData>);
    persist();
    return true;
  } catch {
    return false;
  }
}
export function resetData(): void {
  _data = deepClone(defaultData);
  persist();
}


function profileCompleteness(profile: UserProfile): number {
  const fields = [
    profile.name,
    profile.title,
    profile.summary,
    profile.email || profile.linkedin || profile.website,
    profile.location,
    profile.availability,
  ];
  const filled = fields.filter(isNonEmptyString).length;
  return filled / fields.length;
}

function daysUntil(date: string): number {
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysSince(date: string): number {
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY;
  return (Date.now() - target) / (1000 * 60 * 60 * 24);
}

function isBackupNeeded(data: Pick<AppData, "lastBackup">): boolean {
  if (!data.lastBackup) return true;
  return daysSince(data.lastBackup) >= 7;
}

function buildNextActions(data: AppData): DashboardAction[] {
  const actions: DashboardAction[] = [];
  const activeApps = data.applications.filter(a => !["rejected", "accepted", "withdrawn"].includes(a.status));
  const interviewApps = data.applications.filter(a => ["phone-screen", "technical", "onsite"].includes(a.status));
  const overdueFollowUps = data.applications.filter(a => a.followUpDate && daysUntil(a.followUpDate) <= 0);
  const upcomingPrep = data.interviews.filter(i => daysUntil(i.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  if (profileCompleteness(data.profile) < 0.67) {
    actions.push({
      id: "profile",
      title: "Complete your job-search profile",
      detail: "AI outputs and resume targeting improve once identity, target role, location, and contact fields are filled.",
      href: "/onboarding",
      priority: "critical",
    });
  }

  if (isBackupNeeded(data)) {
    actions.push({
      id: "backup",
      title: data.lastBackup ? "Refresh your backup" : "Export your first backup",
      detail: data.lastBackup
        ? "Your local job-search data has not been backed up in over a week."
        : "Protect applications, resumes, prep notes, story bank, contacts, and offers before browser storage changes.",
      href: "/settings",
      priority: "high",
    });
  }

  if (data.resumes.length === 0) {
    actions.push({
      id: "resume",
      title: "Create a targeted resume version",
      detail: "Add one base resume, then clone it per role so every application has proof matched to the JD.",
      href: "/resume",
      priority: "high",
    });
  }

  if (data.applications.length === 0) {
    actions.push({
      id: "capture",
      title: "Capture your first opportunity",
      detail: "Paste a JD, score the fit, and save it into the pipeline before analysis slows you down.",
      href: "/evaluate",
      priority: "high",
    });
  } else if (activeApps.length === 0) {
    actions.push({
      id: "pipeline",
      title: "Refill the active pipeline",
      detail: "All tracked opportunities are closed. Add new roles or revisit saved leads.",
      href: "/applications",
      priority: "high",
    });
  }

  if (overdueFollowUps.length > 0) {
    actions.push({
      id: "follow-up",
      title: `Follow up on ${overdueFollowUps.length} opportunity${overdueFollowUps.length === 1 ? "" : "ies"}`,
      detail: "Overdue follow-ups are the easiest pipeline leak to plug.",
      href: "/reminders",
      priority: "critical",
    });
  }

  if (interviewApps.length > 0 && data.interviews.length === 0) {
    actions.push({
      id: "prep",
      title: "Build prep plans for active interviews",
      detail: "Phone, technical, and onsite stages need question banks, company research, and a rehearsal plan.",
      href: "/interviews",
      priority: "critical",
    });
  } else if (upcomingPrep[0] && daysUntil(upcomingPrep[0].date) <= 3) {
    actions.push({
      id: "rehearse",
      title: "Rehearse next interview",
      detail: `${upcomingPrep[0].company} is coming up soon. Drill likely questions and tighten your story bank.`,
      href: "/interviews",
      priority: "high",
    });
  }

  if (data.companies.length === 0 && data.applications.length > 0) {
    actions.push({
      id: "research",
      title: "Add company research",
      detail: "Research turns generic answers into specific reasons, questions, and personalization hooks.",
      href: "/research",
      priority: "medium",
    });
  }

  if (data.contacts.length === 0) {
    actions.push({
      id: "contacts",
      title: "Track recruiters and referrals",
      detail: "A lightweight contact list keeps warm leads, referral asks, and thank-you notes from disappearing.",
      href: "/contacts",
      priority: "medium",
    });
  }

  if (data.flashcards.some(f => f.level < 5)) {
    actions.push({
      id: "flashcards",
      title: "Review due flashcards",
      detail: `${data.flashcards.filter(f => f.level < 5).length} prompts are ready for practice.`,
      href: "/flashcards",
      priority: "low",
    });
  }

  const priorityRank: Record<DashboardAction["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]).slice(0, 5);
}

function calculateReadinessScore(data: AppData): number {
  const profile = profileCompleteness(data.profile) * 20;
  const resume = Math.min(data.resumes.length, 1) * 15;
  const pipeline = Math.min(data.applications.filter(a => !["rejected", "withdrawn"].includes(a.status)).length / 5, 1) * 20;
  const interviewPrep = Math.min((data.interviews.length + data.companies.length) / 3, 1) * 20;
  const practice = Math.min(data.flashcards.filter(f => f.level >= 4).length / Math.max(data.flashcards.length, 1), 1) * 15;
  const network = Math.min(data.contacts.length / 5, 1) * 10;
  return Math.round(profile + resume + pipeline + interviewPrep + practice + network);
}

// --- Dashboard Stats ---
export function getDashboardStats(): DashboardStats {
  const data = getData();
  const apps = data.applications;
  return {
    totalApplications: apps.length,
    activeApplications: apps.filter(a => !["rejected", "accepted", "withdrawn", "offer"].includes(a.status)).length,
    interviews: apps.filter(a => ["phone-screen", "technical", "onsite"].includes(a.status)).length,
    offers: apps.filter(a => a.status === "offer").length,
    rejected: apps.filter(a => a.status === "rejected").length,
    skillsProgress: data.skills.filter(s => s.level >= s.targetLevel).length / Math.max(data.skills.length, 1) * 100,
    upcomingInterviews: data.interviews.filter(i => new Date(i.date) > new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    studyModules: data.learningPaths.reduce((sum, p) => sum + p.modules.length, 0),
    completedModules: data.learningPaths.reduce((sum, p) => sum + p.completedModules.length, 0),
    flashcardsDue: data.flashcards.filter(f => f.level < 5).length,
    readinessScore: calculateReadinessScore(data),
    nextActions: buildNextActions(data),
    backupNeeded: isBackupNeeded(data),
    lastBackup: data.lastBackup,
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    saved: "bg-gray-100 text-gray-700",
    applied: "bg-blue-100 text-blue-700",
    "phone-screen": "bg-yellow-100 text-yellow-700",
    technical: "bg-purple-100 text-purple-700",
    onsite: "bg-orange-100 text-orange-700",
    offer: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    accepted: "bg-emerald-100 text-emerald-700",
    withdrawn: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
