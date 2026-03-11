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
- Backend logs MongoDB connected and server port.
- Frontend opens on `http://localhost:5173`.

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

## 4) Phase 2 auth checks (API)

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
Expected: token + user object, role `customer`.

### Customer login ✅
- `POST /api/auth/login`
- Body:
```json
{
  "email": "testcustomer@example.com",
  "password": "123456"
}
```
Expected: token + user.

### Get profile ✅
- `GET /api/auth/me`
- Header: `Authorization: Bearer <token>`
Expected: current user profile.

### Owner register ✅
- `POST /api/auth/register`
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
Expected: role `owner`. Wrong `ownerCode` should fail.

## 5) Owner route protection checks

Login as owner and customer separately.

- `POST /api/foods`
  - Customer token -> should fail (403)
  - Owner token -> should pass

- `PATCH /api/orders/:id/status`
  - Customer token -> should fail (403)
  - Owner token -> should pass

## 6) Frontend auth checks

- Open `/register`, create customer account, should redirect to menu.
- Open `/login`, login as customer, should redirect to menu.
- Open `/owner/login`, login with owner account, should redirect to owner dashboard.
- Try opening `/owner/dashboard` as customer, should redirect to home.
- Click logout from navbar, protected routes should no longer be accessible.

## 7) If something fails

- Clear local storage key `gk_auth` in browser and try again.
- Confirm backend `.env` values are correct.
- Confirm backend is running before frontend requests.
- Check backend terminal for exact error message.
- Re-test endpoint directly in Postman to isolate frontend/backend issue.

## 8) Current resume point

- Resume from: **Phase 2 testing pass and remaining auth refinements**.
