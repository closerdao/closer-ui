import React, { useState } from 'react';

import { SIGNUP_FIELDS } from '../config';
import api from '../utils/api';
import { __ } from '../utils/helpers';

const ApplicationForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState({
    name: '',
    phone: '',
    email: '',
    fields: {},
    source: typeof window !== 'undefined' && window.location.href,
  });
  const submit = async (e) => {
    e.preventDefault();
    if (!application.email || !application.phone) {
      alert('Please enter an email & phone.');
      return;
    }
    try {
      await api.post('/application', application);
      setSubmitted(true);
    } catch (err) {
      alert('There was an error sending your application, please try again.');
    }
  };

  const updateApplication = (update) =>
    setApplication({ ...application, ...update });
  const updateApplicationFields = (update) =>
    setApplication({
      ...application,
      fields: { ...application.fields, ...update },
    });

  return (
    <div>
      {submitted ? (
        <h2 className="my-4">{__('apply_success')}</h2>
      ) : (
        <form className="join mt-24 flex flex-col" onSubmit={submit}>
          <div className="w-full mb-4">
            <label htmlFor="screenname">{__('apply_name')}</label>
            <input
              id="screenname"
              type="text"
              onChange={(e) => updateApplication({ name: e.target.value })}
              placeholder="Jane Birkin"
            />
          </div>
          {SIGNUP_FIELDS &&
            SIGNUP_FIELDS.map((field) => (
              <div className="w-full mb-4" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <textarea
                  className="textarea"
                  id={field.name}
                  value={application.fields[field.name]}
                  onChange={(e) =>
                    updateApplicationFields({
                      [field.name]: e.target.value,
                    })
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          <div className="w-full mb-4">
            <label htmlFor="phone">{__('apply_phone_number')}</label>
            <input
              type="phone"
              required
              id="phone"
              value={application.phone}
              onChange={(e) => updateApplication({ phone: e.target.value })}
              placeholder="+1 777 888 999"
            />
          </div>
          <div className="w-full mb-4">
            <label htmlFor="email">{__('apply_email')}</label>
            <input
              type="email"
              id="email"
              required
              value={application.email}
              onChange={(e) => updateApplication({ email: e.target.value })}
              placeholder="you@project.co"
            />
          </div>
          <div className="w-full mb-4">
            <button id="signupbutton" className="btn-primary" type="submit">
              {__('apply_submit_button')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ApplicationForm;
