import type { Lesson } from '../../types/lesson';
import { getVideoParams, getVideoPlatform } from '../learn.helpers';

const lesson = (fields: Partial<Lesson>) =>
  ({ _id: 'l1', ...fields }) as Lesson;

describe('getVideoPlatform', () => {
  it('names the platform of a video URL', () => {
    expect(getVideoPlatform('https://www.youtube.com/watch?v=abc')).toBe(
      'youtube',
    );
    expect(getVideoPlatform('https://vimeo.com/123')).toBe('vimeo');
    expect(getVideoPlatform('https://example.com/v.mp4')).toBe('');
  });

  it('has no platform when there is no video', () => {
    expect(getVideoPlatform(undefined)).toBe('');
    expect(getVideoPlatform(null)).toBe('');
    expect(getVideoPlatform('')).toBe('');
  });
});

describe('getVideoParams', () => {
  it('gives no player for a lesson without videos, as legacy and tRPC return it', () => {
    const none = { embedId: '', platform: '' };

    for (const noVideo of [{}, { previewVideo: null, fullVideo: null }]) {
      const withoutVideo = lesson(noVideo as Partial<Lesson>);
      expect(getVideoParams(null, withoutVideo, false)).toEqual(none);
      expect(getVideoParams(null, withoutVideo, true)).toEqual(none);
    }
  });

  it('gives no player for a module lesson without a video URL', () => {
    const withModules = lesson({
      modules: [
        {
          title: 'One',
          description: '',
          _id: 'm1',
          lessons: [
            { _id: 'a', title: 'A', fullText: '', isFree: true } as any,
            { _id: 'b', title: 'B', fullText: '', isFree: false } as any,
          ],
        },
      ],
    });

    expect(getVideoParams('a', withModules, false)).toEqual({
      embedId: '',
      platform: '',
    });
    expect(getVideoParams('b', withModules, false)).toEqual({
      embedId: '',
      platform: '',
    });
  });

  it('still embeds a preview video', () => {
    expect(
      getVideoParams(
        null,
        lesson({ previewVideo: 'https://vimeo.com/123' }),
        true,
      ),
    ).toEqual({ embedId: '123', platform: 'vimeo' });
  });
});
