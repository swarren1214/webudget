import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Transaction, type Account } from "@shared/schema";
import { Calendar, Search, Filter, RefreshCw, Plus } from "lucide-react";
import { syncTransactions, getBudgetCategories } from "@/lib/backendApi";
import { useToast } from "@/hooks/use-toast";
import AddTransactionModal from "@/components/modals/AddTransactionModal";
import TransactionDetailsModal from "@/components/modals/TransactionDetailsModal";
import ErrorBoundary from "@/components/ErrorBoundary";

function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  
  // Fetch transactions data
  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['/transactions'],
  });
  
  // Fetch accounts data for filtering
  const { data: accounts, isLoading: isLoadingAccounts, error: accountsError } = useQuery<Account[]>({
    queryKey: ['/accounts'],
  });
  
  // Fetch budget categories
  const { data: budgetCategories = [], isLoading: isLoadingBudgets, error: budgetCategoriesError } = useQuery<Array<{ name: string; color: string }>>({
    queryKey: ['/budget-categories'],
    queryFn: getBudgetCategories,
  });
  
  // Sync transactions mutation
  const syncMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return syncTransactions(accountId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transactions synced successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/transactions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync transactions. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Add mutation for adding a transaction
  const addTransactionMutation = useMutation({
    mutationFn: async (newTransaction: Partial<Transaction>) => {
      const response = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/transactions'] });
      setShowAddTransactionModal(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add transaction. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Get unique categories from transactions
  const categories = Array.from(
    new Set(
      (transactions || [])
        .map(t => t.category)
        .filter((c): c is string => c !== null)
    )
  );
  
  // Filter transactions based on search, account, and category
  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.category && transaction.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesAccount = selectedAccount === "all" || transaction.accountId.toString() === selectedAccount;
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory;
    
    return matchesSearch && matchesAccount && matchesCategory;
  });
  
  // Group transactions by date
  const groupedTransactions = filteredTransactions?.reduce<Record<string, Transaction[]>>((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});
  
  // Get an account name by ID
  const getAccountName = (accountId: number) => {
    return accounts?.find(a => a.id === accountId)?.name || "Unknown Account";
  };
  
  // Handle sync button click
  const handleSync = () => {
    if (selectedAccount === "all") {
      // If "All Accounts" is selected, sync all connected accounts
      accounts?.forEach(account => {
        if (account.plaidAccessToken) {
          syncMutation.mutate(account.id);
        }
      });
    } else {
      // Sync the selected account
      syncMutation.mutate(parseInt(selectedAccount));
    }
  };
  
  // Display error messages if any
  if (transactionsError || accountsError || budgetCategoriesError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load data. Please try again later.</p>
      </div>
    );
  }
  
  const accountOptions = Array.isArray(accounts) ? accounts.map(account => (
    <SelectItem key={account.id} value={account.id.toString()}>
      {account.name}
    </SelectItem>
  )) : [];
  
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Transactions</h1>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search transactions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accountOptions}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="icon" 
          className="shrink-0"
          onClick={handleSync}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" size="icon" className="shrink-0">
          <Calendar className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
        <Button className="flex items-center gap-2" variant="default" onClick={() => setShowAddTransactionModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Transaction
        </Button>
      </div>
      
      <TransactionDetailsModal
        open={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        budgets={budgetCategories ? budgetCategories.map(b => ({ name: b.name, color: b.color, icon: 'default-icon' })) : []}
      />
              
              <AddTransactionModal 
          open={showAddTransactionModal} 
          onOpenChange={setShowAddTransactionModal} 
          accounts={accounts || []} 
          categories={categories} 
          onSave={(transaction) => addTransactionMutation.mutate({ ...transaction, date: new Date(transaction.date) })} 
              />
              
              {(isLoadingTransactions || isLoadingAccounts || isLoadingBudgets) ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {groupedTransactions && Object.keys(groupedTransactions).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([date, transactions]) => (
                  <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="space-y-2">
                      {transactions.map(transaction => (
                        <div 
                          key={transaction.id} 
                          className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-lg px-2 cursor-pointer"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                              transaction.category === 'Groceries' ? 'bg-blue-100 text-blue-500' :
                              transaction.category === 'Dining Out' ? 'bg-yellow-100 text-yellow-500' :
                              transaction.category === 'Transportation' ? 'bg-purple-100 text-purple-500' :
                              transaction.category === 'Entertainment' ? 'bg-red-100 text-red-500' :
                              transaction.category === 'Income' ? 'bg-green-100 text-green-500' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              <span className="material-icons">
                                {transaction.category === 'Groceries' ? 'shopping_cart' :
                                transaction.category === 'Dining Out' ? 'restaurant' :
                                transaction.category === 'Transportation' ? 'local_taxi' :
                                transaction.category === 'Entertainment' ? 'movie' :
                                transaction.category === 'Income' ? 'attach_money' :
                                'receipt_long'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground flex items-center">
                                {transaction.category || 'Uncategorized'} · {getAccountName(transaction.accountId)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${transaction.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.isIncome ? '+' : '-'}${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Wrap the Transactions component with ErrorBoundary
export default function TransactionsWithBoundary() {
  return (
    <ErrorBoundary>
      <Transactions />
    </ErrorBoundary>
  );
}
