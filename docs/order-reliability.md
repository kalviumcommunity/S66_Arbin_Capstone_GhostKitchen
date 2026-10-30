# Reliable ordering and historical items

## Database setup

Order placement and status changes use MongoDB transactions. Use MongoDB Atlas,
a replica set (including a single-node replica set for local development), or a
sharded cluster. A standalone `mongod` does not support these transactions; the
API returns `503` rather than falling back to partial writes.

The order model creates a unique partial index on `{ userId, idempotencyKey }`.
Order creation waits for model initialization before processing checkout. If
automatic index creation is disabled in your deployment, create this index
before enabling checkout:

```javascript
db.orders.createIndex(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);
```

Existing orders do not need a data migration: the index excludes orders without
a checkout key, and cancellation can restore stock using legacy food IDs.

## Checkout and retries

`POST /api/orders` requires authentication and an `Idempotency-Key` header:

```http
Idempotency-Key: 7b55d758-a039-4b13-b9ad-7451ca482ad6
```

Keys accept 8–128 letters, digits, hyphens, or underscores. Send a new key for an
intentional new order; reuse the same key and order details when retrying a
failed or timed-out request. The key is scoped to the authenticated user.

- First successful request: `201`.
- Replay of the same request: `200` and the original order, without another
  stock decrement, inventory-history entry, or new-order socket event.
- Same key with different checkout details: `409`.
- Invalid IDs, invalid field types, or a missing/invalid key: `400`.
- Unavailable or insufficient stock: `409`, with no partial order or stock changes.

The API accepts the existing `foods` array of repeated food IDs (maximum 500
portions). Item prices and totals are calculated on the server. Client-provided
prices, totals, and snapshots are ignored.

The web client keeps an unresolved checkout key in user-scoped session storage,
reuses it when retrying the same details, and removes it after a successful
response. A synchronous in-flight guard also prevents duplicate submissions.

## Order items

New orders include an immutable `items` snapshot array:

```json
{
  "foodId": "<original food ID>",
  "name": "Pasta",
  "unitPrice": 12.35,
  "quantity": 2,
  "lineTotal": 24.70
}
```

Line totals and the order total are rounded to two decimal places. The original
`foods` references remain for compatibility with reorder, reviews, and analytics.
Order history, tracking, and owner item details use snapshots, so menu edits or
deletions do not rewrite purchase history. Reorder still uses current menu data,
and deleted or unavailable food documents are skipped.

Legacy orders retain their known overall total. Their original unit prices cannot
be reconstructed, so the UI does not substitute current menu prices for those
historical prices.

## Status and cancellation policy

The central policy lives in `server/services/orderPolicy.js`. API responses and
socket events contain role-specific `allowedStatuses`; the UI uses these for
available actions. The server always rechecks the policy inside the transaction.

```text
pending -> preparing -> ready -> completed
   |
   +----> cancelled
```

- Owners can advance an order one stage at a time or cancel a pending order.
- Customers can cancel only their own pending orders using
  `PATCH /api/orders/:id/cancel`.
- Owners can also use the cancellation endpoint, or the existing
  `PATCH /api/orders/:id/status` endpoint with `{ "status": "cancelled" }`.
- Cancellation after preparation starts returns `409`.
- A repeated permitted status request is a safe no-op. Concurrent cancellation
  and preparation requests have only one valid winner.
- Cancellation, stock restoration, inventory history, and the `stockRestoredAt`
  marker commit together. Retrying cancellation cannot restore stock twice.
- Existing food items receive their original quantities back. Deleted menu items
  remain in order snapshots but are not recreated as inventory.
- `DELETE /api/orders/:id` rejects active orders. Terminal orders are archived
  from the owner listing, preserving customer history and checkout-key protection.

Future stage/time cancellation rules should be added to `canCancelOrder`; both
customer and owner action lists use that entry point.

## Verification

Use Node.js 20.19+ (Node.js 22 recommended) for the development test tooling.

```bash
# From server/
npm test

# From client/
npm run lint
npm run build
```

The tests start a disposable single-node MongoDB replica set using
`mongodb-memory-server`; they never read the application's `.env` database URI.
The first run downloads a MongoDB binary and requires network access. Subsequent
runs reuse the cached binary.

Coverage includes concurrent stock contention, duplicate checkout requests,
transaction rollback, cancellation races and retries, authorization, sequential
status transitions, legacy orders, archived-order replay protection, snapshots
after menu changes/deletion, and legacy item rendering.
