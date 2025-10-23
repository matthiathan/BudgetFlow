import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsGoalsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { SavingsGoalDialog } from '@/components/features/SavingsGoalDialog';
import { SavingsActionDialog } from '@/components/features/SavingsActionDialog';
import { toast } from 'sonner';
import type { SavingsGoal } from '@/types';
import { format, differenceInDays } from 'date-fns';

export function SavingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionGoal, setActionGoal] = useState<SavingsGoal | null>(null);
  const [actionType, setActionType] = useState<'contribute' | 'withdraw'>('contribute');
  const queryClient = useQueryClient();

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: savingsGoalsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: savingsGoalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      toast.success('Savings goal deleted');
    },
    onError: () => {
      toast.error('Failed to delete goal');
    },
  });

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this savings goal?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleContribute = (goal: SavingsGoal) => {
    setActionGoal(goal);
    setActionType('contribute');
    setActionDialogOpen(true);
  };

  const handleWithdraw = (goal: SavingsGoal) => {
    setActionGoal(goal);
    setActionType('withdraw');
    setActionDialogOpen(true);
  };

  const totalSavings = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground">Track your progress toward your financial goals</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">${totalSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across {savingsGoals.length} goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalTarget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalTarget > 0 ? `${((totalSavings / totalTarget) * 100).toFixed(1)}% complete` : 'Set your first goal'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {savingsGoals.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No savings goals yet. Create your first goal to start tracking your progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          savingsGoals.map((goal) => {
            const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
            
            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">${Number(goal.current_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">${Number(goal.target_amount).toFixed(2)}</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className={`font-medium ${daysLeft !== null && daysLeft < 30 ? 'text-destructive' : ''}`}>
                          {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} days left` : 'Overdue'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleContribute(goal)}
                      disabled={progress >= 100}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Contribute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleWithdraw(goal)}
                      disabled={Number(goal.current_amount) <= 0}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <SavingsGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
      />

      <SavingsActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        goal={actionGoal}
        action={actionType}
      />
    </div>
  );
}
