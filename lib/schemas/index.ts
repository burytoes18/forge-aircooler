import { z } from 'zod';

// A single factual claim. Either has a citation OR a confidence tag.
export const ConfidenceTagSchema = z.enum([
  'verified',      // has a real citation
  'unverified',    // source exists but quality is low
  'estimate',      // calculated/interpolated
  'assumption',    // logical inference
  'needs_expert',  // requires licensed professional
]);
export type ConfidenceTag = z.infer<typeof ConfidenceTagSchema>;

export const ClaimSchema = z.object({
  text: z.string().min(1),
  confidence: ConfidenceTagSchema,
  citation_url: z.string().optional().nullable(),
  citation_title: z.string().optional().nullable(),
  rationale: z.string().optional().nullable(), // for non-verified tags, why
});
export type Claim = z.infer<typeof ClaimSchema>;

export const DomainTagSchema = z.enum([
  'market',
  'engineering',
  'financial',
  'design',
  'regulatory',
  'manufacturing',
]);
export type DomainTag = z.infer<typeof DomainTagSchema>;

export const SectionSchema = z.object({
  heading: z.string().min(1),
  domain_tags: z.array(DomainTagSchema).min(1),
  body: z.string(),                  // prose/markdown allowed
  claims: z.array(ClaimSchema),      // claims referenced in body
});
export type Section = z.infer<typeof SectionSchema>;

export const DeliverableSchema = z.object({
  verdict: z.string().min(1),        // headline finding, displayed at top
  sections: z.array(SectionSchema).min(1),
  open_questions: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});
export type Deliverable = z.infer<typeof DeliverableSchema>;

export const PlanStepSchema = z.object({
  number: z.number(),
  description: z.string(),
  expected_output: z.string(),
});
export const PlanSchema = z.object({
  summary: z.string(),
  steps: z.array(PlanStepSchema).min(1),
  clarifying_question: z.string().optional().nullable(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const AskAnswerSchema = z.object({
  domain_tags: z.array(DomainTagSchema).min(1),
  bullets: z.array(z.object({
    text: z.string(),
    claims: z.array(ClaimSchema).default([]),
  })).min(1).max(6),
});
export type AskAnswer = z.infer<typeof AskAnswerSchema>;
