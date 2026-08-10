import { NextPageContext } from 'next';

const CreateChannelRedirect = () => null;

CreateChannelRedirect.getInitialProps = async (context: NextPageContext) => {
  const { res } = context;

  if (res) {
    res.writeHead(302, { Location: '/social' });
    res.end();
  } else if (typeof window !== 'undefined') {
    window.location.href = '/social';
  }

  return {};
};

export default CreateChannelRedirect;
