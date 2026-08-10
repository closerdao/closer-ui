import { GetServerSideProps } from 'next';

const LearnPage = () => null;

export const getLearnPageServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/learn/category/all',
      permanent: false,
    },
  };
};

export const getServerSideProps = getLearnPageServerSideProps;

export default LearnPage;
