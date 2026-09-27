import type { NextPage } from 'next';

import { Props, createFixedSlugCustomPage } from '../customPageView';

const Page: NextPage<Props> = createFixedSlugCustomPage('/projects');

export default Page;
