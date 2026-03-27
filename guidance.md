# Ghost Kitchen Manual Guidance

Use this checklist to verify everything works after recent changes.

## 1) Start servers ✅

- Backend: ✅
  - `cd server`
  - `npm run dev`
- Frontend: ✅
  - `cd client`
  - `npm run dev`

Expected: ✅
- Backend logs MongoDB connected and server port. ✅
- Frontend opens on `http://localhost:5173`. ✅

## 2) Check environment files ✅

- Ensure `server/.env` includes:
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `FRONTEND_URL=http://localhost:5173`
  - `OWNER_REGISTRATION_CODE=...` (needed for owner registration)

## 3) Phase 1 backend sanity checks ✅

Use Postman/Bruno: ✅
- `GET /api/foods` should return list. ✅
- `GET /api/orders` without token should return unauthorized. ✅

## 4) Phase 2 auth checks (API) ✅

### Customer register ✅
- `POST /api/auth/register` ✅
- Body:
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
- Body:
```json
{
  "email": "testcustomer@example.com",
  "password": "123456"
}
```
Expected: token + user. ✅

### Get profile ✅
- `GET /api/auth/me` ✅
- Header: `Authorization: Bearer <token>`
Expected: current user profile. ✅

### Owner register ✅
- `POST /api/auth/register` ✅
- Body:
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
- ii. Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- iii. Body (JSON):
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
- ii. Headers: `Authorization: Bearer <token>`, `Content-Type: application/json` 
- iii. Body (JSON):
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

- Resume from: **Owner route protection re-check with full URL + headers + body format**.

## 9) Phase 3 validation checklist

### Cart and checkout flow
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

### Customer order APIs
- i. CRUD + URL: `POST http://localhost:5000/api/orders` ✅
- ii. Headers: `Authorization: Bearer <customer_token>`, `Content-Type: application/json` ✅
- iii. Body (JSON):
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
