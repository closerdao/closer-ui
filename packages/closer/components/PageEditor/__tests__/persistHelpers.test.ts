import {
  shouldApplyPersistSnapshot,
  pagesMatchPersistTarget,
} from '../persistHelpers';

describe('shouldApplyPersistSnapshot', () => {
  it('applies only when revision is unchanged', () => {
    expect(shouldApplyPersistSnapshot(3, 3)).toBe(true);
    expect(shouldApplyPersistSnapshot(3, 4)).toBe(false);
  });
});

describe('pagesMatchPersistTarget', () => {
  const isVirtual = (id: string) => id.startsWith('std:');

  it('matches the target id', () => {
    expect(
      pagesMatchPersistTarget('abc', 'abc', false, isVirtual),
    ).toBe(true);
  });

  it('matches virtual id while creating', () => {
    expect(
      pagesMatchPersistTarget('std:/token', 'mongo1', true, isVirtual),
    ).toBe(true);
  });

  it('rejects unrelated pages', () => {
    expect(
      pagesMatchPersistTarget('other', 'abc', false, isVirtual),
    ).toBe(false);
  });
});
