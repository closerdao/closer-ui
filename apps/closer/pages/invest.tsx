import type { GetServerSideProps } from 'next';

function InvestRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const path = ctx.resolvedUrl || '/invest';
  const destination = path.startsWith('/invest')
    ? path.replace(/^\/invest/, '/fundraiser')
    : '/fundraiser';
  return {
    redirect: {
      destination,
      permanent: true,
    },
  };
};

export default InvestRedirect;
