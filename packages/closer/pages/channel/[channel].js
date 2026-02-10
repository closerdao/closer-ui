import { loadLocaleData } from '../../utils/locale.helpers';

const ChannelPage = () => null;

ChannelPage.getInitialProps = async (context) => {
  const { query, res } = context;
  const slug = query.channel;

  const destination = slug
    ? `/community?channel=${slug}`
    : '/community';

  if (res) {
    res.writeHead(302, { Location: destination });
    res.end();
  } else if (typeof window !== 'undefined') {
    window.location.href = destination;
  }

  let messages = null;
  try {
    messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
  } catch (err) {
    // noop
  }

  return { messages };
};

export default ChannelPage;
