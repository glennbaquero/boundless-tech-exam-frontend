This is the **Caravea** booking frontend, a [Next.js](https://nextjs.org) app bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It renders the booking form UI and submits bookings to a Laravel backend API.

## Getting Started

### Prerequisites

- Node.js 20+
- A running instance of the Laravel backend API (see [Connecting to the backend API](#connecting-to-the-backend-api))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in the values for your environment:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_STAGING_URL` | Yes | Base URL of the backend API, including the `/api` prefix (e.g. `http://localhost:8000/api`). Every request made by the app is prefixed with this value. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Enables Google Places autocomplete and Google Distance Matrix for pickup/dropoff location search. If left unset, the app automatically falls back to the free, keyless [OpenStreetMap Nominatim](https://nominatim.org/) (place search) and [OSRM](https://project-osrm.org/) (distance/travel time) services. |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
