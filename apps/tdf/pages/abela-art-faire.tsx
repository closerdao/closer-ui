import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { event } from 'nextjs-google-analytics';

const ArtFaire = () => {
  return (
    <>
      <Head>
        <title>Abela Art Faire - a regenerative art faire in the Traditional Dream Factory, Abela, Portugal.</title>
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
      <section className="-mt-4 max-w-6xl mx-auto">
        <div>
          <img src="/images/landing/art-faire.png" className="cover w-full mb-3 md:rounded-b-2xl" alt="Artist - Ivan during Abela Art Faire 2023" />
          <Heading
            className="text-6xl text-primary md:text-6xl"
            data-testid="page-title"
            display
            level={1}
          >
            Abela Art Faire
          </Heading>
          <Heading
            className="text-3xl md:text-5xl"
            data-testid="page-title"
            display
            level={2}
          >
            Residency Open Call
          </Heading>
          <Heading
            className="mb-4"
            display
            level={3}
          >
            May 22nd to September 22nd, 2024
          </Heading>
          <div className="text-xl italic max-w-prose">
            <p className="mb-4">Calling all artists and creatives! We are excited to announce the Abela Art Faire Residency Open Call, hosted by Traditional Dream Factory (TDF) in Abela, Portugal. This is a unique opportunity for guest artists to immerse themselves in the vibrant and regenerative community of TDF while showcasing their artistic talents.</p>
            <p className="mb-4">During the residency, selected artists will have the chance to collaborate with our diverse community of residents, volunteers, and local stakeholders. You will have access to our special facilities, including a lab, atelier, wood workshop, and more, to bring your artistic vision to life.</p>
            <p className="mb-4">As a resident, you will be invited to contribute your expertise and knowledge to the TDF project. In exchange for your stay at TDF, we ask for a clear deliverable and timeline for your project. This could be in the form of an artwork, installation, performance, or any other creative expression that aligns with our values of sustainability, authenticity, respect, and creativity.</p>
            <p className="mb-4">The residency duration is 4 months. We encourage artists to fully immerse themselves in the TDF community and take advantage of the beautiful surroundings, including the reforestation, food forest, hills, valleys that inspire creativity and connection.</p>
            <p className="mb-4">To apply, please submit a proposal that includes your artistic background, project concept, and how it aligns with TDF&apos;s values. We also welcome any ideas for community engagement or collaboration during your residency.</p>
            <p className="mb-4">Let your creativity flourish in this regenerative playground.</p>
          </div>

          <Link
            href='mailto:play@traditionaldreamfactory.com?subject=ArtFaireResidencyOpenCall'
            target='_blank'
            className="btn btn-primary"
            onClick={() =>
              event('click', {
                category: 'ArtFaire',
                label: 'Apply',
              })
            }
          >
            Email us your application
          </Link>
        </div>
      </section>
    </>
  );
};

export default ArtFaire;
