import Head from 'next/head';
import Link from 'next/link';
// import Image from 'next/image';
import { useRouter } from 'next/router';

import React, { useState } from 'react';

import RichTextEditor from '../../../components/RichTextEditor';

import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';

const Create = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const onChange = (value) => {
    setHtml(value);
  };

  const persist = async () => {
    const res = await api.post('/article', { title, html });
    router.push(decodeURIComponent(`/blog/${res.data.results.slug}`));
  };

  return (
    <>
      <Head>
        <title>{title || 'Write article'}</title>

        <meta property="og:type" content="article" />
      </Head>
      <form onSubmit={(e) => e.preventDefault()} className="main-content w-full max-w-6xl">
        {/* { article.photo && <div className="relative w-full h-96 md:basis-1/2 md:w-96">
          <Image
            src={ fullImageUrl }
            alt={ article.title }
            fill={ true }
            className="bg-cover bg-center"
          />
        </div> } */}
        <div className="mb-4">
          <div>
            <Link href="/blog">◀️ Blog</Link>
          </div>
          <input
            type="text"
            className="text-xl mb-2"
            placeholder="Article Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {isAuthenticated && (
            <div>
              <button className="btn-primary" type="submit" onClick={persist}>
                Save
              </button>
            </div>
          )}
        </div>

        <RichTextEditor value={html} onChange={onChange} />
      </form>
    </>
  );
};

export default Create;
