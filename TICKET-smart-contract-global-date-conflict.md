# Smart Contract Bug: "Booking already exists" for non-existent booking

## Summary

The `BookingFacet` contract rejects bookings with "Booking already exists" error, but **no booking exists on-chain for those dates from any known wallet**.

## Evidence

**Attempted booking:** Mar 4-7, 2026 (days 63-66)

**Debug results:**
- User's wallet: ✗ No bookings on-chain for 2026
- ALL known wallets scanned: ✗ No bookings for days 63-66
- Database: 4 overlapping bookings, but none have `transactionId` (not on-chain)

**Error:** `execution reverted: BookingFacet: Booking already exists`

## Conclusion

The contract's booking existence check is returning true when it should return false. Either:
1. There's a bug in the existence check logic
2. There's a separate global date mapping that's out of sync
3. Orphaned state data in the contract

## Action Required

Review the `bookAccommodation` function's existence check logic. The check that throws "Booking already exists" is incorrectly detecting a booking that doesn't exist in `getAccommodationBookings` for any wallet.

## Debug Tools

Frontend debug panel added at `/bookings/{id}/checkout` when blockchain errors occur:
- Year status check
- On-chain data for user's wallet
- Scan ALL known wallets for conflicting bookings
- Database overlapping bookings query
