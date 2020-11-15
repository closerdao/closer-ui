import React, { useState } from 'react'
import axios from 'axios'
import Router, { useRouter } from 'next/router';
import { trackEvent } from './analytics'

const attemptSignup = async (event, request, setSignupError) => {
  event.preventDefault();
  await axios.post('https://api.oasa.co/subscribe', request)
}

const newsletter = ({ light, tags, placement }) => {
  const [screenname, setName] = useState('');
  const [email, setEmail] = useState('');
  const [signupError, setSignupError] = useState(null);
  const didCompleteSignup = Boolean(typeof localStorage !== 'undefined' && localStorage.getItem('signupCompleted'));
  const referrer = typeof localStorage !== 'undefined' && localStorage.getItem('referrer');
  const [signupCompleted, setSignupCompleted] = useState(false);
  const router = useRouter();

  if (didCompleteSignup) {
    return null;
  }

  return (
    <div className="Newsletter">
      { signupCompleted ?
        <h3>Thanks, we will be in touch soon!</h3> :
        <form
          action="#"
          onSubmit={
            e => attemptSignup(e, { email, screenname, tags: [placement, router.asPath, `ref:${referrer}`] })
              .then(() => {
                trackEvent(placement, 'Lead');
                setSignupCompleted(true);
                localStorage.setItem('signupCompleted', true);
              })
              .catch(err => {
                trackEvent(placement, 'LeadError');
                setSignupError((err.response && err.response.data && err.response.data.error) || err.message);
              })
            }
        >
          { signupError &&
            <div className="error">{ signupError }</div>
          }
          <div className="FormRow">
            <input type="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)} required />
            <button type="submit" name="subscribe" id="mc-embedded-subscribe" className={`button${light?' light':''}`}>
              Subscribe
            </button>
          </div>
        </form>
      }
    </div>
  );
}

export default newsletter;
