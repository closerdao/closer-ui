import React, { useState, useEffect } from 'react'
import Gradient from 'javascript-color-gradient';
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'
import Timeline from '../components/timeline'
import pink_paper from '../pink_paper';
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
        <h1 className="mt-24 italic mb-4 text-4xl font-display">A playground for living and creating together</h1>
        <p className="mb-4">Come build with us, play with us, grow with us. <sup><a href="#footnotes">[1]</a></sup></p>

        <p className="mb-4">
          <ol className="text-right">
            <li className="py-8">
              <p className="mr-2 italic">Step one,</p>
              <h3 className="mt-4"><Link href={ pink_paper.url }>
                  <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full bg-black hover:bg-white text-white hover:text-black font-bold" rel="nofollow noreferrer" target="_blank">
                    Read Pink Paper
                  </a>
                </Link>
              </h3>
            </li>
            <li className="py-8">
              <p className="mr-2 italic">Step two,</p>
              <h3 className="mt-4"><Link href="/signup">
                <a type="submit" className="button px-4 py-1 mr-2 mb-2 rounded-full bg-pink-500 hover:bg-white text-white hover:text-pink-500 font-bold">
                  Become Member
                </a>
              </Link></h3>
            </li>
          </ol>
        </p>

        <div id="footnotes" className="mt-8 italic text-sm">
          <ol className="list-decimal pl-6">
            <li><p><h2 className="mt-24 italic mb-4 text-xl">Welcome home 🐇</h2></p></li>
          </ol>
        </div>
      </section>
    </main>
  </Layout>
);

export default index;
