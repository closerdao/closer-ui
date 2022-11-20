import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import CheckoutForm from '../../../components/CheckoutForm';
import DateTimePicker from '../../../components/DateTimePicker';
import Layout from '../../../components/Layout';
import Tabs from '../../../components/Tabs';

import dayjs from 'dayjs';

import PageNotFound from '../../404';
import config from '../../../config';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { priceFormat } from '../../../utils/helpers';
import { __ } from '../../../utils/helpers';

const maxVolunteers = 20;
const formatName = (name) => name && name.split('_').join(' ');

const EventCheckout = ({ event, error }) => {
  const router = useRouter();
  const { isAuthenticated, user, signup: register } = useAuth();
  const [ticketOption, setTicketOption] = useState(null);
  const [paymentReceived, setPaymentReceived] = useState(null);
  const [signup, updateSignup] = useState({
    fields:
      event.fields && event.fields.map((f) => ({ name: f.name, value: '' })),
  });
  const [signupError, setSignupError] = useState(null);
  const [ticketOptions, setTicketOptions] = useState([]);
  const [volunteerTicketsSold, setVolunteerTicketsSold] = useState(0);
  const now = dayjs();
  const start = event.start && dayjs(event.start);
  const end = event.end && dayjs(event.end);
  const discount =
    router.query.discount &&
    event.discounts &&
    event.discounts.find((d) => d.code === router.query.discount);
  const isVolunteer =
    !!router.query.volunteer && volunteerTicketsSold < maxVolunteers;
  const volunteerCapacityReached =
    !!router.query.volunteer && volunteerTicketsSold >= maxVolunteers;
  const stripe = loadStripe(event.stripePub || config.STRIPE_PUB_KEY);

  let total = 0;
  let currency = 'usd';

  if (ticketOption && ticketOption.price) {
    total = ticketOption.price;
  }
  if (ticketOption && ticketOption.currency) {
    currency = ticketOption.currency;
  }
  if (isVolunteer) {
    total -= event.volunteerDiscount;
  }

  if (
    discount &&
    (!discount.name || !ticketOption || discount.name === ticketOption.name)
  ) {
    if (discount.percent) {
      total = total - total * discount.percent;
    } else if (discount.val) {
      total = total - discount.val;
    }
  }
  total = Math.max(Math.round(total * 100) / 100, 0);

  const setField = (field, value) => {
    updateSignup((oldFields) =>
      Object.assign({}, oldFields, { [field]: value }),
    );
    if (field === 'email' && !value.match(/@/gi)) {
      setSignupError('Please enter a valid email');
    } else if (field === 'screenname' && value.length < 3) {
      setSignupError('Please enter a valid name');
    } else if (field === 'password' && value.length < 5) {
      setSignupError(
        'Please enter a valid password (at least 5 characters and include a number)',
      );
    } else if (field === 'repeat_password' && value !== signup.password) {
      setSignupError('Passwords do not match');
    } else {
      setSignupError(null);
    }
  };

  const submitSignupForm = (e) => {
    e.preventDefault();
    if (paymentReceived) {
      register(signup);
    }
  };

  const loadData = async () => {
    try {
      const {
        data: { ticketOptions: availability, volunteerTicketsSold },
      } = await api.get(`/bookings/event/${event._id}/availability`);
      if (JSON.stringify(availability) !== JSON.stringify(ticketOptions)) {
        setTicketOptions(availability);
        setVolunteerTicketsSold(volunteerTicketsSold);
      }
    } catch (err) {
      console.error(err);
      alert('Error loading availability');
    }
  };

  useEffect(() => {
    if (event && event._id) {
      loadData();
    }
    const refreshAvailability = setInterval(loadData, 30000);
    return () => clearInterval(refreshAvailability);
  }, [event]);

  if (error || !event) {
    return <PageNotFound error={error} />;
  }

  return (
    <Layout>
      <Head>
        <title>{__('events_slug_checkout_title')}</title>
      </Head>
      <div className="main-content max-w-prose booking">
        <h1 className="mb-4">
          <Link as={`/events/${event.slug}`} href="/events/[slug]">
            <a>{event.name}</a>
          </Link>
        </h1>
        {event.start && (
          <p className="text-gray-500 text-sm mb-24">
            {start.format('MMM D, YYYY')} at {start.format('HH:mm')}{' '}
            {event.end && (
              <span>
                until {end.format('MMM D, YYYY')} at {end.format('HH:mm')}
              </span>
            )}
          </p>
        )}
        {isAuthenticated ? (
          <section>
            <h3>
              {__('events_slug_welcome_message')} {user.screenname}
            </h3>
            {isVolunteer && (
              <p className="text-sm">
                {__('events_slug_checkout_volunteer_message')}
              </p>
            )}
            {volunteerCapacityReached && (
              <p className="text-sm">
                {__('events_slug_checkout_volunteer_capacity_reached')}
              </p>
            )}
            <hr className="divide-y divide-gray-400 my-4" />
          </section>
        ) : (
          <section>
            <Tabs
              initialCurrentTab={1}
              tabs={[
                {
                  title: 'Login',
                  href: `/login?back=${encodeURIComponent(router.asPath)}`,
                },
                {
                  title: 'Checkout as guest',
                  content: (
                    <form
                      onSubmit={(e) => submitSignupForm(e)}
                      className="card"
                    >
                      <fieldset className="w-full mb-4">
                        <label
                          className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                          htmlFor="name"
                        >
                          {__('events_slug_checkout_form_full_name')}
                        </label>
                        <input
                          className="w-full"
                          type="text"
                          name="name"
                          id="name"
                          value={signup.screenname}
                          placeholder="John Smith"
                          onChange={(e) =>
                            setField('screenname', e.target.value)
                          }
                          required
                        />
                      </fieldset>
                      <fieldset className="w-full mb-4">
                        <label
                          className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                          htmlFor="email"
                        >
                          {__('events_slug_checkout_form_email')}
                        </label>
                        <input
                          className="w-full"
                          type="email"
                          name="email"
                          id="email"
                          value={signup.email}
                          placeholder="name@awesomeproject.co"
                          onChange={(e) => setField('email', e.target.value)}
                          required
                        />
                      </fieldset>
                      {signupError && (
                        <div className="validation-error">
                          <p>{String(signupError)}</p>
                        </div>
                      )}
                    </form>
                  ),
                },
              ]}
            />
          </section>
        )}
        {event.paid && ticketOptions && ticketOptions.length > 0 ? (
          <section>
            <h3>{__('events_slug_checkout_tickets_title')}</h3>
            <div className="ticket-options my-4 flex flex-row flex-wrap">
              {ticketOptions.map((option) => (
                <button
                  key={option.name}
                  className={`border-2 flex flex-col justify-center rounded-md shadow-lg mr-3 mb-3 p-4 hover:border-primary ${
                    ticketOption && ticketOption.name === option.name
                      ? 'border-primary'
                      : 'border-gray-100'
                  } ${option.available > 0 ? 'available' : 'unavailable'}`}
                  onClick={() => setTicketOption(option)}
                  disabled={option.available === 0}
                >
                  <h4>{formatName(option.name)}</h4>
                  <p className="price text-gray-500">
                    {priceFormat(option.price, option.currency)}
                  </p>
                  <p className="availability text-xs uppercase text-primary">
                    {option.available > 0
                      ? `${option.available} available`
                      : 'not available'}
                  </p>
                </button>
              ))}
            </div>
            {ticketOption && (
              <div className="ticket-disclaimer">
                <p className="text-sm">{ticketOption.disclaimer}</p>
              </div>
            )}
            <hr className="divide-y divide-gray-400 my-4" />
          </section>
        ) : (
          <section></section>
        )}
        <section>
          {event.fields &&
            event.fields.map((field, index) => (
              <div className="w-full mb-4" key={field.name}>
                <label htmlFor={field.name}>{field.name}</label>
                {field.fieldType === 'text' ? (
                  <input
                    id={field.name}
                    type="text"
                    value={signup.fields[field.name]}
                    onChange={(e) =>
                      setField(
                        'fields',
                        (signup.fields || []).map((f, y) => {
                          if (y === index) {
                            return {
                              name: field.name,
                              value: e.target.value,
                            };
                          }
                          return f;
                        }),
                      )
                    }
                    placeholder={field.placeholder}
                  />
                ) : field.fieldType === 'select' ? (
                  <select
                    value={signup.fields[field.name]}
                    onChange={(e) =>
                      setField(
                        'fields',
                        (signup.fields || []).map((f, y) => {
                          if (y === index) {
                            return {
                              name: field.name,
                              value: e.target.value,
                            };
                          }
                          return f;
                        }),
                      )
                    }
                  >
                    <option value={null}>--</option>
                    {field.options &&
                      field.options.map((opt) => (
                        <option value={opt} key={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                ) : (
                  field.fieldType === 'datetime' && (
                    <DateTimePicker
                      value={signup.fields[field.name]}
                      onChange={(value) =>
                        setField(
                          'fields',
                          (signup.fields || []).map((f, y) => {
                            if (y === index) {
                              return {
                                name: field.name,
                                value: value,
                              };
                            }
                            return f;
                          }),
                        )
                      }
                    />
                  )
                )}
              </div>
            ))}
          <h3>{__('events_slug_checkout_notes')}</h3>
          <textarea
            onChange={(e) => setField('message', e.target.value)}
            value={signup.message}
            placeholder="Add message for hosts"
          />
          <hr className="divide-y divide-gray-400 my-4" />
        </section>
        {event.paid && !paymentReceived && (
          <section>
            <h3 className="mb-2">{__('events_slug_checkout_payment_title')}</h3>
            {isVolunteer && (
              <p className="text-sm">
                {__('events_slug_checkout_volunteer_discount')}{' '}
                <b>{priceFormat(event.volunteerDiscount)}</b>
              </p>
            )}
            {router.query.discount && !discount && (
              <p className="validation-error">
                {__('events_slug_checkout_discount_error')}
              </p>
            )}
            {discount && (
              <p className="text-sm">
                {__('events_slug_checkout_discount_success')} (
                {router.query.discount}){' '}
                {discount.percent ? (
                  <b>
                    {Math.round(discount.percent * 10000) / 100}
                    {__('events_slug_checkout_discount_percentage')}
                  </b>
                ) : (
                  <b>
                    {priceFormat(discount.val, currency)}{' '}
                    {__('events_slug_checkout_discount_val')}
                  </b>
                )}
              </p>
            )}
            <p className="text-sm mb-3">
              {__('events_slug_checkout_payment_total')}{' '}
              <b>{priceFormat(total, currency)}</b>
            </p>
            <p className="text-sm">
              {__('events_slug_checkout_ticket_warning')}
            </p>
            {event.stripePub && (
              <p className="text-sm">
                {__('events_slug_checkout_custom_setup')}
              </p>
            )}
            <div className="mt-2">
              <Elements stripe={stripe}>
                <CheckoutForm
                  type="event"
                  ticketOption={ticketOption}
                  total={total}
                  currency={currency}
                  discountCode={router.query.discount}
                  _id={event._id}
                  volunteer={isVolunteer}
                  onSuccess={(payment) =>
                    router.push(`/tickets/${payment._id}`)
                  }
                  email={isAuthenticated ? user.email : signup.email}
                  name={isAuthenticated ? user.screenname : signup.screenname}
                  message={signup.message}
                  fields={signup.fields}
                  buttonText="Book"
                  buttonDisabled={
                    !isAuthenticated &&
                    (!signup.email || !signup.email.match(/@/gi) || signupError)
                  }
                />
              </Elements>
            </div>
          </section>
        )}
        {!event.paid && (
          <div className="validation-error">
            {__('events_slug_checkout_free_event')}
            <div className="mt-4">
              <Link href={`/events/${event.slug}`}>
                <a className="btn-primary">
                  {__('events_slug_checkout_go_back')}
                </a>
              </Link>
            </div>
          </div>
        )}
        {paymentReceived && (
          <div className="success-box">
            {__('events_slug_checkout_payment_success')}
          </div>
        )}
      </div>
    </Layout>
  );
};
EventCheckout.getInitialProps = async ({ req, query }) => {
  try {
    const {
      data: { results: event },
    } = await api.get(`/event/${query.slug}`);
    return { event };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
      event: {
        title: 'Error',
      },
    };
  }
};

export default EventCheckout;
