# MicroCare Project

Welcome to the MicroCare project, an AI-powered journaling app focused on mental wellness.

## Project Structure

This project is organized as a monorepo with distinct frontend and backend directories:

-   **[Frontend](frontend/README.md)**: React application built with Vite, Tailwind CSS, and shadcn-ui.
-   **[Backend](backend/README.md)**: Node.js/Express API with TypeScript and PostgreSQL.

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run setup  # Sets up env and installs dependencies
npm run db:migrate
npm run dev
```

## Docker Support

You can run the entire stack using Docker Compose:

```bash
docker-compose up --build
```
