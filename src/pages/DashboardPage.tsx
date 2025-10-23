import { useQuery } from '@tanstack/react-query';
import { transactionsApi, savingsGoalsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export function DashboardPage() {
  const { formatCurrency } = useCurrency();
  
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: savingsGoalsApi.getAll,
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBalance = totalIncome - totalExpenses;

  const totalSavings = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter((t) => t.date === dateStr);
    const income = dayTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      date: format(date, 'EEE'),
      income,
      expense,
    };
  });

  const categoryExpenses = transactions
    .filter((t) => t.type === 'expense' && t.category)
    .reduce((acc, t) => {
      const categoryName = t.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(categoryExpenses).map(([name, value]) => ({
    name,
    value,
  }));

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Current balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{formatCurrency(totalSavings)}</div>
            <p className="text-xs text-muted-foreground">{savingsGoals.length} goals</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'income' ? 'text-chart-2' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
