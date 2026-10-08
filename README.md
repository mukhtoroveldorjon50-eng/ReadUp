# ReadUp

A public website where anyone can read leveled articles and improve their English. Next.js + SQLite (same stack as the EMpractice site).

## Features

**Readers (anyone who signs up)**
- Library of articles by level (A2–C1) and topic, with search, "not read yet / read / bookmarked" filters, and recommendations based on level, topics and recent quiz scores.
- Reader: tap any word for a definition, pronunciation and translation into the reader's language; save words; original / simplified toggle; text size; reading timer and words-per-minute.
- Listen: text-to-speech with the current sentence highlighted (slow / normal / fast), plus the teacher's own audio recording if one is uploaded.
- **Two quizzes per article**: a *language* quiz (grammar and vocabulary) and a *comprehension* quiz. Question types: multiple choice, True/False/Not given, gap fill. Instant feedback and explanation after every question; answers are checked on the server and never sent to the browser in advance.
- Word exercises from the article's key vocabulary (matching, gap fill, write your own sentence).
- Vocabulary list and spaced-repetition flashcards (Leitner boxes).
- Speaking practice (read a sentence aloud, see which words were recognised; Chrome/Edge/Safari), writing practice (with optional AI feedback), optional "Ask AI" helper.
- Progress: XP, daily goal, streaks, badges, 14-day chart, reading history, quiz averages.
- Installable and works offline for pages already opened (PWA).

**Admin** (the first account registered, or the email in `TEACHER_EMAIL`)
- Article editor: text, simplified text, audio upload, key vocabulary, and the two quizzes. Optional "Draft with AI".
- Per-article statistics: readers and average quiz scores.

## Run locally

```
npm install
npm run build
npm run start -- -p 3100
node scripts/seed-demo.js http://localhost:3100   # optional demo data
```

Demo logins (after seeding): admin `demo-teacher@example.com` / `demo-password-1`, reader `demo-student@example.com` / `demo-password-2`.

## Configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `READUP_DATA_DIR` | Where the database and uploaded audio live. Use a persistent volume in production (e.g. `/data`). |
| `TEACHER_EMAIL` | An email that becomes the admin account when it registers. |
| `RESET_ALL_USERS` | One-time switch. Set to `DELETE_ALL_USERS`, redeploy, then REMOVE it. Deletes every account and its progress (articles are kept); the next person to register becomes the admin. |
| `ANTHROPIC_API_KEY` | Optional. Switches on the AI helper, AI writing feedback and AI quiz drafting. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-5-5`. |

## Deploying (Railway, like EMpractice)

Uses the included `Dockerfile`. Create a service from the GitHub repo, add a volume mounted at `/data`, and set `TEACHER_EMAIL` (your admin email).

## Notes

- Word lookups use Wiktionary and dictionaryapi.dev; translations use MyMemory (free, rate-limited). Results are cached in the database.
- Article texts and audio you add should be ones you have the right to use.
