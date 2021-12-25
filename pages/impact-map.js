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
    <Layout fullscreen>
      <Head>
        <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
      </Head>
      <main>
        <img src="/images/graphics/impact.jpg" alt="TDF Impact Map" className="w-full" />
      </main>
    </Layout>
  );
}

export default about;
