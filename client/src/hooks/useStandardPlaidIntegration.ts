import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlaidLink } from "react-plaid-link";
import { useToast } from "@/hooks/use-toast";
import { createPlaidLinkToken, exchangePlaidPublicToken } from "@/lib/backendApi";

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
  /** The account ID to associate with the connected Plaid item */
  accountId: number | null;
  /** Callback fired when Plaid connection succeeds */
  onSuccess?: (publicToken: string) => void | Promise<void>;
  /** Callback fired when Plaid connection fails */
  onError?: (error: PlaidIntegrationError) => void;
  /** Callback fired when connection is cancelled by user */
  onExit?: () => void;
  /** Whether to automatically invalidate accounts query after success */
  invalidateAccountsQuery?: boolean;
}

/**
 * State returned by the useStandardPlaidIntegration hook
 */
export interface PlaidIntegrationState {
  /** Function to open the Plaid Link modal */
  open: () => void;
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
  options: PlaidIntegrationOptions
): PlaidIntegrationState {
  // Dependencies
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Token request deduplication state
  const tokenRequestRef = useRef<Promise<string> | null>(null);
  
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
      if (!options.accountId) {
        const error: PlaidIntegrationError = {
          type: 'INVALID_ACCOUNT_ID',
          message: 'No account selected for Plaid connection',
          context: { 
            publicToken: '[REDACTED]', // Don't log sensitive data
            timestamp: new Date().toISOString()
          }
        };
        setError(error);
        
        toast({
          title: "Error",
          description: "Please select an account before connecting to Plaid.",
          variant: "destructive",
        });
        return;
      }

      try {
        setError(null); // Clear any previous errors
        
        // Exchange public token for access token via backend
        await exchangePlaidPublicToken(publicToken, options.accountId);
        
        // Success notification
        toast({
          title: "Success",
          description: "Account successfully connected.",
          variant: "default",
        });
        
        // Invalidate accounts query to refresh data (if enabled)
        if (options.invalidateAccountsQuery !== false) {
          queryClient.invalidateQueries({ queryKey: ['/accounts'] });
        }
        
        // Call user-provided success callback
        if (options.onSuccess) {
          await options.onSuccess(publicToken);
        }
        
      } catch (error) {
        console.error("Failed to exchange Plaid public token:", error);
        
        // Create standardized error
        const plaidError: PlaidIntegrationError = {
          type: 'TOKEN_EXCHANGE_FAILED',
          message: 'Failed to connect account. Please try again.',
          originalError: error as Error,
          context: { 
            accountId: options.accountId,
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
      
      // Call user-provided exit callback
      if (options.onExit) {
        options.onExit();
      }
    }
  });

  return {
    open: () => plaidLink.open(),
    ready: plaidLink.ready && linkToken !== null && !isTokenLoading,
    isLoading: isTokenLoading,
    error,
    linkToken: linkToken || null
  };
}