import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AnalyticsPage() {
  const { formatCurrency } = useCurrency();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
  });

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (timeRange) {
    case 'week':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
  }

  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  const totalIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = filteredTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;

  const timeSeriesData = timeRange === 'year' 
    ? eachMonthOfInterval({ start: startDate, end: endDate }).map((date) => {
        const monthStr = format(date, 'yyyy-MM');
        const monthTransactions = filteredTransactions.filter((t) => t.date.startsWith(monthStr));
        const income = monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        
        return {
          date: format(date, 'MMM'),
          income,
          expense,
          net: income - expense,
        };
      })
    : eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayTransactions = filteredTransactions.filter((t) => t.date === dateStr);
        const income = dayTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        
        return {
          date: timeRange === 'week' ? format(date, 'EEE') : format(date, 'MMM d'),
          income,
          expense,
          net: income - expense,
        };
      });

  const categoryData = filteredTransactions
    .filter((t) => t.type === 'expense' && t.category)
    .reduce((acc, t) => {
      const categoryName = t.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your financial patterns</p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
              {formatCurrency(netSavings)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} name="Expense" />
              <Line type="monotone" dataKey="net" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
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
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pieData.sort((a, b) => b.value - a.value).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
