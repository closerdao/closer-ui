import React, { useState } from 'react'
import axios from 'axios'
import Head from 'next/head'
import Router from 'next/router'
import Link from 'next/link'
import Layout from '../components/layout'
import api from '../utils/api'
import { login } from '../utils/auth'

const attemptSignin = async (event, request, setSigninError) => {
  event.preventDefault();
  try {
    const res = await api.post('/login', request);
    login(res.data);
  } catch (error) {
    setSigninError(error.response?.data?.error || error.message);
  }
}

const loginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signinError, setSigninError] = useState(null);

  return (
    <Layout>
      <Head>
        <title>Sign in</title>
      </Head>
      <main className="main-content intro center">
        <p>No account? <Link href="/signup"><a>Sign up</a></Link></p>
        <form
          onSubmit={e => attemptSignin(e, { email, password }, setSigninError)}
        >
          { signinError &&
            <div className="error">{ signinError }</div>
          }
          <div className="FormRow"><input type="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} required /></div>
          <div className="FormRow"><input type="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)} required /></div>
          <div className="FormRow">
            <button type="submit" name="subscribe" id="mc-embedded-subscribe" className="button">
              Sign in
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}

export default loginPage;
