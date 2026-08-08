import { NextPageContext } from 'next';

import {
  CustomPageView,
  createFixedSlugCustomPage,
  loadCustomPageProps,
} from './customPageView';

export { createFixedSlugCustomPage, loadCustomPageProps };

const CustomPagePage = CustomPageView;

CustomPagePage.getInitialProps = async (context: NextPageContext) =>
  loadCustomPageProps(context);

export default CustomPagePage;
