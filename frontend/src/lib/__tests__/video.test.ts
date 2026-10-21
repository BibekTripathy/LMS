import { describe, expect, it } from 'vitest';
import { toEmbedUrl } from '../video';

describe('toEmbedUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=abc123&t=42s', 'https://www.youtube-nocookie.com/embed/abc123'],
    ['https://youtu.be/abc123', 'https://www.youtube-nocookie.com/embed/abc123'],
    ['https://www.youtube.com/shorts/abc123', 'https://www.youtube-nocookie.com/embed/abc123'],
    ['https://www.youtube.com/embed/abc123', 'https://www.youtube-nocookie.com/embed/abc123'],
    ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
    ['https://player.vimeo.com/video/76979871', 'https://player.vimeo.com/video/76979871'],
  ])('%s', (input, expected) => {
    expect(toEmbedUrl(input)).toBe(expected);
  });

  it('returns null for direct video files and junk', () => {
    expect(toEmbedUrl('https://cdn.example.com/lesson.mp4')).toBeNull();
    expect(toEmbedUrl('not a url')).toBeNull();
    expect(toEmbedUrl('https://www.youtube.com/channel/xyz')).toBeNull();
  });
});
