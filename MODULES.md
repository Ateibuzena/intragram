# 1. General Requirements

Building an entire project is complicated, and many things can go wrong. To help you, we will provide a list of general requirements.

The requirements are the following:

- The project must be a web application, and requires a frontend, backend, and a database.
- Git must be used with clear and meaningful commit messages. The repository must show:
  - Commits from all team members.
  - Clear commit messages describing the changes.
  - Proper work distribution across the team.
- Deployment must use a containerization solution (Docker, Podman, or equivalent) and run with a single command.
- Your website must be compatible with the latest stable version of Google Chrome.
- No warnings or errors should appear in the browser console.
- The project must include accessible Privacy Policy and Terms of Service pages with relevant content.

### Privacy Policy and Terms of Service

These pages will be verified during evaluation. They must:

- Be easily accessible from the application (e.g., footer links).
- Contain relevant and appropriate content for your project.
- Not be placeholder or empty pages.

> ⚠️ Missing or inadequate Privacy Policy/Terms of Service pages will result in project rejection.

### Multi-user Support (Mandatory)

Your website must support multiple users simultaneously. This is a core requirement of the project. Users should be able to interact with the application at the same time without conflicts or performance issues. This includes:

- Multiple users can be logged in and active at the same time.
- Concurrent actions by different users are handled properly.
- Real-time updates are reflected across all connected users when applicable.
- No data corruption or race conditions occur with simultaneous user actions.

---

# 2. Technical Requirements

This section, like the previous one, is mandatory. You will then be able to choose the modules you want to use in the next chapter.

- A frontend that is clear, responsive, and accessible across all devices.
- Use a CSS framework or styling solution of your choice (e.g., Tailwind CSS, Bootstrap, Material-UI, Styled Components, etc.).
- Store credentials (API keys, environment variables, etc.) in a local `.env` file that is ignored by Git, and provide an `.env.example` file.
- The database must have a clear schema and well-defined relations.
- Your application must have a basic user management system. Users must be able to sign up and log in securely:
  - At minimum: email and password authentication with proper security (hashed passwords, salted, etc.).
  - Additional authentication methods (OAuth, 2FA, etc.) can be implemented via modules.
- All forms and user inputs must be properly validated in both the frontend and backend.
- Any connection to the backend, from a browser, from a script, from an external API, etc., must use **HTTPS**. Connections inside the backend itself (e.g., web server and database, software inside your container(s)) can be without encryption.

### What is a Framework?

For this project, a framework is defined as a comprehensive tool that provides:

- A structured architecture and conventions for organizing code.
- Built-in features for common tasks (routing, state management, etc.).
- A complete ecosystem of tools and libraries.

**Examples:**

- **Frontend frameworks:** React, Vue, Angular, Svelte, Next.js (these are frameworks).
- **Backend frameworks:** Express, Fastify, NestJS, Django, Flask, Ruby on Rails.
- **Not frameworks:** jQuery (library), Lodash (utility library), Axios (HTTP client).

> **Note:** React is considered a framework in this context due to its ecosystem and architectural patterns, even though it is technically a library.

---

# 3. Modules

## 🔴 Major Modules

### Frameworks (Frontend & Backend)
Use a framework for both the frontend and backend.
- Use a frontend framework (React, Vue, Angular, Svelte, etc.).
- Use a backend framework (Express, NestJS, Django, Flask, Ruby on Rails, etc.).
- Full-stack frameworks (Next.js, Nuxt.js, SvelteKit) count as both if you use both their frontend and backend capabilities.

### Real-time Features
Implement real-time features using WebSockets or similar technology.
- Real-time updates across clients.
- Handle connection/disconnection gracefully.
- Efficient message broadcasting.

### User Interaction
Allow users to interact with other users. The minimum requirements are:
- A basic chat system (send/receive messages between users).
- A profile system (view user information).
- A friends system (add/remove friends, see friends list).

### Public API
A public API to interact with the database with a secured API key, rate limiting, documentation, and at least 5 endpoints:
- `GET /api/{something}`
- `POST /api/{something}`
- `PUT /api/{something}`
- `DELETE /api/{something}`

### Standard User Management & Authentication
- Users can update their profile information.
- Users can upload an avatar (with a default avatar if none provided).
- Users can add other users as friends and see their online status.
- Users have a profile page displaying their information.

### WAF/ModSecurity + HashiCorp Vault
Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets:
- Configure strict ModSecurity/WAF.
- Manage secrets in Vault (API keys, credentials, environment variables), encrypted and isolated.

### Monitoring System
Monitoring system with Prometheus and Grafana.
- Set up Prometheus to collect metrics.
- Configure exporters and integrations.
- Create custom Grafana dashboards.
- Set up alerting rules.
- Secure access to Grafana.

### Backend as Microservices
- Design loosely-coupled services with clear interfaces.
- Use REST APIs or message queues for communication.
- Each service should have a single responsibility.

### Advanced Analytics Dashboard
Advanced analytics dashboard with data visualization.
- Interactive charts and graphs (line, bar, pie, etc.).
- Real-time data updates.
- Export functionality (PDF, CSV, etc.).
- Customizable date ranges and filters.

---

## 🟡 Minor Modules

### Custom Design System
Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).

### Advanced Search
Implement advanced search functionality with filters, sorting, and pagination.

### OAuth 2.0
Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).

### User Activity Analytics
User activity analytics and insights dashboard.
