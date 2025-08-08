# Implementation Plan - Database Schema Fix
**Version:** 1.0  
**Date:** August 8, 2025  
**Dependencies:** spec.md, design.md, CONTEXT.md  

## 1. Goal Clarification

### Primary Goals from Specification
- **Immediate Fix:** Eliminate 500 errors across health, institutions, accounts, plaid endpoints
- **Architectural Improvement:** Establish proper Repository Pattern eliminating direct DB queries from controllers
- **Data Integrity:** Create normalized institutions table with safe migration from existing plaid_items
- **System Reliability:** Maintain API contracts ensuring zero frontend impact
- **Quality Assurance:** Achieve >80% test coverage with comprehensive unit/integration tests

### Success Metrics
- ✅ All 4 affected controllers return proper HTTP status codes (200/proper responses)
- ✅ Health check passes without database errors
- ✅ Repository layer properly abstracts all institution data access
- ✅ Service layer maintains existing method signatures
- ✅ Database migration completes safely with referential integrity
- ✅ Test coverage exceeds 80% for new repository and service code

## 2. User Rules Application (applyUserRules)

### Clean Architecture Compliance
- **Controllers:** Only handle HTTP request/response, inject repository dependencies
- **Services:** Accept repository abstractions as function parameters
- **Repositories:** Own all SQL queries and database knowledge
- **Types:** Shared Institution types in `/src/types/institution.ts`

### Testing Strategy Alignment
- **Unit Tests:** Co-locate with source files using existing Jest patterns
- **Mock Strategy:** Mock repository dependencies in service tests (no jest.mock imports)
- **Integration Tests:** Test repositories against actual database connections

### Migration & Git Strategy
- **Database Changes:** Use node-pg-migrate following existing `1750195973683_create-initial-schema.js` pattern
- **Commit Format:** `fix(db): resolve institutions table schema mismatch`
- **Branch Strategy:** `fix/institutions-table-schema-mismatch`

### Error Handling Consistency
- **Custom Errors:** Use existing `NotFoundError`, `ValidationError` classes
- **Structured Logging:** Follow existing pino patterns, no PII/secrets
- **Error Propagation:** Repository → Service → Controller → Middleware

## 3. Pattern Matching Strategy

### Repository Pattern Template
**Source:** `/server/src/repositories/postgres-plaid-item.repository.ts`
- ✅ Constructor injection with `DbConnection` parameter
- ✅ Interface-based abstraction in `/interfaces/` directory
- ✅ Proper error logging with structured format
- ✅ Transaction support through injected connection

### Service Dependency Injection Template  
**Source:** `/server/src/services/plaid.service.ts` 
- ✅ Functions accept repository abstractions as parameters: `getUserInstitutions(userId, findInstitutionsFn)`
- ✅ Controllers inject concrete implementations when calling services
- ✅ Type definitions for function signatures: `FindInstitutionsByUserIdFn`

### Migration Pattern Template
**Source:** `/server/migrations/1750195973683_create-initial-schema.js`
- ✅ Use `pgm.createTable()` with proper column definitions and constraints
- ✅ Add performance indexes with `pgm.createIndex()`
- ✅ Foreign key relationships with `references` and `onDelete` behavior

### Test Pattern Template
**Source:** `/server/src/repositories/postgres-plaid-item.repository.test.ts`
- ✅ Co-located test files following `*.test.ts` naming convention
- ✅ Mock database connections and verify query behavior
- ✅ Test both success paths and error conditions

## 4. Impact Assessment

### Direct Code Impact
- **4 Controllers:** institution, health, accounts, plaid (remove direct Supabase queries)
- **2 Services:** plaid.service.ts, institution.service.ts (add repository dependencies)
- **1 Repository:** New postgres-institution.repository.ts implementation
- **1 Factory:** Update repository.factory.ts with institution repository
- **Types:** New institution.ts type definitions

### Database Impact
- **Schema:** New institutions table with 8 columns + indexes
- **Data Migration:** Population from existing 50+ plaid_items records (estimated)
- **Relationships:** Foreign key constraint from plaid_items to institutions
- **Performance:** New indexes on foreign keys and plaid_institution_id

### Testing Impact
- **New Tests:** Institution repository unit tests + service integration tests
- **Updated Tests:** Existing controller tests need repository mocking
- **Coverage:** Estimated 15-20 new test files with >80% coverage target

### Deployment Impact
- **Migration:** Must run before application deployment to avoid 500 errors
- **Rollback:** Migration down script required for safe rollback capability
- **Zero Downtime:** Backwards compatible changes until full migration complete

## 5. Implementation Strategy

### Step 1: Data Assessment and Validation
**Rationale:** Validate assumptions about existing data before making schema changes (addresses Devil's Advocate data volume risk)
**Template:** Database inspection patterns using SQL queries
**Files Assessed:**
- Query existing `plaid_items` table for data volume and integrity
- Check `plaid_institution_id` uniqueness and null values
- Analyze institution_name patterns and completeness

**Input:** Production database access
**Output:** Data assessment report with volume metrics and validation results
**Validation:** All plaid_institution_id values unique and non-null, data volume manageable for migration
**Risk Mitigation:** Identifies data issues before schema changes to prevent migration failures

### Step 2: Create Type Definitions and Interfaces
**Rationale:** Establish contracts before implementation
**Template:** Following `/src/types/auth.ts` pattern
**Files Created:**
- `/src/types/institution.ts` - Core Institution types
- `/repositories/interfaces/institution.repository.interface.ts` - Repository contract

**Input:** design.md type definitions
**Output:** TypeScript interfaces with proper exports
**Validation:** TypeScript compilation succeeds, no circular dependencies

### Step 3: Database Migration with Safety Measures
**Rationale:** Create data layer foundation with enhanced safety measures (addresses Devil's Advocate migration risks)
**Template:** `/migrations/1750195973683_create-initial-schema.js`
**Files Created:**
- `/migrations/TIMESTAMP_create-institutions-table.js` - Schema creation with nullable FK initially
- Migration up/down scripts with transaction safety and data validation

**Enhanced Safety Measures:**
- Create institutions table with indexes but without FK constraints initially
- Add unique constraint on plaid_institution_id with proper error handling
- Include data validation checks before constraint creation
- Implement rollback procedures with data cleanup

**Input:** Design schema definitions + data assessment results
**Output:** Executable migration with enhanced safety and rollback procedures
**Validation:** Migration runs successfully against test database with realistic data volumes

### Step 3: Repository Implementation
**Rationale:** Build data access layer following existing patterns
**Template:** `/repositories/postgres-plaid-item.repository.ts`
**Files Created:**
- `/repositories/postgres-institution.repository.ts` - Implementation
- `/repositories/postgres-institution.repository.test.ts` - Unit tests

**Input:** Repository interface contract
**Output:** Complete repository with CRUD operations + tests
**Validation:** All repository unit tests pass, >80% coverage

### Step 4: Repository Factory Integration
**Rationale:** Integrate new repository into dependency injection system
**Template:** `/repositories/repository.factory.ts` existing patterns
**Files Modified:**
- `/repositories/repository.factory.ts` - Add getInstitutionRepository method
- `/config/dependencies.ts` - Wire institution repository

**Input:** Repository implementation
**Output:** Factory method returning institution repository instance
**Validation:** Dependency injection container resolves institution repository

### Step 5: Service Layer Refactoring
**Rationale:** Update business logic to use repository abstractions
**Template:** `/services/plaid.service.ts` dependency injection pattern
**Files Modified:**
- `/services/plaid.service.ts` - Add repository parameters to functions
- `/services/institution.service.ts` - Update existing functions
- Co-located test files with repository mocking

**Input:** Repository abstractions
**Output:** Services using repository dependencies, existing signatures preserved
**Validation:** Service unit tests pass with mocked repositories

### Step 6: Controller Refactoring  
**Rationale:** Remove direct database queries, inject repository dependencies
**Template:** Existing controller dependency injection patterns
**Files Modified:**
- `/controllers/institution.controller.ts` - Remove 4+ direct Supabase queries
- `/controllers/health.controller.ts` - Replace institutions query with repository
- `/controllers/accounts.controller.ts` - Update institutions query via repository
- `/controllers/plaid.controller.ts` - Use repository for institution operations

**Input:** Repository and service abstractions
**Output:** Controllers using proper dependency injection, no direct DB queries
**Validation:** All controller endpoints return proper responses, integration tests pass

### Step 8: Data Migration with Validation and Constraints
**Rationale:** Safely populate institutions and establish FK relationships with proper validation (addresses Devil's Advocate concurrency and rollback risks)
**Template:** Enhanced data migration following existing patterns with transaction isolation
**Files Created:**
- `/migrations/TIMESTAMP_populate-institutions-from-plaid-items.js`
- Transaction-safe data population with concurrency controls
- Constraint addition after successful data migration
- Enhanced rollback procedures with data cleanup

**Enhanced Data Migration Process:**
1. **Pre-Migration Validation:** Verify all plaid_institution_id values are unique and complete
2. **Atomic Population:** Use transaction isolation to prevent concurrent institution creation
3. **FK Relationship:** Add institution_id to plaid_items with proper referential integrity  
4. **Constraint Addition:** Add FK constraints only after successful data population
5. **Validation Checks:** Verify all plaid_items have corresponding institutions
6. **Rollback Safety:** Include procedures to clean up orphaned data on failure

**Input:** Existing plaid_items table data + populated institutions table
**Output:** Fully related institutions and plaid_items with FK constraints and data integrity
**Validation:** All plaid_items have corresponding institutions, referential integrity maintained, rollback procedures tested

### Step 9: Production Deployment with Health Monitoring
**Rationale:** Verify cross-layer functionality with enhanced production deployment coordination (addresses Devil's Advocate deployment risks)
**Template:** Enhanced deployment procedures with health monitoring
**Files Created:**
- Production deployment coordination procedures
- Health monitoring and rollback triggers
- Integration tests for full request flow with authentication

**Enhanced Deployment Process:**
1. **Pre-Deployment Health Check:** Verify current system health and backup procedures
2. **Migration Execution:** Run database migrations with monitoring and rollback triggers
3. **Application Deployment:** Deploy code changes with staged rollout
4. **Health Validation:** Continuous monitoring of all affected endpoints during deployment
5. **Performance Monitoring:** Track API response times and database query performance
6. **Rollback Triggers:** Automated rollback if health checks fail or performance degrades

**Input:** Complete implementation with passing tests
**Output:** Production system with resolved 500 errors and maintained performance
**Validation:** All integration tests pass, system health check succeeds, API response times within acceptable limits

## 6. Testing Strategy

### Unit Testing Approach
**Pattern Source:** `/repositories/postgres-plaid-item.repository.test.ts`
- **Repository Tests:** Mock `DbConnection`, verify SQL queries and error handling
- **Service Tests:** Mock repository functions, test business logic isolation
- **Controller Tests:** Mock service functions, test HTTP request/response handling

### Integration Testing Approach
**Pattern:** Test against actual database with test data
- **Repository Integration:** Test queries against real PostgreSQL instance
- **API Integration:** Test full request flow with authentication
- **Migration Testing:** Verify data migration safety with realistic datasets

### Test Coverage Requirements
- **Target:** >80% coverage for all new code
- **Repository Layer:** 100% of CRUD operations and error paths
- **Service Layer:** All business logic branches and error conditions
- **Controller Layer:** All HTTP endpoints and error responses

### Test Data Strategy
- **Setup:** Use existing test data patterns from codebase
- **Isolation:** Each test creates/cleans own data to avoid interference
- **Realistic Data:** Use representative plaid_items and institution data

## 7. Failure Handling

### Database Migration Risk Mitigation
- **Data Volume Assessment:** Query production data before migration to estimate execution time
- **Data Validation Protocol:** Verify plaid_institution_id uniqueness and completeness before schema changes
- **Phased Constraint Addition:** Create table first, populate data second, add constraints third
- **Concurrency Controls:** Use proper transaction isolation to prevent race conditions during data population
- **Enhanced Rollback:** Include data cleanup scripts for partial migration scenarios with orphaned records

### Production Deployment Risk Mitigation
- **Deployment Sequencing:** Database migration must complete before application deployment
- **Health Monitoring:** Continuous monitoring during deployment with automated rollback triggers
- **Performance Baseline:** Establish API response time baselines before deployment to detect degradation
- **Staged Rollout:** Deploy to subset of instances first to validate functionality before full deployment

### Test Failure Protocol
- **Repository Test Failure:** Review SQL queries and mock setup
- **Service Test Failure:** Check repository mock configuration and business logic
- **Integration Test Failure:** Verify database state and API authentication
- **Coverage Failure:** Identify untested branches and add specific test cases

### Deployment Failure Protocol
- **Health Check Failure:** Verify database migration completed successfully
- **API Error Responses:** Check repository dependency injection in controllers
- **Performance Issues:** Review index creation and query optimization
- **Rollback Strategy:** Use git revert + database migration rollback

### Tool/Environment Issues
- **TypeScript Compilation:** Fix type imports and interface compliance
- **Database Connection:** Verify test database availability and credentials
- **Jest Test Runner:** Check test file naming and configuration
- **Migration Tool:** Verify node-pg-migrate configuration and permissions

## 8. Final Review Checklist

### Code Quality Gates
- [ ] TypeScript compilation succeeds without errors or warnings
- [ ] All ESLint rules pass with project configuration
- [ ] Prettier formatting applied consistently
- [ ] No direct database queries remain in controllers
- [ ] Repository interfaces properly define all abstractions
- [ ] Service functions maintain existing signatures for API compatibility

### Testing Quality Gates
- [ ] Unit test coverage >80% for all new repository and service code
- [ ] All existing tests continue to pass after refactoring
- [ ] Integration tests verify full request flow functionality
- [ ] Repository tests cover all CRUD operations and error conditions
- [ ] Service tests properly mock repository dependencies
- [ ] Migration tests verify data safety with realistic scenarios

### Database Quality Gates
- [ ] Migration creates institutions table with proper schema
- [ ] Foreign key constraints established between institutions and plaid_items
- [ ] Performance indexes created on plaid_institution_id and institution_id
- [ ] Migration down script successfully removes all changes
- [ ] Data migration populates institutions from existing plaid_items safely
- [ ] Referential integrity maintained throughout migration process

### API Quality Gates
- [ ] All affected endpoints return proper HTTP status codes (not 500)
- [ ] Health check passes without database errors
- [ ] Institution endpoints maintain existing response structure
- [ ] Account endpoints successfully join institutions via repository
- [ ] Plaid endpoints use repository for institution operations
- [ ] Authentication and authorization continue to work correctly

### Documentation Quality Gates
- [ ] Repository interfaces documented with proper JSDoc comments
- [ ] Migration scripts include clear comments explaining schema changes
- [ ] Test files document expected behavior and edge cases
- [ ] Error handling follows existing custom error class patterns
- [ ] Logging uses structured format without PII/secrets

### Deployment Quality Gates
- [ ] Migration scripts tested against copy of production data
- [ ] Repository factory properly wires new institution repository
- [ ] Dependency injection resolves all required abstractions
- [ ] Application starts successfully after migration
- [ ] All critical endpoints respond within acceptable time limits
- [ ] No breaking changes to frontend API contracts

### Final Review Checklist (Enhanced)

### Pre-Implementation Data Quality Gates  
- [ ] Production data volume assessed and within manageable limits for migration
- [ ] All plaid_institution_id values verified as unique and non-null  
- [ ] Institution name data completeness validated across existing plaid_items
- [ ] Migration execution time estimated based on actual data volume
- [ ] Test database populated with realistic production data sample

### Database Quality Gates
- [ ] Migration creates institutions table with proper schema and nullable FK initially
- [ ] Data population completes successfully with transaction isolation
- [ ] Foreign key constraints added only after successful data migration
- [ ] Performance indexes created on plaid_institution_id and institution_id
- [ ] Migration down script successfully removes all changes including data cleanup
- [ ] Referential integrity maintained throughout entire migration process

### Deployment Quality Gates
- [ ] Database migration completes before application deployment begins
- [ ] Health monitoring active during deployment with automated rollback triggers
- [ ] API response time baselines established and monitored during rollout
- [ ] Staged deployment to subset of instances validates functionality first
- [ ] All critical endpoints maintain response times within acceptable limits
- [ ] Rollback procedures tested and ready for immediate execution if needed

This enhanced implementation plan addresses the critical risks identified in the Devil's Advocate review while maintaining the original plan's architectural strengths and pattern alignment.
