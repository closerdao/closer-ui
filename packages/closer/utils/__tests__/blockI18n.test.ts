import {
  extractBlockI18nKey,
  materializePageI18n,
  resolveBlockHtml,
  resolveBlockText,
} from '../../utils/blockI18n';
import type { PageDoc } from '../../types/page';

const t = (key: string, values?: Record<string, string | number | Date>) => {
  if (key === 'token_purchase_step_3_desc') {
    return `Pay with ${values?.reserveToken ?? 'TOKEN'}`;
  }
  if (key === 'hello') return 'Hello world';
  if (key === 'xss_payload') return '<img src=x onerror="alert(1)">';
  return key;
};

describe('blockI18n', () => {
  it('extracts only single-token i18n keys', () => {
    expect(extractBlockI18nKey('_i18n_hello')).toBe('hello');
    expect(
      extractBlockI18nKey('_i18n_hello\n\n_i18n_world'),
    ).toBeNull();
  });

  it('resolves multi-key bodies via inline replacement', () => {
    expect(resolveBlockText('_i18n_hello\n\n_i18n_missing', t)).toBe(
      'Hello world\n\nmissing',
    );
  });

  it('supplies default reserveToken for ICU strings', () => {
    expect(resolveBlockText('_i18n_token_purchase_step_3_desc', t)).toBe(
      'Pay with cEUR',
    );
  });

  it('skips lookups for keys the translator does not have', () => {
    const lookups: string[] = [];
    const tWithHas = Object.assign(
      (key: string) => {
        lookups.push(key);
        return t(key);
      },
      { has: (key: string) => key === 'hello' },
    );

    expect(resolveBlockText('_i18n_learn_page_title', tWithHas)).toBe(
      'learn_page_title',
    );
    expect(lookups).toEqual([]);
    expect(resolveBlockText('_i18n_hello', tWithHas)).toBe('Hello world');
    expect(lookups).toEqual(['hello']);
  });

  it('materializes a saved page doc so editor fields hold real copy', () => {
    const page: PageDoc = {
      _id: '507f1f77bcf86cd799439011',
      title: '_i18n_hello',
      slug: '/dataroom',
      description: '_i18n_hello',
      menuLabel: '_i18n_hello',
      sections: [
        {
          type: 'textBlock',
          data: {
            settings: { imagePosition: 'none' },
            content: { title: '_i18n_hello', body: '<p>_i18n_hello</p>' },
          },
        },
      ],
    };

    const materialized = materializePageI18n(page, t);

    expect(materialized.title).toBe('Hello world');
    expect(materialized.description).toBe('Hello world');
    expect(materialized.menuLabel).toBe('Hello world');
    expect(materialized.sections[0].data).toEqual({
      settings: { imagePosition: 'none' },
      content: { title: 'Hello world', body: '<p>Hello world</p>' },
    });
    expect(materialized._id).toBe('507f1f77bcf86cd799439011');
    expect(materialized.slug).toBe('/dataroom');
  });

  it('sanitizes HTML after i18n resolution', () => {
    const sanitized = resolveBlockHtml(
      '<p>Hi</p><script>alert(1)</script>_i18n_xss_payload',
      t,
    );
    expect(sanitized).not.toMatch(/script/i);
    expect(sanitized).not.toMatch(/onerror/i);
    expect(sanitized).toContain('<p>Hi</p>');
    expect(sanitized).toMatch(/<img src="x"\s*\/?>/);
  });
});
