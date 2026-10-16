import React, { useEffect, useState } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import { useWalletState } from './hooks';
import { WalletProvider } from './index';

let mockReady: () => void;
let mockReject: (error: Error) => void;
let mockReadiness: Promise<void>;
let mockRuntimeMounts = 0;
const mockState = { initializationStatus: 'ready' };
const mockDispatch = {};
jest.mock('./WalletProviderWithReown', () => ({
  get walletRuntimeReady() {
    return mockReadiness;
  },
  WalletProviderWithReown: ({ publish }: any) => {
    useEffect(() => {
      mockRuntimeMounts++;
      publish(mockState, mockDispatch);
    }, [publish]);
    return null;
  },
}));

function Form() {
  const [value, setValue] = useState('');
  const { initializationStatus, initializationSlow } = useWalletState();
  return (
    <>
      <input
        aria-label="Name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <span>{initializationStatus}</span>
      {initializationSlow && <span>slow</span>}
    </>
  );
}

beforeEach(() => {
  mockReadiness = new Promise<void>((resolve, reject) => {
    mockReady = resolve;
    mockReject = reject;
  });
});
afterEach(() => {
  jest.useRealTimers();
  process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
});

test('slow lazy initialization preserves typed form input and accepts late success', async () => {
  jest.useFakeTimers();
  render(
    <WalletProvider>
      <Form />
    </WalletProvider>,
  );
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Justina' },
  });
  await act(async () => {
    await Promise.resolve();
    jest.advanceTimersByTime(31000);
  });
  expect(screen.getByText('slow')).toBeInTheDocument();
  await act(async () => {
    mockReady();
    await Promise.resolve();
  });
  expect(screen.getByText('ready')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveValue('Justina');
  expect(mockRuntimeMounts).toBe(1);
});

test('wallet-disabled pages keep the same form and never mount the runtime', async () => {
  process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
  const previous = mockRuntimeMounts;
  render(
    <WalletProvider>
      <Form />
    </WalletProvider>,
  );
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Member' },
  });
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByText('disabled')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveValue('Member');
  expect(mockRuntimeMounts).toBe(previous);
});

test('SDK readiness failure leaves the form mounted and exposes a recoverable error', async () => {
  render(
    <WalletProvider>
      <Form />
    </WalletProvider>,
  );
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Member' },
  });
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    mockReject(new Error('initialization failed'));
  });
  expect(screen.getByText('error')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveValue('Member');
});
