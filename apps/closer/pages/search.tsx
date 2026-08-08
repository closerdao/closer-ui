import type { GetServerSideProps } from 'next';

export default function SearchQueryRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const raw = ctx.query.x;
  const keyword =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw[0]
        : '';
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { redirect: { destination: '/blog', permanent: false } };
  }
  return {
    redirect: {
      destination: `/blog/search/${encodeURIComponent(trimmed)}`,
      permanent: false,
    },
  };
};
