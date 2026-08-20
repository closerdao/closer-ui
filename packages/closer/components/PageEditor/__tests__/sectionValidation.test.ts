import {
  formatPageSaveError,
  sanitizeSection,
  validatePageSections,
  validateSection,
} from '../sectionValidation';

describe('validatePageSections', () => {
  it('accepts valid sections', () => {
    expect(
      validatePageSections([
        { type: 'hero', data: { settings: {}, content: { title: 'Hi' } } },
      ]),
    ).toEqual([]);
  });

  it('rejects non-array sections', () => {
    expect(validatePageSections({})).toEqual([
      { index: -1, message: '"sections" must be an array.' },
    ]);
  });

  it('rejects sections without type', () => {
    const errors = validateSection({ data: {} }, 0);
    expect(errors[0].message).toContain('"type" must be a non-empty string');
  });

  it('rejects non-object data.settings', () => {
    const errors = validateSection(
      { type: 'hero', data: { settings: 'bad', content: {} } },
      2,
    );
    expect(errors[0].message).toContain('data.settings');
  });
});

describe('sanitizeSection', () => {
  it('ensures settings and content objects exist', () => {
    const out = sanitizeSection({
      type: 'cta',
      data: {},
    });
    expect(out.data.settings).toEqual({});
    expect(out.data.content).toEqual({});
  });
});

describe('formatPageSaveError', () => {
  it('returns empty for blank input', () => {
    expect(formatPageSaveError(null)).toBe('');
    expect(formatPageSaveError('')).toBe('');
  });

  it('unwraps mongoose validation prefix', () => {
    expect(
      formatPageSaveError(
        'Page validation failed: sections.0.type: Path `type` is required., slug: Path `slug` is required.',
      ),
    ).toContain('sections.0.type:');
  });

  it('passes through plain messages', () => {
    expect(formatPageSaveError('Network error')).toBe('Network error');
  });
});
