import Head from 'next/head';

import React, { useState } from 'react';

import { PINK_PAPER_URL } from '@/constants';

import { api } from 'closer';

type SignUpFields = {
  [key: string]: string;
};

const SignupPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState<SignUpFields>({
    name: '',
    phone: '',
    email: '',
    home: '',
    dream: '',
    source:
      typeof window !== 'undefined'
        ? window.location.href
        : 'traditionaldreamfactory.com',
  });
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!application.email || !application.phone) {
      alert('Please enter an email & phone.');
      return;
    }
    try {
      await api.post('/application', application);
      setSubmitted(true);
    } catch (err) {
      alert('We couldn`t send your dream to HQ');
    }
  };

  const updateApplication = (update: { [key: string]: string }) =>
    setApplication((prevState) => ({ ...prevState, ...update }));

  return (
    <>
      <Head>
        <title>Join the dreamers - Become a member</title>
      </Head>

      <h1 className="text-xl mb-2 font-bold">
        Join the dreamers + makers of tomorrow
      </h1>
      <p className="mb-8">
        Becoming a member means that you want to join TDF dreamers and makers,
        that you want to come build, play and grow in this land 🤸🏽
      </p>
      <p className="mb-8">
        The process starts with you filling this form. Once you press the{' '}
        <a className="text-pink-500" href="#signupbutton">
          pink button
        </a>{' '}
        our community curator will receive your words and connect with you for a
        short call.
      </p>
      <p className="mb-8">
        Before you hop into it, make sure that you read the{' '}
        <a
          href={PINK_PAPER_URL}
          className="text-pink-500 visited:text-pink-500 hover:text-pink-800"
        >
          pink paper
        </a>{' '}
        and notice what it brings in you. During the call you will get to hear
        all about our regenerative community adventure, how to join the journey,
        and any questions you have are welcome 🤞🏽
      </p>
      <p className="mb-8">
        <a
          href="https://instagram.com/traditionaldreamfactory"
          target="_blank"
          rel="noreferrer"
        >
          Photos
        </a>{' '}
        you say? Get your updates through our{' '}
        <a
          href="https://t.me/+7yBqlNOMbRtlZmFh"
          target="_blank"
          rel="noreferrer"
        >
          Telegram group
        </a>{' '}
        or{' '}
        <a
          href="https://twitter.com/tdfinyourdreams/"
          target="_blank"
          rel="noreferrer"
        >
          Twitter
        </a>
        .
      </p>
      {submitted ? (
        <h2 className="my-4 text-2xl">
          Thank you, our community curator will reach out for an intro call.
        </h2>
      ) : (
        <form className="join mt-24 flex flex-col" onSubmit={handleSubmit}>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="screenname"
            >
              Name
            </label>
            <input
              className="bg-transparent border border-gray-200 w-full px-4 py-1"
              id="screenname"
              type="text"
              onChange={(e) => updateApplication({ name: e.target.value })}
              placeholder="Jane Birkin"
            />
          </div>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="home"
            >
              What is home to you?
            </label>
            <textarea
              className="bg-transparent border border-gray-200 resize-none w-full px-4 py-1"
              id="home"
              value={application.home}
              onChange={(e) => updateApplication({ home: e.target.value })}
              placeholder="Home is where..."
            />
          </div>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="dream"
            >
              What do you dream of creating?
            </label>
            <textarea
              className="bg-transparent border border-gray-200 resize-none w-full px-4 py-1"
              id="dream"
              value={application.dream}
              onChange={(e) => updateApplication({ dream: e.target.value })}
              placeholder="My dream is to..."
            />
          </div>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="phone"
            >
              Phone number
            </label>
            <input
              type="phone"
              className="bg-transparent border border-gray-200 w-full px-4 py-1"
              required
              id="phone"
              value={application.phone}
              onChange={(e) => updateApplication({ phone: e.target.value })}
              placeholder="+351 777 888 999"
            />
          </div>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              className="bg-transparent border border-gray-200 w-full px-4 py-1"
              id="email"
              required
              value={application.email}
              onChange={(e) => updateApplication({ email: e.target.value })}
              placeholder="you@project.co"
            />
          </div>
          <button
            id="signupbutton"
            className="button px-4 py-1 mr-2 mb-2 rounded-full hover:bg-black bg-pink-500 text-white text-xl font-bold"
            type="submit"
          >
            Apply
          </button>
        </form>
      )}
    </>
  );
};

export default SignupPage;
