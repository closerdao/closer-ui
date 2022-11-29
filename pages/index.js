import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React from 'react';

import Layout from '../components/Layout';

import { DEFAULT_TITLE, PLATFORM_NAME, REGISTRATION_MODE } from '../config';
import { useAuth } from '../contexts/auth';

const Index = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    router.push('/dashboard');
  }

  return (
    <Layout>
      <Head>
        <title>{PLATFORM_NAME}</title>
      </Head>
      <main className="homepage">
        <section className="text-center flex flex-column items-center justify-center pb-10">
          <div className="main-content">
            <h1 className="page-title">{PLATFORM_NAME}</h1>
            <p className="font-lg">{DEFAULT_TITLE}</p>
            {REGISTRATION_MODE !== 'closed' && (
              <p className="mt-4">
                <Link href="/signup">
                  <a className="btn-primary">Create your account</a>
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Index;
