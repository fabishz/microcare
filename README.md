# MicroCare

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue.svg)
![Frontend](https://img.shields.io/badge/frontend-react-61DAFB.svg)
![Backend](https://img.shields.io/badge/backend-node-339933.svg)

**MicroCare** is an AI-powered journaling application designed to support mental wellness. It combines a modern, responsive frontend with a robust, scalable backend to provide a secure and engaging user experience.

## ✨ Key Features

-   **AI-Powered Insights**: Analyze journal entries for mood and sentiment trends.
-   **Secure Journaling**: End-to-end encrypted storage for private thoughts.
-   **Wellness Tracking**: Visualize mood over time with interactive charts.
-   **Responsive Design**: Seamless experience across desktop and mobile devices.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS, shadcn-ui
-   **State Management**: React-Query, Context API
-   **Language**: TypeScript

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: PostgreSQL (via Prisma ORM)
-   **API Documentation**: Swagger/OpenAPI
-   **Language**: TypeScript

## 🏗️ Architecture

```mermaid
graph TD
    User[User] -->|HTTPS| Frontend[React Frontend]
    Frontend -->|REST API| Backend[Express Backend]
    Backend -->|SQL| DB[(PostgreSQL)]
    
    subgraph Docker Network
        Frontend
        Backend
        DB
    end
```

## 🚀 Quick Start

### Using Docker (Recommended)

Run the entire application stack with a single command:

```bash
docker-compose up --build
```

-   **Frontend**: http://localhost:5173
-   **Backend API**: http://localhost:3000
-   **API Docs**: http://localhost:3000/api/docs

### Manual Installation

#### Prerequisites
-   Node.js 18+
-   PostgreSQL 12+

#### 1. Backend Setup
```bash
cd backend
npm install
npm run setup   # Creates .env from example
npm run db:migrate
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

This repository is organized as a monorepo:

-   [`frontend/`](frontend/): React client application.
-   [`backend/`](backend/): Node.js API server.
-   [`docker-compose.yml`](docker-compose.yml): Service orchestration.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
