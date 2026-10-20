<p align="center">
  <img src="client/public/ghost-kitchen-logo.jpeg" alt="Ghost Kitchen logo" width="96" />
</p>

<h1 align="center">Ghost Kitchen</h1>

<p align="center">
  A real-time cloud kitchen management platform for customers and kitchen owners.
</p>

<p align="center">
  <a href="https://ghost-kitchen-delta.vercel.app/">Live Frontend</a>
  &nbsp;&bull;&nbsp;
  <a href="https://ghost-kitchen-server-nine.vercel.app/">Live API</a>
</p>

## What is Ghost Kitchen?

Ghost Kitchen is a full-stack application that brings customer ordering and kitchen operations into one platform. Customers can browse available food, place orders, track them in real time, and leave feedback. Kitchen owners can manage food items, orders, inventory, reviews, and analytics from a protected dashboard.

## Why Ghost Kitchen?

Cloud kitchens need more than a menu and an order form. Ghost Kitchen is designed to provide:

- **A better customer experience** with menu discovery, checkout, order history, reorder, and live order tracking.
- **Operational visibility** through owner dashboards, sales analytics, order status tracking, and inventory history.
- **Real-time coordination** with Socket.IO events for new orders, order updates, and inventory changes.
- **Controlled access** with JWT authentication and role-based customer and owner authorization.
- **Actionable feedback** through food ratings, customer reviews, helpful votes, and owner responses.

## Features

### Customer Experience

- Customer registration, login, logout, profile access, and Google sign-in support
- Menu search, categories, bestsellers, combos, and availability filtering
- Cart management and authenticated checkout
- Order history, order details, reorder, and live order tracking
- Food ratings and reviews with editing and helpful votes
- Persisted Light, Dark, and Night themes

### Owner Operations

- Protected owner login and role-based dashboard access
- Dashboard statistics, revenue trends, order status charts, and top-selling items
- Food CRUD with pricing, category, stock, and availability controls
- Order listing, status updates, and deletion
- Inventory quantities, low-stock alerts, stock history, and automatic stock reduction
- Real-time order and inventory notifications
- Review management and owner responses
- Owner workspace areas for messages, calendar, and purchase orders

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Zustand |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas or MongoDB |
| Authentication | JWT, bcryptjs, Google OAuth |
| Real-time updates | Socket.IO |
| Visualization | Chart.js, react-chartjs-2 |
| HTTP client | Axios |
| API testing | Bruno |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB instance
- A Google OAuth web client ID if Google sign-in is enabled

### Clone and install

```bash
git clone https://github.com/kalviumcommunity/S66_Arbin_Capstone_GhostKitchen.git
cd S66_Arbin_Capstone_GhostKitchen

cd server
npm install

cd ../client
npm install
```

### Configure environment variables

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

Keep real credentials in local `.env` files. Never commit secrets. The repository provides `.env.example` files for reference.

### Start the application

Start the backend in one terminal:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:5000](http://localhost:5000) by default.

## Available Scripts

### Client scripts

Run these commands from `client/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

### Server scripts

Run these commands from `server/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API with Node.js |
| `npm test` | Placeholder until automated server tests are added |

## API Overview

The API base path is `/api`. Protected endpoints require an `Authorization: Bearer <token>` header.

| Area | Main endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /auth/me`, `PUT /auth/profile` |
| Foods | `GET /foods`, category, bestseller, combo, and owner CRUD endpoints |
| Orders | Customer create/history endpoints and owner list/status/delete endpoints under `/orders` |
| Analytics | Owner dashboard data at `GET /analytics/dashboard` |
| Inventory | Inventory, low-stock, history, and stock update endpoints under `/inventory` |
| Reviews | Food reviews, customer review management, helpful votes, and owner responses under `/reviews` |

The Bruno request collection is available in `Endpoints Check/`.

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
│   └── socket/             # Socket.IO authentication and events
├── Endpoints Check/        # Bruno API request collection
├── guidance.md             # Manual validation checklist
├── roadmap.md              # Development roadmap
└── CHANGES.md              # Detailed implementation history
```

## Project Status

### Implemented

- Foundation, authentication, customer ordering, owner dashboard, inventory, real-time updates, and review/rating phases
- JWT and role-based authorization for customer and owner flows
- MongoDB persistence for users, foods, orders, reviews, and inventory history
- Socket.IO events for order and inventory changes
- Deployed frontend and backend applications

### In Progress: Phase 8

- Automated backend unit and integration tests
- Automated frontend and end-to-end tests
- Security hardening, including Helmet, input sanitization, rate limiting, and stricter production CORS
- Centralized error handling, structured logging, and monitoring
- Database indexes, response caching, bundle optimization, and Lighthouse audits
- Complete API, deployment, user, and contributor documentation

### Planned Enhancements

- Payment gateway integration
- Email and SMS notifications
- Loyalty programs and coupons
- Multi-location kitchen support
- Delivery tracking with maps
- AI-powered recommendations
- Progressive Web App and mobile applications

See [`roadmap.md`](roadmap.md) for the detailed phase plan and [`CHANGES.md`](CHANGES.md) for the implementation history.

## Verification

Run the frontend checks from `client/`:

```bash
npm run lint
npm run build
```

Use [`guidance.md`](guidance.md) for the manual API and UI checklist. Bruno requests in `Endpoints Check/` cover authentication, foods, orders, and the root endpoint.

Automated tests are not available yet. Running `npm test` from `server/` intentionally reports that status until Phase 8 testing work is completed.

## Contributing

1. Create a focused branch from the latest `main` branch.
2. Keep secrets in local `.env` files and update the matching example file when configuration changes.
3. Run the relevant lint, build, and manual API checks before opening a pull request.
4. Describe the change, verification performed, and known limitations in the pull request.

## License

This project does not currently declare an open-source license. Contact the repository maintainers before redistributing it.
