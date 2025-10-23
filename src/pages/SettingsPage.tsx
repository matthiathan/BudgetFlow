import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, transactionsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export function SettingsPage() {
  const queryClient = useQueryClient();
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleExportCSV = () => {
    const csvHeaders = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Notes'];
    const csvRows = transactions.map((t) => [
      t.date,
      t.type,
      t.category?.name || 'Uncategorized',
      t.description,
      t.amount,
      t.notes || '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences and data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your app preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings?.currency || 'USD'}
              onValueChange={(value) => updateMutation.mutate({ currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings?.language || 'en'}
              onValueChange={(value) => updateMutation.mutate({ language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates about your budget</p>
            </div>
            <Switch
              id="notifications"
              checked={settings?.notifications_enabled ?? true}
              onCheckedChange={(checked) => updateMutation.mutate({ notifications_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your financial data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExportCSV} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export as CSV
          </Button>
          <p className="text-sm text-muted-foreground">
            Export all your transactions to a CSV file for backup or analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
