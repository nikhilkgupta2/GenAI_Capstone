import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { useAuthStore } from '../lib/auth-store';
import { updateUser } from '../lib/user-api';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [assignedWarehouse, setAssignedWarehouse] = useState(user?.assigned_warehouse ?? '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { name: string; assigned_warehouse?: string }) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      return updateUser(user.id, payload);
    },
    onSuccess: (updatedUser) => {
      setSuccessMessage('Profile updated successfully.');
      setErrorMessage(null);
      if (user) {
        setUser({
          ...user,
          name: updatedUser.name,
          assigned_warehouse: updatedUser.assigned_warehouse,
        });
      }
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.detail ?? 'Failed to update profile.');
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Name is required.');
      return;
    }
    mutation.mutate({
      name,
      assigned_warehouse: assignedWarehouse.trim() || undefined
    });
  };

  return (
    <Page>
      <PageHeader
        title="Profile"
        description="Update your account details. Email cannot be changed."
      />

      <div className="mx-auto max-w-4xl space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <SectionCard>
          <SectionHeader
            title="Account"
            description="Keep your profile information up to date."
          />
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <p className="text-xs text-slate-500 font-normal">This will be shown on your account.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <Input
                  value={user?.email ?? ''}
                  disabled
                  className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 font-normal">Email can't be changed.</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Company</label>
                <Input
                  value={user?.company_name ?? 'System Administration'}
                  disabled
                  className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 font-normal">Your primary workspace.</p>
              </div>

              {(user?.role === 'warehouse_staff' || user?.assigned_warehouse) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Assigned Warehouse</label>
                  <Input
                    value={assignedWarehouse}
                    onChange={(e) => setAssignedWarehouse(e.target.value)}
                    placeholder="e.g. North Warehouse"
                  />
                  <p className="text-xs text-slate-500 font-normal">Location for inventory operations.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 h-10 bg-[#5c5f6a] hover:bg-[#4d5059] text-white rounded-md text-sm font-medium transition"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>
        </SectionCard>

        <div className="max-w-md mx-auto rounded-lg border border-slate-100 bg-[#f8fafc] p-4 text-center dark:border-white/10 dark:bg-white/5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Want to change your password?</h4>
          <p className="mt-1 text-xs text-slate-500 font-normal dark:text-slate-400">
            Sign out &rarr; Forgot password &rarr; Reset password.
          </p>
        </div>
      </div>
    </Page>
  );
}
//nikhil