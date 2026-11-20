import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import POLICY from '../../../docs/AI-Policy-updated.md?raw';

// Settings → AI policy (/settings/ai-policy): docs/AI-Policy-updated.md,
// bundled with the app (no network), in English. The review box at the top
// of the file (the status line and "What changed…", which say to remove them
// before publishing) is left out.
export function publicPolicy(md) {
  const start = md.indexOf('\n## ');
  const title = (md.match(/^# .*$/m) || ['# AI Policy'])[0];
  return start === -1 ? md : `${title}\n${md.slice(start)}`;
}

const TEXT = publicPolicy(POLICY);

export default function AiPolicyPage() {
  const navigate = useNavigate();
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/settings'));
  return (
    <div dir="ltr" lang="en" className="min-h-full bg-paper text-navy">
      <div className="bg-navy">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <button type="button" onClick={back} aria-label="Back" className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <article className="max-w-lg mx-auto px-4 py-5 text-base leading-relaxed [&_h1]:font-display [&_h1]:text-[1.75rem] [&_h1]:leading-tight [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-4 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-denim [&_a]:underline">
        <ReactMarkdown>{TEXT}</ReactMarkdown>
      </article>
    </div>
  );
}
