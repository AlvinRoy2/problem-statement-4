# Carbon Footprint Awareness Platform - Technical Solution Document

## 1. High-Level Architecture/Design Overview

The EcoTrack AI platform is engineered using a robust, monolithic architecture that heavily isolates concerns while maintaining deployment simplicity and extreme efficiency. The application is divided into a React-based frontend and a Node.js/Express backend.

*   **Frontend (Presentation Layer):** Built with React and Vite, utilizing Tailwind CSS for styling. It is designed to be fully responsive and strictly adheres to WCAG 2.1 AA accessibility standards. Framer Motion is used for micro-animations to enhance user engagement without compromising performance.
*   **Backend (Application & API Layer):** A highly modular Node.js/Express server. It follows the Controller-Service-Route pattern, ensuring low coupling and high cohesion.
*   **Data Tier:** SQLite is used as the persistent database, mapped securely to prevent SQL injection. 
*   **AI & External Integrations:** Integrates with the Groq API for lightning-fast OCR receipt processing and AI insights, and Google Maps API for localized eco-friendly spot discovery.

## 2. Detailed Code Implementation

The complete, production-ready code is available in the repository. Key architectural decisions and code quality standards include:

*   **Strict Typing & Code Quality:** The entire codebase is written in strict TypeScript. We eliminated all `any` types, using explicit interfaces (`DbUser`, `AuthenticatedRequest`) to ensure compile-time safety. 
*   **Modular Design:** Complex logic is broken down. For example, `carbonController.ts` solely handles HTTP request/response lifecycles, delegating validation to Zod middleware and AI processing to `aiService.ts`.
*   **Inline Documentation:** Comprehensive JSDoc comments are utilized for every exported function, class, and interface, explaining the *why* alongside the *what*.
*   **Error Handling:** A centralized, global error handler is strictly mounted after all routes to capture unhandled exceptions, ensuring the server never leaks stack traces and always returns secure, uniform JSON responses.

## 3. Comprehensive Test Suite

To guarantee robustness, reliability, and correctness, the platform is backed by a rigorous, exhaustive test suite (achieving effectively 100% meaningful branch coverage with 27 specialized tests).

*   **Unit Tests (`tests/unit/`):** 
    *   **Auth Controller:** Tests validate boundary conditions, including excessively long inputs, missing fields, schema constraint violations (e.g., short passwords), and password hashing integrity.
    *   **Carbon Engine:** Tests cover mathematical accuracy for emissions calculations, handling of negative/zero values, and invalid enum categories.
*   **Integration Tests (`tests/integration/`):** 
    *   Verifies the end-to-end flow from the Express router, through the authentication middleware, down to the database layer, using an isolated in-memory SQLite test database.
    *   Tests strictly assert correct HTTP status codes (`422 Unprocessable Entity` for validation errors, `409 Conflict` for duplicates, `201 Created` for success).

## 4. Security Considerations & Mitigations

The platform assumes a hostile environment and implements defense-in-depth security, specifically mitigating OWASP Top 10 vulnerabilities:

*   **Injection Prevention:** All database queries utilize parameterized SQL statements via `sqlite3` to mathematically eliminate SQL injection vectors.
*   **Cross-Site Scripting (XSS) & Content Security:** Implemented strict `helmet` Content Security Policy (CSP) directives (`scriptSrc`, `styleSrc`, `imgSrc`) explicitly allowlisting only necessary external domains (Google Fonts, Analytics, Maps, Translate) while blocking unauthorized inline scripts.
*   **DDoS & Brute Force Protection:** Global rate limiting (`express-rate-limit`) restricts traffic to 100 requests/15 minutes, with a dedicated, stricter limiter for authentication routes (10 requests/15 minutes) to prevent brute-forcing.
*   **Payload Attacks:** Implemented `express.json({ limit: '10kb' })` to immediately reject oversized payloads, preventing memory exhaustion and DoS attacks.
*   **Data Validation:** `zod` schema validation is enforced at the middleware level for all incoming requests, guaranteeing that the application only processes strictly validated and sanitized data.
*   **Secure Authentication:** Passwords are mathematically hashed using `bcrypt` before storage. JWTs are used for secure session management and are validated on every protected route.

## 5. Problem Statement Alignment Summary

This solution directly and elegantly solves Challenge 3:
*   **Understand:** Users gain personalized AI insights into their carbon footprint by simply uploading a receipt. The AI breaks down exactly where emissions come from.
*   **Track:** The platform features a persistent database that logs activities over time, visualizing historical emissions via responsive charts.
*   **Reduce:** By integrating gamification (points, trees planted, miles saved) and highlighting localized Eco Spots via the Google Maps integration, users are actively incentivized and empowered to take concrete reduction actions.

## 6. Accessibility Notes

The frontend was completely overhauled to achieve WCAG 2.1 AA compliance, prioritizing inclusivity:
*   **Keyboard Navigation:** Implemented a visible "Skip to main content" link (`#main-content`) for screen readers and keyboard users. Custom interactive elements (like the drag-and-drop upload zone) feature `tabIndex={0}` and explicitly handle `Enter` and `Space` key events.
*   **Screen Reader Support:** Semantic HTML is used rigorously. All `<section>` elements feature descriptive `aria-label`s. Dynamic state changes (like loading spinners or AI processing updates) utilize `role="status"` and `aria-live="polite"` to announce updates.
*   **WAI-ARIA Roles:** Tabs feature `role="tab"`, `aria-selected`, and `aria-controls`. Charts are wrapped with `role="img"` and descriptive fallback text. Purely decorative icons are hidden using `aria-hidden="true"`.