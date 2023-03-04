/* eslint-disable no-unused-vars */
import React, { Context, PropsWithChildren } from 'react';

import { AxiosInstance } from 'axios';
import { BigNumber } from 'ethers';
import { NextPage } from 'next';
import { BareFetcher } from 'swr/dist/types';

import { ABI, Token, WalletActionsContext, WalletStateContext } from './types';

declare module 'closer' {
  export const AuthProvider: React.FC<PropsWithChildren>;
  export const WalletProvider: React.FC<PropsWithChildren>;
  export const WalletState: React.Context<WalletStateContext>;
  export const WalletDispatch: React.Context<WalletActionsContext>;
  export const PlatformProvider: React.FC<PropsWithChildren>;

  export const usePlatform: () => Context<unknown>;
  export const useAuth: () => Context<unknown>;
  export const useHasMounted: () => boolean;

  export const EventsPage: NextPage;
  export const CreateEventPage: NextPage;
  export const EventPage: NextPage;
  export const EditEventPage: NextPage;
  export const CheckoutEventPage: NextPage;
  export const TicketsEventPage: NextPage;
  export const LoginPage: NextPage;
  export const ForgotPasswordPage: NextPage;
  export const SetPasswordPage: NextPage;
  export const BookingsPage: NextPage;
  export const BookingsRequestsPage: NextPage;
  export const BookingPage: NextPage;
  export const BookingCancelPage: NextPage;
  export const BookingCheckoutPage: NextPage;
  export const BookingConfirmationPage: NextPage;
  export const BookingQuestionsPage: NextPage;
  export const BookingSummaryPage: NextPage;
  export const CreateBookingPage: NextPage;
  export const CreateBookingAccomodationPage: NextPage;
  export const CreateBookingDatesPage: NextPage;
  export const EditBookingPage: NextPage;
  export const MembersPage: NextPage;
  export const MemberPage: NextPage;
  export const TicketPage: NextPage;
  export const TicketsInvoicePage: NextPage;
  export const TokenSalePage: NextPage;
  export const TokenSaleReferralPage: NextPage;
  export const SettingsPage: NextPage;
  export const AdminPage: NextPage;
  export const SignUpPage: NextPage;

  export const Footer: React.FC;
  export const Navigation: React.FC;

  export const BLOCKCHAIN_DAO_DIAMOND_ADDRESS: string;
  export const BLOCKCHAIN_DAO_TOKEN: Token;
  export const BLOCKCHAIN_DAO_TOKEN_ABI: ABI[];
  export const BLOCKCHAIN_DIAMOND_ABI: ABI[];
  export const BLOCKCHAIN_EXPLORER_URL: string;
  export const BLOCKCHAIN_NAME: string;
  export const BLOCKCHAIN_NATIVE_TOKEN: Token;
  export const BLOCKCHAIN_NETWORK_ID: number;
  export const BLOCKCHAIN_RPC_URL: string;
  export const api: AxiosInstance;
  export const fetcher: (library: any, abi: ABI[]) => BareFetcher<any>;
  export const multiFetcher: (
    library: any,
    abi: ABI[],
  ) => (...args: any[]) => Promise<any>;
  export const formatBigNumberForDisplay: (
    bigNumber: BigNumber,
    tokenDecimals: number,
    displayDecimals?: number,
  ) => string;

  export * as theme from 'closer/theme';
}
