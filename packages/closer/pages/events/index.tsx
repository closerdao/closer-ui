import type { NextPage } from 'next';

import { Props, createFixedSlugCustomPage } from '../customPageView';

const Page: NextPage<Props> = createFixedSlugCustomPage('/events');

export default Page;
