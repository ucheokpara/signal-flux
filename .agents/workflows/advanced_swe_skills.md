---
description: Framework and prompts for triggering advanced architectural reasoning, defensive programming, and rigorous problem-solving.
---

# Advanced SWE Skills & Antigravity Collaboration Guide

To get the most robust, enterprise-grade software architecture out of the Antigravity Agent, you should explicitly force it to step out of "immediate execution" mode and into "architectural planning" mode.

By invoking these specific prompt strategies, you force the AI to evaluate trade-offs, decouple brittle dependencies (like LLM-generated syntax), and deliver bolder, more permanent engineering solutions.

## 1. Explicitly Command a "Brainstorming Phase"
Instead of saying *"fix this bug"*, demand a structured evaluation:
> **Prompt:** "Before you write any code or use any tools, brainstorm 3 completely different architectural ways we could solve this problem. Rank them by reliability, maintenance cost, and deterministic execution. Wait for me to pick one."
**Why it works:** It forces the AI's reasoning engine to stop, evaluate trade-offs, and present you with options rather than blindly forcing the very first thought it had into your codebase.

## 2. Constrain the LLM Reliance
When building AI-integrated applications, the AI will naturally try to solve physical UI or structural problems using LLM prompt-engineering. Nip this in the bud:
> **Prompt:** "What is the most deterministic, traditional software engineering way to achieve this without relying on Agent Flux's prompt adherence or real-time LLM generation?"
**Why it works:** It immediately breaks the AI out of "prompt engineering mode" and forces it to rely on strict TypeScript, database schemas, or hardcoded UI templates to solve the problem (e.g., templatizing Mermaid charts).

## 3. Ask for the "Big Picture Refactor"
If you ever feel like the code is getting too messy, brittle, or filled with endless patches:
> **Prompt:** "Take a step back. Is there a bolder, simpler way to restructure this entire component/pipeline so we don't have to keep patching it?"
**Why it works:** AI coding agents often suffer from "tunnel vision" and will eagerly patch a symptom forever. This command grants the agent permission to tear down a flawed foundation and propose a much cleaner rewrite.

## 4. Demand "Defensive Programming"
When implementing a new feature, ensure it won't crash the system if an edge case hits:
> **Prompt:** "Implement this feature using strict defensive programming. Assume the API might fail, the payload might be malformed, or the state might be completely out of sync. Add explicit error catching and graceful fallback UIs."
**Why it works:** It shifts the AI from writing "happy-path-only" code (which looks great but breaks in production) to writing production-ready code that protects the application state.

## 5. Force the "Separation of Concerns"
When components get too large:
> **Prompt:** "This file is doing too much. Before adding the new feature, extract the data-fetching logic and the UI presentation logic into purely separated architectures."
**Why it works:** Keeps your codebase modular and prevents "God files" from forming over multiple chat sessions.

## 6. The "Fix A, Break B" Regression Guard
To prevent side-effects where fixing one isolated issue silently breaks another:
> **Prompt:** "I need you to fix [Issue A]. However, before you declare it complete, you must explicitly identify any related features or modules (B, C, D) that touch this code. After applying the fix, mentally walk through the code and verify that your changes did not break those related systems or introduce new context errors."
**Why it works:** It forces the AI into a "regression-aware" mindset. Instead of blindly applying a localized patch that breaks the wider ecosystem, the agent is forced to step back, map out the dependencies, and guarantee system-wide stability before handing the code back to you.
