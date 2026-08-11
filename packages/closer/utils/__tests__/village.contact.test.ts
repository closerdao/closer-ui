import { canReviewVillage, villageSocialUrl } from '../village.utils';

describe('villageSocialUrl', () => {
  it('turns a bare handle into a profile URL', () => {
    expect(villageSocialUrl('instagram', 'village')).toBe(
      'https://instagram.com/village',
    );
    expect(villageSocialUrl('twitter', '@village')).toBe(
      'https://x.com/village',
    );
    expect(villageSocialUrl('facebook', 'village')).toBe(
      'https://facebook.com/village',
    );
  });

  it('strips a pasted domain rather than doubling it', () => {
    expect(villageSocialUrl('instagram', 'instagram.com/village')).toBe(
      'https://instagram.com/village',
    );
    expect(villageSocialUrl('twitter', 'www.twitter.com/village')).toBe(
      'https://x.com/village',
    );
  });

  it('leaves a full URL alone', () => {
    expect(villageSocialUrl('facebook', 'https://fb.me/village')).toBe(
      'https://fb.me/village',
    );
  });

  it('returns null for nothing usable', () => {
    expect(villageSocialUrl('instagram', undefined)).toBeNull();
    expect(villageSocialUrl('instagram', '   ')).toBeNull();
    expect(villageSocialUrl('instagram', '@')).toBeNull();
  });
});

describe('canReviewVillage', () => {
  it('lets team, admins and ambassadors in', () => {
    expect(canReviewVillage(['team'])).toBe(true);
    expect(canReviewVillage(['admin'])).toBe(true);
    expect(canReviewVillage(['ambassador'])).toBe(true);
    expect(canReviewVillage(['member', 'ambassador'])).toBe(true);
  });

  it('keeps everyone else out', () => {
    expect(canReviewVillage(['member'])).toBe(false);
    expect(canReviewVillage([])).toBe(false);
    expect(canReviewVillage(undefined)).toBe(false);
  });
});
