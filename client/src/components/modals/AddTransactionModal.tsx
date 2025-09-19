import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: {
    description: string;
    amount: number;
    date: string;
    accountId: number;
    category: string;
    isIncome: boolean;
  }) => void;
  accounts: { id: number; name: string }[];
  categories: string[];
}

export default function AddTransactionModal({ open, onOpenChange, onSave, accounts, categories }: AddTransactionModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id?.toString() || "");
  const [category, setCategory] = useState<string>(categories[0] || "");
  const [isIncome, setIsIncome] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction = {
      description,
      amount: parseFloat(amount),
      date,
      accountId: parseInt(accountId, 10),
      category,
      isIncome,
    };
    onSave(transaction);
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (open) {
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setAccountId(accounts[0]?.id?.toString() || "");
      setCategory(categories[0] || "");
      setIsIncome(false);
    }
  }, [open, accounts, categories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            autoFocus
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="min-w-[120px]"
              required
            />
          </div>
          <div className="flex gap-2">
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(accounts) && accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isIncome} onChange={e => setIsIncome(e.target.checked)} />
              <span>Income</span>
            </label>
            <span className="text-xs text-muted-foreground">(Uncheck for expense)</span>
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" className="w-full">Add Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}