# VenueIQ Quality Improvements Implementation Plan

This plan details the architectural and code changes to satisfy the multi-dimensional quality improvements requested for the VenueIQ application.

## User Review Required

> [!CAUTION]
> The addition of `helmet` and `cors` can restrict certain resources if not configured carefully. The Google Maps API and GA4 integration will use mock or placeholder tags (e.g. `YOUR_API_KEY_HERE`) which you'll need to update later with your real credentials. 

## Proposed Changes

---

### Dependencies

#### [MODIFY] package.json
- Add `helmet`, `express-rate-limit`, `cors`, `compression`, `express-validator` to dependencies.
- Add `jest`, `supertest` to devDependencies.
- Update the `"test"` script to `"jest"`.

---

### Configuration & Backend

#### [MODIFY] server.js
- **Security Check:** Validate `process.env.GEMINI_API_KEY` on application startup instead of conditionally in the request.
- **Middlewares:** Use `helmet()` for HTTP security headers. Configure and use `cors()` and `compression()` (gzip).
- **Rate Limit:** Implement `express-rate-limit` for the `/api/chat` endpoint restricting users to 100 requests per 15 minutes.
- **Caching:** Serve static files with robust `Cache-Control` (e.g., `1d` maxAge) and ETags explicitly enabled.
- **Validation:** Add `express-validator` to the `/api/chat` endpoint to strictly sanitize and validate user input.
- **Endpoints:** Add a new `GET /health` endpoint returning server status.
- **Code Quality:** Add JSDoc comments to all server functions. Replace `console.log` and `console.error` with stylized custom error log wrapper. Wrap logic in appropriate `try/catch` handlers.

---

### Frontend

#### [MODIFY] public/index.html
- **Accessibility (a11y):** 
  - Provide a visually hidden "Skip to Navigation" / "Skip to Main Content" link at the top.
  - Implement Semantic roles (`role="main"`, `role="banner"`, `role="navigation"`).
  - Add explicit `aria-label` attributes to the Select dropdowns, icon buttons (like the Chat close/send buttons), and dynamic elements.
  - Fix any missing heading hierarchy issues and explicitly label icons/SVGs with `<title>` and `<desc>`.
- **Google Services:**
  - Inject the Google Maps JS API script tag and a placeholder div in the layout (with a sample implementation container).
  - Inject Google Analytics 4 (GA4) script tag with a dummy stream ID.
- **Performance:** Ensure uncritical remote scripts/stylesheets natively use `defer` or `loading="lazy"`.

#### [MODIFY] public/js/app.js
- **Code Quality:** Thoroughly document classes and core functions using standard JSDoc notation. Introduce robust `try/catch` in UI interaction listeners.
- **Efficiency:** Refactor the 10-second DOM interval rendering. Instead of completely overriding `innerHTML` of list elements, update existing DOM nodes directly by id to minimize forced layout thrashing and unnecessary re-renders. 
- **Security:** Sanitize raw client string manipulation in chat before rendering it in the DOM (escape `<`, `>`, `&`).

---

### Testing

#### [NEW] tests/server.test.js
- Leverage `jest` and `supertest` to comprehensively cover the Express API endpoints.
- Total >5 Backend Tests (Health check success, AI Endpoint missing payload error, Chat endpoint happy path, Rate limit validations, etc.).

#### [NEW] tests/logic.test.js
- Test wait time, formatting, and mathematical logic derived from the frontend application via abstracted node-friendly exported functions.
- Total >5 Logic Tests (Coverage for wait time base multiplication, string truncations, validation logic boundary tests).

---

### Documentation

#### [MODIFY] README.md
- Add clear instructions indicating how the Gemini AI Assistant is deployed.

---

## Open Questions

> [!IMPORTANT]
> 1. For Google Maps, where precisely would you like the map component visually integrated? I plan to replace the right side "Departure Vectors / Transport Panel" or embed it as a new full-width panel below the Heatmap. I will opt for below the transport dashboard.
> 2. What specific version of Node are you utilizing? (Jest config relies heavily on Node versions; I will assume Node 18+).

## Verification Plan

### Automated Tests
- Run `npm install` and manually install modifications.
- Run `npm test` verifying ALL 10+ newly created Jest specifications execute fully without error.

### Manual Verification
- Execute `npm start` natively, ping `/health`, and load the `index.html` frontend via Chrome checking the Network tab for `gzip` (Compression), HTTP Headers (Helmet), and valid render execution against `index.js`. Verify functionality is wholly uninterrupted.
