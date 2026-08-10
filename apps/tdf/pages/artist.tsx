import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/artists/braulio-amado',
      permanent: true,
    },
  };
};

const ArtistPage = () => null;

export default ArtistPage;
