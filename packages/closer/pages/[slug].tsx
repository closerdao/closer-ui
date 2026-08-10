import { NextPage, NextPageContext } from 'next';

import { ComponentProps } from 'react';

import {
  CustomPageView,
  createFixedSlugCustomPage,
  loadCustomPageProps,
} from './customPageView';

export { createFixedSlugCustomPage, loadCustomPageProps };

const CustomPagePage: NextPage<ComponentProps<typeof CustomPageView>> =
  CustomPageView;

CustomPagePage.getInitialProps = async (context: NextPageContext) =>
  loadCustomPageProps(context);

export default CustomPagePage;
