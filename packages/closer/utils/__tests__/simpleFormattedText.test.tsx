import { renderToStaticMarkup } from 'react-dom/server';

import { resolveBlockHtmlWithLinks } from '../blockI18n';
import {
  linkifyMarkdownInHtml,
  parseSimpleFormattedText,
  renderInlineSegments,
  renderLinkedText,
} from '../simpleFormattedText';

const markup = (node: ReturnType<typeof renderLinkedText>) =>
  renderToStaticMarkup(<>{node}</>);

describe('renderLinkedText', () => {
  it('leaves text without a link unchanged, including bold, italic, and list markers', () => {
    const text = '**bold** and *italic* and _also_\n- First point';
    expect(renderLinkedText(text)).toBe(text);
    expect(renderLinkedText('[note]')).toBe('[note]');
    expect(renderLinkedText('[click](javascript:alert(1))')).toBe(
      '[click](javascript:alert(1))',
    );
  });

  it('renders http, https, and mailto links as anchors and keeps the label as text', () => {
    const https = markup(
      renderLinkedText(
        'See [Les Pas-Sages](https://www.les-pas-sages.org/international).',
      ),
    );
    expect(https).toContain(
      'href="https://www.les-pas-sages.org/international"',
    );
    expect(https).toContain('>Les Pas-Sages<');
    expect(https).toContain('target="_blank"');
    expect(https).toContain('rel="noopener noreferrer"');
    expect(https).not.toContain('[Les Pas-Sages]');

    const http = markup(renderLinkedText('[Site](http://example.com)'));
    expect(http).toContain('href="http://example.com"');

    const mail = markup(
      renderLinkedText('[Email](mailto:hello@earthbound.eco)'),
    );
    expect(mail).toContain('href="mailto:hello@earthbound.eco"');
    expect(mail).toContain('>Email<');
    expect(mail).not.toContain('target=');
  });
});

describe('simple formatted text', () => {
  it('keeps paragraphs and bullet lists', () => {
    expect(parseSimpleFormattedText('Hello\n\n- One\n- Two')).toEqual([
      { type: 'paragraph', lines: ['Hello'] },
      { type: 'list', items: ['One', 'Two'] },
    ]);
  });

  it('keeps bold and italic, and links a paragraph or list item', () => {
    const styled = markup(renderInlineSegments('**bold** and *italic*'));
    expect(styled).toContain('<strong>bold</strong>');
    expect(styled).toContain('<em>italic</em>');

    const paragraph = markup(
      renderInlineSegments('Read [LPS](https://example.com)'),
    );
    expect(paragraph).toContain('href="https://example.com"');
    expect(paragraph).toContain('>LPS<');

    const [list] = parseSimpleFormattedText(
      '- Read [LPS](https://example.com/list)',
    );
    expect(list).toEqual({
      type: 'list',
      items: ['Read [LPS](https://example.com/list)'],
    });
    const listItem = markup(
      renderInlineSegments(list.type === 'list' ? list.items[0] : ''),
    );
    expect(listItem).toContain('href="https://example.com/list"');
  });

  it('keeps a link whole when a stray underscore or star comes before it', () => {
    const html = markup(
      renderInlineSegments('Ask team_lead or see [docs](https://ex.com/a_b)'),
    );
    expect(html).toContain('href="https://ex.com/a_b"');
    expect(html).toContain('>docs<');
    expect(html).not.toContain('<em>');
  });

  it('links inside bold and italic', () => {
    const html = markup(
      renderInlineSegments(
        '**See [our FAQ](https://x.com/faq)** _[a](https://x.com/a)_',
      ),
    );
    expect(html).toContain('<strong>See <a href="https://x.com/faq"');
    expect(html).toContain('<em><a href="https://x.com/a"');
  });

  it('wraps a link whose URL holds the same delimiter', () => {
    const html = markup(
      renderInlineSegments('_see [docs](https://x.com/a_b) now_ end'),
    );
    expect(html).toMatch(
      /^<em>see <a href="https:\/\/x.com\/a_b"[^>]*>docs<\/a> now<\/em> end$/,
    );
  });

  it('keeps emphasis inside a link label', () => {
    const html = markup(
      renderInlineSegments('[**Book now**](https://x.com/stay)'),
    );
    expect(html).toMatch(
      /<a href="https:\/\/x.com\/stay"[^>]*><strong>Book now<\/strong><\/a>/,
    );
  });

  it('keeps balanced parentheses in a URL', () => {
    const html = markup(
      renderLinkedText('[Wiki](https://en.wikipedia.org/wiki/Foo_(bar)).'),
    );
    expect(html).toContain('href="https://en.wikipedia.org/wiki/Foo_(bar)"');
    expect(html).toMatch(/<\/a>\.$/);
  });
});

describe('renderLinkedText with site paths and anchors', () => {
  it('links site paths and in-page anchors in the same tab', () => {
    const html = markup(
      renderLinkedText(
        'See [our stays](/stays?x=1), [home](/) or [FAQ](#faq).',
      ),
    );
    expect(html).toContain(
      '<a href="/stays?x=1" class="underline text-accent">our stays</a>',
    );
    expect(html).toContain(
      '<a href="/" class="underline text-accent">home</a>',
    );
    expect(html).toContain(
      '<a href="#faq" class="underline text-accent">FAQ</a>',
    );
    expect(html).not.toContain('target=');
  });

  it('leaves protocol-relative paths as text', () => {
    expect(renderLinkedText('[x](//evil.com)')).toBe('[x](//evil.com)');
    expect(renderLinkedText('[x](/\\evil.com)')).toBe('[x](/\\evil.com)');
  });

  it('links site paths in HTML without a new tab', () => {
    const html = resolveBlockHtmlWithLinks(
      '<p>[stays](/stays) and [top](#top)</p>',
      ((key: string) => key) as never,
    );
    expect(html).toBe(
      '<p><a href="/stays">stays</a> and <a href="#top">top</a></p>',
    );
  });
});

describe('renderLinkedText with missing content', () => {
  it('renders nothing for a missing or empty field', () => {
    expect(renderLinkedText(undefined)).toBeNull();
    expect(renderLinkedText(null)).toBeNull();
    expect(renderLinkedText('')).toBe('');
  });
});

describe('linkifyMarkdownInHtml', () => {
  it('turns markdown links in HTML into anchors that survive sanitizing', () => {
    const html = resolveBlockHtmlWithLinks(
      '<p>See <strong>[our FAQ](https://x.com/faq?a=1)</strong> or [mail](mailto:a@b.co)</p>',
      ((key: string) => key) as never,
    );
    expect(html).toContain(
      '<strong><a href="https://x.com/faq?a=1" target="_blank" rel="noopener noreferrer">our FAQ</a></strong>',
    );
    expect(html).toContain(
      '<a href="mailto:a@b.co" rel="noopener noreferrer">mail</a>',
    );
  });

  it('leaves unsupported schemes as text', () => {
    expect(linkifyMarkdownInHtml('[x](javascript:alert(1))')).toBe(
      '[x](javascript:alert(1))',
    );
  });
});
