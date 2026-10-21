/**
 * Turn a YouTube/Vimeo page link into its embeddable player URL.
 * Watch pages refuse to load in an iframe (X-Frame-Options), so `watch?v=`, `youtu.be/`,
 * `shorts/` and `vimeo.com/<id>` links must be rewritten. Returns null for non-embed URLs.
 */
export function toEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '');

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, id] = url.pathname.split('/');
    if (kind === 'embed' && id) return `https://www.youtube-nocookie.com/embed/${id}`;
    if (kind === 'shorts' && id) return `https://www.youtube-nocookie.com/embed/${id}`;
    const v = url.searchParams.get('v');
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === 'player.vimeo.com') return rawUrl;
  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
