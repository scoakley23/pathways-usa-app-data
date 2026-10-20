# Pathways USA

A learning hub that helps people prepare for U.S. citizenship: studying for the civics and English tests, understanding the N-400 application, and tracking progress along the way.

Built with [Base44](https://base44.com), React, Vite, and Tailwind CSS.

## Features

- **Roadmap home** – a step-by-step path to citizenship that tracks where you are.
- **Lessons** – flashcards, quizzes, key points, notes, and a glossary, with language options.
- **Practice** – civics questions, dictation, and reading sentences.
- **N-400 Guide** – a walkthrough of the citizenship application, a replica of the official form, sample personas, and "Say It Back" speaking practice.
- **Talk to a Lawyer** – a checklist to help decide when to get legal help.
- **AI Study Buddy** – ask questions and get explanations of quiz answers.
- **Progress & motivation** – badges, leaderboard, practice calendar, test-date countdown, and reminders.
- **Tutors & messaging** – connect with a tutor and send messages.
- **Admin** – manage civics questions, vocabulary, and sentences.

## Project structure

| Path | What's there |
| --- | --- |
| `src/pages/` | One file per page (auto-registered by Base44) |
| `src/components/` | Feature components, grouped by area (`lessons/`, `n400/`, `civics/`, …) |
| `src/components/ui/` | Shared UI building blocks (shadcn/ui) |
| `src/api/` | The Base44 client used to talk to the backend |
| `base44/entities/` | Data model definitions (lessons, questions, progress, etc.) |

## How code changes flow

This repo is two-way synced with the Base44 app on the `main` branch: edits made in Base44 appear here, and changes merged into `main` appear in Base44. Work in progress happens on separate branches and is merged into `main` via pull request.

## Running locally

```bash
npm install
npm run dev
```

Running locally requires the Base44 app's environment settings; data, sign-in, and AI features are served by Base44.
