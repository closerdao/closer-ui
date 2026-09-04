import type { PageDoc } from '../types/page';
import { parseMessageFromError } from '../utils/common';
import { resolveStandardOrDbPage } from '../utils/standardPages';
import { CustomPageView } from './customPageView';

interface Props {
  page: PageDoc | null;
  error?: string;
}

const HOME_PAGE_SLUG = '/';

/**
 * The home page is the `/` standard page: whatever has been saved in the page
 * editor, or — until then — a page generated from the village's own data
 * (see `buildHomePageDefaults`).
 */
const Index = ({ page, error }: Props) => (
  <CustomPageView page={page} error={error} />
);

Index.getInitialProps = async (): Promise<Props> => {
  try {
    const page = await resolveStandardOrDbPage(HOME_PAGE_SLUG);
    return { page };
  } catch (err: unknown) {
    return { page: null, error: parseMessageFromError(err) };
  }
};

export default Index;
