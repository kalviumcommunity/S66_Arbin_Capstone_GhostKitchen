# Ghost Kitchen Manual Guidance

Use this checklist to verify everything works after recent changes.

## 1) Start servers ✅

- Backend: ✅
  - `cd server` ✅
  - `npm run dev` ✅
- Frontend: ✅
  - `cd client` ✅
  - `npm run dev` ✅

Expected: ✅
- Backend logs MongoDB connected and server port. ✅
- Frontend opens on `http://localhost:5173`. ✅

## 2) Check environment files ✅

- Ensure `server/.env` includes: ✅
  - `PORT` ✅
  - `MONGO_URI` ✅
  - `JWT_SECRET` ✅
  - `FRONTEND_URL=http://localhost:5173` ✅
  - `OWNER_REGISTRATION_CODE=...` (needed for owner registration) ✅

## 3) Phase 1 backend sanity checks ✅

Use Postman/Bruno: ✅
- `GET /api/foods` should return list. ✅
- `GET /api/orders` without token should return unauthorized. ✅

## 4) Phase 2 auth checks (API) ✅

### Customer register ✅
- `POST /api/auth/register` ✅
- Body: ✅
```json
{
  "username": "testcustomer",
  "email": "testcustomer@example.com",
  "password": "123456",
  "phone": "9999999999",
  "address": "Test Address"
}
```
Expected: token + user object, role `customer`. ✅

### Customer login ✅
- `POST /api/auth/login` ✅
- Body: ✅
```json
{
  "email": "testcustomer@example.com",
  "password": "123456"
}
```
Expected: token + user. ✅

### Get profile ✅
- `GET /api/auth/me` ✅
- Header: `Authorization: Bearer <token>` ✅
Expected: current user profile. ✅

### Owner register ✅
- `POST /api/auth/register` ✅
- Body: ✅
```json
{
  "username": "owner1",
  "email": "owner1@example.com",
  "password": "123456",
  "role": "owner",
  "ownerCode": "<OWNER_REGISTRATION_CODE>"
}
```
Expected: role `owner`. Wrong `ownerCode` should fail. ✅

## 5) Owner route protection checks ✅

### Add food (owner only) ✅
- i. CRUD + URL: `POST http://localhost:5000/api/foods` ✅
- ii. Headers: `Authorization: Bearer <token>`, `Content-Type: application/json` ✅
- iii. Body (JSON): ✅
```json
{
  "name": "Paneer Tikka",
  "category": "veg",
  "price": 150,
  "type": "main",
  "isBestSeller": false
}
```
- iv. Expected: customer token -> `403 Forbidden`, owner token -> success ✅

### Update order status (owner only) ✅
- i. CRUD + URL: `PATCH http://localhost:5000/api/orders/:id/status` ✅
- ii. Headers: `Authorization: Bearer <token>`, `Content-Type: application/json` ✅
- iii. Body (JSON): ✅
```json
{
  "status": "preparing"
}
```
- iv. Expected: 
- customer token: `401 Unauthorized`-> if no user found ✅, `403 Forbidden` -> if user found but role doesn't match ✅
-  owner token -> success ✅

## 6) Frontend auth checks

### Customer register ✅
- i. CRUD + URL: `GET http://localhost:5173/register` ✅
- ii. Fields: form inputs `username`, `email`, `password`, `phone`, `address` ✅
- iii. Body: N/A (form submit) ✅
- iv. Expected: redirect to menu ✅

### Customer login ✅
- i. CRUD + URL: `GET http://localhost:5173/login` ✅
- ii. Fields: form inputs `email`, `password` ✅
- iii. Body: N/A (form submit) ✅
- iv. Expected: redirect to menu ✅

### Owner login
- i. CRUD + URL: `GET http://localhost:5173/owner/login` ✅
- ii. Fields: form inputs `email`, `password` ✅
<!--- iii. Body: N/A (form submit)-->
- iv. Expected: redirect to owner dashboard ✅

### Owner dashboard protection
- i. CRUD + URL: `GET http://localhost:5173/owner/dashboard` ✅
- ii. Headers: N/A
- iii. Body: N/A
- iv. Expected: customer user redirects to home ✅

### Logout check ✅
- i. CRUD + URL: `GET http://localhost:5173/` (after logout) ✅
- ii. Headers: N/A ✅
- iii. Body: N/A ✅
- iv. Expected: protected routes not accessible ✅

## 7) If something fails

- Clear local storage key `gk_auth` and test again. ✅
- Confirm backend `.env` has correct `PORT`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`. ✅
- Confirm backend is running at `http://localhost:5000` before frontend testing. ✅
- Re-test API directly in Postman with: ✅
  - URL: `http://localhost:5000/api/...` ✅
  - Header: `Authorization: Bearer <token>` ✅
  - Header: `Content-Type: application/json` ✅

## 8) Current resume point

- Resume from: **Phase 6 real-time updates validation and notification flow checks**.

## 9) Phase 3 validation checklist

### Cart and checkout flow ✅
- Route: `GET http://localhost:5173/menu` ✅
- Action: click `Add` on one or more food cards ✅
- Expected: cart count in navbar increases ✅

- Route: `GET http://localhost:5173/cart` ✅
- Action: verify item list, quantity `+/-`, remove, total ✅
- Expected: totals update correctly ✅

- Route: `GET http://localhost:5173/checkout` ✅
- Header requirement: user must be logged in (customer or owner) ✅
- Body source: form fields `customerName`, `phone`, `address` + cart items ✅
- Expected: place order succeeds, redirect to `http://localhost:5173/order-success` ✅

### Customer order APIs ✅
- i. CRUD + URL: `POST http://localhost:5000/api/orders` ✅
- ii. Headers: `Authorization: Bearer <customer_token>`, `Content-Type: application/json` ✅
- iii. Body (JSON): ✅
```json
{
  "customerName": "Test Customer",
  "foods": ["<FOOD_ID_1>", "<FOOD_ID_2>"],
  "phone": "9999999999",
  "address": "Test Address"
}
```
- iv. Expected: `201 Created` with order object, `userId` equals logged-in user ✅

- i. CRUD + URL: `GET http://localhost:5000/api/orders/me` ✅
- ii. Headers: `Authorization: Bearer <customer_token>` ✅
- iii. Body: N/A
- iv. Expected: only that customer's orders ✅

- i. CRUD + URL: `GET http://localhost:5000/api/orders/me/:id` ✅
- ii. Headers: `Authorization: Bearer <customer_token>` ✅
- iii. Body: N/A
- iv. Expected: selected order if owned by customer, otherwise `404` ✅

### My Orders and reorder ✅
- Route: `GET http://localhost:5173/my-orders` ✅
- Action: verify status badge, items, total, date  
- Expected: order list loads from `/api/orders/me` ✅

- Route: `GET http://localhost:5173/my-orders` ✅
- Action: click `Reorder` ✅
- Expected: items are added back to cart ✅

## 10) Phase 4 owner dashboard checks ✅

Run API checks in Postman/Bruno and UI checks in browser. ✅

### 10.1 Prerequisites ✅
- Backend: `http://localhost:5000` is running. ✅
- Frontend: `http://localhost:5173` is running. ✅
- Use an owner account and keep `Authorization: Bearer <owner_token>` ready for API calls. ✅

### 10.2 Dashboard analytics ✅
- Where: Postman/Bruno
- Request: `GET http://localhost:5000/api/analytics/dashboard` ✅
- Headers: `Authorization: Bearer <owner_token>` ✅
- Body: N/A
- Expected: response contains `stats`, `salesByStatus`, `latestOrders`. ✅

- Where: Browser
- Page: `http://localhost:5173/owner/dashboard` ✅
- Expected: stat cards, status summary, latest orders are visible. ✅

### 10.3 Owner foods management ✅
- Where: Browser
- Page: `http://localhost:5173/owner/foods` ✅
- Expected: foods table with `Add`, `Edit`, `Delete` actions. ✅

- Where: Postman/Bruno (Create)
- Request: `POST http://localhost:5000/api/foods` ✅
- Headers: `Authorization: Bearer <owner_token>`, `Content-Type: application/json` ✅
- Body: ✅
```json
{
  "name": "Double Spicy Veg Manchurian",
  "category": "veg",
  "type": "main",
  "price": 140,
  "isBestSeller": true
}
```
- Expected: `201 Created`; new item appears in owner foods page. ✅

- Where: Postman/Bruno (Update)
- Request: `PUT http://localhost:5000/api/foods/:id` ✅
- Headers: `Authorization: Bearer <owner_token>`, `Content-Type: application/json` ✅
- Body: ✅
```json
{
  "name": "Veg Manchurian Dry",
  "price": 150,
  "type": "main"
}
```
- Expected: updated values appear in owner foods page. ✅

- Where: Postman/Bruno (Delete) ✅
- Request: `DELETE http://localhost:5000/api/foods/:id` ✅
- Headers: `Authorization: Bearer <owner_token>` ✅
- Body: N/A
- Expected: success response and item removed from foods page. ✅

### 10.4 Owner orders management
- Where: Browser ✅
- Page: `http://localhost:5173/owner/orders` ✅
- Expected: orders table with a status dropdown for each order. ✅

- Where: Postman/Bruno
- Request: `PATCH http://localhost:5000/api/orders/:id/status` 
- Headers: `Authorization: Bearer <owner_token>`, `Content-Type: application/json`
- Body:
```json
{
  "status": "ready"
}
```
- Expected: status updates successfully and reflects in owner orders page.

## 11) Role-based entry flow checks

### 11.1 Pre-login landing ✅
- Where: Browser
- Page: `http://localhost:5173/` ✅
- Expected: title `Welcome to Ghost Kitchen` and two role boxes: `Customer`, `Owner` (with profile icons). ✅

### 11.2 Customer entry and auth ✅
- Where: Browser 
- Page: `http://localhost:5173/customer` ✅
- Expected: both customer actions are visible: `Login`, `Register`. ✅

- Where: Postman/Bruno (or frontend form)
- Request: `POST http://localhost:5000/api/auth/login` ✅
- Headers: `Content-Type: application/json` ✅
- Body: ✅
```json
{
  "email": "testcustomer12345@example.com",
  "password": "123456789876543456"
}
```
- Expected: successful login; frontend redirects customer to menu/ordering flow. ✅

### 11.3 Owner fixed-credential auth ✅
- Where: Config check
- File: `server/.env` ✅
- Required keys: `OWNER_LOGIN_EMAIL`, `OWNER_LOGIN_PASSWORD` ✅

- Where: Postman/Bruno (or owner login form)
- Request: `POST http://localhost:5000/api/auth/login` ✅
- Headers: `Content-Type: application/json` ✅
- Body: ✅
```json
{
  "email": "<OWNER_LOGIN_EMAIL>",
  "password": "<OWNER_LOGIN_PASSWORD>"
}
```
- Expected: only valid fixed owner credentials are accepted; success redirects to `http://localhost:5173/owner/dashboard`. ✅

### 11.4 Post-login visibility rules ✅
- Where: Browser (after login as customer or owner) ✅
- Expected:
  - landing role selection should not be shown as an option, ✅
  - customer `Login/Register` options should not be visible, ✅
  - only role-relevant navigation should be visible. ✅

- Where: Browser (after logout) ✅
- Expected: landing role selection and customer auth options become visible again. ✅

## 12) Phase 5 inventory checks ✅

### 12.1 Owner inventory APIs ✅
- i. CRUD + URL: `GET http://localhost:5000/api/inventory` ✅
- ii. Headers: `Authorization: Bearer <owner_token>` ✅
- iii. Body: N/A
- iv. Expected: returns foods with inventory fields (`stockQuantity`, `lowStockThreshold`, `unit`, `isAvailable`). ✅

- i. CRUD + URL: `GET http://localhost:5000/api/inventory/low-stock` ✅
- ii. Headers: `Authorization: Bearer <owner_token>` ✅
- iii. Body: N/A
- iv. Expected: returns only low stock foods (`stockQuantity <= lowStockThreshold`). ✅

- i. CRUD + URL: `GET http://localhost:5000/api/inventory/history?limit=100` ✅
- ii. Headers: `Authorization: Bearer <owner_token>` ✅
- iii. Body: N/A
- iv. Expected: returns latest stock change records with `changeType`, `previousStock`, `quantityChange`, `newStock`. ✅

- i. CRUD + URL: `PATCH http://localhost:5000/api/inventory/:foodId/stock` ✅
- ii. Headers: `Authorization: Bearer <owner_token>`, `Content-Type: application/json` ✅
- iii. Body (JSON): ✅
```json
{
  "stockQuantity": 25,
  "note": "manual refill"
}
```
- iv. Expected: food stock updates, `isAvailable` auto-updates, and new history entry is created. ✅

### 12.2 Owner inventory UI ✅
- Where: Browser
- Page: `http://localhost:5173/owner/inventory` ✅
- Expected: ✅
  - low stock alert chips are visible, ✅
  - stock table loads with editable stock inputs, ✅
  - save action updates stock and recent history section. ✅

### 12.3 Food create/update with inventory fields ✅
- Where: Browser
- Page: `http://localhost:5173/owner/foods` ✅
- Action: open Add/Edit food modal ✅
- Expected: form includes `stockQuantity`, `lowStockThreshold`, `unit`, `isAvailable`. ✅

### 12.4 Order placement stock deduction ✅
- Where: Postman/Bruno
- Request: `POST http://localhost:5000/api/orders` ✅
- Headers: `Authorization: Bearer <customer_token>`, `Content-Type: application/json` ✅
- Body: ✅
```json
{
  "customerName": "Stock Test",
  "foods": ["<FOOD_ID>", "<FOOD_ID>"],
  "phone": "9999999999",
  "address": "Inventory Lane"
}
```
- Expected: stock decreases by ordered quantity; history records `changeType: order_placed`. ✅

### 12.5 Out-of-stock visibility rules ✅
- Where: Browser
- Page: `http://localhost:5173/menu` ✅
- Expected: foods with `isAvailable=false` or `stockQuantity=0` are hidden from customer menu listing. ✅

## 13) Phase 6 real-time update checks ✅

### 13.1 Before you test (must pass first) ✅
- Backend URL: `http://localhost:5000` ✅
- Frontend URL: `http://localhost:5173` ✅
- Login in two sessions:
  - Session A = Owner account ✅
  - Session B = Customer account ✅
- If `Live` badge stays offline:
  - clear local storage key `gk_auth`,
  - login again,
  - hard refresh frontend.

### 13.2 Live socket connection check ✅
- Where: Browser (owner or customer) ✅
- Action: ✅
  - login, ✅
  - open any protected page, ✅
  - open DevTools console. ✅
- Expected: ✅
  - no repeating `WebSocket ... failed` errors, ✅
  - navbar badge changes to `Live`, ✅
  - on logout badge changes from `Live` to `Offline`. ✅

### 13.3 New order real-time check (customer -> owner) ✅
- Session A (Owner): open `http://localhost:5173/owner/orders` ✅
- Session B (Customer): place an order from checkout or call `POST http://localhost:5000/api/orders` ✅
- Expected on Session A: ✅
  - new order appears without page refresh, ✅
  - toast appears for new order, ✅
  - `Alerts` unread badge increases. ✅

### 13.4 Order status real-time check (owner -> customer) ✅
- Session A (Customer): open `http://localhost:5173/my-orders` ✅
- Session B (Owner): open `http://localhost:5173/owner/orders` ✅
- Session B action: update one order status (`pending` -> `preparing` -> `ready`) ✅
- Expected on Session A: ✅
  - status updates automatically, ✅
  - toast appears for status update, ✅
  - unread alerts count increases. ✅

### 13.5 Inventory real-time check ✅
- Session A (Owner): open `http://localhost:5173/owner/inventory` ✅
- Session B action option 1: place a customer order ✅
- Session B action option 2: update stock using owner inventory page ✅
- Expected on Session A: ✅
  - inventory list refreshes automatically, ✅
  - low stock chips update, ✅
  - inventory toast appears. ✅

### 13.6 Alerts control check ✅
- Where: Any logged-in session ✅
- Action: click `Alerts` in navbar ✅
- Expected: ✅
  - unread badge resets to 0, ✅
  - new future events increase unread count again, ✅
  - toasts still appear for new events. ✅

### 13.7 If real-time check fails ✅
- Confirm backend is running on port `5000`. ✅
- Confirm frontend `VITE_API_URL` points to backend base API (example: `http://localhost:5000/api`). ✅
- Confirm token is fresh (login again to get new JWT). ✅
- Confirm user role is correct for page being tested (`owner` for owner pages). ✅
- Re-run tests in this order: 13.2 -> 13.3 -> 13.4 -> 13.5. ✅

## 14) Phase 7: Review and rating checks

Complete the checks below in order. Use a customer account for customer actions and an owner account for owner actions.

### 14.1 Prepare the test data and tokens

1. Start both servers as described in section 1.
2. Log in as a customer through `http://localhost:5173/login`. Copy the JWT from the login response or browser storage and call it `CUSTOMER_TOKEN`.
3. Log in as an owner through `http://localhost:5173/owner/login`. Copy the JWT and call it `OWNER_TOKEN`.
4. Use a completed customer order that contains the food item you want to review. You will need the IDs of that food, the completed order, and the review created during the next step.
5. In every protected API request, replace `<TOKEN>` with the correct token. For example:
   `Authorization: Bearer eyJhbGciOi...`
6. Replace every placeholder such as `<FOOD_ID>` with a real MongoDB ObjectId. Do not send the angle brackets or the placeholder text.

Use these headers for requests that include JSON:
```text
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### 14.2 Create a review as a customer

In Postman or Bruno, create a `POST` request to `http://localhost:5000/api/reviews`. Add the customer token and JSON content type, then enter this body after replacing both IDs:

```json
{
  "foodId": "671234567890abcdef123456",
  "orderId": "671234567890abcdef654321",
  "rating": 5,
  "comment": "The food was fresh, hot, and tasty."
}
```

The IDs above are examples only. Use IDs from your own database. A successful request returns `201 Created` and a review object. Save its `_id` as `<REVIEW_ID>` for the next checks.

Verify these validation cases as well:
- Sending the same food and order again returns `409 Conflict` because one customer can review a food only once per order.
- Using an order that is not `completed` returns `400 Bad Request`.
- Using a food that is not included in the order returns `400 Bad Request`.

### 14.3 Read reviews and rating statistics

These two food endpoints are public, so they do not require an authorization header. Replace `<FOOD_ID>` with the same food ID used in section 14.2:

- `GET http://localhost:5000/api/reviews/food/<FOOD_ID>` returns the reviews for that food.
- `GET http://localhost:5000/api/reviews/food/<FOOD_ID>/stats` returns `averageRating`, `totalReviews`, and counts for ratings `1` through `5`.

The customer reviews endpoint requires the customer token:

- `GET http://localhost:5000/api/reviews/me` with `Authorization: Bearer <CUSTOMER_TOKEN>` returns only reviews written by that customer.

### 14.4 Mark and unmark a review as helpful

Send a `PATCH` request to `http://localhost:5000/api/reviews/<REVIEW_ID>/helpful` with a customer or owner token. Do not add a request body.

The first request should increase `helpful` by one and return `isHelpfulByMe: true`. Send the same request again with the same token. The count should decrease by one and the response should return `isHelpfulByMe: false`.

### 14.5 Respond to a review as an owner

Send a `PATCH` request to `http://localhost:5000/api/reviews/<REVIEW_ID>/respond` using `Authorization: Bearer <OWNER_TOKEN>` and `Content-Type: application/json`.

Enter this example body:
```json
{
  "message": "Thank you for your feedback. We are glad you enjoyed your meal."
}
```

The response should include the message under `ownerResponse.message` and a date under `ownerResponse.respondedAt`. A customer token must be rejected for this endpoint.

### 14.6 Verify the customer pages

1. Open `http://localhost:5173/my-orders` as the customer.
2. Find a completed order and click `Write Review`.
3. Select the completed order, select one food from that order, choose a rating from 1 to 5 stars, and enter a comment such as `Good portion and excellent taste.`
4. Click `Submit Review`. The review should be saved successfully.
5. Open `http://localhost:5173/my-reviews`. The new review should show its food, stars, comment, helpful count, and any owner response.
6. Open `http://localhost:5173/menu`. Food cards should show their average star rating and review count.

### 14.7 Verify the owner review page

1. Open `http://localhost:5173/owner/reviews` as the owner.
2. Select the food that was reviewed.
3. Confirm that the customer review appears.
4. Type a response such as `We appreciate your feedback and hope to serve you again.`
5. Click `Send Response`. The saved response should appear on the review card.

### 14.8 Confirm rating aggregation

Send `GET http://localhost:5000/api/foods`. For a food with reviews, confirm that the response includes:

- `averageRating`: the average score rounded to one decimal place.
- `totalReviews`: the number of reviews for that food.
- `ratingDistribution`: an object with keys `1`, `2`, `3`, `4`, and `5` and the count for each score.

### 14.9 Troubleshooting

- Confirm the backend is running on port `5000` and the frontend is running on port `5173`.
- Confirm that each ID is a real 24-character MongoDB ObjectId copied from an API response.
- Log in again if a token is expired or returns `401 Unauthorized`.
- Use the customer token to create or view personal reviews and the owner token to respond.
- Confirm that the order belongs to the logged-in customer and its status is exactly `completed`.
- Repeat the checks in this order: 14.2, 14.3, 14.4, 14.5, 14.6, and 14.7.
