#!/usr/bin/env node
/**
 * publish-github.mjs — push a self-contained workbook HTML to a GitHub repo
 * (GitHub Pages). Because the tagged workbooks embed their own screenshots,
 * Pages serves them with zero build. Separate from Google auth — GitHub is not
 * affected by the school Workspace block.
 *
 *   export GITHUB_TOKEN=ghp_...            (a PAT with 'repo' / contents:write)
 *   node tools/publish-github.mjs --file "<workbook.html>" \
 *     --repo ctwadden/mm12-photoshop --path lab8/index.html [--message "..."] [--branch main]
 *
 * Prints the published raw path and the likely Pages URL (enable Pages once in
 * the repo settings; a user/org page repo named <owner>.github.io serves at root).
 */
import { readFileSync } from 'node:fs';

const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const token = process.env.GITHUB_TOKEN;
const file = arg('file'), repo = arg('repo'), path = arg('path');
const branch = arg('branch', 'main');
const message = arg('message', `Publish workbook ${path || ''}`.trim());

if (!token) { console.error('Set GITHUB_TOKEN (a PAT with contents:write on the repo).'); process.exit(1); }
if (!file || !repo || !path) { console.error('need --file <html> --repo <owner/repo> --path <dest/in/repo.html>'); process.exit(1); }
const [owner, name] = repo.split('/');
if (!owner || !name) { console.error('--repo must be owner/repo'); process.exit(1); }

const H = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'scribeit-publish' };
const api = `https://api.github.com/repos/${owner}/${name}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
const content = Buffer.from(readFileSync(file)).toString('base64');

// Need the existing blob sha to update in place (omit to create).
let sha;
const head = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers: H });
if (head.ok) sha = (await head.json()).sha;
else if (head.status !== 404) { console.error(`lookup failed ${head.status}: ${(await head.text()).slice(0, 200)}`); process.exit(1); }

const put = await fetch(api, {
  method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
});
if (!put.ok) { console.error(`publish failed ${put.status}: ${(await put.text()).slice(0, 300)}`); process.exit(1); }
const data = await put.json();
const isUserSite = name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const pages = isUserSite ? `https://${owner}.github.io/${path}` : `https://${owner}.github.io/${name}/${path}`;
console.log(`✓ ${sha ? 'updated' : 'created'} ${path} @ ${data.content?.html_url || repo}`);
console.log(`  Pages URL (once Pages is enabled): ${pages.replace(/index\.html$/, '')}`);
