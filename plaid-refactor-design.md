# Plaid Integration Standardization - Architectural Design

**Version**: 1.0  
**Date**: October 7, 2025  
**Based On**: plaid-refactor-spec.md  
**Complexity**: Medium

## 1. High-Level Approach

### Design Philosophy
Apply the proven `useStandardPlaidIntegration` hook pattern from Accounts.tsx to Dashboard.tsx and Onboarding.tsx, eliminating inconsistent modal and inline implementations while preserving existing UX patterns.

### Core Strategy
- **Template Pattern**: Use Accounts.tsx hook integration as the canonical template
- **Minimal UI Changes**: Preserve all existing UI/UX, swap only Plaid integration logic
- **Error Handling Standardization**: Replace custom error boundaries with standard ErrorBoundary
- **Progressive Refactoring**: Dashboard first (simple), then Onboarding (complex), then cleanup

### Design Principles
1. **Pattern Reuse**: Leverage proven hook implementation
2. **UX Preservation**: Maintain exact user experience
3. **Code Reduction**: Remove redundant modal and inline implementations
4. **Type Safety**: Full TypeScript typing, no `any` types
5. **Consistent Error Handling**: Standard ErrorBoundary everywhere

## 2. Component Breakdown

### 2.1 Dashboard.tsx Modifications

**Current Architecture**:
```
Dashboard Component
├── State: showConnectModal
├── Child: ConnectAccountModal (with accountId={0})
└── Trigger: setShowConnectModal(true)
```

**New Architecture**:
```
Dashboard Component
├── Hook: useStandardPlaidIntegration
├── Button: onClick={connectAccount}
└── No Modal Dependency
```

**Changes Required**:
- **Remove**: `ConnectAccountModal` import
- **Remove**: `showConnectModal` state variable
- **Remove**: Modal JSX (`<ConnectAccountModal isOpen={...} />`)
- **Add**: `useStandardPlaidIntegration` hook import and usage
- **Add**: `useToast` hook for notifications
- **Modify**: "Connect Account" button onClick handler
- **Modify**: Button disabled state based on `ready` and `isLoading`

**File**: `/client/src/pages/Dashboard.tsx`
**Lines Affected**: ~10-15
**Risk Level**: Low

### 2.2 Onboarding.tsx Modifications

**Current Architecture**:
```
Onboarding Component
├── PlaidErrorBoundary wrapper
├── Step state management
├── Inline usePlaidLink hook
├── Manual token management (useEffect)
└── Hardcoded accountId=1
```

**New Architecture**:
```
Onboarding Component
├── Standard ErrorBoundary wrapper
├── Step state management (preserved)
├── useStandardPlaidIntegration hook
└── Account creation automatic
```

**Changes Required**:
- **Replace**: `PlaidErrorBoundary` with standard `ErrorBoundary`
- **Remove**: `PlaidErrorBoundary` import and usage
- **Remove**: `usePlaidLink` import and usage
- **Remove**: `linkToken` state and token fetch `useEffect`
- **Remove**: `usePlaidErrorHandler` hook
- **Add**: `useStandardPlaidIntegration` hook
- **Add**: `useToast` hook
- **Modify**: Connect button onClick to call `connectAccount()`
- **Modify**: onSuccess callback to set `plaidLinked` and increment step
- **Preserve**: All step navigation logic

**File**: `/client/src/pages/Onboarding.tsx`
**Lines Affected**: ~30-40
**Risk Level**: Medium (preserve step flow)

### 2.3 ConnectAccountModal.tsx Deprecation

**Action**: Add deprecation notice without removing (safe approach)

**Changes Required**:
- **Add**: Header comment documenting deprecation
- **Add**: Replacement pattern reference
- **Optional**: Check for other usages before removal

**File**: `/client/src/components/modals/ConnectAccountModal.tsx`
**Lines Affected**: 3-5 (comment only)
**Risk Level**: Minimal

## 3. Data Models & Type Structures

### 3.1 Hook Integration Pattern

```typescript
// From useStandardPlaidIntegration.ts
interface PlaidIntegrationOptions {
  onSuccess?: (accountId: number) => void;
  onError?: (error: PlaidIntegrationError) => void;
  onExit?: () => void;
  invalidateAccountsQuery?: boolean;
  createAccountFirst?: boolean;
}

interface PlaidIntegrationReturn {
  connectAccount: () => Promise<void>;
  ready: boolean;
  isLoading: boolean;
  error: PlaidIntegrationError | null;
}
```

### 3.2 Component-Specific Types

**Dashboard.tsx** - No new types needed, uses existing:
- `Account[]` from `@shared/schema`
- `BudgetCategory[]` from `@shared/schema`
- `Transaction[]` from `@shared/schema`

**Onboarding.tsx** - Preserve existing:
- Step state: `number`
- `plaidLinked`: `boolean`
- `profilePhoto`: `File | null`

## 4. API Contracts

### No API Changes Required
- Backend services unchanged
- All API endpoints remain identical
- Token management handled by hook internally
- Account creation API already supports the pattern

### Hook API Usage

**Dashboard Pattern**:
```typescript
const { connectAccount, ready, isLoading } = useStandardPlaidIntegration({
  onSuccess: (accountId: number) => {
    toast({ title: "Success", description: "Account connected" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

**Onboarding Pattern**:
```typescript
const { connectAccount, ready, isLoading } = useStandardPlaidIntegration({
  onSuccess: (accountId: number) => {
    setPlaidLinked(true);
    setStep(step + 1);
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

## 5. Key Interactions & Component Diagram

```
┌─────────────────┐
│  Dashboard.tsx  │
│                 │
│  [Connect Btn]──┼──> connectAccount()
│                 │
└────────┬────────┘
         │ uses
         ▼
┌──────────────────────────────┐
│ useStandardPlaidIntegration  │
│                              │
│ • Token Management           │
│ • Account Creation           │
│ • Plaid Link Open            │
│ • Error Handling             │
└──────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Plaid Link    │
│   (External)    │
└─────────────────┘
```

```
┌─────────────────┐
│ Onboarding.tsx  │
│                 │
│  [Step 2]       │
│  [Connect Btn]──┼──> connectAccount()
│                 │
│  onSuccess: ────┼──> setPlaidLinked(true)
│                 │     setStep(step + 1)
└────────┬────────┘
         │ uses
         ▼
┌──────────────────────────────┐
│ useStandardPlaidIntegration  │
│  (Same hook, different flow) │
└──────────────────────────────┘
```

## 6. Integration Points

### 6.1 Dashboard Integration

**Before**:
```typescript
// Dashboard triggers modal
<Button onClick={() => setShowConnectModal(true)}>
  Connect Account
</Button>

// Modal handles Plaid logic
<ConnectAccountModal 
  isOpen={showConnectModal}
  onClose={() => setShowConnectModal(false)}
  accountId={0}
/>
```

**After**:
```typescript
// Dashboard uses hook directly
const { connectAccount, ready, isLoading } = useStandardPlaidIntegration({
  onSuccess: (accountId) => {
    toast({ title: "Success", description: "Account connected" });
  },
});

<Button 
  onClick={connectAccount}
  disabled={!ready || isLoading}
>
  Connect Account
</Button>
```

### 6.2 Onboarding Integration

**Before**:
```typescript
// Inline token management
const [linkToken, setLinkToken] = useState<string | null>(null);
useEffect(() => {
  const fetchToken = async () => {
    const data = await createPlaidLinkToken();
    setLinkToken(data.linkToken);
  };
  if (step === 2) fetchToken();
}, [step]);

// Inline Plaid Link
const { open, ready } = usePlaidLink({
  token: linkToken || '',
  onSuccess: async (publicToken) => {
    await exchangePlaidPublicToken(publicToken, 1);
    setPlaidLinked(true);
    setStep(step + 1);
  },
});
```

**After**:
```typescript
// Hook handles everything
const { connectAccount, ready, isLoading } = useStandardPlaidIntegration({
  onSuccess: (accountId) => {
    setPlaidLinked(true);
    setStep(step + 1);
  },
});

// Simplified button
<button 
  onClick={connectAccount}
  disabled={!ready || isLoading}
>
  {plaidLinked ? 'Account Linked!' : 'Connect with Plaid'}
</button>
```

### 6.3 Error Boundary Integration

**Replace**:
```typescript
import { PlaidErrorBoundary } from '@/components/PlaidErrorBoundary';

<PlaidErrorBoundary onError={(error) => {...}}>
  <OnboardingContent />
</PlaidErrorBoundary>
```

**With**:
```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

export default function OnboardingWithBoundary() {
  return (
    <ErrorBoundary>
      <Onboarding />
    </ErrorBoundary>
  );
}
```

## 7. Phase 2 Decisions Impact

### Decision: Direct Hook Integration (Dashboard)
**Impact**: Eliminates modal component dependency, reduces code by ~15 lines, simplifies state management

### Decision: Preserve Step Flow (Onboarding)
**Impact**: Maintains UX consistency, requires careful callback integration, preserves `plaidLinked` state

### Decision: Deprecate Modal
**Impact**: Future removals safe after verification, reduces maintenance burden, consolidates Plaid logic

### Decision: Manual Testing Priority
**Impact**: Faster delivery, relies on proven hook pattern, reduces test implementation time

## 8. Complexity Factors

### Dashboard Refactor
- **Complexity**: Low
- **Factors**: Simple button replacement, no state preservation needed
- **Mitigation**: Follow Accounts.tsx pattern exactly

### Onboarding Refactor
- **Complexity**: Medium
- **Factors**: Step flow preservation, callback coordination, state management
- **Mitigation**: Preserve all step logic, only swap Plaid integration, thorough testing

### Error Boundary Swap
- **Complexity**: Low
- **Factors**: Direct replacement, proven pattern
- **Mitigation**: ErrorBoundary already used successfully in other components

## 9. Pattern Alignment

### Proven Pattern Source
**File**: `/client/src/pages/Accounts.tsx` (lines 1-110)
```typescript
// Reference implementation
import { useStandardPlaidIntegration } from "@/hooks/useStandardPlaidIntegration";

const { connectAccount, ready, isLoading } = useStandardPlaidIntegration({
  onSuccess: (accountId) => {
    toast({ title: "Success", description: "Account successfully connected." });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

### Hook Implementation
**File**: `/client/src/hooks/useStandardPlaidIntegration.ts`
- Session-level token caching (React Query)
- Race condition protection (refs)
- Account creation flow
- Comprehensive error handling
- Auth session expiry detection

### Error Boundary Pattern
**File**: `/client/src/components/ErrorBoundary.tsx`
- Standard React error boundary
- Used in Accounts.tsx successfully
- Graceful error display

### Import Order Convention
**From**: Multiple files across codebase
```typescript
// 1. React hooks
import { useState, useEffect } from 'react';

// 2. UI components
import { Button } from '@/components/ui/button';

// 3. Backend API
import { apiFetch } from '@/lib/backendApi';

// 4. Types
import { type Account } from '@shared/schema';
```

## 10. User Rules Application

### Architecture Rules
✅ **Clean Architecture**: No backend changes, frontend-only refactor  
✅ **Security First**: Hook handles secure token management  
✅ **Error Boundaries**: Standard ErrorBoundary pattern applied

### Code Standards
✅ **Component Structure**: Import order convention followed  
✅ **TypeScript**: Full typing from hook interface  
✅ **React Query**: Hook uses existing React Query patterns  
✅ **Hook Pattern**: useStandardPlaidIntegration for all connections

### Integration Patterns
✅ **Account Creation Flow**: Create-first pattern in hook  
✅ **Token Management**: 30-min TTL session caching  
✅ **UX Consistency**: Same pattern across all entry points  
✅ **Error Handling**: Consistent toast notifications

### Development Workflow
✅ **Conventional Commits**: Plan includes commit strategy  
✅ **Implementation Order**: Dashboard → Onboarding → Cleanup  
✅ **Test Coverage**: Manual testing priority  
✅ **Commit Strategy**: After each successful component refactor

---

## Design Summary

This design leverages the proven `useStandardPlaidIntegration` hook pattern to eliminate inconsistent Plaid integrations in Dashboard.tsx and Onboarding.tsx. By removing the ConnectAccountModal dependency and inline usePlaidLink implementations, we achieve:

1. **Code Reduction**: ~40 lines removed across components
2. **Pattern Consistency**: Single hook pattern for all Plaid connections
3. **UX Preservation**: Identical user experience with improved reliability
4. **Maintainability**: Centralized Plaid logic, easier to update
5. **Type Safety**: Full TypeScript coverage via hook interface

The design follows all established user rules and architectural patterns, with minimal risk due to proven hook implementation and progressive refactoring approach.

**Next Phase**: Implementation Planning - Create detailed step-by-step tasks for Dashboard.tsx and Onboarding.tsx refactors.
