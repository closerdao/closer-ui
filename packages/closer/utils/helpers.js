import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import { blockchainConfig } from '../config_blockchain';
import { REFUND_PERIODS } from '../constants';
import base from '../locales/base';
import en from '../locales/en';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);

const { BLOCKCHAIN_DAO_TOKEN } = blockchainConfig;

let language = Object.assign({}, base, en);

const ONE_HOUR = 60 * 60 * 1000;

export const __ = (key, paramValue) => {
  if (paramValue) {
    return language[key].replace('%s', paramValue);
  }
  return language[key] || `__${key}_missing__`;
};

export const switchLanguage = (lang) =>
  (language = Object.assign(language, lang));

export const getHashTags = (inputText) => {
  var regex = /(?:^|\s)(?:#)([a-zA-Z\d]+)/gm;
  var matches = [];
  var match;

  while ((match = regex.exec(inputText))) {
    matches.push(match[1]);
  }

  return matches;
};

const urlsRegex =
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
export const getUrls = (text) =>
  Array.from(new Set((text || '').match(urlsRegex))).map((url) => {
    if (!/^https?:\/\//i.test(url)) {
      return 'http://' + url;
    }
    return url;
  });

export const getTimeDetails = (eventTime) => {
  // '2021-05-1 19:59:59' | '2021-05-1 18:59:59'
  if (!eventTime) {
    throw new Error('Missing eventTime');
  }
  const now = dayjs();
  const oneHourAgo = dayjs(new Date() - ONE_HOUR);
  if (eventTime.isBefore(now) && eventTime.isAfter(oneHourAgo)) {
    return {
      class: 'now',
      label: 'HAPPENING NOW',
      longLabel: 'Session is in progress!',
    };
  } else if (
    eventTime.isBefore(now.add(7, 'minutes')) &&
    eventTime.isAfter(oneHourAgo)
  ) {
    return {
      class: 'soon',
      label: 'HAPPENING SOON',
      longLabel: 'Starting soon!',
    };
  } else if (eventTime.isBefore(oneHourAgo)) {
    return {
      class: 'past',
      longLabel: `The session took place ${eventTime.from(now)}`,
      label: eventTime.fromNow(), //eventTime.from(now)
    };
  }
  return {
    class: 'future',
    longLabel: `Happening ${eventTime.from(now)}`,
    label: eventTime.fromNow(), //eventTime.from(now)
  };
};

export const priceFormat = (price, currency = 'EUR') => {
  if (typeof price === 'number') {
    return parseFloat(price).toLocaleString('en-US', {
      style: 'currency',
      currency,
    });
  }
  if (typeof price === 'object' && price.get && price.get('val')) {
    return parseFloat(price.get('val')).toLocaleString('en-US', {
      style: 'currency',
      currency: price.get('cur'),
    });
  }
  if (typeof price === 'object' && price.val) {
    const priceValue = parseFloat(price.val);
    if (price.cur === BLOCKCHAIN_DAO_TOKEN.symbol) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: BLOCKCHAIN_DAO_TOKEN.symbol,
      })
        .formatToParts(priceValue)
        .map((v, i) => (i === 0 ? '$' + v.value : v.value));
    }
    return priceValue.toLocaleString('en-US', {
      style: 'currency',
      currency: price.cur,
    });
  }
  return '0.00';
};

export const prependHttp = (url, { https = true } = {}) => {
  if (typeof url !== 'string') {
    throw new TypeError(
      `Expected \`url\` to be of type \`string\`, got \`${typeof url}\``,
    );
  }

  url = url.trim();

  if (/^\.*\/|^(?!localhost)\w+?:/.test(url)) {
    return url;
  }

  return url.replace(/^(?!(?:\w+?:)?\/\/)/, https ? 'https://' : 'http://');
};

export const getSample = (field) => {
  switch (field.type) {
    case 'text':
    case 'longtext':
    case 'email':
    case 'phone':
      return '';
    case 'number':
      return 0;
    case 'currency':
      return {
        cur: 'USD',
        val: 0,
      };
    case 'tags':
      return [];
    case 'photos':
      return [];
    case 'date':
      return new Date();
    case 'switch':
      return false;
    case 'datetime':
      return null;
    case 'ticketOptions':
      return [
        {
          id: Math.random(),
          name: '',
          icon: null,
          price: 0,
          currency: 'USD',
          disclaimer: '',
          limit: 0,
        },
      ];
    case 'fields':
      return [];
    case 'discounts':
      return [
        {
          id: Math.random(),
          name: '',
          code: '',
          percent: '',
          val: '',
        },
      ];
    case 'select':
      return field.options && field.options[0] && field.options[0].value;
    case 'autocomplete':
    case 'currencies':
      return [
        {
          cur: 'USD',
          val: 0,
        },
      ];
    default:
      throw new Error(`Invalid model type:${field.type}`);
  }
};

export const calculateRefundTotal = ({ initialValue, policy, startDate }) => {
  const { default: defaultRefund, lastmonth, lastweek, lastday } = policy || {};
  const bookingStartDate = dayjs(startDate);
  const now = dayjs();
  const daysUntilBookingStart = bookingStartDate.diff(now, 'days');

  if (daysUntilBookingStart > REFUND_PERIODS.MONTH) {
    return initialValue * defaultRefund;
  }
  if (daysUntilBookingStart >= REFUND_PERIODS.WEEK) {
    return initialValue * lastmonth;
  }
  if (daysUntilBookingStart > REFUND_PERIODS.DAY) {
    return initialValue * lastweek;
  }
  if (daysUntilBookingStart > REFUND_PERIODS.LASTDAY) {
    return initialValue * lastday;
  }
  return 0;
};

export const checkIfBookingEqBlockchain = (booking, blockchain) => {
  if (!blockchain) {
    return false;
  }
  const isBookingMatchBlockchain = booking.every(([year, day]) =>
    blockchain.some(
      ([_, bookedYear, bookedDay]) => bookedYear === year && bookedDay === day,
    ),
  );
  return isBookingMatchBlockchain;
};

export const formatCurrency = (currency) => {
  const symbol = {
    USD: '$',
    EUR: '€',
    TDF: '$',
  };
  return `${symbol[currency]} ${currency}`;
};