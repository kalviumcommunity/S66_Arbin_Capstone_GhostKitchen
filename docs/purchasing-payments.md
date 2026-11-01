# Purchasing, ingredient stock, and checkout payments

## Phase scope and dependency

This phase builds on PR #63 (`feat/reliable-orders`) and its transactional order
creation, stock restoration, and historical item snapshots. Until #63 is merged,
the implementation PR targets that branch so its review shows only this phase.

The agreed inventory model is **staff-recorded ingredient usage**. Ingredient
stock and sellable food portions are separate:

- Receive 10 kg of chicken against a supplier purchase order.
- Record 7.5 kg used and 0.75 kg wasted during the week.
- The remaining stock is 1.75 kg. If the threshold is 2 kg, a low-stock alert appears.
- Use remaining stock and the selected period's usage total to plan the next purchase.
- Customer orders continue reducing existing sellable food portions. They do not
  deduct raw ingredients or use recipes in this phase.

### Explicit follow-up phase: cancellation timing and deductions

**This phase automatically requests a full refund for an eligible paid,
pending-order cancellation.** The current pending-only eligibility rule remains.

The user-requested policy of a free-cancellation time window followed by a
deduction is deliberately deferred. The follow-up must define the window, how
it starts, the fixed/percentage deduction and rounding, applicable order stages,
customer disclosure, and refund calculation tests before changing behavior.
Do not infer or configure a deduction amount in this phase.

Automatic recipe deductions are also deferred by agreement. Receipt downloads
are printable HTML, with browser Print → Save as PDF available.

## Database and startup

Use MongoDB Atlas or a replica set. Purchasing receipts, ingredient adjustments,
order cancellation, and captured-payment state changes rely on transactions.
The API starts listening after connection and model/index initialization.

New collections: `suppliers`, `ingredients`, `ingredienthistories`, and
`purchaseorders`. New order fields track payment method/status, reservation
expiry, provider references, refunds, and reconciliation leases. Unique sparse
indexes on provider order and payment IDs prevent cross-order reuse. Existing
orders need no backfill; absent payment fields behave as legacy COD orders.

## Owner purchasing workflow

Open **Purchase Orders → Suppliers** to add, edit, archive, or restore suppliers.
Archiving keeps supplier references and historical names intact.

Open **Inventory → Ingredients & usage** to create ingredients, choose a fixed
stock unit (`kg`, `g`, `l`, `ml`, or `unit`), set opening stock, preferred supplier,
and a low-stock threshold. Quantities support up to three decimal places. An
ingredient's unit is fixed so existing quantities cannot silently change meaning.
For an ingredient tracked in kg, enter `0.5` for 500 g. Changes to remaining stock
go through the adjustment ledger rather than metadata editing.

1. Create a purchase order with an active supplier and one or more ingredient lines.
2. Edit while pending, then **Submit order**.
3. **Receive delivery** with the quantities that actually arrived. Multiple partial
   deliveries are supported; leave undelivered lines blank.
4. The receipt, ingredient stock increments, history entries, and purchase status
   commit atomically. Repeated receiving requests with the same key do not add stock twice.
5. A purchase becomes `received` when every line has arrived. **Cancel remaining**
   closes the outstanding portion of a partially received purchase without removing
   stock already received.

Purchase line names, units, prices, supplier names, and totals are snapshots.
Prices are stored in integer paise; each line total is rounded to the nearest paise.
The CSV export has one row per line, quoted fields, and spreadsheet-formula escaping.

Staff record **usage**, **waste/spoilage**, or signed **corrections** with a note.
Updates cannot take stock below zero. An ingredient with remaining stock or an
open purchase cannot be archived. History retains names/units even after archiving.
Period summaries aggregate the entire selected window, while the history table
shows the most recent 500 entries. Owner lists return up to 1,000 records and the
CSV export up to 10,000 purchase orders.

Low-stock status means remaining quantity is at or below the threshold. It is
shown on the ingredient screen after every refresh; Socket.IO changes refresh
open ingredient screens and notify owners. Refresh remains available when a
Socket.IO connection is unavailable.

## Razorpay test configuration

Fill the placeholders in `server/.env` (also listed in `server/.env.example`):

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_separate_webhook_signing_secret
PAYMENT_CRON_SECRET=your_random_scheduler_bearer_secret
RECEIPT_BUSINESS_NAME=Ghost Kitchen
RECEIPT_BUSINESS_ADDRESS=Your kitchen address
```

Use test-mode keys generated in the Razorpay dashboard. The adapter rejects live
keys in this phase. Online checkout remains disabled until the test key ID,
key secret, and webhook secret are present. COD works without Razorpay credentials.
The browser receives the public key ID at runtime; key secrets remain server-side.

In Razorpay test mode:

1. Configure automatic payment capture. An `authorized` payment alone does not
   enable kitchen fulfillment; the backend requires `captured` status.
2. Set a public HTTPS webhook URL to `POST /api/payments/webhook` on your backend.
   A local tunnel can expose the development backend for test delivery.
3. Set its signing secret to `RAZORPAY_WEBHOOK_SECRET` and subscribe to:
   `payment.captured`, `order.paid`, `payment.failed`, `refund.created`,
   `refund.processed`, and `refund.failed`.
4. Keep the request body unmodified through your reverse proxy. The raw webhook
   route is mounted before JSON parsing and verifies the signature over the raw bytes.

The checkout handler also verifies its signature server-side using the **stored**
gateway order ID, then fetches the payment to check capture status, amount,
currency, and binding to the local order. Browser-supplied amounts/statuses are ignored.

### Cash on delivery

COD orders start unpaid and can progress through fulfillment. In owner order
details, **Record cash collected** becomes available for ready/completed COD
orders. Recording collection is idempotent and enables the payment receipt.
Only an owner can record cash; unpaid COD is not counted as collected revenue.

## Reservations, recovery, and refunds

Online checkout reserves food portions for 15 minutes. Unpaid online orders cannot
enter preparation. Closing the payment modal leaves the same local order available
for payment retry or cancellation in **My Orders**, rather than creating another
order. A provider attempt failure does not cancel the order because checkout can retry.

At the deadline the reservation becomes eligible for expiry. Scheduled maintenance,
order-list/detail requests, and new checkouts release expired unpaid reservations.
Expiry and paid confirmation recheck state transactionally. A payment captured
after expiry or cancellation is recorded and routed to a full refund, never
fulfilled using stock that has already been returned.

Payment initialization uses a lease and a stable Razorpay receipt to recover a
gateway order after an uncertain network response. Captured callbacks, duplicate
webhooks, and reconciliation use the same payment identity and do not decrement
stock again. Provider order/payment IDs are unique per local order.

Paid pending cancellation restores stock and persists refund intent in the same
transaction. The external refund is requested after commit. Refund processing can
be asynchronous: `refund_pending` means requested/pending, not that funds have
already reached the customer. The application reports `refunded` only after the
provider reports `processed`.

Refund requests use a stable per-attempt receipt and a lease. On uncertain provider
responses, reconciliation fetches existing refunds before attempting another
request. A definitively failed refund can be retried with a new attempt receipt.
Owner details expose refund state, provider reference, error, and retry/reconcile
actions. Automatic maintenance also retries unresolved refunds. An unrelated
partial refund made outside the app requires operator reconciliation rather than
blindly sending another full refund.

### Scheduled maintenance is required for unattended operation

Configure an external scheduler to call the following every minute (or an interval
appropriate to your deployment):

```http
GET /api/payments/maintenance
Authorization: Bearer <PAYMENT_CRON_SECRET>
```

Each run expires up to 50 reservations and considers up to 25 payment/refund
reconciliation candidates, with an approximately 20-second loop budget. A provider
call already in progress may finish after that budget. Candidates are rotated by
last reconciliation time, so repeat runs drain larger backlogs. Configure backend
request duration accordingly. No in-process timer is relied on in serverless hosting.

Owners can also run **Reconcile payments & expired checkouts** from the Orders
page (`POST /api/payments/maintenance`) or check one order. Customer status checks
can recover a missing payment callback. Webhooks remain the primary notification
path; maintenance provides recovery for missed deliveries and abandoned checkouts.

## Receipts and revenue

Customers can download their own paid/refunding/refunded order receipts; owners
can download any such receipt from order details. The protected endpoint returns
an HTML attachment using original order-item snapshots, payment references, and
refund state. Customer-provided text is escaped. Use browser Print → Save as PDF
for a PDF copy. The receipt is a payment record, not a GST tax invoice.

Dashboard revenue/sales trends include paid non-cancelled orders and completed
legacy orders from before payment tracking. Unpaid online/COD orders and cancelled
sales are excluded from recognized revenue.

## API overview

All procurement endpoints are owner-only under `/api/procurement`:

| Endpoint | Purpose |
| --- | --- |
| `GET/POST /suppliers`, `PUT/DELETE /suppliers/:id` | Supplier directory and archiving |
| `GET/POST /ingredients`, `PUT/DELETE /ingredients/:id` | Ingredient metadata and opening stock |
| `GET /ingredients/history?days=7` | Stock ledger (optional `ingredientId`) |
| `GET /ingredients/summary?days=7` | Period usage/waste totals |
| `POST /ingredients/:id/adjustments` | Staff usage/waste/correction; `Idempotency-Key` required |
| `GET/POST /purchase-orders`, `PUT /purchase-orders/:id` | Persistent purchase orders |
| `PATCH /purchase-orders/:id/status` | Submit or cancel remaining quantities |
| `POST /purchase-orders/:id/receive` | Atomic partial/full receipt; `Idempotency-Key` required |
| `GET /purchase-orders/export` | CSV download |

Payment endpoints are under `/api/payments`:

| Endpoint | Access / purpose |
| --- | --- |
| `GET /config` | Public payment-method availability |
| `POST /:id/start`, `POST /:id/verify`, `POST /:id/reconcile` | Customer's own order or owner |
| `POST /:id/refund` | Owner cancellation refund retry/reconciliation |
| `POST /:id/collect-cash` | Owner cash collection |
| `GET /:id/receipt` | Customer's own receipt or owner |
| `POST /webhook` | Raw-body Razorpay signature authentication |
| `GET /maintenance` | Scheduler bearer authentication |
| `POST /maintenance` | Owner authentication |

Order creation accepts `paymentMethod: "cod" | "razorpay"` (default `cod`).
Existing checkout idempotency and cancellation endpoints remain in use.

## Verification

From `server/`, run `npm test`. Tests use disposable MongoDB replica sets and
an injected Razorpay test double; no actual gateway charge/refund is performed.
The real HTTP adapter is separately checked with mocked HTTP responses.
From `client/`, run `npm run lint` and `npm run build`.

Because keys are to be supplied later, a real Razorpay test-mode checkout,
webhook delivery through the deployed endpoint, and an actual test-mode refund
must be verified after credentials and the scheduler are configured.
