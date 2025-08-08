import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import SummaryCard from "@/components/dashboard/SummaryCard";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import ConnectedAccounts from "@/components/dashboard/ConnectedAccounts";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HiOutlineSearch, HiOutlineFilter } from "react-icons/hi";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectAccountModal from "@/components/modals/ConnectAccountModal";
import TransferModal from "@/components/modals/TransferModal";
import { apiFetch } from '@/lib/backendApi';
import { type Account, type BudgetCategory, type Transaction } from "@shared/schema";
import ErrorBoundary from "@/components/ErrorBoundary";

function Dashboard() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch accounts data
  const { data: accounts, isLoading: isLoadingAccounts, error: accountsError } = useQuery<Account[]>({
    queryKey: ['/accounts'],
    queryFn: async () => {
      try {
        const result = await apiFetch('/accounts');
        console.log('Accounts API response:', result);
        return result;
      } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
    }
  });
  
  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
  }
  
  // Fetch budget categories data
  const { data: budgetCategories, isLoading: isLoadingBudgets, error: budgetsError } = useQuery<BudgetCategory[]>({
    queryKey: ['/budget-categories'],
    queryFn: async () => {
      try {
        const result = await apiFetch('/budget-categories');
        console.log('Budget categories API response:', result);
        return result;
      } catch (error) {
        console.error('Error fetching budget categories:', error);
        throw error;
      }
    }
  });
  
  if (budgetsError) {
    console.error('Error fetching budget categories:', budgetsError);
  }
  
  // Fetch recent transactions
  const { data: recentTransactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['/transactions/recent'],
    queryFn: async () => {
      try {
        const result = await apiFetch('/transactions/recent');
        console.log('Transactions API response:', result);
        return result;
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
        throw error;
      }
    }
  });
  
  if (transactionsError) {
    console.error('Error fetching recent transactions:', transactionsError);
  }
  
  // Calculate total balance
  const totalBalance = Array.isArray(accounts) ? accounts.reduce((sum, account) => sum + account.balance, 0) : 0;
  
  // Calculate monthly income and expenses
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  const monthlyIncome = Array.isArray(recentTransactions) ? recentTransactions.filter(t => t.isIncome && new Date(t.date) >= thisMonth).reduce((sum, t) => sum + t.amount, 0) : 0;
  const monthlyExpenses = Array.isArray(recentTransactions) ? recentTransactions.filter(t => !t.isIncome && new Date(t.date) >= thisMonth).reduce((sum, t) => sum + t.amount, 0) : 0;
  
  return (
    <>
      {/* Dashboard header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Dashboard</h1>
        <div className="flex space-x-2">
          <div className="">
            <Input
              type="text"
              placeholder="Search..."
              icon={<HiOutlineSearch />}
              iconPosition="left"
              className="pr-4 py-2 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="icon" className="flex items-center">
            <HiOutlineFilter className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Financial Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {isLoadingAccounts ? (
          <>
            <Skeleton className="h-[150px] rounded-2xl" />
            <Skeleton className="h-[150px] rounded-2xl" />
            <Skeleton className="h-[150px] rounded-2xl" />
          </>
        ) : (
          <>
            <SummaryCard 
              title="Total Balance" 
              amount={totalBalance}
              change={1520.25}
              changePercent={6.2}
              changeText="this month"
              icon="account_balance_wallet"
              iconColor="text-white"
              className="bg-gradient-to-r from-purple-700 to-purple-500 dark:from-purple-800 dark:to-purple-600 text-white rounded-2xl shadow-xl"
              titleClassName="text-white"
            />
            <SummaryCard 
              title="Monthly Income" 
              amount={monthlyIncome}
              change={240.00}
              changePercent={4.8}
              changeText="vs. last month"
              icon="trending_up"
              iconColor="text-white"
              className="bg-gradient-to-r from-green-700 to-green-500 dark:from-green-800 dark:to-green-600 text-white rounded-2xl shadow-xl"
              titleClassName="text-white"
            />
            <SummaryCard 
              title="Monthly Expenses" 
              amount={monthlyExpenses}
              change={-120.45}
              changePercent={-3.1}
              changeText="vs. last month"
              icon="trending_down"
              iconColor="white"
              className="bg-gradient-to-r from-red-700 to-red-500 dark:from-red-800 dark:to-red-600 text-white rounded-2xl shadow-xl"
              titleClassName="text-white"
            />
          </>
        )}
      </div>
      
      {/* Budget Progress Section */}
      <div className="">
        {isLoadingBudgets ? (
          <Skeleton className="h-[300px] rounded-2xl" />
        ) : (
          <BudgetProgress categories={budgetCategories || []} transactions={recentTransactions || []} />
        )}
      </div>
      
      {/* Two Column Layout for Accounts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Connected Accounts Section */}
        <div className="lg:col-span-2">
          {isLoadingAccounts ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <ConnectedAccounts 
              accounts={accounts || []} 
              onConnectAccount={() => setShowConnectModal(true)} 
            />
          )}
        </div>
        
        {/* Recent Transactions Section */}
        <div className="lg:col-span-3">
          {isLoadingTransactions ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <RecentTransactions transactions={recentTransactions || []} />
          )}
        </div>
      </div>
      
      {/* Modals */}
      <ConnectAccountModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)} 
        accountId={0}
      />
      
      <TransferModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)}
        accounts={accounts || []}
      />
    </>
  );
}

// Wrap the Dashboard component with ErrorBoundary
export default function DashboardWithBoundary() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
