import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectAccountModal from "@/components/modals/ConnectAccountModal";
import { type Account, type InsertAccount } from "@shared/schema";
import { HiPlus } from "react-icons/hi";
import { createAccount, createPlaidLinkToken, exchangePlaidPublicToken } from "@/lib/backendApi";
import { useToast } from "@/hooks/use-toast";
import { usePlaidLink } from "react-plaid-link";
import { apiFetch } from '@/lib/backendApi';
import ErrorBoundary from "@/components/ErrorBoundary";

function Accounts() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch accounts data
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/accounts'],
    queryFn: async () => {
      const res = await apiFetch('/accounts');
      return res.json();
    }
  });

  // Fetch transactions data
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await apiFetch('/transactions');
      return res.json();
    }
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (accountData: InsertAccount) => {
      return createAccount(accountData);
    },
    onSuccess: (account) => {
      setSelectedAccountId(account.id);
      // Don't show modal for main flow - we'll open Plaid directly
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const { linkToken } = await createPlaidLinkToken();
        setLinkToken(linkToken);
      } catch (error) {
        console.error("Failed to fetch Plaid Link token from backend API:", error);
      }
    };

    fetchLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: async (publicToken) => {
      try {
        if (selectedAccountId === null) {
          throw new Error("No account selected.");
        }
        await exchangePlaidPublicToken(publicToken, selectedAccountId);
        toast({
          title: "Success",
          description: "Account successfully connected.",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ['/accounts'] });
      } catch (error) {
        console.error("Failed to exchange Plaid public token:", error);
        toast({
          title: "Error",
          description: "Failed to connect account. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleConnectAccount = async () => {
    try {
      // Step 1: Create account first (this was the missing step!)
      const accountData: InsertAccount = {
        name: `New Account ${Date.now()}`, // Temporary name, user can edit later
        type: 'checking', // Default type, will be updated from Plaid data
        balance: 0, // Will be updated from Plaid data
        institutionName: 'Pending', // Will be updated from Plaid data
        accountNumber: 'Pending', // Will be updated from Plaid data
      } as InsertAccount; // Type assertion since backend will add userId from auth

      // Create the account and wait for completion
      const newAccount = await createAccountMutation.mutateAsync(accountData);
      
      // Step 2: Account is created, selectedAccountId is set, now open Plaid
      if (ready && newAccount?.id) {
        // The selectedAccountId should be set by now, but let's be safe
        if (!selectedAccountId) {
          setSelectedAccountId(newAccount.id);
        }
        open();
      } else if (!ready) {
        toast({
          title: "Error", 
          description: "Plaid is not ready. Please wait a moment and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create account before Plaid connection:', error);
      toast({
        title: "Error",
        description: "Failed to prepare account for connection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button 
          onClick={handleConnectAccount}
          icon={<HiPlus />}
          iconPosition="left"
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
      ) : (
        <div className="grid gap-4">
          {accounts?.map((account: Account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          
          <Button
            variant="outline"
            className="border-dashed h-[100px] mt-2"
            onClick={handleConnectAccount}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Connect New Account
          </Button>
        </div>
      )}
      
      <ConnectAccountModal 
        isOpen={showConnectModal} 
        onClose={() => {
          setShowConnectModal(false);
          setSelectedAccountId(null);
        }}
        accountId={selectedAccountId || 0}
      />
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
