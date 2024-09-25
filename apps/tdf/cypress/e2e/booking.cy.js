/* eslint-disable no-undef */

const LISTING = { slug: 'glamping-private', name: 'Glamping (private)' };
const LISTING_HOURLY = { slug: 'meeting-room', name: 'Meeting room' };
const TEST_EVENT_SLUG = 'cypress-test-event';

const login = ({ isAdmin }) => {
  if (isAdmin) {
    cy.get('input[aria-label*="Email"]').type(Cypress.env('TEST_ADMIN_EMAIL'));
  } else {
    cy.get('input[aria-label*="Email"]').type(Cypress.env('TEST_USER_EMAIL'));
  }
  cy.get('input[aria-label*="Password"]').type(
    Cypress.env('TEST_USER_PASSWORD'),
  );
  cy.contains('button', 'Log in').click();
  cy.wait(2000);
};

const getDateInTwodays = () => {
  const today = new Date();
  const todayDate = today.getDate();
  return todayDate + 2;
};

const getIframeBody = () => {
  return cy
    .get('iframe[role="presentation"]')
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap);
};

const selectDates = () => {
  cy.get('[data-testid="select-dates-button"]').click();
  const tomorrowDate = getDateInTwodays();
  cy.contains('.rdp-day', tomorrowDate).click();
  cy.get('button')
    .contains(/book now/i)
    .should('be.disabled');
  cy.contains('.rdp-day', tomorrowDate + 1).click();
  cy.get('[data-testid="select-dates-button"]').click();
};

const selectDatesSearchListings = () => {
  const tomorrowDate = getDateInTwodays();
  cy.contains('.rdp-day', tomorrowDate).click();
  cy.contains('.rdp-day', tomorrowDate + 1).click();
};

const selectDateAndTime = () => {
  cy.get('[data-testid="select-dates-button"]').click();
  const tomorrowDate = getDateInTwodays();
  cy.contains('.rdp-day', tomorrowDate + 1).click();
  cy.get('button')
    .contains(/12:00.*13:00/s)
    .click();
  cy.get('[data-testid="select-dates-button"]').click();
};

const fillStripeForm = () => {
  getIframeBody().find('input[name="cardnumber"]').type('4242424242424242');
  getIframeBody().find('input[name="exp-date"]').type('1035');
  getIframeBody().find('input[name="cvc"]').type('111');
  getIframeBody().find('input[name="postal"]').type('90210');
};

describe('Booking flow', () => {
  it('should have correct unauthenticated user booking flow', () => {
    cy.visit(`${Cypress.config('baseUrl')}/stay/${LISTING.slug}`);
    selectDates();
    cy.get('button')
      .contains(/book now/i)
      .click();

    cy.url().should('include', `signup?back=stay/${LISTING.slug}`);
    cy.get('[data-testid="login-link"]').click();
    cy.url().should('include', `/login?back=stay/${LISTING.slug}`);

    login({ isAdmin: false });
    cy.url().should('include', `/stay/${LISTING.slug}`);
  });

  it('should have correct authenticated user (cannot instant book) booking flow', () => {
    cy.visit(`${Cypress.config('baseUrl')}/login`);
    login({ isAdmin: false });
    cy.wait(2000);
    cy.visit(`${Cypress.config('baseUrl')}/stay/${LISTING.slug}`);
    cy.get('button')
      .contains(/select dates/i)
      .click();
    const tomorrowDate = getDateInTwodays();
    cy.contains('.rdp-day', tomorrowDate).click();
    cy.contains('.rdp-day', tomorrowDate + 1).click();
    cy.get('[data-testid="select-dates-button"]').click();
    cy.get('button')
      .contains(/book now/i)
      .click();

      cy.get('h1')
      .contains(/food/i)
      .should('be.visible')

      cy.get('button')
      .contains(/continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click();
    
    cy.get('button')
      .contains(/submit request/i)
      .should('be.visible')
      .should('be.enabled');
  });

  it('should have correct authenticated user (can instant book) booking flow', () => {
    cy.visit(`${Cypress.config('baseUrl')}/login`);
    login({ isAdmin: true });
    cy.visit(`${Cypress.config('baseUrl')}/stay/${LISTING.slug}`);
    selectDates();
    cy.get('button')
      .contains(/book now/i)
      .click();

      cy.get('h1')
      .contains(/food/i)
      .should('be.visible')

      cy.get('button')
      .contains(/continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click();

    cy.get('button')
      .contains(/checkout/i)
      .click();
    cy.url().should('include', '/checkout');
    cy.get('button').contains(/pay/i).should('be.disabled');

    fillStripeForm();

    cy.get('input[type="checkbox"]').click({ multiple: true });
    cy.get('button').contains(/pay/i).click();
    cy.wait(16000);
    cy.url().should('include', '/confirmation');

    cy.get('button')
      .contains(/view booking/i)
      .click();

    cy.url().should('include', '/bookings');

    cy.get('button')
      .contains(/cancel booking/i)
      .click();
    cy.url().should('include', '/cancel');

    cy.get('button').contains(/yes/i).click();
  });

  it('should have correct authenticated user (can instant book) booking flow paid with credits', () => {
    cy.visit(`${Cypress.config('baseUrl')}/login`);
    login({ isAdmin: true });
    cy.visit(`${Cypress.config('baseUrl')}/stay/${LISTING.slug}`);
    selectDates();
    cy.get('button')
      .contains(/book now/i)
      .click();

      cy.get('h1')
      .contains(/food/i)
      .should('be.visible')

      cy.get('button')
      .contains(/continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click();

    cy.get('button')
      .contains(/checkout/i)
      .click();
    cy.url().should('include', '/checkout');
    cy.get('button').contains(/pay/i).should('be.disabled');

    cy.get('button')
      .contains(/apply discount/i)
      .click();

    cy.get('div')
      .contains(/will be redeemed/i)
      .should('be.visible');

  });

  it('should have correct authenticated user booking flow with listing search', () => {
    cy.visit(`${Cypress.config('baseUrl')}/login`);
    login({ isAdmin: true });

    cy.visit(`${Cypress.config('baseUrl')}/stay`);
    cy.get('a')
      .contains(/apply to stay/i)
      .click();

    selectDatesSearchListings();

    cy.get('button')
      .contains(/search/i)
      .click();

    cy.contains('div', LISTING.name)
      .find('h4')
      .contains(LISTING.name)
      .parents('div')
      .contains('button', 'Select')
      .click();
    
      cy.get('h1')
      .contains(/food/i)
      .should('be.visible')

      cy.get('button')
      .contains(/continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click();

    cy.wait(2000);
    cy.url().should('include', '/summary');
  });

  it('should have correct unauthenticated user booking flow with listing search', () => {
    cy.visit(`${Cypress.config('baseUrl')}/stay`);
    cy.get('a')
      .contains(/apply to stay/i)
      .click();

    selectDatesSearchListings();

    cy.get('button')
      .contains(/search/i)
      .click();

    cy.contains('div', LISTING.name)
      .find('h4')
      .contains(LISTING.name)
      .parents('div')
      .get('button')
      .contains(/log in to book/i)
      .click();

    login({ isAdmin: true });

    cy.contains('div', LISTING.name)
      .find('h4')
      .contains(LISTING.name)
      .parents('div')
      .contains('button', 'Select')
      .click();

      cy.get('h1')
      .contains(/food/i)
      .should('be.visible')

      cy.get('button')
      .contains(/continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click();

    cy.url().should('include', '/summary');
  });

  it('should have correct authenticated user (can instant book) hourly booking flow', () => {
    cy.visit(`${Cypress.config('baseUrl')}/login`);
    login({ isAdmin: true });
    cy.visit(`${Cypress.config('baseUrl')}/stay/${LISTING_HOURLY.slug}`);

    selectDateAndTime();
    cy.get('button')
      .contains(/book now/i)
      .click();

      cy.get('h1')
      .contains(/food/i)
      .should('be.visible')

      cy.get('button')
      .contains(/continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click();

    cy.get('button')
      .contains(/checkout/i)
      .click();
    cy.url().should('include', '/checkout');
    cy.get('button').contains(/pay/i).should('be.disabled');

    fillStripeForm();

    cy.get('input[type="checkbox"]').click({ multiple: true });
    cy.get('button').contains(/pay/i).click();
    cy.wait(16000);
    cy.url().should('include', '/confirmation');

    cy.get('button')
      .contains(/view booking/i)
      .click();

    cy.url().should('include', '/bookings');

    cy.get('button')
      .contains(/cancel booking/i)
      .click();
    cy.url().should('include', '/cancel');

    cy.get('button').contains(/yes/i).click();
  });

  // TODO: add more realistic test for hourly booking
  it('should have correct unauthenticated user (can instant book) hourly booking flow', () => {
    cy.visit(`${Cypress.config('baseUrl')}/stay/${LISTING_HOURLY.slug}`);

    selectDateAndTime();
    cy.get('button')
      .contains(/book now/i)
      .click();

    cy.url().should('include', `signup?back=stay/${LISTING_HOURLY.slug}`);
    cy.get('[data-testid="login-link"]').click();
    cy.url().should('include', `/login?back=stay/${LISTING_HOURLY.slug}`);

    login({ isAdmin: true });
    cy.url().should('include', `/stay/${LISTING_HOURLY.slug}`);
    
  });
});

it('should have correct authenticated overnight event booking flow', () => {
  cy.visit(`${Cypress.config('baseUrl')}/login`);
  login({ isAdmin: true });

  cy.visit(`${Cypress.config('baseUrl')}/events/${TEST_EVENT_SLUG}`);
  cy.get('a')
    .contains(/buy ticket/i)
    .click();

    
    cy.contains('button', 'overnight ticket', { matchCase: false })
    .should('exist')
    .click();
    
    
    cy.get('button')
      .contains(/clear selection/i)
      .click();
    
  selectDatesSearchListings();

  cy.get('button')
    .contains(/search/i)
    .click();

  cy.contains('div', LISTING.name)
    .find('h4')
    .contains(LISTING.name)
    .parents('div')
    .contains('button', 'Select')
    .click();

  cy.get('button')
    .contains(/submit/i)
    .click();

    cy.get('button')
    .contains(/checkout/i)
    .click();
    
  cy.url().should('include', '/checkout');

  cy.get('button').contains(/pay/i).should('be.disabled');

  fillStripeForm();

  cy.get('input[type="checkbox"]').click({ multiple: true });
  cy.get('button').contains(/pay/i).click();
  cy.wait(16000);
  cy.url().should('include', '/confirmation');

  cy.get('button')
    .contains(/view ticket/i)
    .click();

  cy.url().should('include', '/bookings');

  cy.get('button')
    .contains(/cancel booking/i)
    .click();
  cy.url().should('include', '/cancel');

  cy.get('button').contains(/yes/i).click();
});

it('should have correct authenticated day ticket event booking flow', () => {
  cy.visit(`${Cypress.config('baseUrl')}/login`);
  login({ isAdmin: true });

  cy.visit(`${Cypress.config('baseUrl')}/events/${TEST_EVENT_SLUG}`);
  cy.get('a')
    .contains(/buy ticket/i)
    .click();


  cy.get('button')
    .contains(/continue/i)
    .click();

  cy.get('button')
    .contains(/submit/i)
    .click();

    cy.get('button')
    .contains(/checkout/i)
    .click();
    
  cy.url().should('include', '/checkout');

  cy.get('button').contains(/pay/i).should('be.disabled');

  fillStripeForm();

  cy.get('input[type="checkbox"]').click({ multiple: true });
  cy.get('button').contains(/pay/i).click();
  cy.wait(16000);
  cy.url().should('include', '/confirmation');

  cy.get('button')
    .contains(/view ticket/i)
    .click();

  cy.url().should('include', '/bookings');

  cy.get('button')
    .contains(/cancel booking/i)
    .click();
  cy.url().should('include', '/cancel');

  cy.get('button').contains(/yes/i).click();
});
