# Security & Compliance Strategy

## Multi-Tenant Isolation

The platform guarantees data sovereignty for each entity within the group (Company 1, 2, 3) while allowing the Group Director (Paolo Picchio) oversight.

### Mechanism: Row-Level Security (RLS)

We utilize Firestore Security Rules to enforce isolation at the database kernel level.

```javascript
match /contracts/{contractId} {
  allow read: if isGroupDirector() || isSameCompany(resource.data.companyId);
}
```

- **Group Director**: Full visibility (Read/Write).
- **Company Admin**: Visibility limited strictly to documents tagged with their `companyId`.
- **Analyst**: Read-only access to their company's documents.

## Data Protection

- **Encryption at Rest**: All data in Firestore and Storage is encrypted by default (Google Cloud Standard).
- **Encryption in Transit**: All API communication uses TLS 1.3.

## AI Safety & GDPR Compliance

- **Provider**: AWS Bedrock (Eu-Central-1 / US-East-1).
- **Data Privacy**:
  - **Zero Retention**: AWS explicitly guarantees that inputs and outputs are NOT used to train the base models.
  - **Isolation**: Inference occurs in a secure environment isolated from the public internet.
- **PII Scrubbing**: (Planned) Pre-processing step to redact names/dates before sending to AI, if required by GDPR.

## Access Control

- **Authentication**: Enterprise-grade identity management (SSO capable).
- **Audit Logs**: All "Approve" and "Modify" actions are logged with timestamp and User ID for legal non-repudiation.
