# OneCheck Backend API

AI-Powered Application Validation & Regulatory Compliance Verification Platform.

---

## 1. Overview & Architecture

The OneCheck backend is built with **Node.js**, **Express.js**, and **MongoDB/Mongoose**. It acts as the primary API orchestrator, owning:
- Application lifecycle state machines and audit logging
- Role-based authorization (`ADMIN`, `OFFICER`, `INSTITUTION_USER`)
- Secure, private document upload and streaming download
- External verification service orchestration (HTTP calls to FastAPI ML service)
- Deterministic 5-pillar risk score calculation
- System alerts and compliance dashboard aggregations

> **Note:** Forensic ML algorithms (OCR, ELA tamper analysis, EXIF metadata, pHash, fuzzy matching) are executed by an external Python FastAPI verification service and consumed by the Node.js backend via a resilient client adapter.

---

## 2. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) | `development` |
| `PORT` | HTTP port for Express API | `3000` |
| `MONGODB_URI` | MongoDB connection connection string | `mongodb://127.0.0.1:27017/onecheck` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `replace_with_a_long_random_secret` |
| `JWT_EXPIRES_IN` | JWT token lifetime | `1h` |
| `VERIFICATION_SERVICE_URL` | Base URL of FastAPI verification service | `http://127.0.0.1:8000` |
| `VERIFICATION_TIMEOUT_MS` | Request timeout for verification calls | `15000` |
| `UPLOAD_DIR` | Private disk storage directory for uploaded files | `./private_uploads` |
| `MAX_FILE_SIZE_MB` | Maximum file upload size in megabytes | `15` |
| `MAX_FILES_PER_REQUEST` | Maximum number of files in a single upload | `10` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173` |
| `HMAC_SECRET` | Secret key for deterministic faculty identifier HMAC | `replace_with_secret_managed_key` |
| `HMAC_KEY_VERSION` | Version tag for HMAC key rotation | `v1` |
| `MOCK_VERIFICATION_SERVICE` | Toggle mocked verification adapter for local tests | `true` |

---

## 3. Getting Started & Running Locally

### Prerequisites
- **Node.js** >= 18.x (tested on v22.19.0)
- **npm** >= 9.x
- **MongoDB** (local or remote; automated tests run hermetically using in-memory MongoDB)

### Installation
```bash
npm install
```

### Running the API
```bash
# Start with hot reload (development)
npm run dev

# Start in production mode
npm start
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response when MongoDB is connected:
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "database": "CONNECTED",
    "timestamp": "2026-10-23T18:15:00.000Z",
    "uptimeSeconds": 12
  },
  "meta": {
    "requestId": "req-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

---

## 4. Available NPM Scripts

- `npm start`: Starts the Express server.
- `npm run dev`: Starts the server with `nodemon` auto-reload.
- `npm test`: Runs all unit and integration tests using Jest.
- `npm run test:unit`: Runs isolated unit tests.
- `npm run test:integration`: Runs end-to-end integration tests.
- `npm run seed:dev`: Populates the database with initial admin, officer, institutions, and demo applications.

---

## 5. API Response Envelope

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req-uuid"
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A concise explanation",
    "details": []
  },
  "meta": {
    "requestId": "req-uuid"
  }
}
```
