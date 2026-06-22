# InsightFlow BI - Backend

InsightFlow BI is a multi-tenant Business Intelligence SaaS backend built with **Django 5**, **Django REST Framework**, and **Celery/Redis**. It supports role-based tenant isolation, CSV/Excel data uploads, metadata schema detection, and in-memory analytical aggregation queries (SUM, AVG, COUNT, etc.) powered by Pandas and PyArrow parquet files.

---

## Technical Stack
- **Web Framework**: Django 5.2 & Django REST Framework (DRF)
- **Database**: SQLite (configured with WAL mode compatibility)
- **Authentication**: JSON Web Tokens (JWT) via SimpleJWT
- **Task Queue**: Celery (with Redis broker)
- **Data Engine**: Pandas & PyArrow (converting CSV/Excel to optimized Parquet files)
- **Report Generation**: OpenPyXL (Excel report compilation)

---

## Project Structure
```
backend/
├── apps/                 # Modular Domain Applications
│   ├── analytics/        # Analytical calculations engine
│   ├── audit_logs/       # Tenant transaction records
│   ├── authentication/   # JWT logins, signups, email verifications
│   ├── dashboards/       # Layout containers
│   ├── datasets/         # Schema ingestion & Parquet versioning
│   ├── notifications/    # Alerting logic
│   ├── organizations/    # SaaS Tenant memberships
│   ├── reports/          # Excel/PDF report scheduling
│   ├── users/            # Custom User profiles
│   └── widgets/          # Dashboard components
├── config/               # Routing & Multi-Env Settings
├── core/                 # Shared Middlewares, Exceptions & Permissions
├── media/                # File uploads (raw files, parquets & reports)
├── static/               # Django static assets compilation
├── requirements/         # Dependencies (base, local, production)
├── manage.py
└── requirements.txt      # Root pointer to local requirements
```

---

## Getting Started

### 1. Prerequisites
Make sure you have the following installed on your machine:
- **Python 3.12+**
- **Redis Server** (running locally on port `6379`, e.g., via Docker or native service)

---

### 2. Installation & Setup

1. **Clone the repository and navigate to the backend root directory**:
   ```bash
   cd Backend
   ```

2. **Create and activate a virtual environment**:
   - **On Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **On macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

### 3. Database Initialization & Migrations

Apply the database migrations to initialize the SQLite database (`db.sqlite3`):
```bash
python manage.py migrate
```

Create a Django superuser account (system-wide admin):
```bash
python manage.py createsuperuser
```
mustafapinjari344@gmail.com
55555
---

### 4. Running the Application

You need to run the Django API server, the Redis broker, and the Celery workers in separate terminal windows.

#### A. Run Django API Server (Default local settings)
```bash
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000/`.

#### B. Start Celery Worker (Optional in Local Dev)
In the local development settings (`config/settings/local.py`), `CELERY_TASK_ALWAYS_EAGER = True` is enabled by default. This executes all Celery tasks (like email dispatching or report compilation) synchronously in-process. Consequently, **you do not need a running Redis server or a separate Celery worker process to test background tasks locally**—merely starting the Django server is enough.

If you wish to test asynchronous execution with Redis, set `CELERY_TASK_ALWAYS_EAGER = False` in `config/settings/local.py`, ensure your local Redis server is running, and start a worker to listen to the default, dataset ingestion, and reporting queues:
- **On Windows** (note: `-P threads` or eventlet is recommended for Celery on Windows):
  ```bash
  celery -A config worker --loglevel=info -P threads
  ```
- **On macOS/Linux**:
  ```bash
  celery -A config worker --loglevel=info
  ```


---

## API Endpoints Overview

All tenant-scoped API routes require the client to supply the resolved organization ID via header parameter:
`X-Organization-Id: <org_uuid>`

### 1. Authentication
- `POST /api/v1/auth/register/`: Account creation & optional organization initialization.
- `POST /api/v1/auth/login/`: Obtains JWT token credentials. Returns user metadata and organization roles.
- `POST /api/v1/auth/refresh/`: Refreshes access tokens.
- `GET /api/v1/auth/verify-email/?token=<jwt_token>`: Verifies registration links.
- `POST /api/v1/auth/forgot-password/` & `POST /api/v1/auth/reset-password/`: Handles credentials recovery.

### 2. Multi-Tenant Resources
- `GET /api/v1/organizations/`: Lists authorized tenants.
- `POST /api/v1/organizations/<id>/invite/`: Invites a user to the organization.
- `GET /api/v1/users/`: Lists users in the current organization.
- `GET /api/v1/users/me/`: Retrieve/Update active profile attributes.

### 3. Data & Analytics
- `POST /api/v1/datasets/`: Register a new dataset.
- `POST /api/v1/datasets/<id>/upload/`: Form multipart upload to ingest files (inferred schemas are compiled to Parquet).
- `POST /api/v1/datasets/<id>/query/`: Run aggregates (`sum`, `avg`, `count`, `max`, `min`), filter data, and retrieve results.

### 4. Layout Layouts & Scheduling
- `GET`, `POST /api/v1/dashboards/`: List/Create dashboards.
- `GET`, `POST /api/v1/dashboards/<id>/widgets/`: Manage layout components.
- `POST /api/v1/reports/`: Schedules recurring dashboard reports compilation.
- `GET /api/v1/audit_logs/`: Retrieve audit records (Org Admins only).
