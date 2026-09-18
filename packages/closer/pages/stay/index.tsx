import type { NextPage } from 'next';

import { Props, createFixedSlugCustomPage } from '../customPageView';

const Page: NextPage<Props> = createFixedSlugCustomPage('/stay');

export default Page;
