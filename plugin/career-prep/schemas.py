"""Tool schemas for Career Prep plugin."""

EVALUATE_JD_SCHEMA = {
    "name": "evaluate_jd",
    "description": (
        "Evaluate a job description against your profile (CV, skills, experience). "
        "Take a job description URL or pasted text and return a structured A-F evaluation: "
        "A) Role Summary, B) CV Match Score, C) Level/Title Strategy, "
        "D) Compensation Research, E) Personalization Hooks, F) Interview Prep Roadmap. "
        "Use this when the user pastes a job link, asks 'evaluate this role', "
        "or wants to know if a job is worth applying to."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "url_or_text": {
                "type": "string",
                "description": "URL to the job posting or the full job description text to evaluate."
            },
            "save_to_portal": {
                "type": "boolean",
                "description": "Whether to save the evaluation to the Interview Prep Portal (default: true).",
                "default": True
            }
        },
        "required": ["url_or_text"]
    }
}

COVER_LETTER_SCHEMA = {
    "name": "generate_cover_letter",
    "description": (
        "Generate a tailored, ATS-optimized cover letter for a specific job. "
        "Requires company name and role. Optionally include the job description "
        "for better keyword matching. Returns a markdown cover letter with personalization hooks."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "company": {
                "type": "string",
                "description": "Company name you're applying to."
            },
            "role": {
                "type": "string",
                "description": "Role/title you're applying for."
            },
            "job_description": {
                "type": "string",
                "description": "Optional: the job description text for keyword matching."
            },
            "angle": {
                "type": "string",
                "enum": ["why_them", "why_me", "impact", "mission"],
                "description": "The angle for the cover letter: why_them (why you want the company), why_me (why you're the right fit), impact (what you'll deliver), mission (alignment with their mission).",
                "default": "impact"
            }
        },
        "required": ["company", "role"]
    }
}

RESEARCH_COMPANY_SCHEMA = {
    "name": "research_company",
    "description": (
        "Deep research on a company before an interview. "
        "Searches the web for recent news, product launches, funding, culture, "
        "tech stack, leadership changes, and interview process. "
        "Returns a structured research brief you can use in interviews."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "company": {
                "type": "string",
                "description": "Company name to research."
            },
            "role": {
                "type": "string",
                "description": "Optional: the role you're targeting for role-specific research."
            },
            "save_to_portal": {
                "type": "boolean",
                "description": "Save the research to the portal's Company Research section (default: true).",
                "default": True
            }
        },
        "required": ["company"]
    }
}

SCAN_JOBS_SCHEMA = {
    "name": "scan_jobs",
    "description": (
        "Scan job boards and company career pages for matching roles. "
        "Searches common job platforms (LinkedIn, Indeed, Wellfound, Greenhouse, etc.) "
        "for roles matching your profile. Use when the user asks 'find me jobs', "
        "'what's out there', or wants to discover new opportunities."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "search_terms": {
                "type": "string",
                "description": "Search terms like 'AI Engineer', 'LLM Developer', 'MCP Engineer'. Default: uses your configured profile roles."
            },
            "location": {
                "type": "string",
                "description": "Location filter. Use 'remote' for remote-only. Default: Toronto/Remote."
            },
            "max_results": {
                "type": "integer",
                "description": "Number of jobs to return. Default: 10, max: 25.",
                "minimum": 1,
                "maximum": 25,
                "default": 10
            }
        },
        "required": []
    }
}

INTERVIEW_STORIES_SCHEMA = {
    "name": "generate_interview_stories",
    "description": (
        "Generate STAR+Reflection interview stories for your profile. "
        "Creates 5-10 master stories that address common behavioral questions: "
        "leadership, conflict, failure, innovation, collaboration, technical challenge. "
        "Each story follows the STAR+R format (Situation, Task, Action, Result, Reflection). "
        "Use this when preparing for behavioral interviews."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "focus": {
                "type": "string",
                "enum": ["leadership", "conflict", "failure", "innovation", "collaboration", "technical", "all"],
                "description": "Which story type to generate. Use 'all' for a complete story bank.",
                "default": "all"
            },
            "save_to_portal": {
                "type": "boolean",
                "description": "Save stories to the portal's Interview Prep section.",
                "default": True
            }
        },
        "required": []
    }
}

NEGOTIATION_SCRIPT_SCHEMA = {
    "name": "generate_negotiation_script",
    "description": (
        "Generate a salary negotiation script tailored to your situation. "
        "Provides talking points, anchor strategies, geographic discount pushback, "
        "competing offer leverage, and equity evaluation. "
        "Use when you have an offer or are preparing for compensation discussions."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "offer_details": {
                "type": "string",
                "description": "Details about the offer: company, role, offered comp, location, any benefits/equity. Can be pasted text."
            },
            "c2c": {
                "type": "boolean",
                "description": "Whether this is a C2C/contract role (default: false).",
                "default": False
            }
        },
        "required": ["offer_details"]
    }
}

SERVE_PORTAL_SCHEMA = {
    "name": "serve_portal",
    "description": (
        "Start or stop the Interview Prep Portal web dashboard. "
        "The portal provides a visual UI for tracking applications, managing learning paths, "
        "practicing flashcards, and researching companies. "
        "Runs on localhost:8766 by default."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["start", "stop", "status"],
                "description": "What to do with the portal: start, stop, or check status."
            }
        },
        "required": ["action"]
    }
}

PORTAL_STATUS_SCHEMA = {
    "name": "portal_status",
    "description": (
        "Get a summary of your Interview Prep Portal data: "
        "total applications, active interviews, study progress, flashcards due, "
        "upcoming interview prep sessions, and skills gap analysis."
    ),
    "parameters": {
        "type": "object",
        "properties": {},
        "required": []
    }
}
