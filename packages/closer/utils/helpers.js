import ReactGA from 'react-ga';

import { ObjectId } from 'bson';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import { blockchainConfig } from '../config_blockchain';
import { DEFAULT_CURRENCY, REFUND_PERIODS } from '../constants';
import { PaymentType } from '../types';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

// TODO: convert to typescript

const { BLOCKCHAIN_DAO_TOKEN } = blockchainConfig;

const ONE_HOUR = 60 * 60 * 1000;

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

export const priceFormat = (price, currency = DEFAULT_CURRENCY) => {
  if (currency === 'credits') {
    return `${price} ${currency}`;
  }
  if (price?.cur && price.cur === 'credits') {
    return `${price.val} ${price.cur}`;
  }
  if (price?.val === null) {
    return parseFloat(0).toLocaleString('en-US', {
      style: 'currency',
      currency,
    });
  }
  if (!currency) {
    currency = DEFAULT_CURRENCY;
  }
  if (typeof price === 'number') {
    return parseFloat(price).toLocaleString('en-US', {
      style: 'currency',
      currency,
    });
  } else if (price?.get && typeof price.get('val') !== 'undefined') {
    return parseFloat(price.get('val')).toLocaleString('en-US', {
      style: 'currency',
      currency: price.get('cur'),
    });
  } else if (typeof price?.val !== 'undefined') {
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
      currency: price.cur || currency,
    });
  } else {
    return '0.00';
  }
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
        cur: 'EUR',
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
          id: new ObjectId().toString(),
          name: '',
          icon: null,
          price: 0,
          currency: 'EUR',
          disclaimer: '',
          limit: 0,
        },
      ];
    case 'fields':
      return [];
    case 'discounts':
      return [
        {
          id: new ObjectId().toString(),
          name: '',
          code: '',
          percent: '',
          val: '',
        },
      ];
    case 'select':
      return field.options && field.options[0] && field.options[0].value;
    case 'multi-select':
      return [];
    case 'autocomplete':
    case 'currencies':
      return [
        {
          cur: 'EUR',
          val: 0,
        },
      ];
    case 'learnEditor':
      return [];
    default:
      throw new Error(`Invalid model type:${field.type}`);
  }
};

export const calculateRefundTotal = ({
  bookingStatus,
  fiatPrice,
  tokenOrCreditPrice,
  policy,
  startDate,
  paymentType,
}) => {
  const { default: defaultRefund, lastmonth, lastweek, lastday } = policy || {};
  const bookingStartDate = dayjs(startDate);

  const isTokenOrCreditPayment =
    paymentType === PaymentType.PARTIAL_TOKENS ||
    paymentType === PaymentType.FULL_TOKENS ||
    paymentType === PaymentType.PARTIAL_CREDITS ||
    paymentType === PaymentType.FULL_CREDITS;

  const localTokenOrCreditPrice = isTokenOrCreditPayment
    ? tokenOrCreditPrice
    : 0;

  const now = dayjs();
  const daysUntilBookingStart = bookingStartDate.diff(now, 'days');
  if (
    bookingStatus === 'pending' ||
    bookingStatus === 'confirmed' ||
    bookingStatus === 'open'
  ) {
    return {
      fiat: { val: 0, cur: fiatPrice.cur },
      tokensOrCredits: {
        val: 0,
        cur: 'credits',
      },
    };
  }

  if (daysUntilBookingStart > REFUND_PERIODS.MONTH) {
    return {
      fiat: { val: fiatPrice.val * defaultRefund, cur: fiatPrice.cur },
      tokensOrCredits: {
        val: localTokenOrCreditPrice.val * defaultRefund,
        cur: 'credits',
      },
    };
  }
  if (daysUntilBookingStart >= REFUND_PERIODS.WEEK) {
    return {
      fiat: { val: fiatPrice.val * lastmonth, cur: fiatPrice.cur },
      tokensOrCredits: {
        val: localTokenOrCreditPrice.val * lastmonth,
        cur: 'credits',
      },
    };
  }
  if (daysUntilBookingStart > REFUND_PERIODS.DAY) {
    return {
      fiat: { val: fiatPrice.val * lastweek, cur: fiatPrice.cur },
      tokensOrCredits: {
        val: localTokenOrCreditPrice.val * lastweek,
        cur: 'credits',
      },
    };
  }
  if (daysUntilBookingStart > REFUND_PERIODS.LASTDAY) {
    return {
      fiat: { val: fiatPrice.val * lastday, cur: fiatPrice.cur },
      tokensOrCredits: {
        val: localTokenOrCreditPrice.val * lastday,
        cur: 'credits',
      },
    };
  }

  return {
    fiat: { val: fiatPrice.val * defaultRefund, cur: fiatPrice.cur },
    tokensOrCredits: {
      val: localTokenOrCreditPrice.val * defaultRefund,
      cur: 'credits',
    },
  };
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

export const getVatInfo = (total, vatRate) => {
  if (vatRate) {
    const vatAmount = (total?.val * Number(vatRate)) / (1 + Number(vatRate));
    return `${priceFormat(vatAmount, total?.cur)}
    (${Number(vatRate) * 100}%)`;
  }
  return '';
};

export const getCurrencySymbol = (currency) => {
  const symbol = {
    USD: '$',
    EUR: '€',
    TDF: '$TDF',
  };
  return `${symbol[currency]}`;
};

export const getNextMonthName = () => {
  const currentDate = dayjs();
  const nextMonth = currentDate.add(1, 'month');
  return nextMonth.format('MMMM');
};
const validationPatterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^[0-9()+-\s]{5,}$/,
  taxNo: /^$|^[0-9()\-\s]{6,}$/,
  swissAddress: /Switzerland/i,
  usAddress: /\s\b(us|usa|united\sstates)\b/,
};

const doesRegexMatch = (value, validation) => {
  const pattern = validationPatterns[validation];
  if (pattern) {
    return pattern.test(value);
  }
  return true;
};

export const isInputValid = (value, validation) => {
  return doesRegexMatch(value, validation);
};

export const doesAddressMatchPattern = (value, validation) => {
  return doesRegexMatch(value, validation);
};

export const getCreatedPeriodFilter = (period) => {
  {
    const today = new Date();
    let startDate;

    switch (period) {
      case 'last-week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last-month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'last-3-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'last-6-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 6);
        break;
      default:
        return null;
    }

    return {
      $gte: startDate,
    };
  }
};

export const prepareUserDataForCsvExport = (usersData) => {
  const headers = [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Wallet address', key: 'walletAddress' },
    { label: 'Roles', key: 'roles' },
    { label: 'Created', key: 'created' },
  ];

  const data = usersData.map((userMap) => {
    const user = userMap.toJS();
    return {
      name: user.screenname,
      email: user.email,
      walletAddress: user.walletAddress || '-',
      created: user.created,
      roles: (user.roles && user.roles.join()) || '-',
    };
  });

  return { headers, data };
};

export const sendAnalyticsEvent = (action, category, label) => {
  ReactGA.event({
    action,
    category,
    label,
  });
};

export const getMaxBookingHorizon = (settings, isMember) => {
  if (settings) {
    if (isMember) {
      return [settings.memberMaxBookingHorizon, settings.memberMaxDuration];
    }
    return [settings.guestMaxBookingHorizon, settings.guestMaxDuration];
  }
  return [0, 0];
};

export const calculateFullDaysDifference = (targetDate) => {
  const currentDate = new Date();
  const timeDifference = currentDate - new Date(targetDate);
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  const fullDaysDifference = Math.floor(timeDifference / millisecondsInADay);
  return fullDaysDifference;
};

export const getBookingRate = (durationInDays) =>
  durationInDays >= 28 ? 'monthly' : durationInDays >= 7 ? 'weekly' : 'daily';

export const getDiscountRate = (durationName, settings) => {
  switch (durationName) {
    case 'monthly':
      return settings.discountsMonthly;
    case 'weekly':
      return settings.discountsWeekly;
    case 'daily':
      return settings.discountsDaily;
    default:
      return settings.discountsDaily;
  }
};

export const doAllKeysHaveValues = (obj, keys) => {
  if (!obj) return false;
  for (const key of keys) {
    if (!(key in obj) || !obj[key]) {
      return false;
    }
  }
  return true;
};

export const calculateSubscriptionPrice = (plan, monthlyCredits) => {
  if (!plan) {
    return 0;
  }

  if (!plan.tiersAvailable) {
    return Number(plan.price);
  }

  if (plan.tiersAvailable) {
    return Number(plan.price) * monthlyCredits;
  }

  throw new Error(
    `Could not calculate subscription price for this amount of credits ${monthlyCredits}.`,
  );
};
