# CodinIT.dev Backend Service

This is the backend service for a comprehensive web application, providing a robust set of features through a RESTful API. It's built with Node.js and Express, and it integrates with various services like Supabase for database and authentication, Stripe for payments, and multiple AI providers for intelligent features.

## Features

*   **Analytics:** Track and export business and chat analytics.
*   **Chat Functionality:** Real-time chat with AI integration.
*   **File Management:** Upload, download, and manage files.
*   **GitHub Integration:** Import repositories from GitHub.
*   **Code Sandboxing:** Execute code in a secure sandbox environment.
*   **Subscription Management:** Handle user subscriptions and track usage with Stripe.
*   **Terminal Access:** Provide terminal access within the application.
*   **Webhooks:** Handle webhooks from various services.

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database & Auth:** Supabase
*   **Payments:** Stripe
*   **AI:** Anthropic, Fireworks, Google, Mistral, OpenAI
*   **Code Sandboxing:** E2B

## Getting Started

### Prerequisites

*   Node.js (v16 or higher)
*   npm
*   A Supabase project
*   A Stripe account

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/codinit-dev/backend.git
    cd backend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the root of the project and add your environment variables for Supabase, Stripe, and any AI services you want to use.

### Running the Server

To start the development server, run:

```bash
npm start
```

The server will be running on `http://localhost:3000`.

## API Endpoints

The API is structured around the following main routes:

*   `/api/analytics`: for business and export analytics.
*   `/api/chat`: for chat functionality.
*   `/api/files`: for file management.
*   `/api/integrations/github`: for GitHub integration.
*   `/api/sandbox`: for code sandboxing.
*   `/api/subscription`: for subscription and usage tracking.
*   `/api/templates`: for managing templates.
*   `/api/terminal`: for terminal access.
*   `/api/webhooks`: for handling webhooks.

## License

This project is licensed under the MIT License.
