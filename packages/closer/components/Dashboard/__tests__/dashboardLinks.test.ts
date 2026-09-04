import rbacDefaultConfig from '../../../constants/rbac';
import { filterDashboardLinks, getDashboardLinks } from '../dashboardLinks';

const translate = (key: string) => key;
const allowAll = () => true;

describe('Sales dashboard access', () => {
  const links = getDashboardLinks(translate, { isTokenEnabled: true });

  it('does not expose Sales to space hosts', () => {
    const urls = filterDashboardLinks(links, ['space-host'], allowAll).map(
      (link) => link.url,
    );

    expect(rbacDefaultConfig['space-host'].TokenSales).toBe(false);
    expect(urls).not.toContain('/dashboard/sales');
  });

  it('continues to expose Sales to admins and team members', () => {
    for (const role of ['admin', 'team']) {
      const urls = filterDashboardLinks(links, [role], allowAll).map(
        (link) => link.url,
      );

      expect(urls).toContain('/dashboard/sales');
    }
  });
});

describe('Citizen funnel dashboard access', () => {
  const links = getDashboardLinks(translate, { isCitizenshipEnabled: true });

  it('exposes Citizens to team, space-host, and community-curator', () => {
    for (const role of ['admin', 'team', 'space-host', 'community-curator']) {
      expect(rbacDefaultConfig[role].CitizenFunnel).toBe(true);
      const urls = filterDashboardLinks(links, [role], allowAll).map(
        (link) => link.url,
      );
      expect(urls).toContain('/dashboard/citizens');
    }
  });

  it('hides Citizens when citizenship is disabled', () => {
    const disabled = getDashboardLinks(translate, {
      isCitizenshipEnabled: false,
    });
    const urls = filterDashboardLinks(disabled, ['team'], allowAll).map(
      (link) => link.url,
    );
    expect(urls).not.toContain('/dashboard/citizens');
  });
});

describe('Platform-setting gated dashboard pages', () => {
  it.each([
    ['cohousing', '/dashboard/cohousing', 'isCohousingEnabled'],
    ['engagement', '/dashboard/engagement', 'isEngagementEnabled'],
  ])(
    'hides %s unless its platform setting is on',
    (_slug, url, flag) => {
      const off = filterDashboardLinks(
        getDashboardLinks(translate),
        ['admin'],
        allowAll,
      ).map((link) => link.url);
      expect(off).not.toContain(url);

      const on = filterDashboardLinks(
        getDashboardLinks(translate, { [flag]: true }),
        ['admin'],
        allowAll,
      ).map((link) => link.url);
      expect(on).toContain(url);
    },
  );
});
