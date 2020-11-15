import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Footer from '../components/footer'
import Nav from '../components/nav'
import Layout from '../components/layout'

const notfound = () => (
  <Layout>
    <Head>
      <title>Page not found</title>
    </Head>
    <main  className="main-content about intro page-not-found">
      <h1>Page not found</h1>
      <p><Link href="/"><a>Home</a></Link></p>
    </main>
  </Layout>
);

export default notfound;
