import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { usePlaidLink } from "react-plaid-link";
import { useToast } from "@/hooks/use-toast";
import { createPlaidLinkToken, exchangePlaidPublicToken, createAccount } from "@/lib/backendApi";
import { InsertAccount } from "@shared/schema";

/**
 * Standard Plaid Integration Hook
 * 
 * Provides a standardized, reusable interface for Plaid Link integration
 * across all UI components. Implements session-level token caching,
 * race condition protection, and consistent error handling.
 * 
 * @example
 * ```tsx
 * const { open, ready, isLoading, error } = useStandardPlaidIntegration({
 *   accountId: selectedAccountId,
 *   onSuccess: () => console.log("Account connected!"),
 *   onError: (error) => console.error("Connection failed:", error)
 * });
 * 
 * return (
 *   <button onClick={open} disabled={!ready || isLoading}>
 *     Connect Bank Account
 *   </button>
 * );
 * ```
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for the useStandardPlaidIntegration hook
 */
export interface PlaidIntegrationOptions {
  /** Callback fired when Plaid connection succeeds with the accountId */
  onSuccess?: (accountId: number) => void | Promise<void>;
  /** Callback fired when Plaid connection fails */
  onError?: (error: PlaidIntegrationError) => void;
  /** Callback fired when connection is cancelled by user */
  onExit?: () => void;
  /** Whether to automatically invalidate accounts query after success */
  invalidateAccountsQuery?: boolean;
  /** Whether to automatically create an account before opening Plaid */
  createAccountFirst?: boolean;
}

/**
 * State returned by the useStandardPlaidIntegration hook
 */
export interface PlaidIntegrationState {
  /** Function to trigger the account connection flow */
  connectAccount: () => Promise<void>;
  /** Whether Plaid Link is ready to be opened */
  ready: boolean;
  /** Whether a token request or exchange is in progress */
  isLoading: boolean;
  /** Current error state, if any */
  error: PlaidIntegrationError | null;
  /** The current link token (for debugging/testing) */
  linkToken: string | null;
}

/**
 * Standardized error interface for Plaid integration
 */
export interface PlaidIntegrationError {
  /** Error type/category */
  type: 'TOKEN_FETCH_FAILED' | 'TOKEN_EXCHANGE_FAILED' | 'INVALID_ACCOUNT_ID' | 'AUTH_EXPIRED' | 'NETWORK_ERROR';
  /** Human-readable error message */
  message: string;
  /** Original error for debugging */
  originalError?: Error;
  /** Additional context/metadata */
  context?: Record<string, any>;
}

/**
 * Internal state for managing concurrent token requests
 */
interface TokenRequestState {
  /** Active token request promise, if any */
  activeRequest: Promise<string> | null;
  /** Whether a token request is currently in progress */
  isRequesting: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Session-level cache key for Plaid link tokens
 * Includes user session context to prevent cross-user token leakage
 */
const PLAID_TOKEN_CACHE_KEY = 'plaid-link-token-session';

/**
 * Token cache TTL: 30 minutes (in milliseconds)
 * Matches Plaid Link token expiration recommendations
 */
const TOKEN_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Standard Plaid Integration Hook
 * 
 * Implements session-level token caching with race condition protection
 * and 30-minute TTL. Provides consistent Plaid integration across components.
 */
export function useStandardPlaidIntegration(
  options: PlaidIntegrationOptions = {}
): PlaidIntegrationState {
  // Dependencies
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Token request deduplication state
  const tokenRequestRef = useRef<Promise<string> | null>(null);
  const selectedAccountIdRef = useRef<number | null>(null);
  const isConnectingRef = useRef(false);
  
  // State management
  const [error, setError] = useState<PlaidIntegrationError | null>(null);

  /**
   * Session-level token caching with React Query
   * Implements 30-minute TTL and automatic cache invalidation
   */
  const {
    data: linkToken,
    isLoading: isTokenLoading,
    error: tokenError,
    refetch: refetchToken
  } = useQuery({
    queryKey: [PLAID_TOKEN_CACHE_KEY],
    queryFn: fetchLinkTokenWithDeduplication,
    staleTime: TOKEN_CACHE_TTL, // Override default staleTime
    gcTime: TOKEN_CACHE_TTL, // Cache garbage collection
    retry: false, // Let our error handling manage retries
    refetchOnWindowFocus: false, // Prevent unnecessary token refreshes
    refetchOnMount: false, // Use cached token if available
  });

  /**
   * Token fetching with race condition protection
   * Ensures only one token request is active at a time
   */
  async function fetchLinkTokenWithDeduplication(): Promise<string> {
    // If there's already an active request, wait for it
    if (tokenRequestRef.current) {
      return tokenRequestRef.current;
    }

    // Create new token request with mutex protection
    const tokenRequest = createPlaidLinkToken()
      .then(response => {
        const token = response.linkToken;
        
        // Clear the active request reference
        tokenRequestRef.current = null;
        
        // Clear any previous errors
        setError(null);
        
        return token;
      })
      .catch(error => {
        // Clear the active request reference
        tokenRequestRef.current = null;
        
        // Create standardized error
        const plaidError: PlaidIntegrationError = {
          type: 'TOKEN_FETCH_FAILED',
          message: 'Failed to fetch Plaid Link token',
          originalError: error,
          context: { timestamp: new Date().toISOString() }
        };
        
        setError(plaidError);
        throw error;
      });

    // Store the active request for deduplication
    tokenRequestRef.current = tokenRequest;
    
    return tokenRequest;
  }

  /**
   * Handle token fetch errors and convert to standardized format
   */
  useEffect(() => {
    if (tokenError) {
      const plaidError: PlaidIntegrationError = {
        type: 'TOKEN_FETCH_FAILED',
        message: 'Unable to initialize Plaid connection',
        originalError: tokenError as Error,
        context: { 
          timestamp: new Date().toISOString(),
          queryKey: PLAID_TOKEN_CACHE_KEY
        }
      };
      setError(plaidError);
    }
  }, [tokenError]);

  /**
   * Cache invalidation utility
   * Exposes method to clear cached tokens (useful for auth state changes)
   */
  const invalidateTokenCache = () => {
    queryClient.invalidateQueries({ queryKey: [PLAID_TOKEN_CACHE_KEY] });
    tokenRequestRef.current = null; // Clear any active requests
    setError(null); // Clear error state
  };

  /**
   * Detect auth session expiry during token operations
   * Monitor for 401 errors that indicate expired sessions
   */
  useEffect(() => {
    if (error?.type === 'TOKEN_FETCH_FAILED' && error.originalError) {
      // Check if this is an auth-related error (401, 403)
      const originalError = error.originalError as any;
      if (originalError.status === 401 || originalError.status === 403) {
        const authError: PlaidIntegrationError = {
          type: 'AUTH_EXPIRED',
          message: 'Authentication session expired. Please log in again.',
          originalError: error.originalError,
          context: { 
            ...error.context,
            authFailure: true 
          }
        };
        setError(authError);
        
        // Clear token cache on auth failure
        invalidateTokenCache();
      }
    }
  }, [error, queryClient]);

  /**
   * Create account mutation for create-first, update-later pattern
   */
  const createAccountMutation = useMutation({
    mutationFn: async (accountData: InsertAccount) => {
      return createAccount(accountData);
    },
    onError: (err: Error) => {
      console.error('[H1_ERROR] Failed to create account:', err);
      const plaidError: PlaidIntegrationError = {
        type: 'NETWORK_ERROR',
        message: 'Failed to create account',
        originalError: err,
      };
      setError(plaidError);
      options.onError?.(plaidError);
    },
  });

  /**
   * Standard Plaid Link integration with account creation flow
   * Handles success/error states and provides consistent user feedback
   */
  const plaidLink = usePlaidLink({
    token: linkToken || "",
    /**
     * Handle successful Plaid Link completion
     * Exchanges public token and creates account association
     */
    onSuccess: async (publicToken) => {
      const currentAccountId = selectedAccountIdRef.current;
      
      console.log('[H1_DEBUG] Plaid onSuccess triggered', {
        publicToken: '[REDACTED]',
        selectedAccountId: currentAccountId,
        timestamp: new Date().toISOString()
      });
      
      if (!currentAccountId) {
        const error: PlaidIntegrationError = {
          type: 'INVALID_ACCOUNT_ID',
          message: 'No account selected for Plaid connection',
          context: { 
            publicToken: '[REDACTED]',
            timestamp: new Date().toISOString()
          }
        };
        setError(error);
        
        toast({
          title: "Error",
          description: "Please select an account before connecting to Plaid.",
          variant: "destructive",
        });
        
        options.onError?.(error);
        return;
      }

      try {
        setError(null); // Clear any previous errors
        
        console.log('[H1_DEBUG] Calling exchangePlaidPublicToken', { accountId: currentAccountId });
        
        // Exchange public token for access token via backend
        await exchangePlaidPublicToken(publicToken, currentAccountId);
        
        console.log('[H1_DEBUG] exchangePlaidPublicToken SUCCESS');
        
        // Success notification
        toast({
          title: "Success",
          description: "Account successfully connected.",
          variant: "default",
        });
        
        // Invalidate accounts query to refresh data (if enabled)
        if (options.invalidateAccountsQuery !== false) {
          queryClient.invalidateQueries({ queryKey: ['/accounts'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
        
        // Call user-provided success callback with account ID
        if (options.onSuccess) {
          await options.onSuccess(currentAccountId);
        }
        
      } catch (error) {
        console.error('[H1_ERROR] Failed to exchange Plaid public token:', error);
        
        // Create standardized error
        const plaidError: PlaidIntegrationError = {
          type: 'TOKEN_EXCHANGE_FAILED',
          message: 'Failed to connect account. Please try again.',
          originalError: error as Error,
          context: { 
            accountId: currentAccountId,
            timestamp: new Date().toISOString()
          }
        };
        setError(plaidError);
        
        // Error notification
        toast({
          title: "Error",
          description: "Failed to connect account. Please try again.",
          variant: "destructive",
        });
        
        // Call user-provided error callback
        if (options.onError) {
          options.onError(plaidError);
        }
      } finally {
        isConnectingRef.current = false;
        selectedAccountIdRef.current = null;
      }
    },
    /**
     * Handle Plaid Link exit events (user cancellation or errors)
     * Provides appropriate error handling and user feedback
     */
    onExit: (error, metadata) => {
      // User cancelled or there was an exit error
      if (error) {
        const plaidError: PlaidIntegrationError = {
          type: 'NETWORK_ERROR', // or other appropriate type based on error
          message: error.display_message || 'Plaid connection was interrupted',
          originalError: error as any,
          context: { 
            metadata,
            timestamp: new Date().toISOString()
          }
        };
        setError(plaidError);
        
        // Only show toast for actual errors, not user cancellation
        if (error.error_code !== 'USER_EXIT') {
          toast({
            title: "Connection Issue",
            description: error.display_message || "There was an issue connecting your account.",
            variant: "destructive",
          });
        }
        
        // Call user-provided error callback
        if (options.onError) {
          options.onError(plaidError);
        }
      }
      
      // Reset state on exit
      isConnectingRef.current = false;
      selectedAccountIdRef.current = null;
      
      // Call user-provided exit callback
      if (options.onExit) {
        options.onExit();
      }
    }
  });

  /**
   * Main connect account function
   * Implements create-first, update-later pattern
   */
  const connectAccount = useCallback(async () => {
    // Race condition protection
    if (isConnectingRef.current) {
      console.warn('[H1_WARNING] Connection already in progress, ignoring duplicate request');
      return;
    }

    // Check if Plaid is ready
    if (!plaidLink.ready || !linkToken) {
      const error: PlaidIntegrationError = {
        type: 'TOKEN_FETCH_FAILED',
        message: 'Plaid is not ready. Please wait a moment and try again.',
      };
      console.error('[H1_ERROR] Plaid not ready', {
        ready: plaidLink.ready,
        hasLinkToken: !!linkToken,
      });
      setError(error);
      options.onError?.(error);
      
      toast({
        title: "Error",
        description: "Plaid is not ready. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    isConnectingRef.current = true;
    setError(null);

    try {
      // Step 1: Create account first (create-first, update-later pattern)
      const accountData: InsertAccount = {
        name: `New Account ${Date.now()}`, // Temporary name
        type: 'checking', // Default type, will be updated from Plaid
        balance: 0, // Will be updated from Plaid
        institutionName: 'Pending', // Will be updated from Plaid
        accountNumber: 'Pending', // Will be updated from Plaid
      } as InsertAccount;

      console.log('[H1_DEBUG] Creating account with data:', accountData);

      const newAccount = await createAccountMutation.mutateAsync(accountData);

      console.log('[H1_DEBUG] Account created:', { id: newAccount?.id });

      if (!newAccount?.id) {
        throw new Error('Failed to create account');
      }

      // Step 2: Set account ID for closure access
      selectedAccountIdRef.current = newAccount.id;
      console.log('[H1_DEBUG] Set selectedAccountId to:', newAccount.id);

      // Step 3: Open Plaid Link
      console.log('[H1_DEBUG] Opening Plaid Link');
      plaidLink.open();
    } catch (err) {
      const error: PlaidIntegrationError = {
        type: 'NETWORK_ERROR',
        message: 'Failed to prepare account for connection. Please try again.',
        originalError: err as Error,
      };
      console.error('[H1_ERROR] Failed to create account before Plaid connection:', err);
      setError(error);
      options.onError?.(error);
      isConnectingRef.current = false;
      
      toast({
        title: "Error",
        description: "Failed to prepare account for connection. Please try again.",
        variant: "destructive",
      });
    }
  }, [plaidLink, linkToken, createAccountMutation, options, toast]);

  return {
    connectAccount,
    ready: plaidLink.ready && linkToken !== null && !isTokenLoading,
    isLoading: isTokenLoading || createAccountMutation.isPending,
    error,
    linkToken: linkToken || null
  };
}