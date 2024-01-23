import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { event } from 'nextjs-google-analytics';

const ArtFaire = () => {
  return (
    <>
      <Head>
        <title>How to Build A Regenerative Village - book co-authored at Traditional Dream Factory</title>
        <meta
          name="description"
          content="The actionable manual accelerating the transition towards a regenerative way of living, on an individual and planetary scale."
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="max-w-6xl mx-auto">
        <div className="md:flex md:flex-row mb-8">
          <img src="/images/products/how-to-build-a-regenerative-village.jpg" className="mr-8 shadow rounded-lg w-[200px]" alt="How to build a regenerative village book" />
          <div className="max-w-prose">
            <Heading
              className="text-3xl mt-6 md:text-4xl"
              data-testid="page-title"
              display
              level={1}
            >
              How to Build A Regenerative Village
            </Heading>
            <p className="mb-6 text-2xl">
              The actionable manual accelerating the transition towards a regenerative way of living, on an individual and planetary scale.
            </p>

            <Link
              href='https://payhip.com/buy?link=OxFHQ'
              target='_blank'
              className="btn btn-primary"
              onClick={() =>
                event('click', {
                  category: 'HowToBuildARegenerativeVillage',
                  label: 'Buy',
                })
              }
            >
              Buy the book
            </Link>
          </div>
        </div>
        <div className="text-lg max-w-prose">
          <p className="mb-4">&quot;How to Build a Regenerative Village&quot; is an actionable manual co-authored by 22 regenerative practitioners and community founders at TDF. This 174-page illustrated book serves as a comprehensive guide for aspiring regenerative village builders, offering a wealth of wisdom and practical experience from a global tribe of village builders. It provides an actionable blueprint for accelerating the transition towards a regenerative way of living on both an individual and planetary scale.</p>
          <Heading
            className="mb-4"
            display
            level={3}
          >
            Chapters
          </Heading>
          <ul>
            <li className="mb-4">
              <Heading
                level={4}
              >
                1. Personal Regeneration
              </Heading>
              <p>focuses on the individual, and the relationship between individual and a community</p>
            </li>
            <li className="mb-4">
              <Heading
                level={4}
              >
                2. Legal & Governance
              </Heading>
              <p>explores processes for a cohesive and fruitful co-creation</p>
            </li>
            <li className="mb-4">
              <Heading
                level={4}
              >
                3. Funds & Capital
              </Heading>
              <p>dives into acquiring and managing resources</p>
            </li>
            <li className="mb-4">
              <Heading
                level={4}
              >
                4. Infrastructure
              </Heading>
              <p>outlines practical steps to actually build the village</p>
            </li>
            <li className="mb-4">
              <Heading
                level={4}
              >
                5. Regenerating Nature
              </Heading>
              <p>compiles regenerative frameworks to work together with nature</p>
            </li>
            <li className="mb-4">
              <Heading
                level={4}
              >
                6. Beyond Your Village
              </Heading>
              <p>looks at the wider ecosystem of villages, and how to maximise the impact of the global regenerative movement</p>
            </li>
          </ul>

          <p className="mb-6 italic">You can buy the book for just €9.</p>
        </div>
      </section>
    </>
  );
};

export default ArtFaire;
