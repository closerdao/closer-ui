## Migration to a new platform Stripe account

- Configure payout settings on the new platform account dashboard (to match the old Closer account)
- Show "Closed for scheduled maintenance" message on TDF website (prod only)
- Change FE env variable PLATFORM_STRIPE_SECRET_KEY to secret key of the new main account
- Change FE env variable NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY to public key of the new main account
- Change export const STRIPE_CONNECT_CLIENT_ID constant to live mode new main account value in shared.constants.ts
- Change BE env variable STRIPE_PLATFORM_KEY
- Disconnect TDF account from old Closer stripe account from Closer Stripe dashboard 
- Go to [https://www.traditionaldreamfactory.com/stripe-connect](https://www.traditionaldreamfactory.com/stripe-connect) and click 
"Connect with Stripe" button, select the TDF account
- Do a test transaction in live mode on localhost
- Remove "Closed for maintenance" message from TDF website
- Check if webhook events are delivered to the new platform account

