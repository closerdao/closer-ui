import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import Timeline from '../components/timeline'
import pink_paper from '../pink_paper';

const getCode = (diff1, diff2) => Math.abs(Math.round(
  (((Math.random()/10*6 + 0.5) * 255*0.85))
)).toString(16);
const getColor = () => `#${getCode(0,0)}${getCode(0,0)}${getCode(0,0)}`;
const makePlaygound = () => (
  <>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>p</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>l</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>a</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>y</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>g</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>r</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>u</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>n</span>
    <span className="drop-shadow-lg" style={ { color: getColor() } }>d</span>
  </>
);

const index = () => {
  const [playgound, setPlayground] = useState(makePlaygound());

  useEffect(() => {
    const interval = setInterval(() => setPlayground(makePlaygound()), 250);
    return () => clearInterval(interval);
  }, [])

  return (
    <Layout>
      <Head>
        <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
      </Head>
      <main className="foreground m-3">
        <section className="text-xl mb-20">
          <h1 className="mt-24 italic mb-4 text-4xl font-display">A {playgound} for living and creating together</h1>
          <p className="mb-4">Come build with us, play with us, grow with us. <sup><a href="#footnotes">[1]</a></sup></p>

          <ol className="text-right mb-4">
            <li className="py-8">
              <p className="mr-2 italic">Step one,</p>
              <h3 className="mt-4">
                <Link href="/welcome">
                  <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full hover:bg-black bg-white hover:text-white text-black font-bold" rel="nofollow noreferrer">
                    Learn more
                  </a>
                </Link>
              </h3>
            </li>
            <li className="py-8">
              <p className="mr-2 italic">Step two,</p>
              <h3 className="mt-4"><Link href={ pink_paper.url }>
                  <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full bg-black hover:bg-white text-white hover:text-black font-bold" rel="nofollow noreferrer" target="_blank">
                    Read Pink Paper
                  </a>
                </Link>
              </h3>
            </li>
            <li className="py-8">
              <p className="mr-2 italic">Step three,</p>
              <h3 className="mt-4"><Link href="/signup">
                <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full bg-pink-500 hover:bg-white text-white hover:text-pink-500 font-bold">
                  Become Member
                </a>
              </Link></h3>
            </li>
          </ol>

          <div id="footnotes" className="mt-8 italic text-sm">
            <ol className="list-decimal pl-6">
              <li><h2 className="mt-24 italic mb-4 text-xl"><Link href="/welcome"><a>Welcome home 🐇</a></Link></h2></li>
            </ol>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default index;
