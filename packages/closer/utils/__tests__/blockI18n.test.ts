import {
  extractBlockI18nKey,
  resolveBlockText,
} from '../../utils/blockI18n';

const t = (key: string, values?: Record<string, string | number | Date>) => {
  if (key === 'token_purchase_step_3_desc') {
    return `Pay with ${values?.reserveToken ?? 'TOKEN'}`;
  }
  if (key === 'hello') return 'Hello world';
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
});
