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
