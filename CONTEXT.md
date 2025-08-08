# CONTEXT.md - Database Schema Fix Implementation

## 1. ORIGINAL TASK CONTEXT
- **Task:** Fix systematic database schema mismatch where controllers query non-existent `institutions` table
- **Root Cause:** 4+ controllers query `institutions` table that doesn't exist; only `plaid_items` exists in migrations
- **Impact:** 500 errors across health, institutions, accounts, plaid endpoints
- **Complexity:** Large (confirmed after deep analysis - architectural violations amplify scope)
- **Automation Level:** High (user prioritizes maintainability/scalability over timeline)
- **Re-triage Decision:** Maintained Large complexity due to discovered architectural debt

## 2. USER RULES AND PREFERENCES
- **Clean Architecture:** Controllers→Services→Repositories with strict separation
- **Repository Pattern:** Abstract all data persistence, only repos know DB schema
- **Dependency Injection:** Services define abstractions, controllers inject implementations
- **Testing Strategy:** Co-located unit tests, >80% coverage, mock external dependencies
- **Migration Strategy:** Database changes via node-pg-migrate files only
- **Commit Format:** Conventional commits: `fix(db): resolve institutions table schema mismatch`
- **Quality Priority:** Maintainability, scalability, deployability, performance over speed

## 3. CODEBASE ANALYSIS SUMMARY
- **Architecture:** Express.js + TypeScript + PostgreSQL + Supabase client + Clean Architecture
- **Violations Found:** Controllers directly query DB instead of using repositories
- **Existing Patterns:** `postgres-plaid-item.repository.ts` template, dependency injection in services
- **Testing Infrastructure:** Jest with co-located tests, existing repository test patterns
- **Migration System:** node-pg-migrate with 3 existing migrations, no institutions table created

## 4. DECISION LOG
### Phase 0c - Architecture Overview
- **Key Pattern:** Repository factory with interface-based abstractions
- **Missing Component:** Institution repository despite controller dependencies
- **Critical Files:** 4 controllers with 18+ direct `institutions` queries

### Phase 2 - Clarification Decisions
- **Data Model Strategy:** Create institutions table with proper plaid_items relationships
- **Repository Scope:** Full Repository Pattern implementation across all layers
- **API Compatibility:** Preserve existing endpoint contracts for frontend stability
- **Testing Approach:** Comprehensive unit + integration testing strategy

### Phase 3 - Specification Influences  
- **Architectural Decision:** Eliminate all direct DB queries from controllers
- **Migration Strategy:** Safe data population from existing plaid_items
- **Performance Optimization:** Proper indexing for new table relationships

### Phase 4 - Design Creation
- **`/design.md`** - Detailed architectural design (200+ lines)
- **Key Patterns:** Repository interfaces, dependency injection, data migration strategy  
- **Implementation Blueprint:** Concrete technical design following existing code patterns

### Phase 5 - Implementation Planning
- **`/implementation_plan.md`** - Comprehensive implementation plan (280+ lines)
- **8-Step Strategy:** Types → Migration → Repository → Factory → Services → Controllers → Data Migration → Testing
- **Pattern Templates:** References specific existing files as implementation guides

## 5. CLARIFICATIONS AND DECISIONS
**Q:** Data model approach - create table vs refactor controllers?
**A:** Create institutions table + full Repository Pattern for maintainable architecture

**Q:** Repository Pattern scope - minimal fix vs comprehensive implementation?
**A:** Comprehensive - eliminate all architectural violations for long-term health

**Q:** API backwards compatibility requirements?
**A:** Maintain existing contracts while fixing underlying data access patterns

**Scope Boundaries:**
- ✅ In: Database schema, repositories, services, controllers, types, tests, migration
- ❌ Out: Frontend changes, other table issues, API versioning

## 6. SPECIFICATION SUMMARY
- **Primary Objectives:** Eliminate 500 errors + establish Clean Architecture compliance
- **Success Criteria:** All endpoints return proper status + Repository Pattern implemented + >80% test coverage
- **Technical Approach:** New institutions table + Repository abstractions + Service refactoring + Controller dependency injection
- **Quality Gates:** Zero downtime migration + data safety + backwards compatibility
- **Implementation Strategy:** Follow existing patterns from `postgres-plaid-item.repository.ts`

## 7. WORKFLOW PROGRESS
✅ **Completed Phases:**
- Phase 0: Intelligent triage (Large complexity)
- Phase 0b: User rules identification (16 rules captured)
- Phase 0c: Architecture overview (Clean Architecture with violations)
- Phase 2: Informed clarification (6 strategic questions answered)
- Phase 2b: Dynamic re-triage (Large complexity confirmed)
- Phase 3: Specification creation (165-line comprehensive spec)
- Phase 3b: Context documentation (this document)

🔄 **Current Phase:** Phase 4 - Design and Planning

⏳ **Remaining Phases:** 4 (Design), 5 (Implementation Planning), 6 (Implementation), 7 (Verification)

📋 **Context Variables Set:**
- `taskComplexity`: "Large"
- `automationLevel`: "High" 
- `specificationComplete`: true
- `architectureOverview`: Detailed analysis captured
- `clarifiedRequirements`: Strategic approach defined

## 8. RESUMPTION INSTRUCTIONS
**Function Definitions for Reference:**
```
fun updateDecisionLog() = 'Update Decision Log in CONTEXT.md: file paths/ranges, excerpts, why important, outcome impact. Limit 3-5 files/decision.'
fun createFile(filename) = 'Use edit_file to create/update {filename}. NEVER output full content in chat—only summarize.'
fun applyUserRules() = 'Apply & reference user-defined rules, patterns & preferences. Document alignment in Decision Log.'
fun matchPatterns() = 'Use codebase_search/grep to find similar patterns. Reference Decision Log patterns.'
fun gitCommit(type, msg) = 'If git available: commit with {type}: {msg}. If unavailable: log in CONTEXT.md with timestamp.'
```

**How to Resume:**
1. Call: `mcp_workrail_workflow_get(id: "coding-task-workflow-with-loops", mode: "preview")`
2. Call: `mcp_workrail_workflow_next(workflowId: "coding-task-workflow-with-loops", completedSteps: ["phase-0-intelligent-triage", "phase-0b-user-rules-identification", "phase-0c-overview-gathering", "phase-2-informed-clarification", "phase-2b-dynamic-retriage", "phase-3-specification", "phase-3b-create-context-doc"], context: {"taskComplexity": "Large", "automationLevel": "High", "specificationComplete": true, "architectureOverview": "...", "clarifiedRequirements": "...", "userRules": [...]})`

## 9. HANDOFF INSTRUCTIONS
**Critical Files to Review:**
- `/spec.md` - Complete implementation specification (165 lines)
- `/CONTEXT.md` - This comprehensive context document
- `/server/migrations/1750195973683_create-initial-schema.js` - Current DB schema
- `/server/src/repositories/postgres-plaid-item.repository.ts` - Repository pattern template
- `/server/src/controllers/institution.controller.ts` - Primary affected controller (4+ queries)

**Key Decisions Made:**
1. Create institutions table with plaid_items relationships (not refactor approach)
2. Implement full Repository Pattern (not minimal fix)
3. Maintain API contracts (preserve frontend compatibility)  
4. Comprehensive testing strategy (unit + integration)
5. Safe migration with data population (zero downtime)

## 8. WORKFLOW PROGRESS
✅ **Completed Phases:**
- Phase 0: Intelligent triage + User rules + Architecture overview
- Phase 2: Requirements clarification + Dynamic re-triage  
- Phase 3: Specification creation + Context documentation
- Phase 4: Architectural design
- Phase 5: Implementation planning + Devil's Advocate review + Plan finalization + Sanity check + Context update

🔄 **Current Phase:** Ready for Phase 6 (Implementation)

⏳ **Remaining Phases:** 6 (Implementation), 7 (Verification)

📁 **Deliverables Created:** `spec.md`, `design.md`, `implementation_plan.md`, `future_enhancements.md`, `CONTEXT.md`
