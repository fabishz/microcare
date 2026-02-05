# Contributing to MicroCare Backend

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to MicroCare Backend. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [MicroCare Backend Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [support@microcare.app](mailto:support@microcare.app).

## getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/microcare-backend.git
    cd microcare-backend
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Set up environment**:
    ```bash
    npm run setup
    ```
    This will copy `.env.example` to `.env`. You **must** then edit `.env` with your local PostgreSQL credentials.

5.  **Start development server**:
    ```bash
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
