Act as a Senior Django Architect and SaaS Backend Engineer.

Build the backend architecture and implementation plan for a production-ready Business Intelligence platform called InsightFlow BI.

Tech Stack:
- Django 5
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Celery
- Redis
- Pandas
- OpenPyXL

IMPORTANT:

Create ONLY the backend.

Do NOT generate frontend code.

The backend must be completely independent and expose REST APIs that any frontend can consume.

Use Clean Architecture and Domain-Driven Design principles.

Project Structure:

backend/

├── apps/
│   ├── authentication/
│   ├── organizations/
│   ├── users/
│   ├── datasets/
│   ├── dashboards/
│   ├── widgets/
│   ├── analytics/
│   ├── reports/
│   ├── notifications/
│   └── audit_logs/
│
├── config/
├── core/
├── media/
├── static/
└── requirements/

Build specifications for:

1. Authentication
- JWT
- Refresh Token
- Forgot Password
- Email Verification

2. Multi Tenant Organizations

3. User Roles
- Super Admin
- Organization Admin
- Analyst
- Viewer

4. Dataset Management
- CSV Upload
- Excel Upload
- Metadata Detection
- Data Type Detection
- Dataset Versioning

5. Dashboard APIs

6. Widget APIs

7. Analytics Engine
- Sum
- Count
- Avg
- Max
- Min
- Group By

8. Report Generation APIs

9. Notification System

10. Audit Logs

Generate:

- Complete folder structure
- Database schema
- ER Diagram
- Django Apps Design
- Models
- Serializers
- Services Layer
- Repository Layer
- API Endpoints
- Permissions Matrix
- Security Architecture
- Celery Architecture
- Redis Usage
- Deployment Strategy
- Testing Strategy

Design everything for enterprise-level scalability.

No code generation initially.

Focus only on backend architecture and implementation blueprint.