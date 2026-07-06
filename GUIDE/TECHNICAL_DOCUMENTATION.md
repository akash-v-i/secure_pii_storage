# PiiVault Guard – Technical Documentation

## 1. Project Architecture

### Overview
PiiVault Guard is a full-stack application for storing sensitive personal data with layered protections. The backend is implemented in Python with FastAPI and SQLAlchemy; the frontend is a React + TypeScript application built with Vite and Tailwind. The system uses AES-GCM for authenticated encryption of PII values and files, wraps per-record data encryption keys (DEKs) with a master key, and stores those wrapped keys in a separate database.

### Core architectural layers

1. Presentation layer
   - Frontend: [frontend/src](frontend/src)
   - Implements login, dashboard, vault, admin, privacy, file upload, and audit views.
   - Uses React Router for page navigation, Axios for HTTP calls, and React Query for asynchronous state.
   - Stores the JWT access token in browser local storage and attaches it via the Axios interceptor.

2. API layer
   - Backend: [backend/main.py](backend/main.py)
   - FastAPI exposes routers for authentication, vault operations, and admin functionality.
   - Route modules delegate domain-specific behavior to services and database sessions.

3. Domain and persistence layer
   - SQLAlchemy models live in [backend/db/pii_db.py](backend/db/pii_db.py), [backend/db/key_db.py](backend/db/key_db.py), and session initialization in [backend/db/session.py](backend/db/session.py).
   - The application uses two databases:
     - PII database: stores users, PII records, audit logs, login attempts, deletion requests, and file metadata.
     - Keys database: stores wrapped DEKs for each record.

4. Security layer
   - The crypto stack is centered in [backend/services/crypto_service.py](backend/services/crypto_service.py) and [backend/utils/key_management.py](backend/utils/key_management.py).
   - Authentication is handled by [backend/routes/auth.py](backend/routes/auth.py) with JWT-based access tokens.
   - Passwords are hashed using BCrypt via [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py).

### How the frontend, backend, database, and security components interact
- The browser submits credentials or PII data to the FastAPI API.
- The API validates input, authenticates the user, and applies authorization rules.
- When sensitive data is submitted, the backend encrypts it before persistence.
- The ciphertext, nonce, and key reference are written to the PII database.
- The DEK used for encryption is wrapped with the master key and stored in the keys database.
- On retrieval, the backend fetches the wrapped key, unwraps it, decrypts the ciphertext, and returns plaintext only to the authenticated caller.

### Full request and response lifecycle
1. User logs in via the frontend.
2. The frontend sends credentials to [backend/routes/auth.py](backend/routes/auth.py).
3. The backend verifies the password hash, records login attempts, and issues a JWT.
4. The frontend stores the JWT and uses it in subsequent requests.
5. For PII submission, the frontend sends plaintext to [backend/routes/vault.py](backend/routes/vault.py).
6. The backend generates a DEK, encrypts the value with AES-GCM, wraps the DEK with the master key, and stores the ciphertext and metadata.
7. The response returns storage success metadata to the frontend.
8. On subsequent retrieval, the backend unwraps the DEK, decrypts the ciphertext, and returns the plaintext to the UI only for the authenticated user.

### Sensitive data flow
- User input enters the browser as plaintext.
- The frontend sends it to the API over HTTP(S) in a normal request body.
- The backend immediately encrypts it using AES-GCM before DB persistence.
- Only the ciphertext and nonce are stored in the PII database.
- Wrapped DEKs are stored separately in the keys database.
- On return, plaintext only appears in memory during decryption and is returned to the authenticated caller.

---

## 2. Libraries and Dependencies

### Backend libraries

| Library | Why it is used | Problem it solves | Files importing it | Main classes/functions |
|---|---|---|---|---|
| FastAPI | Web framework for building the API | Routing, request validation, dependency injection | [backend/main.py](backend/main.py), [backend/routes/auth.py](backend/routes/auth.py), [backend/routes/vault.py](backend/routes/vault.py), [backend/routes/admin.py](backend/routes/admin.py) | `app = FastAPI(...)`, route handlers and dependency injection |
| Starlette | Underlying ASGI framework for FastAPI | HTTP handling, middleware, response streaming | indirectly via FastAPI | Used through FastAPI features such as `StreamingResponse` |
| Uvicorn | ASGI server | Runs the FastAPI app in production/development | [backend/main.py](backend/main.py) | `uvicorn.run(...)` |
| SQLAlchemy | ORM and database toolkit | Maps Python objects to relational tables and handles queries | [backend/db/session.py](backend/db/session.py), [backend/db/pii_db.py](backend/db/pii_db.py), [backend/db/key_db.py](backend/db/key_db.py), route files | `create_engine`, `sessionmaker`, model classes |
| PyMySQL / mysql-connector | MySQL driver | Connects SQLAlchemy to MySQL | [backend/db/session.py](backend/db/session.py) | `mysql+pymysql://...` engine URL |
| Pydantic | Request/response validation and schema modeling | Validates API payloads and shapes responses | [backend/routes/auth.py](backend/routes/auth.py), [backend/routes/vault.py](backend/routes/vault.py), [backend/routes/admin.py](backend/routes/admin.py) | `BaseModel` classes such as `RegisterRequest` and `PIIStoreRequest` |
| python-dotenv | Environment variable loader | Loads `.env` files | [backend/main.py](backend/main.py), [backend/db/session.py](backend/db/session.py), [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py) | `load_dotenv(...)` |
| cryptography | Cryptographic primitives | AES-GCM encryption/decryption, key derivation, hashing | [backend/services/crypto_service.py](backend/services/crypto_service.py), [backend/utils/key_management.py](backend/utils/key_management.py) | `AESGCM`, `PBKDF2HMAC`, `hashes` |
| bcrypt | Password hashing primitive | Secure salted password hashing | indirectly via `passlib` | Used by `passlib` under the hood |
| passlib | Password hashing abstraction | Provides `CryptContext` and BCrypt hashing | [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py) | `CryptContext`, `pwd_context.hash()`, `pwd_context.verify()` |
| python-jose | JWT implementation | Signs and verifies access tokens | [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py) | `jwt.encode`, `jwt.decode` |
| slowapi | Rate limiting | Protects login and API endpoints from abuse | [backend/main.py](backend/main.py) | `Limiter`, `_rate_limit_exceeded_handler` |
| bleach | HTML sanitization | Removes dangerous markup and script content | [backend/utils/validation.py](backend/utils/validation.py) | `bleach.clean(...)` |
| email-validator | Email validation | Ensures input meets email standards | [backend/utils/validation.py](backend/utils/validation.py) | `validate_email(...)` |
| requests | HTTP client | GeoIP lookup against `ip-api.com` | [backend/utils/geoip.py](backend/utils/geoip.py) | `requests.get(...)` |
| python-multipart | Multipart form parsing | Supports file uploads | [backend/routes/vault.py](backend/routes/vault.py) | `UploadFile`, `File` |

### Frontend libraries

| Library | Why it is used | Problem it solves | Files importing it | Main classes/functions |
|---|---|---|---|---|
| React | UI framework | Builds the interactive SPA | [frontend/src/main.tsx](frontend/src/main.tsx), [frontend/src/App.tsx](frontend/src/App.tsx) | component rendering |
| React Router | Client-side routing | Navigation between pages | [frontend/src/App.tsx](frontend/src/App.tsx) | `<Routes>`, `<Route>` |
| Vite | Build tooling | Fast local development and bundling | [frontend/package.json](frontend/package.json) | `vite` scripts |
| TypeScript | Typed JavaScript | Improves correctness and maintainability | [frontend/tsconfig.json](frontend/tsconfig.json) | type-safe app code |
| Axios | HTTP client | Sends authenticated API requests | [frontend/src/lib/api.ts](frontend/src/lib/api.ts) | `api`, `authAPI`, `vaultAPI`, `adminAPI` |
| TanStack React Query | Async state management | Centralizes remote data fetching | [frontend/src/App.tsx](frontend/src/App.tsx) | `QueryClientProvider` |
| react-hook-form | Form management | Handles form state and validation cleanly | [frontend/src/pages/AddPII.tsx](frontend/src/pages/AddPII.tsx) | `useForm`, `handleSubmit` |
| Zod | Schema validation | Validates UI form payloads | [frontend/src/pages/AddPII.tsx](frontend/src/pages/AddPII.tsx) | `z.object`, `zodResolver` |
| jwt-decode | Token decoding | Reads JWT claims on the client | [frontend/src/lib/api.ts](frontend/src/lib/api.ts), [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx) | `jwtDecode` |
| Sonner / shadcn UI / Radix UI | UI components | Build the polished dashboard and dialog components | [frontend/src/App.tsx](frontend/src/App.tsx), [frontend/src/components](frontend/src/components) | alert dialogs, cards, buttons, tables |
| Tailwind CSS | Styling | Utility-first design system | [frontend/tailwind.config.ts](frontend/tailwind.config.ts), [frontend/src/index.css](frontend/src/index.css) | utility classes |

---

## 3. Component-Level Explanation

### Authentication module
- Responsibility: register, login, logout, token validation, CAPTCHA handling, current-user resolution.
- Main file: [backend/routes/auth.py](backend/routes/auth.py)
- Execution sequence:
  1. Client posts login or registration payload.
  2. The router validates CAPTCHA and input.
  3. It checks the user record and password hash.
  4. On success, it creates a JWT and returns it to the client.
  5. Every protected route depends on `get_current_user()` to verify the bearer token.
- Communication: uses the user model from [backend/db/pii_db.py](backend/db/pii_db.py) and password helpers from [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py).

### User management
- Responsibility: user creation, role assignment, profile access, admin deletion, audit visibility.
- Main files: [backend/routes/auth.py](backend/routes/auth.py), [backend/routes/admin.py](backend/routes/admin.py), [backend/db/pii_db.py](backend/db/pii_db.py)
- Roles: `USER`, `ADMIN`, and `AUDITOR`.
- Why necessary: authorization boundaries and admin/auditor views depend on this model.

### Encryption module
- Responsibility: encrypt and decrypt PII values and files.
- Main file: [backend/services/crypto_service.py](backend/services/crypto_service.py)
- Methods:
  - `encrypt_pii()`
  - `_encrypt_with_dek()`
  - `decrypt_pii()`
  - `encrypt_file()`
  - `decrypt_file()`
  - `wrap_dek()` / `unwrap_dek()`
- Communication: calls key-management helpers and uses the DEK returned by [backend/utils/key_management.py](backend/utils/key_management.py).

### Key management module
- Responsibility: generate DEKs, wrap and unwrap them, and derive the master key.
- Main file: [backend/utils/key_management.py](backend/utils/key_management.py)
- Methods:
  - `generate_master_key()`
  - `generate_dek()`
  - `wrap_key()`
  - `unwrap_key()`
  - `get_master_key()`
- Why necessary: this module bridges cryptography primitives with the database layer by storing wrapped keys safely.

### Database layer
- Responsibility: persistence of application data and keys.
- Main files: [backend/db/session.py](backend/db/session.py), [backend/db/pii_db.py](backend/db/pii_db.py), [backend/db/key_db.py](backend/db/key_db.py)
- The system uses two engines and two session factories because secrets and metadata are intentionally separated.

### Repository layer
- In this codebase, the repository pattern is very light. SQLAlchemy ORM sessions act as the repository boundary.
- The route handlers directly query the ORM models rather than a separate repository abstraction.

### Service layer
- Cryptography service is the main service layer: [backend/services/crypto_service.py](backend/services/crypto_service.py).
- It centralizes encryption and decryption logic so the route handlers do not implement cryptographic details directly.

### Controller layer
- The FastAPI routers serve as the controller layer:
  - [backend/routes/auth.py](backend/routes/auth.py)
  - [backend/routes/vault.py](backend/routes/vault.py)
  - [backend/routes/admin.py](backend/routes/admin.py)
- They receive HTTP requests, validate them, call services, and produce HTTP responses.

### DTOs
- The DTOs are the Pydantic request/response models in the router files.
- Examples:
  - `RegisterRequest`, `LoginRequest`
  - `PIIStoreRequest`, `PIIUpdateRequest`
  - `DeletionReasonRequest`
- They describe the structure of API payloads and enforce validation before business logic runs.

### Entities
- SQLAlchemy models are the entities.
- Examples: `User`, `PIIRecord`, `PIIFile`, `FieldKey`, `LoginAttempt`, `AuditLog`.
- They represent the logical database records the application uses.

### Configuration classes
- The project relies on environment variables rather than rich configuration classes.
- Configuration is loaded from `.env` by `python-dotenv` and read directly in route and utility modules.

### Utility classes
- [backend/utils/validation.py](backend/utils/validation.py): sanitization and validation helpers.
- [backend/utils/logger.py](backend/utils/logger.py): logger setup.
- [backend/utils/geoip.py](backend/utils/geoip.py): IP-to-location enrichment.
- [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py): authentication helpers.

### Exception handlers
- FastAPI exception handling is mostly implicit through `HTTPException` raising in the route handlers.
- Main API-level rate-limit handling is registered in [backend/main.py](backend/main.py).

### Security filters / middleware / interceptors
- CORS middleware is added in [backend/main.py](backend/main.py).
- Request rate limiting is configured in [backend/main.py](backend/main.py) using `slowapi`.
- The frontend uses Axios interceptors in [frontend/src/lib/api.ts](frontend/src/lib/api.ts) to attach bearer tokens and handle unauthorized responses.

---

## 4. AES-GCM Implementation

### Library and import
- The implementation uses the `cryptography` package.
- The exact import is:

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
```

### Provider model
- This project is written in Python, so it does not use Java’s JCA or a Java provider.
- The implementation is backed by the `cryptography` library, which wraps OpenSSL primitives under the hood.

### Why AES-GCM was chosen
- AES-GCM provides both confidentiality and authenticity in a single primitive.
- It is preferable to AES-CBC because CBC requires separate MAC/HMAC handling and is vulnerable to padding-oracle style issues if implemented carelessly.
- GCM is efficient and widely used for modern authenticated encryption.

### Confidentiality and authentication
- The plaintext is encrypted with AES in GCM mode.
- A 96-bit nonce is generated for each encryption.
- The authentication tag is generated internally by the GCM implementation and appended to the ciphertext by the library.
- The tag is checked during decryption; if validation fails, decryption raises an exception.

### IV generation
- The IV/nonce is generated in [backend/services/crypto_service.py](backend/services/crypto_service.py) and [backend/utils/key_management.py](backend/utils/key_management.py).
- The code uses:

```python
nonce = secrets.token_bytes(12)
```

- Size: 12 bytes (96 bits).
- It is random and generated per encryption.
- The nonce is stored as a hex string in the database alongside the ciphertext.

### Key size
- The code uses 32-byte keys (256 bits) for DEKs and the master key is treated as 32 bytes.
- The key generation is:

```python
def generate_dek() -> Tuple[bytes, str]:
    dek = secrets.token_bytes(32)
```

### Cipher initialization
- The cipher object is initialized as:

```python
aesgcm = AESGCM(dek)
```

### Encryption flow
1. The route handler receives plaintext PII in [backend/routes/vault.py](backend/routes/vault.py).
2. A DEK is generated by `generate_dek()`.
3. `crypto_service.encrypt_pii()` calls `_encrypt_with_dek()`.
4. A fresh 12-byte nonce is generated.
5. `AESGCM(dek).encrypt(nonce, plaintext.encode("utf-8"), None)` encrypts the data and produces the ciphertext.
6. The ciphertext is stored as hex in `PIIRecord.encrypted_value`.
7. The nonce is stored in `PIIRecord.nonce`.
8. The key identifier is stored in `PIIRecord.key_id`.

### Decryption flow
1. The route handler retrieves the record and the wrapped DEK.
2. The DEK is unwrapped using the master key.
3. The ciphertext and nonce are converted from hex into bytes.
4. The AES-GCM object decrypts the data and verifies the authentication tag.
5. If the tag fails, an exception is raised and the route returns an internal error.

### AAD usage
- The implementation uses `None` as additional authenticated data.
- No custom AAD is included in the current code, so the authentication is limited to the ciphertext and nonce.

### Storage format
- Ciphertext is hex-encoded and stored in `encrypted_value`.
- Nonce is stored as a hex string in `nonce`.
- The wrapped DEK is stored in the keys database as `wrapped_key`.

---

## 5. BCrypt Implementation

### Library and import
- The project uses `passlib` with the BCrypt scheme.
- The relevant import and setup are in [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py):

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

### Files using BCrypt
- [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py)
- [backend/routes/auth.py](backend/routes/auth.py)

### Password hashing workflow
1. The registration handler in [backend/routes/auth.py](backend/routes/auth.py) gets the user-supplied password.
2. It passes it to `get_password_hash()`.
3. `get_password_hash()` calls `pwd_context.hash(password)`.
4. The resulting BCrypt hash is stored in `User.hashed_password`.

### Password verification workflow
1. On login, [backend/routes/auth.py](backend/routes/auth.py) calls `verify_password(request.password, user.hashed_password)`.
2. `verify_password()` delegates to `pwd_context.verify(plain_password, hashed_password)`.
3. BCrypt verifies the supplied password against the stored hash without ever decrypting the original password.

### Salt generation
- BCrypt automatically generates a per-hash salt.
- The resulting hash string encodes both the cost factor and the salt.

### Cost factor
- The project does not explicitly override the BCrypt work factor.
- Passlib and the underlying `bcrypt` implementation use their default cost setting (commonly 12 rounds in current configurations).

### Why BCrypt is used
- It is purpose-built for password hashing.
- It is slow by design, making offline brute-force attacks expensive.
- It is better than plain SHA-256 or MD5 for password storage because those are fast and do not include a salt in a password-storage-friendly way.

---

## 6. Key Management

### Where the AES key is generated
- The data encryption key (DEK) is generated in [backend/utils/key_management.py](backend/utils/key_management.py) by `generate_dek()`.

### How it is stored
- The DEK is generated as 32 random bytes.
- It is used immediately for AES-GCM encryption.
- It is not stored directly in plain form in the PII database.
- Instead, it is wrapped with the master key and stored in the keys database in the `FieldKey.wrapped_key` column.

### Persistence model
- The plaintext DEK exists only in memory during the request and is then wrapped and persisted in encrypted form.
- The keys database is separate from the PII database, which is a meaningful security separation.

### Key lifecycle
1. `generate_dek()` creates a fresh 256-bit random DEK.
2. The DEK is used for encryption by [backend/services/crypto_service.py](backend/services/crypto_service.py).
3. `wrap_key()` uses AES-GCM with the master key to encrypt the DEK.
4. The wrapped DEK is stored in the keys table.
5. On retrieval, `unwrap_key()` decrypts the wrapped DEK using the master key.
6. The DEK is used to decrypt the PII value or file.

### Rotation support
- The schema includes `rotated_at` and `expires_at` in [backend/db/key_db.py](backend/db/key_db.py), but the current implementation does not actively rotate keys or implement a key versioning workflow.

### Key loading at startup
- The master key is resolved lazily when the crypto service initializes via `get_master_key()`.
- There is no explicit startup bootstrap for key loading beyond that function call.

### Encoding and serialization
- The current implementation uses raw bytes for the DEK and master key.
- The wrapped key is stored as a hex string representation in the database.
- The code does not use Base64 serialization or a structured key container.

---

## 7. Master Key

### What the master key is
- The “master key” is the key used to wrap and unwrap per-record DEKs.
- In practice, the application treats the master key as a 32-byte secret.

### Where it is created
- The helper `generate_master_key()` exists in [backend/utils/key_management.py](backend/utils/key_management.py), but it is never used by the active code path.

### How it is generated
- If `MASTER_ENCRYPTION_KEY` is present, it is loaded from the environment variable.
- If not, the code falls back to a SHA-256 digest of `SECRET_KEY`.

### Where it is stored
- The project expects it in the environment, not in a dedicated keystore.
- There is no integration with Azure Key Vault, HashiCorp Vault, AWS KMS, or a Java keystore.

### How it is loaded
- `get_master_key()` reads the environment in [backend/utils/key_management.py](backend/utils/key_management.py).
- `CryptoService.__init__()` calls it and stores the result on the service instance.

### Which classes access it
- [backend/services/crypto_service.py](backend/services/crypto_service.py)
- [backend/utils/key_management.py](backend/utils/key_management.py)

### What it protects
- It protects the random DEKs used to encrypt PII values and files.

### Key wrapping behavior
- The master key does not encrypt another key hierarchy beyond wrapping the DEKs.
- The code uses AES-GCM to wrap the DEK with the master key.

### Exposure and rotation
- The master key is not exposed in the API responses.
- It is not rotated by the current implementation.
- It is not stored in a dedicated secure envelope or HSM.

---

## 8. Key Encryption

### Is the master key encrypted?
- No, not in the current implementation.
- The master key is either read directly from an environment variable or derived from the application’s JWT secret.

### Security implications
- If the environment variable is compromised, the wrapped DEKs are recoverable and all encrypted data becomes accessible.
- If the fallback `SECRET_KEY` is weak or reused, the encryption hierarchy becomes weaker than intended.

### Production recommendations
- Use a dedicated KMS or vault.
- Store the master key outside the application process.
- Rotate the master key and re-wrap the DEKs during a controlled migration.
- Avoid deriving the master key from the JWT secret.

---

## 9. Security Architecture

### Authentication flow
1. User submits credentials via the login form in [frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx).
2. The frontend calls `/auth/login` in [frontend/src/lib/api.ts](frontend/src/lib/api.ts).
3. The backend validates CAPTCHA, user identity, and password hash.
4. A JWT is issued and stored in browser local storage.
5. Subsequent requests carry the token in the `Authorization` header.

### Authorization flow
- Protected routes rely on `get_current_user()` in [backend/routes/auth.py](backend/routes/auth.py).
- Admin and auditor routes use `require_admin()` and `require_auditor_or_admin()` in [backend/routes/admin.py](backend/routes/admin.py).

### Token generation
- Implemented in [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py).
- The token includes the user ID and role and expires according to `ACCESS_TOKEN_EXPIRE_MINUTES`.

### JWT handling
- The token is verified using `jwt.decode(...)`.
- The frontend uses `jwt-decode` to inspect token claims.

### Session management
- The system uses stateless JWTs rather than server-side sessions.
- Logout is effectively client-side token removal.

### Input validation
- The backend uses Pydantic models and manual validation helpers in [backend/utils/validation.py](backend/utils/validation.py).
- The frontend uses Zod and React Hook Form before sending requests.

### SQL injection prevention
- SQLAlchemy ORM queries are parameterized by design.
- The application does not construct raw SQL for normal CRUD operations.

### XSS prevention
- The server sanitizes input with `bleach.clean(...)`.
- The UI does not use raw HTML injection for user content.

### CSRF protection
- The app uses bearer tokens rather than cookie-based sessions, which reduces classic CSRF risk.
- No explicit CSRF token middleware is present.

### Secure random number generation
- `secrets.token_bytes(...)` is used for nonces and DEKs.
- This is appropriate for cryptographic randomness.

### Secret management
- Secrets are expected from environment variables.
- The code contains fallback values, which is not ideal for production.

### Secure configuration
- The application uses environment variables and `.env` files.
- The repo includes an example file [backend/env.example](backend/env.example) and a runtime `.env` file for local development.

### Error handling
- The API converts unexpected failures to `HTTPException` with `500` responses.
- Some errors are logged, but the error responses remain generic to reduce leakage.

### Sensitive logging
- The logging configuration in [backend/utils/logger.py](backend/utils/logger.py) logs events but does not record plaintext PII values.
- The route handlers log record labels and metadata rather than decrypted values.

---

## 10. Complete Encryption Workflow

### Step 1: User submits sensitive data
- The user enters data in [frontend/src/pages/AddPII.tsx](frontend/src/pages/AddPII.tsx).
- The frontend calls `piiStore.addRecord(...)` from [frontend/src/stores/piiStore.ts](frontend/src/stores/piiStore.ts).

### Step 2: Validation
- The frontend validates the payload using Zod.
- The backend validates the request body with Pydantic and helper functions in [backend/utils/validation.py](backend/utils/validation.py).

### Step 3: Key retrieval
- The route handler in [backend/routes/vault.py](backend/routes/vault.py) generates a new DEK using `generate_dek()`.
- The DEK is passed to `crypto_service.encrypt_pii()`.

### Step 4: Cipher initialization
- The crypto layer creates `AESGCM(dek)` in [backend/services/crypto_service.py](backend/services/crypto_service.py).

### Step 5: IV generation
- A fresh 12-byte nonce is created via `secrets.token_bytes(12)`.

### Step 6: AES-GCM encryption
- The plaintext is encoded as UTF-8 and encrypted with `aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)`.

### Step 7: Authentication tag generation
- The AES-GCM implementation internally produces the authentication tag during encryption.
- The ciphertext and tag are combined by the library.

### Step 8: Database storage
- The ciphertext is stored in `PIIRecord.encrypted_value`.
- The nonce is stored in `PIIRecord.nonce`.
- The key identifier is stored in `PIIRecord.key_id`.
- The wrapped DEK is stored in the keys database through `FieldKey` in [backend/db/key_db.py](backend/db/key_db.py).

### Step 9: Retrieval
- The user requests the record from [frontend/src/pages/Vault.tsx](frontend/src/pages/Vault.tsx).
- The frontend calls `vaultAPI.retrieve()` in [frontend/src/lib/api.ts](frontend/src/lib/api.ts).
- The backend loads the PII record and the associated wrapped key.

### Step 10: Authentication tag verification
- On decryption, `AESGCM.decrypt()` verifies the tag.
- If the tag is invalid, it raises an exception.

### Step 11: Decryption
- The wrapped DEK is unwrapped with the master key.
- The ciphertext is decrypted and decoded back to UTF-8 plaintext.

### Step 12: Returning plaintext to the application
- The plaintext is returned via the API response to the authenticated user.
- The frontend temporarily displays the value in the secure value cell component.

---

## 11. Dependency Analysis for Security-Related Libraries

| Dependency | Why it exists | Files using it | Methods that call it | Algorithms implemented |
|---|---|---|---|---|
| `cryptography` | AES-GCM encryption and key derivation | [backend/services/crypto_service.py](backend/services/crypto_service.py), [backend/utils/key_management.py](backend/utils/key_management.py) | `encrypt_pii`, `decrypt_pii`, `encrypt_file`, `decrypt_file`, `wrap_key`, `unwrap_key` | AES-GCM, PBKDF2HMAC |
| `passlib` | Password hashing abstraction | [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py) | `get_password_hash`, `verify_password` | BCrypt |
| `python-jose` | JWT creation and decoding | [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py) | `create_access_token`, `decode_access_token` | HMAC-SHA256 signing |
| `slowapi` | API rate limiting | [backend/main.py](backend/main.py) | app startup and exception handling | token bucket / sliding-window style limiting |
| `bleach` | Input sanitization | [backend/utils/validation.py](backend/utils/validation.py) | `sanitize_input` | HTML stripping |
| `email-validator` | Email format validation | [backend/utils/validation.py](backend/utils/validation.py) | `validate_email_format` | email syntax validation |
| `requests` | GeoIP lookup | [backend/utils/geoip.py](backend/utils/geoip.py) | `get_location_from_ip` | network lookup |

---

## 12. Code References and Traceability

- Authentication entrypoint: [backend/routes/auth.py](backend/routes/auth.py)
- JWT helpers: [backend/utils/jwt_handler.py](backend/utils/jwt_handler.py)
- Encryption service: [backend/services/crypto_service.py](backend/services/crypto_service.py)
- Key management: [backend/utils/key_management.py](backend/utils/key_management.py)
- PII models: [backend/db/pii_db.py](backend/db/pii_db.py)
- Key storage model: [backend/db/key_db.py](backend/db/key_db.py)
- Database sessions: [backend/db/session.py](backend/db/session.py)
- FastAPI entrypoint: [backend/main.py](backend/main.py)
- Frontend API layer: [frontend/src/lib/api.ts](frontend/src/lib/api.ts)
- UI store: [frontend/src/stores/piiStore.ts](frontend/src/stores/piiStore.ts)
- Form entry: [frontend/src/pages/AddPII.tsx](frontend/src/pages/AddPII.tsx)
- Vault view: [frontend/src/pages/Vault.tsx](frontend/src/pages/Vault.tsx)

---

## 13. Security Review

### Strengths
- Sensitive values are encrypted before persistence.
- The implementation uses AES-GCM, which is an authenticated encryption mode.
- Passwords are hashed with BCrypt rather than stored in plaintext.
- The project separates PII storage from key storage.
- Access is gated by JWT-based authentication and role-based checks.

### Issues and risks

1. Master key is weakly managed
   - The code derives the master key from `SECRET_KEY` when `MASTER_ENCRYPTION_KEY` is absent.
   - This binds encryption strength to the application secret and makes the encryption hierarchy less robust.

2. No real key rotation workflow
   - The schema hints at rotation, but the runtime does not implement it.
   - Re-wrapping keys and rotating the master key are not handled.

3. No dedicated key store or HSM integration
   - The code expects environment variables only.
   - This is acceptable for prototypes, but not for production-grade key management.

4. Default credentials and default secrets are present in setup materials
   - The initialization script creates admin and auditor accounts with predictable passwords.
   - This is convenient for bootstrapping but risky if the service is exposed.

5. Encryption update path is incomplete
   - The update endpoint for PII values contains a placeholder and does not re-encrypt updated values.

6. Key records are not cleaned up on record deletion
   - Deleting a PII record does not remove its wrapped key record from the keys database.
   - This leaves orphaned key material behind.

7. Backup endpoint returns encrypted values and metadata, not plaintext
   - This is safer than exporting plaintext, but the backup format should be protected with additional access controls and integrity checks.

### Recommended improvements
- Move the master key to a KMS or dedicated vault.
- Split the JWT secret from the encryption master key.
- Implement key rotation and re-wrapping for old DEKs.
- Remove default admin credentials or require first-run setup.
- Enforce deletion of wrapped keys when records are removed.
- Add failed-login throttling and account lockout policies beyond the current simple threshold.
- Add integrity checks for backups and audit trails.
- Add automated tests for the encryption and decryption paths.

### OWASP / NIST-aligned recommendations
- Use a dedicated KMS or HSM for master key protection (NIST SP 800-57 guidance).
- Enforce strong secrets rotation and separation of duties.
- Apply least privilege for admin and auditor roles.
- Log security-relevant events without storing plaintext secrets.
- Prefer environment injection and secret managers over local `.env` files in production.
