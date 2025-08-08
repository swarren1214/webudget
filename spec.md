# Database Schema Fix Specification
**Version:** 1.0  
**Date:** August 8, 2025  
**Complexity:** Large  

## Task Description

Fix systematic database table schema mismatch where controllers query non-existent `institutions` table, causing 500 errors across critical endpoints. Implement comprehensive architectural improvements to establish proper Clean Architecture patterns while resolving the immediate issue.

**Root Cause:** Database contains only `plaid_items` table from migrations, but 4+ controllers systematically query non-existent `institutions` table, causing system-wide failures.

## Key Objectives & Success Criteria

### Primary Objectives
1. **Eliminate 500 Errors:** All controllers successfully query correct database tables
2. **Establish Data Model:** Create proper `institutions` table with relationships to `plaid_items`
3. **Implement Repository Pattern:** Abstract all data persistence logic from controllers
4. **Maintain API Contracts:** Preserve existing `/api/v1/institutions` endpoint behavior
5. **Ensure System Health:** Health checks pass without database errors

### Success Criteria
- ✅ All health, institutions, accounts, and plaid endpoints return 200/proper status codes
- ✅ Database schema includes `institutions` table with proper foreign key relationships
- ✅ Controllers no longer contain direct Supabase/database queries
- ✅ Repository layer abstracts all data access for institutions and plaid_items
- ✅ Service layer maintains existing method signatures while using new repositories
- ✅ Unit test coverage >80% for new repository and service code
- ✅ Integration tests verify cross-layer functionality
- ✅ Migration safely populates institutions from existing plaid_items data

## Scope and Constraints

### In Scope
1. **Database Schema Changes**
   - Create `institutions` table migration
   - Establish foreign key relationships with `plaid_items`
   - Add proper indexes for performance
   - Populate institutions from existing plaid_items data

2. **Repository Layer Implementation**
   - Create `postgres-institution.repository.ts` following existing patterns
   - Define `IInstitutionRepository` interface in `/repositories/interfaces/`
   - Implement dependency injection abstractions
   - Add comprehensive unit tests

3. **Service Layer Refactoring**
   - Refactor direct database queries to use repository abstractions
   - Maintain existing service method signatures for API compatibility
   - Update dependency injection patterns per user rules
   - Add/update service layer unit tests

4. **Controller Layer Updates**
   - Remove all direct Supabase queries from controllers
   - Inject repository dependencies per Clean Architecture
   - Preserve existing API response formats
   - Update error handling to use custom error classes

5. **Type System Updates**
   - Define shared Institution types in `/src/types/`
   - Update existing interfaces to reflect new data model
   - Ensure type safety across all layers

### Out of Scope
- Frontend/client-side changes (API contracts preserved)
- Other table schema issues not related to institutions
- Performance optimization beyond basic indexing
- API versioning or deprecation strategies

### Constraints
- **Zero Downtime:** Changes must not break existing functionality during deployment
- **Data Safety:** All existing plaid_items data must be preserved
- **Backwards Compatibility:** Existing API endpoints maintain same response structure
- **User Rules Compliance:** Must follow all established architectural patterns
- **Testing Requirements:** Comprehensive test coverage required before deployment

## Existing Patterns & Conventions

### Architecture Patterns (matchPatterns)
- **Repository Pattern:** Follow `postgres-plaid-item.repository.ts` as template
- **Dependency Injection:** Services define type abstractions, controllers inject concrete implementations
- **Error Handling:** Use custom error classes with standardized JSON responses
- **Testing:** Co-locate unit tests with source files using Jest

### Code Conventions (applyUserRules)
- **TypeScript Types:** Shared types in `/src/types/` for multi-module usage
- **Clean Architecture:** Strict layered separation (Controllers → Services → Repositories)
- **Request Validation:** Use `zod` for validation in dedicated middleware
- **Migration Strategy:** Use node-pg-migrate for all database schema changes
- **Commit Format:** `fix(db): resolve institutions table schema mismatch`

## System Integration Approach

### Database Layer Integration
- Create new migration following existing naming convention: `TIMESTAMP_create-institutions-table.js`
- Establish proper foreign key relationship: `institutions.id` ← `plaid_items.institution_id`
- Use existing Supabase client configuration
- Follow existing connection patterns in `/config/database.ts`

### Repository Layer Integration
- Follow factory pattern from `repository.factory.ts`
- Implement interface-based dependency injection
- Use existing transaction patterns from `postgres-unit-of-work.ts`
- Match naming conventions: `postgres-institution.repository.ts`

### Service Layer Integration
- Maintain existing service signatures for `getUserInstitutions`, `archiveInstitution`, etc.
- Use existing dependency injection patterns from `plaid.service.ts`
- Preserve business logic while changing data access layer
- Follow existing error propagation patterns

### Controller Layer Integration
- Inject repository dependencies through existing dependency injection patterns
- Maintain existing API route structures in `/api/routes/`
- Use existing middleware patterns for validation and error handling
- Preserve response formats for frontend compatibility

## Impact on Components & Workflows

### Affected Components
1. **health.controller.ts** - Remove direct institutions query from health check
2. **institution.controller.ts** - Refactor all 4 direct database queries
3. **accounts.controller.ts** - Update institutions query with accounts relationship
4. **plaid.controller.ts** - Refactor institution-related operations
5. **plaid.service.ts** - Update service methods to use repository abstractions

### Workflow Impacts
- **Development:** Developers must use repository layer for all data access
- **Testing:** New repository abstractions require comprehensive test coverage
- **Deployment:** Migration must run before application deployment
- **Monitoring:** Health checks will properly validate database connectivity

## Testing & Quality Alignment

### Unit Testing Strategy
- **Repository Tests:** Mock database client, test query logic and error handling
- **Service Tests:** Mock repository dependencies, test business logic isolation
- **Controller Tests:** Mock service dependencies, test HTTP request/response handling
- **Target Coverage:** >80% for all new code, maintain existing coverage levels

### Integration Testing Strategy
- **Database Integration:** Test repository layer against test database
- **API Integration:** Test full request flow with test data
- **Migration Testing:** Verify data migration safety with realistic datasets

### Quality Gates
- All tests pass before merge
- Linting and formatting compliance
- No direct database queries in controllers (architectural compliance)
- Repository interfaces properly define abstractions
- Error handling follows established patterns

## Technical Implementation Notes

### Data Migration Strategy
1. Create institutions records from existing plaid_items data
2. Add institution_id foreign key to plaid_items
3. Establish referential integrity constraints
4. Create performance indexes for common query patterns

### Performance Considerations
- Index institution_id foreign key in plaid_items
- Consider compound indexes for common query patterns
- Optimize repository query patterns for typical use cases

### Error Handling Strategy
- Use existing custom error classes (NotFoundError, ValidationError)
- Maintain existing error response format
- Add proper error logging with structured format (no PII)
- Repository layer should propagate business-appropriate errors

## Dependencies & Prerequisites
- Existing database migrations must be applied
- Test database environment for integration testing
- Existing Supabase client configuration
- Jest testing infrastructure
- TypeScript compilation pipeline

This specification provides comprehensive guidance for implementing a maintainable, scalable, and performant solution that resolves the database schema mismatch while establishing proper architectural patterns for future development.
