import { registerEscapedVideo } from '.';

const PAYLOAD = 'https://x.test/"><img src=x onerror=alert(1)>';

it('escapes the video URL in the exported HTML', () => {
  class Video {
    value() {
      return { video: PAYLOAD };
    }
  }
  const register = jest.fn();
  registerEscapedVideo({ import: () => Video, register });

  const [[EscapedVideo, overwrite]] = register.mock.calls;
  const rendered = document.createElement('div');
  rendered.innerHTML = new EscapedVideo().html();

  expect(overwrite).toBe(true);
  expect(rendered.querySelector('img')).toBeNull();
  expect(rendered.querySelector('a')?.getAttribute('href')).toBe(PAYLOAD);
  expect(rendered.textContent).toBe(PAYLOAD);
});
