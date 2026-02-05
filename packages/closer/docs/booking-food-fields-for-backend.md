# Booking food fields: frontend usage (for backend calculations)

Brief note so backend can align food-related calculations with the UI.

## Fields

- **`foodOption`** – Intent: `'food_package'` = guest has a food package, `'no_food'` = no food, `'default'` = use  default (let guest select)
- **`foodOptionId`** – When `foodOption === 'food_package'`, this is the selected food package document `_id`. When `foodOption === 'no_food'` or no selection, frontend sends `null`.
- **`foodFiat`** – Total fiat amount for food on the booking. Shape: `{ val: number, cur: string }` (e.g. EUR). Used in totals and display only; frontend does not compute it.

## Where the frontend sends these

1. **POST `/bookings/request`** (create booking)  
   - For **event** bookings we send `foodOption` and `foodOptionId` from the event when present:  
     `foodOption: event.foodOption`, `foodOptionId: event.foodOption === 'food_package' ? event.foodOptionId : null`.  
   - For **non-event** bookings we send a single `foodOption` (no `foodOptionId`) when no event is involved.
2. **POST `/bookings/:id/update-food`** (food step)  
   - Body: `{ foodOption: 'food_package' | 'no_food', foodOptionId: string | null }`.  
   - `foodOptionId` is the chosen package `_id`, or `null` when the user selects no food.

## What the frontend expects from the backend

- **Booking response** should include:
  - `foodOption`, `foodOptionId` (so we know selection and can show the right package).
  - **`foodFiat`**: `{ val, cur }` for the **total** food amount for the stay (e.g. `price × adults × nights` or your rule). Frontend adds `booking.foodFiat.val` into the displayed total when `foodOptionEnabled !== false` and does not recalculate it; backend is the source of truth for `foodFiat`.

## Summary for backend calculations

- **`foodOption`** = whether the booking has food (`'food_package'`) or not (`'no_food'` / `'default'` as per event).
- **`foodOptionId`** = which package is selected (required when `foodOption === 'food_package'`); use it to resolve package and pricing.
- **`foodFiat`** = total food price for the booking in fiat; backend should set this whenever the booking has a food selection (and optionally when there is no food, e.g. `{ val: 0, cur: 'EUR' }`), so the frontend total (rental + utility + food + event) is correct without any extra frontend calculation.
