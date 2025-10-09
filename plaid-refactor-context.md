# Plaid Integration Standardization - Workflow Context

**Date**: October 7, 2025  
**Workflow**: coding-task-workflow-with-loops v0.8.0  
**Complexity**: Medium  
**Automation Level**: High

## 1. ORIGINAL TASK CONTEXT

**Task**: Complete Plaid integration standardization by refactoring Dashboard.tsx and Onboarding.tsx to use the `useStandardPlaidIntegration` hook.

**Complexity Classification**: Medium
- Multi-file refactoring (2 components + 1 deprecation)
- Proven pattern exists (reduces complexity)
- UX preservation required (Onboarding step flow)
- Low technical risk, moderate scope

**Re-Triage Decision**: CONFIRMED Medium complexity
- No hidden risks discovered
- Pattern is working in Accounts.tsx
- Clear implementation path

**Automation Level**: High (auto-approve confidence >8/10)

## 2. USER RULES AND PREFERENCES

**Architecture**: Clean Architecture (Controllers→Services→Repositories), Security First  
**Error Handling**: Standard ErrorBoundary pattern (replace PlaidErrorBoundary)  
**React Patterns**: React Query for API calls, hook pattern for Plaid  
**Code Structure**: Import order (React hooks → UI → API → Types)  
**TypeScript**: Full typing, no `any` types  
**Testing**: Minimum 80% coverage for modified components  
**Git**: Conventional commits (`type(scope): description`), commit after successful steps  
**Implementation Order**: Dashboard.tsx first, then Onboarding.tsx

## 3. CODEBASE ANALYSIS SUMMARY

**Key Files Analyzed**:
- `/client/src/pages/Dashboard.tsx` - Uses ConnectAccountModal, needs direct hook
- `/client/src/pages/Onboarding.tsx` - Uses PlaidErrorBoundary, inline usePlaidLink, step-based flow
- `/client/src/components/modals/ConnectAccountModal.tsx` - To be deprecated
- `/client/src/hooks/useStandardPlaidIntegration.ts` - Proven hook with token caching
- `/client/src/pages/Accounts.tsx` - Reference implementation

**Patterns Identified**:
- ErrorBoundary wrapper pattern (standard across components)
- useStandardPlaidIntegration hook usage (Accounts.tsx reference)
- Session-level token caching (30-min TTL via React Query)
- Create-first, update-later account flow
- Toast notifications for success/error feedback

**Dependencies**:
- Dashboard: ConnectAccountModal (to be removed)
- Onboarding: PlaidErrorBoundary (to be replaced), inline usePlaidLink (to be removed)

## 4. DECISION LOG

**Phase 0 - Triage**:
- Classified as Medium complexity
- High automation approved
- User rules documented

**Phase 2 - Clarifications**:
- Dashboard: Remove modal, direct hook integration
- Onboarding: Replace error boundary, preserve step UX
- ConnectAccountModal: Deprecate after refactors
- Testing: Manual testing priority

**Phase 3 - Specification**:
- Created comprehensive spec: `/plaid-refactor-spec.md`
- Implementation order: Dashboard → Onboarding → Cleanup
- Risk mitigation strategies documented

## 5. CLARIFICATIONS AND DECISIONS

**Q: How to handle Dashboard.tsx?**  
A: Remove ConnectAccountModal completely, use useStandardPlaidIntegration hook directly on "Connect Account" button click

**Q: How to preserve Onboarding UX?**  
A: Keep step-based flow intact (step 2 = bank connection), only swap Plaid integration logic, maintain setStep() and plaidLinked state

**Q: What about ConnectAccountModal?**  
A: Deprecate after Dashboard refactor - no longer needed with hook pattern

**Q: Testing approach?**  
A: Manual testing priority (hook already tested in Accounts.tsx), unit tests optional

**Technical Approach**:
- Follow exact pattern from Accounts.tsx
- Replace PlaidErrorBoundary with standard ErrorBoundary
- Use same toast notification messages
- Maintain all existing UI states and navigation

## 6. SPECIFICATION SUMMARY

**Objectives**:
1. Standardize Dashboard.tsx - Remove modal, direct hook usage
2. Standardize Onboarding.tsx - Replace error boundary, integrate hook, preserve steps
3. Deprecate ConnectAccountModal.tsx

**Constraints**:
- UX preservation (exact same user experience)
- No breaking changes
- TypeScript strict (no `any` types)
- Follow import order convention

**Design Principles**:
- Reuse proven hook pattern
- Maintain existing error handling via ErrorBoundary
- Consistent toast notifications
- Session-level token caching

**Integration Approach**:
- Dashboard: Replace modal trigger with `connectAccount()` call
- Onboarding: Replace inline Plaid logic with hook, keep step navigation
- Both: Add `ready` and `isLoading` disabled states to buttons

## 7. WORKFLOW PROGRESS

✅ **Completed Phases**:
- Phase 0: Intelligent Triage (Medium complexity, High automation)
- Phase 0b: User Rules Identification (17 rules documented)
- Phase 2: Informed Clarification (4 key decisions)
- Phase 2b: Dynamic Re-Triage (Confirmed Medium)
- Phase 3: Specification Created (`/plaid-refactor-spec.md`)
- Phase 3b: Context Documentation (this file)

🔄 **Current Phase**: Phase 4 - Implementation Planning

⏳ **Remaining Phases**:
- Phase 4: Create Implementation Plan
- Phase 5: Implementation Steps (Dashboard → Onboarding → Cleanup)
- Phase 6: Devil's Advocate Review
- Phase 7: Verification & Completion

📋 **Context Variables Set**:
- `taskComplexity`: "Medium"
- `automationLevel`: "High"
- `requestDeepAnalysis`: false
- `proposedDowngrade`: false
- `specificationFile`: "/Users/stephenwarren/Developer/webudget/plaid-refactor-spec.md"
- `implementationOrder`: ["Dashboard.tsx", "Onboarding.tsx", "ConnectAccountModal.tsx deprecation"]

📁 **Files Created**:
- `/Users/stephenwarren/Developer/webudget/plaid-refactor-spec.md`
- `/Users/stephenwarren/Developer/webudget/plaid-refactor-context.md` (this file)

## 8. RESUMPTION INSTRUCTIONS

**How to Resume This Workflow:**

1. **Get Workflow Definition**:
```javascript
workflow_get({
  id: "coding-task-workflow-with-loops",
  mode: "preview"
})
```

2. **Continue from Current Step**:
```javascript
workflow_next({
  workflowId: "coding-task-workflow-with-loops",
  completedSteps: [
    "phase-0-intelligent-triage",
    "phase-0b-user-rules-identification",
    "phase-2-informed-clarification",
    "phase-2b-dynamic-retriage",
    "phase-3-specification",
    "phase-3b-create-context-doc"
  ],
  context: {
    "taskComplexity": "Medium",
    "automationLevel": "High",
    "task": "Implement remaining Plaid integration standardization...",
    "specificationFile": "/Users/stephenwarren/Developer/webudget/plaid-refactor-spec.md",
    "implementationOrder": ["Dashboard.tsx", "Onboarding.tsx", "ConnectAccountModal.tsx deprecation"],
    // ... (include all context variables from section 7)
  }
})
```

3. **Function Definitions Reference**:
- `updateDecisionLog()`: Update Decision Log in CONTEXT.md with file paths/ranges, excerpts, impact
- `useTools()`: Use tools to verify, never guess. Expand file reads to imports/models/deps
- `createFile(filename)`: Use edit_file to create/update. Summarize only, never output full content
- `applyUserRules()`: Apply user-defined rules, document alignment in Decision Log
- `matchPatterns()`: Use codebase_search/grep to find similar patterns
- `gitCommit(type, msg)`: Commit with conventional format, log in CONTEXT.md if git unavailable
- `verifyImplementation()`: Test coverage >80%, run tests, self-review

## 9. HANDOFF INSTRUCTIONS

**Critical Files to Attach**:
1. `/Users/stephenwarren/Developer/webudget/plaid-refactor-spec.md` - Full specification
2. `/Users/stephenwarren/Developer/webudget/plaid-refactor-context.md` - This context document
3. `/client/src/hooks/useStandardPlaidIntegration.ts` - Reference hook implementation
4. `/client/src/pages/Accounts.tsx` - Reference usage pattern

**Key Decision Summary**:
- Dashboard: Remove modal completely, direct hook integration
- Onboarding: Preserve step flow, swap Plaid logic only
- Modal: Deprecate after successful refactors
- Testing: Manual priority, hook already tested

**Implementation Readiness**:
- ✅ Specification complete
- ✅ Hook pattern proven and working
- ✅ User rules documented
- ✅ Implementation order defined
- ✅ Risk mitigation strategies in place

**Next Immediate Action**: Proceed to Phase 4 (Implementation Planning) to create detailed step-by-step implementation plan for Dashboard.tsx refactor.

---
*Context documentation complete. Ready for implementation phase.*
