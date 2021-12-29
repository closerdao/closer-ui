import React, { useState, useEffect } from 'react'
import Gradient from 'javascript-color-gradient';
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import Timeline from '../components/timeline'
//
// const title = 'Traditio   nal Dream  Factory ';
// const start = Date.now();
// const colorGradient = new Gradient();
//
// const color1 = "#3F2CAF";
// const color2 = "#8BC2E3";
//
// colorGradient.setGradient(color1, color2);
// colorGradient.setMidpoint(30);
//
// const getCode = (diff1, diff2) => Math.abs(Math.round(
//   ((Math.random() * 255 - diff1 + diff2) + Date.now())
// )).toString(16);
// const getColors = () => {
//   const diff1 = Math.random() * 100;
//   const diff2 = Math.random() * 100;
//   colorGradient.setGradient(
//     `#${getCode(diff1,diff2)}${getCode(diff1,diff2)}${getCode(diff1,diff2)}`,
//     `#${getCode(diff1,diff2)}${getCode(diff1,diff2)}${getCode(diff1,diff2)}`
//   );
//   colorGradient.setMidpoint(30);
//   return colorGradient.getArray();
// }

const index = () => (
  <Layout>
    <Head>
      <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
    </Head>
    <main className="foreground m-3">
      <section className="text-xl mb-20">
        {/* <h1 className="mt-24 italic mb-4 text-xl font-display">A playground for living and creating together</h1> */}

        <p className="mb-4">We are living in an age of transformation. Our species has built technology & tools enabling it to reign over the natural kingdom, but in the process we have exhausted the natural resources of the planet, and altered it's ecology to the point of entering the 6th mass extinction event. Earth has lost 50% of its wildlife in the past 40 years<sup><a href="#footnotes">[1]</a></sup>, and if we do not radically change the way that we live over the next few decades we will lose most natural species, including ourselves.</p>

        <p className="mb-4">We are here to prototype a better way. We believe that humans are kind by design <sup><a href="#footnotes">[2]</a></sup>, and we believe in creating a future that works for all life.</p>

        <p className="mb-4">We believe that our creativity is our greatest asset, and that we can channel our collective inteligence towards planetary regeneration. We believe in using technology for good, and in replacing ownership with stewarship.</p>

        <p className="mb-4">We are here to re:imagine how we live together, to put into practice years of research in creating abundant food systems that work with nature, to retain water in our soils and avoid erosion and droughts, to create human living systems that leave a positive trace on it's environment <sup><Link href="/impact-map"><a>(view our impact map)</a></Link></sup>.</p>

        <p className="mb-4">This is not idealism or optimism. We are realists, and it is time that our modern societies wake up to the call. A new Earth is waiting. In this new planet, we are the stewards of the land. In this new world, we thrive by promoting biodiversity and being in the service of the greater ecosystem that we are a part of. We must re:learn to be part of Nature, and to respect its delicate cycles.</p>

        <hr className="my-8"/>

        <p className="mb-4">Join the dreamers & the makers of tomorrow.</p>
        <p className="mb-4">We are a regenerative living & creation collective based in Alentejo, Portugal.</p>
        <p className="mb-4">We are engineers, artists, permaculturists, scientists, innovators, nomads.</p>
        <p className="mb-4">Come build with us, play with us, grow with us.</p>

        <p className="mb-4">
          <Link href="/signup">
            <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full bg-black hover:bg-pink-500 text-white font-bold">
              Become Member
            </a>
          </Link>
          <Link href="https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/mobilebasic">
            <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full bg-black hover:bg-pink-500 text-white font-bold" rel="nofollow noreferrer" target="_blank">
              Read Pink Paper
            </a>
          </Link>
        </p>

        <div id="footnotes" className="mt-8 italic text-sm">
          <ol className="list-decimal pl-6">
            <li><p><a href="https://www.theguardian.com/environment/2014/sep/29/earth-lost-50-wildlife-in-40-years-wwf" target="_blank" rel="noreferrer nofollow">Earth has lost half of its wildlife in the past 40 years, says WWF</a></p></li>
            <li>Human kind - a hopeful history, Rutger Bregman.</li>
          </ol>
        </div>
      </section>

      <section className="my-8">
        <p>
          <figure>
            <img className="w-full" src="/images/architecture/map-overlay.png" alt="TDF Area map" />
            <figcaption>Traditional Dream Factory area map. Purple is the land we own (coliving), yellow is the 5ha currently leased that we are regenerating, and yellow+green is the 25ha option to buy (it has a small farm, old windmill, a river, multiple agricultural dependencies, and includes 4000 sqm urbanizable land).</figcaption>
          </figure>
        </p>
      </section>

      <section className="my-8">
        <p>
          <figure>
            <img className="w-full" src="/images/architecture/tdf-plan.png" alt="Architectural plans" />
            <figcaption>Architectural plans: 14 suites, 3 studios, 1 house, natural swimming pool, coworking, restaurant and event space - <a href="https://cruatelier.pt/" target="_blank">CRU architects</a>.</figcaption>
          </figure>
        </p>
      </section>

      <Timeline />
    </main>
  </Layout>
);

export default index;
