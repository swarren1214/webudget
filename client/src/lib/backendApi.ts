// client/src/lib/backendApi.ts

import { InsertAccount } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

export async function createAccount(accountData: InsertAccount) {
  return await apiFetch("/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  });
}


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
}

interface ExchangePlaidResponse {
  message: string;
}

/**
 * Helper to make a fetch request to the backend API with credentials and JSON headers
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;

  if (!token) {
    console.warn('Supabase session token is missing. Ensure the user is logged in.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('Authorization Header:', headers.Authorization);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers
  });

  console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}/api/v1${path} - Status: ${response.status}`);

  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = await response.text() || `HTTP ${response.status}`;
    }
    console.error(`API Error: ${response.status} ${errorMessage}`);
    throw new Error(`API Error: ${response.status} ${errorMessage}`);
  }

  return response.json();
}

/**
 * Create a new Plaid Link Token
 */
export async function createPlaidLinkToken(): Promise<PlaidLinkTokenResponse> {
  return apiFetch<PlaidLinkTokenResponse>('/plaid/create-link-token', {
    method: 'POST'
  });
}

/**
 * Exchange Plaid Public Token with the backend
 */
export async function exchangePlaidPublicToken(publicToken: string, accountId: number): Promise<ExchangePlaidResponse> {
  return apiFetch<ExchangePlaidResponse>('/plaid/exchange-public-token', {
    method: 'POST',
    body: JSON.stringify({ publicToken, accountId })
  });
}


/**
 * Sync transactions for a specific account
 * @param accountId - The ID of the account to sync transactions for
 */
export async function syncTransactions(accountId: number) {
  return await apiFetch(`/transactions/sync`, {
    method: "POST",
    body: JSON.stringify({ accountId }),
  });
}


// Fetch budget categories from the backend API
import { BudgetCategory } from "@shared/schema";

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  return await apiFetch("/budget-categories");
}

// Add more backend API helpers here as needed