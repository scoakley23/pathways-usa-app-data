# Civics grading eval

When a learner says a civics answer the phone can't match on its own
(`matchCivicsAnswer()`), the app asks an AI whether the answer is right
(`checkCivicsAnswer()`). This eval sends test answers to several models with
**the app's exact prompt** (`src/lib/civicsCheckPrompt.js`) and compares each
verdict with the answer's label, so you can pick the model.

## What it reports, per model

- **Passes a wrong answer**: the costly mistake (a learner thinks they're
  ready when they aren't). Lower is better.
- **Fails a right answer**: discourages the learner. Lower is better.
- **Accuracy**, with a 95% range: two models whose ranges overlap a lot may
  not really differ; run more reps (`--reps 4`) to narrow it.
- **Errors**, **median wait** and **cost per 1,000 answers**.
- How each type of case went (wrong, broken English, "Name three…", and so on).

## Steps (on your computer, keys in your terminal only)

1. Review the cases in `cases.md`. To change one, edit `cases.json`, then run
   `npm run evals:civics:cases`. When you're happy, set every case's
   `"status"` to `"reviewed"` (the runner won't run drafts without
   `--allow-drafts`).
2. Estimate the cost, free: `npm run evals:civics -- --check`
3. Set your key: `read -rs "ANTHROPIC_API_KEY?Key: "` then
   `export ANTHROPIC_API_KEY`. For ChatGPT also `OPENAI_API_KEY` the same way.
4. Run: `npm run evals:civics`
   - ChatGPT too: `npm run evals:civics -- --openai-model <model id> --openai-price <input>,<output>`
     (price per million tokens from openai.com/api/pricing, so the cost column is right).
   - Options: `--models haiku,sonnet,opus` · `--reps 2` · `--effort low|medium|high`
     (Claude only; without it each model uses its default) · `--concurrency 4`.
5. Read `.claude/hillclimb/civics-grading/summary.md`. Each model's
   `results.jsonl` has every verdict with the model's short reason, and
   `traces/` the exact prompt and reply.

If it stops partway, run the same command again: finished answers are kept and
skipped. Results stay on your computer (`.claude/hillclimb/` is not committed).

## Notes

- Claude: Haiku 5.5, Sonnet 5.5, Opus 5.5 through Anthropic's SDK, with
  structured output so every reply is `{ is_correct, feedback }`. Refusal
  fallbacks are off on purpose: a fallback would answer with a different model
  and blur the comparison. A refusal counts as an error for that model.
- A reply from a model other than the one asked for is recorded as an error
  (`served-model-mismatch`), never scored.
- The app sends the prompt through Base44 today; the eval calls the models
  directly with the same words. The model you pick here is what the `ai`
  server function (Step 4) will use.
- The cases are made up. Personal details in three of them (a phone number, an
  email, an A-number) check that those are removed before anything is sent.
