import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TransferModal from "@/components/modals/TransferModal";
import { type Transfer, type Account } from "@shared/schema";
import { HiArrowRight, HiPlus } from "react-icons/hi";
import { apiFetch } from '@/lib/backendApi';
import ErrorBoundary from "@/components/ErrorBoundary";

function Transfers() {
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Fetch transfers
  const { data: transfers = [], isLoading: isLoadingTransfers, error: transfersError } = useQuery<Transfer[]>({
    queryKey: ['/transfers'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/transfers');
        const data = await res.json();
        // Backend returns { transfers: [...] }, we need just the array
        return data.transfers || [];
      } catch (error) {
        // Transfers endpoint not implemented yet - return empty array
        console.warn('Transfers endpoint not available:', error);
        return [];
      }
    },
    retry: false, // Don't retry since endpoint doesn't exist
  });
  
  // Fetch accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/accounts'],
    queryFn: async () => {
      const res = await apiFetch('/accounts');
      const data = await res.json();
      // Backend returns { accounts: [...] }, we need just the array
      return data.accounts || [];
    }
  });
  
  // Function to get account name by ID
  const getAccountName = (accountId: number) => {
    return accounts?.find(account => account.id === accountId)?.name || "Unknown Account";
  };
  
  // Function to format date
  const formatDate = (date: string | Date) => {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Transfers</h1>
        <Button 
          onClick={() => setShowTransferModal(true)}
          icon={<HiPlus />}
          iconPosition="left"
        >
          New Transfer
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransfers || isLoadingAccounts ? (
            <Skeleton className="h-[400px] w-full" />
          ) : transfers && transfers.length > 0 ? (
            <div className="space-y-4">
              {transfers.map(transfer => (
                <div key={transfer.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                    <div className="flex items-center mb-2 md:mb-0">
                      <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                        <span className="material-icons">compare_arrows</span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {getAccountName(transfer.fromAccountId)} <HiArrowRight className="inline h-4 w-4 mx-1" /> {getAccountName(transfer.toAccountId)}
                        </h3>
                        <p className="text-sm text-muted-foreground">{formatDate(transfer.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className={`mr-3 ${getStatusBadgeColor(transfer.status)}`}>
                        {transfer.status}
                      </Badge>
                      <p className="font-semibold">${transfer.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {transfer.note && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-sm text-muted-foreground">
                        Note: {transfer.note}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <span className="material-icons text-3xl text-gray-400">compare_arrows</span>
              </div>
              <h3 className="text-lg font-medium text-center">No Transfers Yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mt-1 mb-4">
                Start transferring money between your connected accounts.
              </p>
              <Button onClick={() => setShowTransferModal(true)}>
                Create Your First Transfer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <TransferModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)} 
        accounts={accounts || []} 
      />
    </>
  );
}

// Wrap the Transfers component with ErrorBoundary
export default function TransfersWithBoundary() {
  return (
    <ErrorBoundary>
      <Transfers />
    </ErrorBoundary>
  );
}
