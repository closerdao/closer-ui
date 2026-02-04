import { Page404, getStaticProps404 } from 'closer';
import { GetStaticProps } from 'next';

export default Page404;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const { props } = await getStaticProps404({ locale });

  return { props: { messages: props.messages } };
};