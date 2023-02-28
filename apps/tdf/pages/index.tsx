import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import { Playground } from '@/components';
import { PINK_PAPER_URL } from '@/constants';

import { NextPage } from 'next';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>
          Traditional Dream Factory | Regenerative coliving space in Alentejo,
          Portugal
        </title>
      </Head>

        <section className="text-xl mb-20">
          <h1 className="mt-8 italic mb-4 text-4xl font-display font-bold">
            A{' '}
            <span>
              <Playground />
            </span>{' '}
            for living and creating together
          </h1>

          <p className="mb-4 mt-24">
            We are living in an age of transformation. Our species has built
            technology & tools enabling it to reign over the natural kingdom,
            but in the process we have exhausted the natural resources of the
            planet, and altered it&apos;s ecology to the point of entering the
            6th mass extinction event.
          </p>
          <blockquote className="text-xl my-8">
            Earth has lost 50% of its wildlife in the past 40 years{' '}
            <sup>
              <a href="#footnotes">[1]</a>
            </sup>
          </blockquote>
          <p>
            If we do not radically change the way that we live over the next few
            decades we will lose most natural species, including ourselves.
          </p>

          <p className="mb-4">
            We are here to prototype a better way. We believe that humans are
            kind by design{' '}
            <sup>
              <a href="#footnotes">[2]</a>
            </sup>
            , and are committed to promoting{' '}
            <b>
              biodiversity, restoration of water cycles, regeneration of the
              soils, and regeneration of souls
            </b>
            .
          </p>

          <p className="mb-4">
            We believe that our creativity is our greatest asset, and that we
            can channel our collective inteligence towards planetary
            regeneration. We believe in using technology for good, and in
            replacing ownership with stewardship.
          </p>

          <p className="mb-4">
            We are here to re:imagine how we live together, to put into practice
            years of research in creating abundant food systems that work with
            nature, to retain water in our soils and avoid erosion and droughts,
            to create human living systems that leave a positive trace on its
            environment{' '}
            <sup>
              <Link href="/impact-map">(view our impact map)</Link>
            </sup>
            .
          </p>

          <p className="mb-4">
            This is not idealism or optimism. We are realists, and it is time
            that our modern societies wake up to the call. A new Earth is
            waiting. On this new planet,{' '}
            <b>we are the stewards of our spaceship</b>. In this new world, we
            thrive by promoting biodiversity and being in the service of the
            greater ecosystem that we are a part of. We must re:learn to be part
            of Nature, and to respect its delicate cycles.
          </p>

          <hr className="my-8" />

          <p className="mb-8">
            Traditional Dream Factory (aka TDF ) is our first prototype in
            developing a new form in living that&apos;s more in tune with nature
            and with our human creativity. We are creating a DAO governed
            regenerative village, sitting on lands conserved under the{' '}
            <a href="https://oasa.earth" target="_blank" rel="noreferrer">
              Oasa network
            </a>
            .
          </p>

          <p className="mb-4">
            <Link
              href={PINK_PAPER_URL}
              className="button px-4 py-1 mr-4 mb-2 rounded-full bg-black hover:bg-white text-white hover:text-black font-bold"
              rel="nofollow noreferrer"
              target="_blank"
            >
              Read Pink Paper
            </Link>
            <Link
              href="/roadmap"
              className="button px-4 py-1 mr-4 mb-2 rounded-full bg-black hover:bg-white text-white hover:text-black font-bold"
            >
              See our roadmap
            </Link>
          </p>

          <hr className="my-8" />

          <p className="mb-4">
            Join the dreamers & the makers of tomorrow. We are engineers,
            artists, permaculturists, scientists, innovators, nomads. Come build
            with us, play with us, grow with us.
          </p>
          {/* <p className="mb-4">We are a regenerative living & creation collective based in Alentejo, Portugal.</p> */}

          <p className="mb-4">
            <Link
              href="/signup"
              type="submit"
              className="button px-4 py-1 mr-2 mb-2 rounded-full bg-pink-500 hover:bg-white text-white hover:text-pink-500 font-bold"
            >
              🐇 Become Member
            </Link>
          </p>
          <div id="footnotes" className="mt-8 italic text-sm">
            <ol className="list-decimal pl-6">
              <li>
                <p>
                  <a
                    href="https://www.theguardian.com/environment/2014/sep/29/earth-lost-50-wildlife-in-40-years-wwf"
                    target="_blank"
                    rel="noreferrer nofollow"
                  >
                    Earth has lost half of its wildlife in the past 40 years,
                    says WWF
                  </a>
                </p>
              </li>
              <li>Human kind - a hopeful history, Rutger Bregman.</li>
            </ol>
          </div>
        </section>

    </>
  );
};

export default HomePage;
