// Phone ↔ computer sync through one secret GitHub gist.
// The gist holds progress only (see syncPayload): no WaniKani or GitHub token.

import { state, persist, syncPayload, mergeRemote } from './store.js';

const API = 'https://api.github.com';
const FILE = 'benkyo.json';
const DESCRIPTION = 'Benkyō sync — progress data, do not edit';

async function gh(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${state.settings.gistToken.trim()}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
  });
  if (res.status === 401) throw new Error('GitHub token rejected');
  if (res.status === 403 || res.status === 404) throw new Error('Token needs the “gist” permission');
  if (!res.ok) throw new Error(`GitHub error ${res.status}`);
  return res.json();
}

async function findGist() {
  for (let page = 1; page <= 5; page++) {
    const gists = await gh(`/gists?per_page=100&page=${page}`);
    const hit = gists.find((g) => g.description === DESCRIPTION && g.files[FILE]);
    if (hit) return hit.id;
    if (gists.length < 100) break;
  }
  return '';
}

async function readGist(id) {
  const gist = await gh(`/gists/${id}`);
  const file = gist.files[FILE];
  if (!file) return null;
  const text = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
  return JSON.parse(text);
}

let running = null;

/** Pull, merge, push. Safe to call often: concurrent calls share one run. */
export function syncNow() {
  if (!state.settings.gistToken) return Promise.resolve(null);
  running ||= (async () => {
    try {
      let id = state.settings.gistId || (await findGist());
      let remoteText = '';
      if (id) {
        try {
          const remote = await readGist(id);
          remoteText = JSON.stringify(remote);
          mergeRemote(remote, !state.syncedAt);
        } catch (e) {
          if (!/404|permission/.test(e.message)) throw e;
          id = ''; // gist deleted: recreate below
        }
      }
      const payload = JSON.stringify(syncPayload());
      if (!id) {
        const created = await gh('/gists', {
          method: 'POST',
          body: JSON.stringify({ description: DESCRIPTION, public: false, files: { [FILE]: { content: payload } } }),
        });
        id = created.id;
      } else if (payload !== remoteText) {
        await gh(`/gists/${id}`, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: payload } } }) });
      }
      state.settings.gistId = id;
      state.syncedAt = Date.now();
      state.syncError = null;
      persist();
      return true;
    } catch (e) {
      state.syncError = e.message;
      persist();
      throw e;
    } finally {
      running = null;
    }
  })();
  return running;
}
