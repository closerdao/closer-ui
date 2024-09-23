import Head from 'next/head';

import { Button } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

const ArtFaire = () => {
  return (
    <>
      <Head>
        <title>
          Abela Art Faire - a regenerative art faire in the Traditional Dream
          Factory, Abela, Portugal.
        </title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="-mt-4 max-w-6xl mx-auto py-6">

        <Button
          onClick={() => window.open('https://buy.stripe.com/cN2dRC1B08AO4De7sC')}
          type="primary"
          className="mb-4"
        >
          Blubucha - 2.5€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/dR66pacfEg3gglW00b')}
          type="primary"
          className="mb-4"
        >
          Cappuchino - 2.5€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/9AQ8xi2F42cq7Pq7sA')}
          type="primary"
          className="mb-4"
        >
          Flat White - 3€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/14k8xia7w4ky4DedR4')}
          type="primary"
          className="mb-4"
        >
          Latte - 3.5€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/8wMcNycfE7wK7Pq4gs')}
          type="primary"
          className="mb-4"
        >
          Espresso - 1.5€
        </Button>
        <Button
            onClick={() => window.open('https://buy.stripe.com/eVa3cY5RgcR4edO5kx')}
          type="primary"
          className="mb-4"
        >
          Double Espresso - 2€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/5kA28UbbA7wK8TuaET')}
          type="primary"
          className="mb-4"
        >
          Cookie - 3€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/bIY9Bm4Nc6sG4DeeVa')}
          type="primary"
          className="mb-4"
        >
          Brownie - 3.5€
        </Button>
        <Button
          onClick={() => window.open('https://buy.stripe.com/8wMaFq0wWg3g3za3ct')}
          type="primary"
          className="mb-4"
        >
          Energy ball - 2.5€
        </Button>
      </section>
    </>
  );
};

ArtFaire.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default ArtFaire;
