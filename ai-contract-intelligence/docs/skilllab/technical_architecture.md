# Technical Architecture - AI Contract Intelligence

## Overview

This platform is a multi-tenant SaaS solution designed to automate contract analysis using Generative AI (LLMs). The system is built on a scalable cloud architecture ensuring strict data isolation and high availability.

## Core Components

### 1. Frontend Layer

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **UI Library**: Tailwind CSS + Shadcn/UI
- **Hosting**: Vercel / Edge Network

### 2. Backend & Data Layer

- **Platform**: Google Firebase (Serverless)
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage (for PDF contracts)
- **Authentication**: Firebase Auth with Custom Role-Based Access Control (RBAC)

### 3. AI Engine

- **Model**: Claude 3.5 Sonnet (via Anthropic API)
- **Capability**:
  - Context Window: 200k tokens
  - Feature: "Granular Pointers" - identifying Page/Line coordinates for specific clauses.
- **Feedback Loop**:
  - Corrections made by Group Director (Paolo Picchio) are stored in a dedicated `training_data` collection to refine future prompts (Few-Shot Prompting).

## Data Flow

1. User uploads PDF -> Stored in Firebase Storage (Bucket isolated by `companyId`).
2. Cloud Function triggers -> `pdf-parse` extracts text referencing pages.
3. Prompt Engineering module constructs context for Claude 3.5.
4. AI Response -> Parsed JSON stored in `analysis_results` (Firestore).
5. Frontend fetches result -> Visualized in Split-Screen Editor.

## Scalability

The architecture is designed to handle 3 current companies but is horizontally scalable to N tenants without schema changes.
