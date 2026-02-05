# Contributing to MicroCare Project

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to the MicroCare project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [MicroCare Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [support@microcare.app](mailto:support@microcare.app).

## Getting Started

### Using Docker (Recommended)

The easiest way to get started is using Docker Compose:

```bash
docker-compose up --build
```
This starts both the frontend (http://localhost:5173) and backend (http://localhost:3000).

### Manual Setup

If you prefer running services individually:

1.  **Fork and Clone**:
    ```bash
    git clone https://github.com/your-username/microcare.git
    cd microcare
    ```

2.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    npm run setup
    npm run db:migrate
    npm run dev
    ```

## How Can I Contribute?

### Reporting Bugs

Specifying verify verifiable methods to reproduce the bug is the most reliable way to help us fix it.
1.  **Search for existing issues** to see if the bug has already been reported.
2.  **Create a new issue** and provide a detailed description, including steps to reproduce, expected behavior, and actual behavior.

### Suggesting Enhancements

1.  **Search for existing suggestions** to see if your idea has already been proposed.
2.  **Create a new issue** describing your proposed enhancement.

### Pull Requests

1.  **Create a new branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-feature
    ```
2.  **Make your changes**.
3.  **Run tests** to ensure you haven't broken anything:
    ```bash
    npm test
    ```
4.  **Lint your code**:
    ```bash
    npm run lint
    ```
5.  **Commit your changes** with descriptive commit messages.
6.  **Push to your fork** and submit a **Pull Request**.

## Code Style

-   We use **Eslint** and **Prettier** for code formatting.
-   Run `npm run lint` before submitting your PR.
-   Write clear, self-documenting code.
-   Add comments for complex logic.
