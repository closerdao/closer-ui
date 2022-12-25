import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import Timeline from '../components/Timeline'
import pink_paper from '../pink_paper';

const index = () => (
  <Layout>
    <Head>
      <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
    </Head>
    <main className="main-content">
      <section className="my-8 text-xl">
        <h1 className="font-bold mb-4">🛠️ TDF Roadmap</h1>
        <p className="mb-4">Traditional Dream Factory is operating as a <a href="https://ethereum.org/en/dao/" target="_blank">DAO</a>, organized in a sociocratic manner with circles for each of our core areas of focus: permaculture, architecture & construction, legal & tokenization, community and coordination.</p>
        <p className="mb-4">We are currently focused on developing the coliving concept repurposing the existing buildings on the land. Along with building accomodations for humans, we are also building water systems (natural pool, grey water treatment etc), reforesting & creating food systems, developing a legal and technological framework for regenerative villages that can be replicated, creating art, brewing kombucha, hosting events... Life is rich, and the container we are building is here to encourage your creativity and to give you the tools to bring your gifts to the world.</p>
        <p className="mb-4">Over last winter we planted about 1800 trees, reforesting some of the uncovered land as well as starting our food forest which we are expanding this winter (2022). We planted ~1000 trees from seed in the fall that we will be adding to our forest to enhance it's biodiversity and create a wholistic food production system that can sustain life.</p>
        <figure>
          <img className="w-full" src="/images/architecture/map-overlay.png" alt="TDF Area map" />
          <figcaption>Traditional Dream Factory area map. Purple is the land we own (coliving), yellow is the 5ha currently leased that we are regenerating, and yellow+green is the 25ha option to buy (it has a small farm, old windmill, a river, multiple agricultural dependencies, and includes 4000 sqm urbanizable land).</figcaption>
        </figure>
      </section>

      <section className="my-8 text-xl">
        <figure>
          <img className="w-full" src="/images/architecture/tdf-plan.png" alt="Architectural plans" />
          <figcaption>Architectural plans: 14 suites, 3 studios, 1 house, natural swimming pool, coworking, restaurant and event space - <a href="https://cruatelier.pt/" target="_blank">CRU architects</a>.</figcaption>
        </figure>
      </section>

      <Timeline v2 />
    </main>
  </Layout>
);

export default index;
