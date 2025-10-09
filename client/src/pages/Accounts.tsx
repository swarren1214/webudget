import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { type Account } from "@shared/schema";
import { HiPlus } from "react-icons/hi";
import { apiFetch } from '@/lib/backendApi';
import { useToast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useStandardPlaidIntegration } from "@/hooks/useStandardPlaidIntegration";

function Accounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch accounts data with error handling
  const { data: accounts, isLoading, error: accountsError } = useQuery({
    queryKey: ['/accounts'],
    queryFn: async () => {
      return await apiFetch('/accounts');
    },
    retry: 1,
  });

  // Fetch transactions data
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      return await apiFetch('/transactions');
    },
    retry: 1,
  });

  // Use the standardized Plaid integration hook
  const { connectAccount, ready, isLoading: isPlaidLoading } = useStandardPlaidIntegration({
    onSuccess: (accountId) => {
      console.log('[H1_DEBUG] Account connected successfully:', accountId);
      toast({
        title: "Success",
        description: "Account successfully connected.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('[H1_ERROR] Plaid connection failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Show error toast for account loading errors
  if (accountsError) {
    toast({
      title: "Error",
      description: "Failed to load accounts. Please refresh the page.",
      variant: "destructive",
    });
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button 
          onClick={connectAccount}
          icon={<HiPlus />}
          iconPosition="left"
          disabled={!ready || isPlaidLoading}
        >
          Connect Account
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>
      ) : accountsError ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load accounts. Please try refreshing the page.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts?.map((account: Account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          
          <Button
            variant="outline"
            className="border-dashed h-[100px] mt-2"
            onClick={connectAccount}
            disabled={!ready || isPlaidLoading}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Connect New Account
          </Button>
        </div>
      )}
    </>
  );
}

interface AccountCardProps {
  account: Account;
}

function AccountCard({ account }: AccountCardProps) {
  const getIconForAccountType = (type: string) => {
    switch (type) {
      case 'checking':
        return 'account_balance';
      case 'savings':
        return 'savings';
      case 'credit':
        return 'credit_card';
      default:
        return 'account_balance';
    }
  };
  
  const getColorForAccountType = (type: string) => {
    switch (type) {
      case 'checking':
        return 'bg-blue-100 text-blue-600';
      case 'savings':
        return 'bg-green-100 text-green-600';
      case 'credit':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 ${getColorForAccountType(account.type)}`}>
            <span className="material-icons">{getIconForAccountType(account.type)}</span>
          </div>
          {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{account.institutionName}</p>
            <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
          </div>
          <div className="mt-2 md:mt-0">
            <p className={`text-2xl font-semibold ${account.balance < 0 ? 'text-red-500' : ''}`}>
              ${Math.abs(account.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-sm text-muted-foreground">
              {account.balance < 0 ? 'Current Debt' : 'Available Balance'}
            </p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">View Transactions</Button>
          <Button variant="outline" size="sm">Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrap the Accounts component with ErrorBoundary
export default function AccountsWithBoundary() {
  return (
    <ErrorBoundary>
      <Accounts />
    </ErrorBoundary>
  );
}
