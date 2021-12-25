import React, { useState, useEffect } from 'react'
import Gradient from 'javascript-color-gradient';
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import Nav from '../components/nav'
import Flicker from '../components/Flicker'
import api from '../utils/api';

const about = () => {
  return (
    <Layout>
      <Head>
        <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
      </Head>
      <div>
        <h1 className="text-xl font-bold flex flex-row items-center justify-items-center font-display font-black">
          <Link href="/"><a><img src="/images/logo-sheep.png" width="60" alt="TDF"/></a></Link>
          <span className="ml-2">Traditional Dream Factory</span>
        </h1>
        <main className="foreground m-3">
          <section>
            <h2><i>A playground for living and creating together</i></h2>
            <p>Once upon a time, humanity was a free roaming herd of nomad gatherers.</p>
            <p>Over the course of centuries, our path changed slightly, with established global human systems increasingly capable of reigning over the natural kingdom.</p>
            <p>We entered the anthropocene. The total weight of human made objects exceeded that of all other living beings combined.</p>
            <p>We ran into some challenges - like climate change and political tensions.</p>
            <p>What was really happening is that what did for a living and what "making a living" lost its sense of purpose.</p>
            <hr/>
            <p>A new reality emerges.</p>
            <p>We feel empowered to unite, changing forever the way we live, the way we work, the way we play.</p>
            <p>We enter a new age of abundance.</p>
            <p>A playful age.</p>
            <p>An age where our creativity is our greatest asset, and our collective inteligence regenerates the planet.</p>
            <hr/>
            <p>Join the dreamers & the makers of tomorrow.</p>
            <p>We are a regenerative living & creation collective based in Alentejo, Portugal.</p>
            <p>Come build with us, play with us, grow with us.</p>
          </section>
        </main>
      </div>
    </Layout>
  );
}

export default about;
