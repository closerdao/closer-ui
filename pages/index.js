import React, { useState, useEffect } from 'react'
import Gradient from 'javascript-color-gradient';
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import Timeline from '../components/timeline'
import Nav from '../components/nav'
import Flicker from '../components/Flicker'
import api from '../utils/api';

const title = 'Traditio   nal Dream  Factory ';
const start = Date.now();
const colorGradient = new Gradient();

const color1 = "#3F2CAF";
const color2 = "#8BC2E3";

colorGradient.setGradient(color1, color2);
colorGradient.setMidpoint(30);

const getCode = (diff1, diff2) => Math.abs(Math.round(
  ((Math.random() * 255 - diff1 + diff2) + Date.now())
)).toString(16);
const getColors = () => {
  const diff1 = Math.random() * 100;
  const diff2 = Math.random() * 100;
  colorGradient.setGradient(
    `#${getCode(diff1,diff2)}${getCode(diff1,diff2)}${getCode(diff1,diff2)}`,
    `#${getCode(diff1,diff2)}${getCode(diff1,diff2)}${getCode(diff1,diff2)}`
  );
  colorGradient.setMidpoint(30);
  return colorGradient.getArray();
}


const index = () => {
  const [colors, setColors] = useState(getColors());
  const [step, setStep] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showWeb, enableWeb] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const refreshColors = () => {
    const newColors = getColors();
    setColors(newColors);
  }

  return (
    <Layout>
      <Head>
        <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
      </Head>
      <div className={ showWeb ? 'password-entered' :'' }>
        <main className="foreground m-3">
          <section className="text-lg mb-20">
            <h2 className="mb-4 font-bold"><i>A playground for living and creating together</i></h2>
            <p>Once upon a time, humanity was a free roaming herd of nomad gatherers.</p>
            <p>Over the course of centuries, our path changed slightly, with established global human systems increasingly capable of reigning over the natural kingdom.</p>
            <p>We entered the anthropocene. The total weight of human made objects exceeded that of all other living beings combined.</p>
            <p>We ran into some challenges - like climate change and political tensions.</p>
            <p>What was really happening is that what did for a living and what "making a living" lost its sense of purpose.</p>
            <hr className="my-4"/>
            <p>A new reality emerges.</p>
            <p>We feel empowered to unite, changing forever the way we live, the way we work, the way we play.</p>
            <p>We enter a new age of abundance.</p>
            <p>A playful age.</p>
            <p>An age where our creativity is our greatest asset, and our collective inteligence regenerates the planet.</p>
            <hr className="my-4"/>
            <p>Join the dreamers & the makers of tomorrow.</p>
            <p>We are a regenerative living & creation collective based in Alentejo, Portugal.</p>
            <p>Come build with us, play with us, grow with us.</p>
            <br />
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
          </section>
          <Timeline />
        </main>
      </div>
    </Layout>
  );
}

export default index;
