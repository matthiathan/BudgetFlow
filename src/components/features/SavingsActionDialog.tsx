import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsGoalsApi, transactionsApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { SavingsGoal } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';

interface SavingsActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoal | null;
  action: 'contribute' | 'withdraw';
}

export function SavingsActionDialog({ open, onOpenChange, goal, action }: SavingsActionDialogProps) {
  const { formatCurrency } = useCurrency();
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async (actionAmount: number) => {
      if (!goal) throw new Error('No goal selected');

      const currentAmount = Number(goal.current_amount);
      const targetAmount = Number(goal.target_amount);

      // Calculate new amount
      const newAmount = action === 'contribute' 
        ? currentAmount + actionAmount 
        : currentAmount - actionAmount;

      // Validate
      if (newAmount < 0) {
        throw new Error('Cannot withdraw more than current savings');
      }

      if (action === 'contribute' && newAmount > targetAmount) {
        throw new Error('Contribution would exceed target amount');
      }

      // Update savings goal
      await savingsGoalsApi.update(goal.id, {
        current_amount: newAmount,
      });

      // Create transaction to affect total balance
      await transactionsApi.create({
        type: action === 'contribute' ? 'expense' : 'income',
        amount: actionAmount,
        category_id: null,
        date: new Date().toISOString().split('T')[0],
        description: action === 'contribute' 
          ? `Contribution to ${goal.title}` 
          : `Withdrawal from ${goal.title}`,
        notes: `Savings goal ${action}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Successfully ${action === 'contribute' ? 'contributed to' : 'withdrew from'} ${goal?.title}`);
      onOpenChange(false);
      setAmount('');
    },
    onError: (error: any) => {
      console.error('Savings action error:', error);
      toast.error(error.message || `Failed to ${action}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !goal) {
      toast.error('Please enter an amount');
      return;
    }

    const actionAmount = Number(amount);
    if (isNaN(actionAmount) || actionAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    actionMutation.mutate(actionAmount);
  };

  const maxAmount = action === 'withdraw' 
    ? Number(goal?.current_amount || 0)
    : Number(goal?.target_amount || 0) - Number(goal?.current_amount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {action === 'contribute' ? 'Contribute to' : 'Withdraw from'} {goal?.title}
          </DialogTitle>
          <DialogDescription>
            {action === 'contribute' 
              ? 'Add money to your savings goal. This will be deducted from your total balance.'
              : 'Withdraw money from your savings goal. This will be added to your total balance.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              max={maxAmount}
            />
            <p className="text-xs text-muted-foreground">
              {action === 'contribute' 
                ? `Maximum: ${formatCurrency(maxAmount)} (to reach target)`
                : `Available: ${formatCurrency(maxAmount)}`}
            </p>
          </div>

          <div className="bg-secondary/50 p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Amount:</span>
              <span className="font-medium">{formatCurrency(Number(goal?.current_amount || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {action === 'contribute' ? 'After Contribution:' : 'After Withdrawal:'}
              </span>
              <span className="font-medium">
                {formatCurrency(Number(goal?.current_amount || 0) + (action === 'contribute' ? Number(amount || 0) : -Number(amount || 0)))}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionMutation.isPending}>
              {actionMutation.isPending 
                ? `${action === 'contribute' ? 'Contributing' : 'Withdrawing'}...` 
                : action === 'contribute' ? 'Contribute' : 'Withdraw'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
