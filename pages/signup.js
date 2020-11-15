import React, { useState } from 'react'
import axios from 'axios'
import Head from 'next/head'
import Link from 'next/link'
import Router from 'next/router'
import Layout from '../components/layout'
import api from '../utils/api'
import { login } from '../utils/auth'

const attemptSignup = async (event, request, setSigninError) => {
  event.preventDefault();
  try {
    const res = await api.post('/signup', request);
    login(res.data);
  } catch (error) {
    setSigninError(error.response?.data?.error || error.message);
  }
}

const signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [screenname, setScreenname] = useState('');
  const [signinError, setSigninError] = useState(null);

  return (
    <Layout>
      <Head>
        <title>Sign up</title>
      </Head>
      <main className="main-content intro center">
        <p>Have an account account? <Link href="/login"><a>Log in</a></Link></p>
        <form
          onSubmit={e => attemptSignup(e, { email, screenname, password }, setSigninError)}
        >
          { signinError &&
            <div className="error">{ signinError }</div>
          }
          <div className="FormRow"><input type="screenname" value={screenname} placeholder="Screenname" onChange={e => setScreenname(e.target.value)} required /></div>
          <div className="FormRow"><input type="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} required /></div>
          <div className="FormRow"><input type="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)} required /></div>
          <div className="FormRow">
            <button type="submit" name="subscribe" id="mc-embedded-subscribe" className="button">
              Sign up
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}

export default signup;
