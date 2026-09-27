import type { NextPage } from 'next';

import { Props, createFixedSlugCustomPage } from '../customPageView';

const Page: NextPage<Props> = createFixedSlugCustomPage('/token');

export default Page;
