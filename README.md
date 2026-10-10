# Ghost Kitchen

Ghost Kitchen is a full-stack cloud kitchen management system for customers and kitchen owners. Customers can browse a live menu, place and track orders, and leave reviews. Owners can manage menu items, orders, inventory, reviews, and business analytics from a protected dashboard.

## Live Applications

- Frontend: https://ghost-kitchen-delta.vercel.app/
- Backend: https://ghost-kitchen-server-nine.vercel.app/

## Features

### Customer

- Customer registration, login, logout, profile access, and Google sign-in support
- Menu browsing with category filters, search, bestsellers, combos, and availability filtering
- Cart management and authenticated checkout
- Order history, order details, reorder, and live order tracking
- Food ratings and reviews, including review editing and helpful votes
- Persisted Light, Dark, and Night themes

### Owner

- Protected owner authentication and role-based route authorization
- Dashboard statistics, revenue trends, order status charts, and top-selling items
- Food management with create, update, delete, pricing, category, and availability controls
- Order management with status updates and deletion
- Inventory quantities, low-stock alerts, stock history, and automatic stock reduction when orders are placed
- Real-time order and inventory notifications through Socket.IO
- Review management and owner responses
- Purchase order, calendar, and messages dashboard areas

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Zustand |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Authentication | JWT, bcryptjs, Google OAuth |
| Real-time updates | Socket.IO |
| Visualization | Chart.js, react-chartjs-2 |
| HTTP client | Axios |
| Deployment | Vercel frontend and deployed backend |

## Repository Structure

```text
.
├── client/                 # React and Vite frontend
│   ├── src/api/            # API clients
│   ├── src/components/     # Shared and owner UI components
│   ├── src/pages/          # Customer and owner pages
│   ├── src/stores/         # Zustand state stores
│   └── src/hooks/          # Socket and application hooks
├── server/                 # Express API and Socket.IO server
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication and role checks
│   ├── models/             # Mongoose models
│   ├── routes/             # API route definitions
│   └── socket/              # Socket.IO authentication and events
├── Endpoints Check/        # Bruno API request collection
├── guidance.md             # Manual validation checklist
├── roadmap.md              # Development roadmap and phase status
└── CHANGES.md              # Detailed project change log
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas or a local MongoDB instance
- A Google OAuth web client ID if Google sign-in is enabled

## Local Development

### 1. Clone and install dependencies

```bash
git clone https://github.com/kalviumcommunity/S66_Arbin_Capstone_GhostKitchen.git
cd S66_Arbin_Capstone_GhostKitchen

cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
OWNER_REGISTRATION_CODE=your_owner_registration_code
OWNER_LOGIN_EMAIL=owner@example.com
OWNER_LOGIN_PASSWORD=change_this_password
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
```

Never commit `.env` files or real credentials. The example files contain placeholders only.

### 3. Start the backend

```bash
cd server
npm run dev
```

The API runs at `http://localhost:5000` by default. The root endpoint returns `API is running...`.

### 4. Start the frontend

In a second terminal:

```bash
cd client
npm run dev
```

The Vite development server runs at `http://localhost:5173` by default.

## Available Scripts

### Client

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

### Server

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API with Node.js |
| `npm test` | Placeholder script; automated tests are not implemented yet |

## API Overview

The API base path is `/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Area | Main endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /auth/me`, `PUT /auth/profile` |
| Foods | `GET /foods`, `GET /foods/category/:category`, `GET /foods/bestsellers`, `GET /foods/combos`, owner CRUD on `/foods` |
| Orders | Customer create/history endpoints and owner list/status/delete endpoints under `/orders` |
| Analytics | Owner dashboard data at `GET /analytics/dashboard` |
| Inventory | Inventory, low-stock, history, and stock update endpoints under `/inventory` |
| Reviews | Food reviews, customer review management, helpful votes, and owner responses under `/reviews` |

The complete request collection is available in `Endpoints Check/` and can be imported into Bruno.

## Implemented vs. Remaining Work

### Implemented

- Foundation, authentication, customer ordering, owner dashboard, inventory, real-time updates, and review/rating phases
- JWT and role-based authorization for customer and owner flows
- MongoDB persistence for users, foods, orders, reviews, and inventory history
- Socket.IO events for order and inventory changes
- Production frontend and backend deployments

### In Progress: Phase 8

- Automated backend unit and integration tests
- Automated frontend tests and a repeatable end-to-end test suite
- Security hardening, including Helmet, input sanitization, rate limiting, and stricter production CORS
- Centralized production error handling, structured logging, and monitoring
- Database indexes, response caching, bundle optimization, and Lighthouse performance audits
- API, deployment, user, and contributor documentation

### Planned Enhancements

- Payment gateway integration
- Email and SMS notifications
- Loyalty programs and coupons
- Multi-location kitchen support
- Delivery tracking with maps
- AI-powered recommendations
- Progressive Web App and mobile applications

See `roadmap.md` for the detailed phase plan and `CHANGES.md` for the implementation history.

## Verification

Run the current frontend checks from `client/`:

```bash
npm run lint
npm run build
```

Run the manual API and UI checklist in `guidance.md`. Bruno requests in `Endpoints Check/` cover authentication, foods, orders, and the root endpoint.

Automated tests are not available yet; running `npm test` from `server/` intentionally reports that status until Phase 8 testing work is completed.

## Contributing

1. Create a focused branch from `main`.
2. Keep secrets in local `.env` files and update the corresponding example file when configuration changes.
3. Run the relevant lint, build, and manual API checks before opening a pull request.
4. Describe user-facing changes, verification performed, and any known limitations in the pull request.

## License

This project currently does not declare an open-source license. Contact the repository maintainers before redistributing it.
