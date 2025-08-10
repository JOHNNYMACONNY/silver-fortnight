# Seeding Sample Challenges and AI Model Configuration

## 1) Seed Universal Sample Challenges

Run the TypeScript seeding script to populate a few universal challenges.

Prerequisites:
- Firebase project configured in this repo
- Node 18+

Steps:
1. Ensure your Firebase config is valid and you can connect to Firestore from the local environment.
2. Run the script:

```bash
npx ts-node scripts/create-sample-challenges.ts
```

Notes:
- The script creates a few universal challenges (e.g., “Tell a Story with Your Craft”, “Solve a Real Problem”).
- Records are written to the `challenges` collection.

## 2) Configure OpenRouter Model

We default the AI model for code review and other tasks to a cost-effective/free option.

- Default model: `google/gemini-flash-1.5`
- Override via environment variable:

```bash
export OPENROUTER_MODEL="mistralai/mistral-7b-instruct"
```

The service reads:
- `OPENROUTER_API_KEY` for authentication
- `OPENROUTER_MODEL` for preferred model (optional, falls back to `google/gemini-flash-1.5`)

Ensure your environment contains:

```bash
export OPENROUTER_API_KEY="<your-openrouter-api-key>"
# optional override
export OPENROUTER_MODEL="google/gemini-flash-1.5"
```

Then restart your app/server so changes take effect.

## 3) Where it’s used

- `src/services/ai/codeReviewService.ts` – reads `OPENROUTER_MODEL` and `OPENROUTER_API_KEY`.
- Challenge discovery/completion can leverage AI as we expand features.

## 4) Troubleshooting

- If seeding fails: verify Firestore credentials and rules; ensure `firebase-config` is correct.
- If AI calls fail: check `OPENROUTER_API_KEY` validity, model name spelling, and network connectivity.


