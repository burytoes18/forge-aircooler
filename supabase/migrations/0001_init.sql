-- Forge schema — single-project, no auth (two-user trusted app)

create extension if not exists "pgcrypto";

-- The project brief (singleton — stores the editable CLAUDE.md content)
create table project_brief (
  id uuid primary key default gen_random_uuid(),
  product_context text not null,
  unknowns text not null,
  domain_areas text not null,
  anti_patterns text not null,
  updated_at timestamptz not null default now()
);

-- Workflow specs (the five from CLAUDE.md, loadable as editable rows)
create table workflows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  intake_schema jsonb not null,           -- field defs for the intake form
  output_template jsonb not null,         -- required section structure
  system_prompt_module text not null,     -- workflow-specific system prompt
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A single execution of a workflow
create table workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  intake_inputs jsonb not null,
  plan jsonb,
  status text not null default 'planning',  -- planning | approved | running | complete | failed
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Deliverables — the actual output artifacts
create table deliverables (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  title text not null,
  -- Structured content: array of sections, each with domain tags + claims
  structured_content jsonb not null,
  content_markdown text not null,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The Grounding Reference benchmarks table from CLAUDE.md
create table benchmarks (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  value text not null,           -- text to allow ranges like "3.0–5.5"
  unit text not null,
  source_url text,
  source_title text,
  confidence_tag text not null,  -- 'verified' | 'estimate' | 'assumption' | 'unverified' | 'needs_expert'
  notes text,
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One-off Ask queries
create table ask_history (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  structured_answer jsonb not null,
  content_markdown text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index deliverables_run_idx on deliverables(workflow_run_id);
create index deliverables_created_idx on deliverables(created_at desc);
create index workflow_runs_status_idx on workflow_runs(status);
create index benchmarks_verified_idx on benchmarks(last_verified_at desc);
