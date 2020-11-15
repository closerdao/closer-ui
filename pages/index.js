import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/layout'

const index = () => (
  <Layout>
    <Head>
      <title>Traditional Dream Factory</title>
    </Head>
    <main>
      <section className="hero-intro center">
        <div className="main-content">
          <div className="pixels">
            { Array.from('.'.repeat(100)).map((pixel, index) => <div className={`pixel pixel-${index}`} />) }
          </div>
          <h1 className="name flicker">
            <span className="traditional">Traditional</span> Dream Factory
          </h1>
          <div className="opening-soon">Opening spring 2021</div>
        </div>
      </section>
      <section className="main-content hero-section">
        <h2><span>An evolutionary experiment for living and creating together</span></h2>
        <p>The 21st century must be the age of creativity.</p>
        <p>In all fields, ultra specialization facilitated by massive communication improvements brought by technology has led to an increase in the reach any worker can have.</p>
        <p>Where a shoe maker from the 11th century could possibly hope to reach a few hundreds or thousands of individuals over his lifetime, a ux designer in today's world might work on a piece of software used by millions. The value of providing a repetitive (in Nietshes words - alienating) labor to factories is plummeting. Instead, today's value resides in human capital: the ability to innovate, to scale, and to create products that have an impact on other humans.</p>
        <p>At the same time, we are reaching the end of the seemingly infinite res  ources we've enjoyed over the past century thanks to fossil fuels. We need to rethink how we work, how we live, and how we create value.</p>
        <p>We no longer have a choice, we must change now.</p>
        <p>We must dream a bolder future.</p>
      </section>
      <div className="inverted">
        <section className="main-content hero-section">
          <h2><span>Join the movement.</span></h2>
          <p>Come unleash your creativity in our 1500sqm of factory space and join the dreamers creating a regenerative future</p>
          <p>The time is now. <a href="https://oasa.typeform.com/to/vKHlZa" target="_blank">Join us</a></p>
        </section>
      </div>
    </main>
  </Layout>
);

export default index;
