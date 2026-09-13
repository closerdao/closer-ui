# Buying credits — API contract

The credit checkout (`/credits/checkout?amount=N`) sells credits two ways. The
card leg already exists; the stablecoin leg is new and needs backend work.

## What the UI sends today (card — already implemented)

```
POST /credits/payment
  { creditsAmount, email, paymentMethod, currency: 'EUR' }
  -> { results: { paymentIntent } }

POST /credits/payment/confirmation
  { paymentMethod, paymentId }
  -> 200
```

Pricing is client-side: the page multiplies `creditsAmount` by the configured
price. **The API must price the purchase itself from the same config** and
must not trust an amount from the client — the UI only decides how many
credits are asked for.

## What the UI needs (crypto — not implemented yet)

Modelled on `POST /stays/:id/token-payment`, which already does this for
stays: one endpoint, two steps, discriminated by the presence of `txHash`.

### Step 1 — quote

```
POST /credits/payment/token
  { creditsAmount: number }

  -> { results: {
         creditsAmount: number,
         fiatAmount: number,        // creditsAmount x config.credit.creditPricePerUnit
         currency: string,          // 'EUR'
         chainId: number,
         treasuryAddress: string,   // accounting entity walletAddress
         stablecoinSymbol: string,  // 'cEUR' (mainnet) / 'fakeEUR' (testnet)
         stablecoinAddresses: string[]
       } }
```

The UI shows `fiatAmount` and `treasuryAddress`, then asks the member's wallet
to transfer that amount of the stablecoin. It never computes the price itself
for this leg.

### Step 2 — confirm

```
POST /credits/payment/token
  { creditsAmount: number, txHash: string }

  -> { results: {
         creditsAmount: number,   // credits actually granted
         balance: number | null,  // new balance, if cheap to return
         verified: boolean
       } }
```

Requirements carried over from the stay flow:

- **Idempotent on `txHash`.** A member who reloads mid-confirmation replays the
  same hash; that must not grant credits twice. The UI keeps the pending hash
  in `sessionStorage` (`closer:credits-crypto-payment-pending:<credits>`) and
  offers "Verify my transfer" rather than a second transfer.
- **Verify on chain**, do not trust the client: the transfer must be to the
  treasury, in the expected token, for at least the quoted amount, and not
  already consumed.
- **A not-yet-indexed transfer answers 400 with a message matching
  `/could not be verified/i`.** The UI treats exactly that message as
  retryable and retries five times, five seconds apart, before telling the
  member their credits are not lost. Any other 400 is shown verbatim, so the
  message must be member-readable.
- Credits land on the same balance as `/credits/payment`, with the same expiry
  rules.

## Config the endpoint reads

`config.credit` (new group, admin-editable, env-gated behind
`NEXT_PUBLIC_FEATURE_CARROTS`):

| field                | meaning                                                     |
| -------------------- | ----------------------------------------------------------- |
| `enabled`            | whether credits are on sale at all                          |
| `creditPricePerUnit` | price of one credit in the platform currency                |
| `minPurchase`        | smallest purchase the checkout offers (default 1)           |
| `maxPurchase`        | largest purchase the checkout offers (default 100)          |
| `allowCryptoPayment` | whether the crypto tab is offered                           |
| `packages`           | curated bundles: `title`, `credits`, `bonusCredits`, `description` |
| `volumeDiscounts`    | buy-more-pay-less tiers: `minCredits`, `discountPercent`     |

`fundraiser.creditPricePerUnit` is the legacy home of the price. The UI falls
back to it while nobody has saved a price in `config.credit`
(`utils/credits.helpers.ts`), and the API should resolve the price the same
way so both sides agree on what a purchase costs.

`bonusCredits` are granted free on top of the paid quantity, so the API must
apply the bundle bonus itself when the requested `creditsAmount` matches a
configured package — the UI displays the bonus but does not price it.

## Volume discounts

`volumeDiscounts` is a list of `{ minCredits, discountPercent }` tiers. **They
do not stack**: a purchase gets the single highest-percentage tier whose
`minCredits` it reaches, and nothing below the first tier. The discount comes
off the subtotal (`creditsAmount x creditPricePerUnit`) and the result is
rounded to whole cents.

```
subtotal = creditsAmount * creditPricePerUnit
tier     = best tier where creditsAmount >= tier.minCredits, else none
total    = round2(subtotal - round2(subtotal * tier.discountPercent / 100))
```

`utils/credits.helpers.ts` (`getVolumeDiscounts`, `getCreditPurchasePrice`) is
the reference implementation, including which tiers are ignored: a tier is
dropped, rather than clamped, when `minCredits` is missing or non-positive or
when `discountPercent` falls outside 0-100 exclusive. The API must price the
charge the same way — both `/credits/payment` and `/credits/payment/token`
show the buyer a total before they pay, and a server that priced it
differently would either overcharge them or sell credits at a loss.
