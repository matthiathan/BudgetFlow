import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { TransactionDialog } from '@/components/features/TransactionDialog';
import { toast } from 'sonner';
import type { Transaction } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/hooks/useCurrency';

export function TransactionsPage() {
  const { formatCurrency } = useCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction deleted');
    },
    onError: () => {
      toast.error('Failed to delete transaction');
    },
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredTransactions = transactions
    .filter((t) => filterType === 'all' || t.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return Number(b.amount) - Number(a.amount);
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <Button onClick={() => { setEditingTransaction(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="amount">Sort by Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions found. Add your first transaction to get started.
              </p>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{transaction.date}</span>
                          <span>•</span>
                          <span>{transaction.category?.name || 'Uncategorized'}</span>
                        </div>
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-chart-2' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        categories={categories}
      />
    </div>
  );
}
