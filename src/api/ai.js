// Every live AI call in the app goes through here (Step 4).
//
// ai.run(kind, input): the learner-facing requests in src/lib/aiRequests.js
// (ask, civics_check, interview, understanding, explain).
//   Switch on (Supabase): the `ai` Edge Function, which confirms the question,
//   writes the instructions, counts the daily limit and calls Claude. The phone
//   sends only data. A learner over the limit gets an AiLimitError.
//   Switch off (Base44): the same instructions, built here, through Base44's
//   InvokeLLM, as before.
// ai.translate(args): live translation of app text, only while the switch is
//   off (with it on, the translation pack is used and missing lines stay in
//   English). Throws when the switch is on.
// ai.adminDraft(args): the admin explanation drafting tool (Base44 only).
import { PROVIDER } from '@/api/provider';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { AI_LIMIT_MESSAGE, buildRequest } from '@/lib/aiRequests';

export class AiLimitError extends Error {
  constructor() {
    super(AI_LIMIT_MESSAGE);
    this.name = 'AiLimitError';
    this.limit = true;
  }
}
export const isAiLimit = (error) => !!error?.limit;

export function createAiApi({ provider = PROVIDER, base44: b44 = base44, supabase = getSupabase } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  return {
    // ctx.civics: the official list for Ask Amio on Base44, or a function that
    // loads it (loadCivicsBank); the server has its own copy.
    async run(kind, input, ctx = {}) {
      if (provider === 'supabase') {
        const { data, error } = await sb().functions.invoke('ai', { body: { kind, input } });
        if (error) {
          if (error.context?.status === 429) throw new AiLimitError();
          throw new Error('The AI request did not work.');
        }
        if (!data?.result) throw new Error('The AI request did not work.');
        return data.result;
      }
      const civics = typeof ctx.civics === 'function' ? await ctx.civics() : ctx.civics;
      const built = buildRequest(kind, input, { civics, today: new Date() });
      if (!built.ok) throw new Error(`AI request not sent: ${built.error}`);
      return b44.integrations.Core.InvokeLLM({ prompt: built.prompt, response_json_schema: built.schema });
    },

    async translate(args) {
      if (provider === 'supabase') throw new Error('Live translation is off: the translation pack is used.');
      return b44.integrations.Core.InvokeLLM(args);
    },

    async adminDraft(args) {
      return b44.integrations.Core.InvokeLLM(args);
    },
  };
}

export const ai = createAiApi();
