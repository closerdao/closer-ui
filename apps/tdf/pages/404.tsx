import { Page404, getStaticProps404 } from 'closer';
import { GetStaticProps } from 'next';

export default Page404;

export const getStaticProps: GetStaticProps = async () => {
  const { props } = await getStaticProps404();

  return { props: { messages: props.messages } };
};