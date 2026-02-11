import { NextPageContext } from 'next';

import { loadLocaleData } from '../../utils/locale.helpers';

const CreateChannelRedirect = () => null;

CreateChannelRedirect.getInitialProps = async (context: NextPageContext) => {
  const { res } = context;

  if (res) {
    res.writeHead(302, { Location: '/social' });
    res.end();
  } else if (typeof window !== 'undefined') {
    window.location.href = '/social';
  }

  let messages = null;
  try {
    messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
  } catch (err: unknown) {
    // noop
  }

  return { messages };
};

export default CreateChannelRedirect;
