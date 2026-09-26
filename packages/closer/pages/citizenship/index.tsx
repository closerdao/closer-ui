import type { NextPage } from 'next';

import { Props, createFixedSlugCustomPage } from '../customPageView';

const Page: NextPage<Props> = createFixedSlugCustomPage('/citizenship');

export default Page;
