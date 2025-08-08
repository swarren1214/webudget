# Architectural Design - Database Schema Fix
**Version:** 1.0  
**Date:** August 8, 2025  
**References:** spec.md, CONTEXT.md  

## 1. High-Level Approach

### Design Philosophy
Build upon existing Clean Architecture patterns while introducing the missing `institutions` abstraction layer. Transform the current architectural violation (direct DB queries in controllers) into a proper layered system that aligns with established patterns from `postgres-plaid-item.repository.ts`.

### Strategic Approach
1. **Create Missing Data Layer:** Add `institutions` table as normalized entity separate from `plaid_items`
2. **Establish Repository Abstractions:** Follow existing `PlaidItemRepository` interface pattern
3. **Maintain Service Contracts:** Preserve existing service method signatures while changing underlying implementation
4. **Eliminate Architectural Violations:** Remove all direct Supabase queries from controllers
5. **Safe Data Migration:** Populate institutions from existing `plaid_items` with referential integrity

## 2. Component Breakdown

### New Components
#### 2.1 Database Schema
- **Table:** `institutions` (new)
- **Migration:** `TIMESTAMP_create-institutions-table.js`
- **Relationships:** `institutions.id` ← `plaid_items.institution_id` (FK)

#### 2.2 Repository Layer
- **Interface:** `IInstitutionRepository` in `/repositories/interfaces/`
- **Implementation:** `PostgresInstitutionRepository` in `/repositories/`
- **Types:** Institution-related types in `/types/institution.ts`

#### 2.3 Test Infrastructure
- **Unit Tests:** `postgres-institution.repository.test.ts`
- **Service Tests:** Updated `plaid.service.test.ts` and `institution.service.test.ts`
- **Integration Tests:** New endpoint tests with repository layer

### Modified Components
#### 2.4 Existing Controllers
- **institution.controller.ts:** Remove 4+ direct Supabase queries, inject repository
- **health.controller.ts:** Remove direct institutions query, use repository
- **accounts.controller.ts:** Remove direct institutions query, use repository  
- **plaid.controller.ts:** Remove direct institutions query, use repository

#### 2.5 Service Layer
- **plaid.service.ts:** Update to use repository abstractions instead of direct queries
- **institution.service.ts:** Add new service methods using repository pattern

#### 2.6 Repository Factory
- **repository.factory.ts:** Add institution repository creation method

## 3. Data Models

### 3.1 Institution Table Schema
```sql
CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    plaid_institution_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7),
    website VARCHAR(255),
    supported_products TEXT[], -- ['transactions', 'auth', 'identity']
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

-- Indexes for performance
CREATE INDEX idx_institutions_plaid_institution_id ON institutions(plaid_institution_id);
```

### 3.2 Updated PlaidItems Relationship
```sql
-- Add foreign key to existing plaid_items table
ALTER TABLE plaid_items ADD COLUMN institution_id INTEGER;
ALTER TABLE plaid_items ADD CONSTRAINT fk_plaid_items_institution 
    FOREIGN KEY (institution_id) REFERENCES institutions(id);

-- Index for join performance
CREATE INDEX idx_plaid_items_institution_id ON plaid_items(institution_id);
```

### 3.3 TypeScript Types
```typescript
// /src/types/institution.ts
export interface Institution {
    id: number;
    plaidInstitutionId: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    website?: string;
    supportedProducts: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInstitutionData {
    plaidInstitutionId: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    website?: string;
    supportedProducts: string[];
}

export interface UpdateInstitutionData {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    website?: string;
    supportedProducts?: string[];
}
```

## 4. API Contracts (Preserve Existing)

### 4.1 Institution Endpoints
All existing endpoints maintain identical response structures:

```typescript
// GET /api/v1/institutions
{
    "data": Institution[],
    "count": number,
    "status": "success"
}

// DELETE /api/v1/institutions/:id
{
    "status": "success",
    "message": "Institution archived successfully"
}

// POST /api/v1/institutions/:id/refresh
{
    "status": "success",
    "data": { syncJobId: string }
}

// GET /api/v1/institutions/can-link
{
    "canLink": boolean,
    "data": { maxLinkedAccounts: number }
}
```

### 4.2 Health Check Response
```typescript
// GET /api/v1/health
{
    "status": "healthy",
    "timestamp": string,
    "services": {
        "database": "connected",
        "plaid": "available"
    }
}
```

## 5. Key Interactions

### 5.1 Repository Layer Pattern
```
Controller → Service → Repository → Database
    ↓         ↓          ↓
[Request] → [Business] → [Data] → [PostgreSQL]
  Logic     Logic      Access
```

### 5.2 Institution Creation Flow
```
1. PlaidItem creation triggers institution lookup
2. Repository checks if institution exists by plaid_institution_id
3. If not exists: Create institution from Plaid metadata
4. If exists: Use existing institution.id for FK relationship
5. Update plaid_item with institution_id foreign key
```

### 5.3 Data Access Flow
```
institution.controller.getInstitutionsHandler()
    ↓
plaid.service.getUserInstitutions(userId, findInstitutionsByUserId)
    ↓
repository.findByUserId(userId)
    ↓
PostgreSQL JOIN query (institutions + plaid_items)
```

## 6. Integration Points

### 6.1 Dependency Injection Pattern
Following existing pattern from `plaid.service.ts`:

```typescript
// Service abstractions
export type FindInstitutionsByUserIdFn = (userId: string) => Promise<Institution[]>;
export type FindInstitutionByIdFn = (id: number) => Promise<Institution | null>;

// Controller injection
export const getInstitutionsHandler = async (req, res, next) => {
    const userId = req.user!.id;
    const institutions = await getUserInstitutions(
        userId, 
        institutionRepository.findByUserId
    );
    res.status(200).json({ data: institutions, count: institutions.length });
};
```

### 6.2 Repository Factory Integration
```typescript
// /repositories/repository.factory.ts
export class DependencyContainer {
    getInstitutionRepository(): IInstitutionRepository {
        return new PostgresInstitutionRepository(this.getDbConnection());
    }
}
```

### 6.3 Error Handling Integration
Use existing custom error classes:
```typescript
// Repository layer
if (!institution) {
    throw new NotFoundError(`Institution with ID ${id} not found`);
}

// Service layer propagates business-appropriate errors
// Controller layer uses existing error middleware
```

## 7. Phase 2 Decisions Impact

### 7.1 Full Repository Pattern Implementation
**Decision:** Implement comprehensive Repository Pattern across all data access layers
**Impact:** All 4 controllers refactored to eliminate direct Supabase queries
**Benefit:** Establishes proper abstraction boundaries, improves testability

### 7.2 API Contract Preservation
**Decision:** Maintain existing endpoint response structures
**Impact:** Frontend requires no changes, seamless deployment
**Implementation:** Repository/service changes are transparent to API layer

### 7.3 Comprehensive Testing Strategy
**Decision:** Unit + integration testing with >80% coverage
**Impact:** New repository interfaces require extensive test coverage
**Approach:** Mock repository dependencies in service tests, test repositories against real DB

## 8. Complexity Factors

### 8.1 Data Migration Complexity
- **Challenge:** Safely populate institutions from existing plaid_items data
- **Solution:** Migration script with transaction safety and rollback capability
- **Risk Mitigation:** Test migration on copy of production data

### 8.2 Multi-Layer Refactoring
- **Scope:** 4 controllers + 2 services + 1 new repository + tests
- **Coordination:** Changes must be synchronized across layers
- **Testing:** Integration tests ensure cross-layer compatibility

### 8.3 Foreign Key Relationship Management
- **Challenge:** Establish referential integrity without breaking existing data
- **Solution:** Add nullable FK initially, populate data, then add constraints
- **Performance:** Proper indexing on foreign key relationships

## 9. Pattern Alignment

### 9.1 Following Existing Repository Pattern
**Template:** `postgres-plaid-item.repository.ts`
- ✅ Constructor dependency injection with `DbConnection`
- ✅ Interface-based abstractions in `/interfaces/` directory  
- ✅ Proper error logging with structured format
- ✅ Transaction support through unit-of-work pattern

### 9.2 Service Layer Dependency Injection
**Template:** `plaid.service.ts` functions like `getUserInstitutions`
- ✅ Service functions accept repository abstractions as parameters
- ✅ Controllers inject concrete repository implementations
- ✅ Business logic decoupled from data access implementation

### 9.3 Migration Pattern
**Template:** `1750195973683_create-initial-schema.js`
- ✅ Use `pgm.createTable()` with proper column definitions
- ✅ Add indexes with `pgm.createIndex()` for performance
- ✅ Foreign key constraints with proper `onDelete` behavior

### 9.4 Testing Pattern
**Template:** `postgres-plaid-item.repository.test.ts`
- ✅ Co-located test files following `*.test.ts` convention
- ✅ Mock external dependencies (database connections)
- ✅ Test both success paths and error conditions

## 10. User Rules Application

### 10.1 Clean Architecture Compliance
- **Controllers:** Only handle HTTP request/response, inject dependencies
- **Services:** Contain business logic, accept repository abstractions
- **Repositories:** Own all data persistence logic and database knowledge

### 10.2 TypeScript Type Safety
- **Shared Types:** Institution types in `/src/types/institution.ts`
- **Interface Contracts:** Proper repository interface definitions
- **Type Imports:** Consistent imports across layers

### 10.3 Testing Requirements
- **Unit Tests:** Co-located with source files using Jest
- **Mock Strategy:** Mock all external dependencies in service tests
- **Coverage Target:** >80% for all new repository and service code

### 10.4 Migration Strategy
- **Database Changes:** All schema changes via node-pg-migrate files
- **Transaction Safety:** Use database transactions for data migration
- **Rollback Support:** Migration down scripts for safe rollback

### 10.5 Error Handling
- **Custom Errors:** Use existing `NotFoundError`, `ValidationError` classes
- **Structured Logging:** JSON logs with pino, no PII/secrets
- **Error Propagation:** Services throw business-appropriate errors

### 10.6 Commit Strategy
- **Conventional Commits:** `fix(db): resolve institutions table schema mismatch`
- **Atomic Changes:** Each implementation step as logical, committable chunk
- **Branch Strategy:** `fix/institutions-table-schema-mismatch`

This design provides a comprehensive blueprint for transforming the current architectural violations into a maintainable, scalable solution that follows established patterns while resolving the immediate database schema mismatch issue.
