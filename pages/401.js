import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'

const notallowed = () => (
  <Layout>
    <Head>
      <title>No access</title>
    </Head>
    <main  className="main-content about intro page-not-found">
      <h1>No access</h1>
      <p><Link href="/login"><a>Sign In</a></Link>.</p>
    </main>
  </Layout>
);

export default notallowed;
