# GreenLedger

GreenLedger is a platform for tracking and trading green energy assets (Renewable Energy Certificates - RECs and Carbon Offset Credits - CCCs).

This repository contains both the frontend (Next.js) and the backend (Express).

## Project Structure

*   **/frontend**: Next.js application for the user interface and Web3 interaction.
*   **/backend**: Express backend for API endpoints, webhook handling (like Razorpay), and database interactions.

## Setup Instructions

### Environment Variables

You need to set up environment variables for both the frontend and backend.

1.  Copy `.env.example` to `.env.local` inside the `frontend/` directory (and `backend/` if applicable).
2.  Fill in the required values (Razorpay keys, Supabase URLs, Web3 RPC URL, etc.).

**Important:** Never commit `.env.local` or any file containing real API keys or private keys to the repository.

### Running Locally

To run the project, you need to start both the frontend and backend servers.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```
