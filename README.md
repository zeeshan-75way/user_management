# User Management Application

This project is a Node.js template with TypeScript, Express, JWT authentication, and various utilities for development. It includes features such as user authentication, task management, and various middleware for error handling and validation.

## Features

- **JWT Authentication**: Secure your routes with token-based authentication.
- **User Management**: Create, update, and delete users, with validation and role-based access control.
- **Task Management**: Create, update, and manage tasks assigned to users.
- **TypeScript Support**: Fully supports TypeScript for type safety.
- **Pre-configured ESLint, Prettier, and Husky**: Linting and code formatting are automated to ensure consistent code quality.
- **Nodemon for Development**: Automatic server restarts on code changes.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v16 or later)
- [npm](https://www.npmjs.com/) (recommended)

## Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/zeeshan-75way/user_management.git
    cd user_management
    ```

2.  **Install dependencies**:

    Using `npm` (recommended):

    ```bash
    npm install
    ```

    Or with `pnpm`:

    ```bash
    pnpm install
    ```

3.  **Create a `.env` file** in the root directory to store your environment variables:

    ```bash
    PORT=5000
    MONGO_URI=<your-mongo-uri>
    JWT_SECRET=<your-secret-key>
    JWT_ACCESS_TOKEN_EXPIRY=expiry
    JWT_REFRESH_TOKEN_EXPIRY=expiry
    MAIL_PASSWORD=mailpassword
    MAIL_USER=mailuser
    ```

## Scripts

Here are the available npm scripts:

- **Start the server (development mode)**:  
  Runs the server with `nodemon` for automatic restarts.

  ```bash
  npm run start
  ```

- **Build the project**:

  ```bash
  npm run build
  ```

- **Run TypeScript (dev)**:

  ```bash
  npm run start
  ```

## Folder Structure

Here’s a basic overview of the project folder structure:

```
├── src
│   ├── common
│   │   ├── middleware
│   │   └── helper
│   ├── user
│   ├── tasks
│   └── ...
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project documentation
```
