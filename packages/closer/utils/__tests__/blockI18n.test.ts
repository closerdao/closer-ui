import {
  extractBlockI18nKey,
  resolveBlockHtml,
  resolveBlockText,
} from '../../utils/blockI18n';

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
