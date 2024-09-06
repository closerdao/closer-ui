// write smoke test for VolunteerEventView
import { screen } from '@testing-library/react';

import { AuthContext } from '../../contexts/auth';
import { VolunteerOpportunity } from '../../types';
import VolunteerEventView from './VolunteerEventView';
import { renderWithNextIntl } from '../../test/utils';

const volunteerEventMock: VolunteerOpportunity = {
  name: 'Test title',
  category: 'test',
  photo: '6428ca70fc792398aed73d58',
  slug: 'test',
  description: 'test description',
  start: '2023-05-01T11:00:00.000Z',
  end: '2023-05-05T11:00:00.000Z',
  visibleBy: [],
  createdBy: '63fc8e8910354e3f945e249a',
  updated: '2023-04-02T00:21:28.927Z',
  created: '2023-04-02T00:21:28.927Z',
  attributes: [],
  managedBy: [],
  _id: '6428ca88fc792398aed73d5c',
};

const userMock = {
  screenname: 'VV',
  timezone: 'Asia/Almaty',
  slug: 'vv',
  tagline: '',
  about: 'srwer',
  email: 'vashnev13@gmail.com',
  email_verified: false,
  lastactive: '2023-03-23T10:08:36.178Z',
  lastlogin: '2023-03-24T07:03:00.985Z',
  roles: [],
  viewChannels: [],
  manageChannels: [],
  location: {
    type: 'Point',
    coordinates: [76.9167, 43.25],
    timezone: 'Asia/Almaty',
    source: 'IP',
    iso_code: '',
    name_long: 'Almaty, ',
    name: 'Almaty',
  },
  settings: { newsletter_weekly: true },
  links: [],
  visibleBy: [],
  createdBy: '',
  updated: '2023-03-23T13:08:36.649Z',
  created: '2023-03-23T10:08:36.178Z',
  attributes: [],
  managedBy: [],
  _id: '641c2524f72ea12f5e9ab85d',
  walletAddress: 'adawdkjhi98y189u',
  nonce: '',
  photo: 'photo',
  type: 'test',
};

const authContextMock = {
  isAuthenticated: true,
  user: userMock,
  login: jest.fn(),
  setAuthentification: jest.fn(),
  isLoading: false,
  logout: jest.fn(),
  error: null,
  signup: jest.fn(),
  completeRegistration: jest.fn(),
  updatePassword: jest.fn(),
  setUser: jest.fn(),
  setError: jest.fn(),
};

describe('VolunteerEventView', () => {
  it('should render', () => {
    renderWithNextIntl(
      <AuthContext.Provider value={authContextMock}>
        <VolunteerEventView volunteer={volunteerEventMock} />
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Test title')).toBeInTheDocument();
    expect(screen.getByText('test description')).toBeInTheDocument();
  });

  it('should have Edit button if user has steward role', () => {
    const authContextWithUserStewardRole = {
      ...authContextMock,
      user: {
        ...userMock,
        roles: ['steward'],
      },
    };

    renderWithNextIntl(
      <AuthContext.Provider value={authContextWithUserStewardRole}>
        <VolunteerEventView volunteer={volunteerEventMock} />
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Test title')).toBeInTheDocument();
    expect(screen.getByText('test description')).toBeInTheDocument();
    expect(screen.getByText('Edit opportunity')).toBeInTheDocument();
  });
});
