import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Account, type InsertTransfer } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
}

const transferSchema = z.object({
  fromAccountId: z.number().positive("Please select a source account"),
  toAccountId: z.number().positive("Please select a destination account"),
  amount: z.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
  frequency: z.enum(["one-time", "weekly", "monthly"]).default("one-time"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

const TransferDrawer = ({ isOpen, onClose, accounts }: TransferModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: 0,
      toAccountId: 0,
      amount: 0,
      note: "",
      frequency: "one-time",
    },
  });
  
  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      const transferData: Partial<InsertTransfer> = {
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        date: new Date(), // Fix type issue by using a Date object
        note: data.note || undefined,
        status: "pending",
      };

      const res = await apiRequest('POST', '/api/transfers', transferData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer Initiated",
        description: "Your transfer has been successfully initiated.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/accounts'] });
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "There was an error processing your transfer. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit: SubmitHandler<TransferFormValues> = (data) => {
    if (data.fromAccountId === data.toAccountId) {
      form.setError("toAccountId", { 
        message: "Source and destination accounts must be different" 
      });
      return;
    }

    const fromAccount = accounts.find(acc => acc.id === data.fromAccountId);
    if (fromAccount && fromAccount.balance < data.amount) {
      form.setError("amount", { 
        message: "Insufficient funds in the source account" 
      });
      return;
    }

    createTransferMutation.mutate(data);
  };
  
  const resetForm = () => {
    form.reset();
    onClose();
  };
  
  const setFrequency = (freq: string) => {
    form.setValue("frequency", freq as "one-time" | "weekly" | "monthly");
  };
  
  return (
    <div
      className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      aria-hidden={!isOpen}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Transfer Money</h2>
          <button
            onClick={resetForm}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField<TransferFormValues>
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>From Account</FormLabel>
                    <Select 
                      value={field.value.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(accounts) && accounts.map(account => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({account.accountNumber}) - ${account.balance.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField<TransferFormValues>
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>To Account</FormLabel>
                    <Select 
                      value={field.value.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(accounts) && accounts.map(account => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({account.accountNumber}) - ${account.balance.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField<TransferFormValues>
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input type="number" step="0.01" className="pl-8" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField<TransferFormValues>
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Frequency</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        type="button"
                        variant={field.value === "one-time" ? "secondary" : "outline"} 
                        onClick={() => setFrequency("one-time")}
                        className={field.value === "one-time" ? "border-primary" : ""}
                      >
                        One Time
                      </Button>
                      <Button 
                        type="button"
                        variant={field.value === "weekly" ? "secondary" : "outline"} 
                        onClick={() => setFrequency("weekly")}
                        className={field.value === "weekly" ? "border-primary" : ""}
                      >
                        Weekly
                      </Button>
                      <Button 
                        type="button"
                        variant={field.value === "monthly" ? "secondary" : "outline"} 
                        onClick={() => setFrequency("monthly")}
                        className={field.value === "monthly" ? "border-primary" : ""}
                      >
                        Monthly
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField<TransferFormValues>
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add a note" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-2 justify-end">
                <Button variant="outline" type="button" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTransferMutation.isPending}
                >
                  {createTransferMutation.isPending ? "Processing..." : "Transfer Now"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default TransferDrawer;
