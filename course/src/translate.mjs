// Thai → English for the local editor (src/dev.mjs). When the teacher saves Thai text, the
// matching English is rewritten so both languages stay in step. Never runs in published pages.
//
// Backend, in order:
// 1. Claude Code's own `claude` command in headless mode: uses the teacher's Claude login,
//    no API key. Tools are switched off (--tools ""), so it can only return text.
// 2. The Claude API, if ANTHROPIC_API_KEY is set in course/.env (for a computer without
//    Claude Code).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';
const TIMEOUT_MS = 180_000;

const SYSTEM = `You translate passages of a university lesson from Thai into English. The course teaches Python and pandas to humanities students who are new to programming. Your output replaces the English version of the passage on a bilingual lesson page, so it must say the same thing as the Thai.

- Keep the Markdown structure exactly: list markers and numbering, blank lines, **bold**, *italic*, \`inline code\`, links, and any line that starts with ":::".
- Leave untranslated: anything in backticks, code, column names, file names, and Thai example data that is the object of study (for example a Thai sentence being tokenized).
- Translate the meaning precisely. Do not add, explain or drop information.
- Write plain, short sentences in the style of the current English version, and reuse its terms where the meaning has not changed.

Return only the English Markdown: no preamble, no notes, no code fence.`;

function findClaudeCli() {
  const dirs = (process.env.PATH ?? '').split(path.delimiter);
  const candidates = [
    process.env.CLAUDE_CLI,
    ...dirs.map((d) => path.join(d, 'claude')),
    path.join(os.homedir(), '.local', 'bin', 'claude'),
    path.join(os.homedir(), '.claude', 'local', 'claude'),
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
  ].filter(Boolean);
  return (
    candidates.find((p) => {
      try {
        fs.accessSync(p, fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    }) ?? null
  );
}

// Which backend is available: 'claude-code', 'api', 'fake' (tests) or null.
export function translationBackend(dotenv = {}) {
  if (process.env.COURSE_TRANSLATE_FAKE === '1') return 'fake';
  if (findClaudeCli()) return 'claude-code';
  if (process.env.ANTHROPIC_API_KEY || dotenv.ANTHROPIC_API_KEY) return 'api';
  return null;
}

function buildPrompt({ thai, currentEnglish, context }) {
  return [
    context ? `Section: ${context}` : null,
    currentEnglish ? `Current English version (match its style and terms):\n<english>\n${currentEnglish}\n</english>` : null,
    `New Thai version to translate:\n<thai>\n${thai}\n</thai>`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

const cleanUp = (text) =>
  text
    .trim()
    .replace(/^```\w*\n([\s\S]*?)\n```$/, '$1') // in case it fenced the answer anyway
    .trim();

function viaClaudeCode(prompt) {
  const cli = findClaudeCli();
  return new Promise((resolve, reject) => {
    // run outside the repo so the project's CLAUDE.md is not loaded into the translation
    const child = spawn(cli, ['-p', '--system-prompt', SYSTEM, '--output-format', 'text', '--tools', '', '--no-session-persistence'], {
      cwd: os.tmpdir(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Claude Code took too long to answer'));
    }, TIMEOUT_MS);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`could not start Claude Code: ${e.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`Claude Code stopped (${code}): ${(err || out).trim().split('\n').pop()}`));
      const text = cleanUp(out);
      if (!text) return reject(new Error('translation came back empty'));
      resolve(text);
    });
    child.stdin.end(prompt);
  });
}

let client = null;
async function viaApi(prompt, apiKey) {
  client ??= new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'low' }, // short, well-specified passages
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // if the request is declined, the API retries it on a fallback model
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error('the API key was not accepted (check ANTHROPIC_API_KEY in course/.env)');
    if (e instanceof Anthropic.RateLimitError) throw new Error('the API is rate limiting; try again in a minute');
    if (e instanceof Anthropic.APIConnectionError) throw new Error('could not reach the Claude API (offline?)');
    if (e instanceof Anthropic.APIError) throw new Error(`Claude API error ${e.status ?? ''}: ${e.message}`.trim());
    throw e;
  }
  if (response.stop_reason === 'refusal') {
    throw new Error(`translation was declined${response.stop_details?.category ? ` (${response.stop_details.category})` : ''}`);
  }
  if (response.stop_reason === 'max_tokens') throw new Error('translation was cut off; the passage is too long');
  const text = cleanUp(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
  if (!text) throw new Error('translation came back empty');
  return text;
}

// thai: the new Thai passage. currentEnglish: the English it replaces (for style and terms).
export async function translateToEnglish({ thai, currentEnglish, context, dotenv = {} }) {
  const backend = translationBackend(dotenv);
  if (backend === 'fake') return `[EN] ${thai}`; // tests only
  const prompt = buildPrompt({ thai, currentEnglish, context });
  if (backend === 'claude-code') return viaClaudeCode(prompt);
  if (backend === 'api') return viaApi(prompt, process.env.ANTHROPIC_API_KEY || dotenv.ANTHROPIC_API_KEY);
  throw new Error('no translator: install Claude Code, or set ANTHROPIC_API_KEY in course/.env');
}
