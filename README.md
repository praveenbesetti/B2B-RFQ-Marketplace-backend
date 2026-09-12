# Mini B2B RFQ Marketplace

A focused buyer and supplier marketplace for requesting products or services, collecting competitive quotations, and reviewing submitted offers.

See [RFQ_WORKFLOW.md](RFQ_WORKFLOW.md) for the complete buyer/supplier workflow and lifecycle rules.

## Technology

- Backend: Node.js, Express, ES modules
- Database: Neon PostgreSQL with `pg` connection pooling
- Authentication: JWT and bcryptjs
- Validation: Joi
- Frontend: React and Axios in the sibling `learning` project

## Features

- Buyer and supplier signup/login with role-based JWT authorization
- Buyers create, edit, list, and inspect RFQs
- Buyers view quotations received for their own RFQs
- Suppliers search/filter open RFQs and view full details
- Suppliers submit price, delivery time, and notes
- Suppliers view their previous quotations
- PostgreSQL persistence, parameterized queries, validation, and centralized errors
- Responsive frontend loading, empty, and error states

## Run Locally

1. Create a Neon PostgreSQL database.
2. Copy `.env.example` to `.env` and fill in the Neon and JWT values.
3. Install and start the API:

```bash
npm install
npm run dev
```

4. Apply the three SQL files in `src/db/migrations` to a fresh Neon database in numerical order. Existing databases should be migrated manually to match the current table definitions before running the application.
5. Start the frontend in the sibling project:

```bash
cd ../learning
npm install
npm start
```

The API runs at `http://localhost:5000`; the React app runs at `http://localhost:3000`.

Set `REACT_APP_API_URL` in the frontend environment when the API is hosted elsewhere.

## API Overview

| Method | Route | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create a buyer or supplier |
| POST | `/api/auth/login` | Public | Login and receive a JWT |
| GET | `/api/auth/me` | Authenticated | Read current user |
| POST | `/api/rfqs` | Buyer | Create an RFQ |
| GET | `/api/rfqs/mine` | Buyer | List own RFQs |
| PATCH | `/api/rfqs/:id` | Buyer | Edit an owned RFQ |
| POST | `/api/rfqs/:id/close` | Buyer | Close an open owned RFQ |
| POST | `/api/rfqs/:id/accept` | Buyer | Accept one quotation and mark the RFQ accepted |
| GET | `/api/rfqs` | Supplier | Search and filter RFQs |
| GET | `/api/rfqs/:id` | Buyer/Supplier | View RFQ details |
| POST | `/api/quotations/rfq/:rfqId` | Supplier | Submit a quotation |
| PATCH | `/api/quotations/:id` | Supplier | Edit their pending quotation |
| GET | `/api/quotations/mine` | Supplier | List submitted quotations |
| GET | `/api/quotations/rfq/:rfqId` | Buyer | List quotations for an owned RFQ |

## Architecture

Requests flow through `route -> authentication/role middleware -> controller -> service -> PostgreSQL`. Controllers shape API responses, services own business rules and SQL, and the error middleware converts validation/database failures into a consistent JSON response.

## Assumptions and Limitations

- A quotation is unique per supplier and RFQ.
- RFQ deadlines are validated as future dates at create/update time.
- There is no messaging, payment, file upload, or notification system because they are outside the assignment scope.
- Deployment requires the candidate's own Neon, API hosting, frontend hosting, and GitHub credentials; this workspace is prepared for deployment but no live URL or repository can be created without those credentials.
