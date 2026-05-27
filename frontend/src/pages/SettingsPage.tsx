import { useState } from 'react';
import { Settings, Shield, Mail, Key, CheckCircle, Save } from 'lucide-react';
import { Page, PageHeader, SectionCard, SectionHeader } from '../components/ui/Page';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'security' | 'smtp' | 'oauth'>('branding');
  const [notice, setNotice] = useState<string | null>(null);

  const [brandingForm, setBrandingForm] = useState({
    platformName: 'Antigravity SaaS IMS',
    supportContact: 'platform-support@antigravity.io',
    logoUrl: '/logo.svg',
  });

  const [securityForm, setSecurityForm] = useState({
    sessionTimeoutMin: '60',
    enforceMfa: true,
    ipRestrictions: '',
  });

  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.mailgun.org',
    port: '587',
    username: 'postmaster@mg.antigravity.io',
    fromName: 'Antigravity IMS Admin',
  });

  const [oauthForm, setOauthForm] = useState({
    googleClientId: '1234567890-mock-google-client-id.apps.googleusercontent.com',
    allowSingleSignOn: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('Settings saved successfully.');
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Platform Preferences"
        title="System Settings"
        description="Configure branding parameters, set security session lifetimes, coordinate SMTP details, and authenticate mock OAuth APIs."
      />

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Navigation Tabs */}
        <aside className="space-y-1">
          <button
            type="button"
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === 'branding' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('branding')}
          >
            <Settings className="h-4 w-4" /> Branding & Profile
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <Shield className="h-4 w-4" /> Security & Session
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === 'smtp' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('smtp')}
          >
            <Mail className="h-4 w-4" /> SMTP Mail Queue
          </button>
          <button
            type="button"
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === 'oauth' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('oauth')}
          >
            <Key className="h-4 w-4" /> Single Sign-On (SSO)
          </button>
        </aside>

        {/* Content pane */}
        <div className="space-y-6">
          {activeTab === 'branding' && (
            <SectionCard>
              <SectionHeader title="Branding Configuration" description="Modify general platform descriptors and support parameters." />
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Platform Display Name</span>
                  <Input
                    value={brandingForm.platformName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, platformName: e.target.value })}
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium">
                  <span>System Support Contact Email</span>
                  <Input
                    value={brandingForm.supportContact}
                    onChange={(e) => setBrandingForm({ ...brandingForm, supportContact: e.target.value })}
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium">
                  <span>Theme Logo URL</span>
                  <Input
                    value={brandingForm.logoUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                  />
                </label>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="inline-flex items-center gap-1.5">
                    <Save className="h-4 w-4" /> Save Branding
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}

          {activeTab === 'security' && (
            <SectionCard>
              <SectionHeader title="Security Controls" description="Configure session parameters and multifactor auth policies." />
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Session Expiration Lifetime (minutes)</span>
                  <Input
                    type="number"
                    value={securityForm.sessionTimeoutMin}
                    onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeoutMin: e.target.value })}
                  />
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={securityForm.enforceMfa}
                    onChange={(e) => setSecurityForm({ ...securityForm, enforceMfa: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enforce Multi-Factor Authentication (MFA) on all admin roles</span>
                </label>

                <label className="block space-y-2 text-sm font-medium">
                  <span>IP Access Restrictions (optional CIDR list)</span>
                  <Input
                    placeholder="e.g. 192.168.1.1/24"
                    value={securityForm.ipRestrictions}
                    onChange={(e) => setSecurityForm({ ...securityForm, ipRestrictions: e.target.value })}
                  />
                </label>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="inline-flex items-center gap-1.5">
                    <Save className="h-4 w-4" /> Save Security
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}

          {activeTab === 'smtp' && (
            <SectionCard>
              <SectionHeader title="SMTP Mail Configuration" description="Configure mail transfer parameters for sending system notifications." />
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm font-medium">
                    <span>SMTP Host</span>
                    <Input
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    <span>SMTP Port</span>
                    <Input
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                    />
                  </label>
                </div>

                <label className="block space-y-2 text-sm font-medium">
                  <span>SMTP Username</span>
                  <Input
                    value={smtpForm.username}
                    onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium">
                  <span>Sender Display Name</span>
                  <Input
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                  />
                </label>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="inline-flex items-center gap-1.5">
                    <Save className="h-4 w-4" /> Save SMTP
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}

          {activeTab === 'oauth' && (
            <SectionCard>
              <SectionHeader title="SSO Integration" description="Configure OAuth credentials and SSO parameters." />
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Google Client ID</span>
                  <Input
                    value={oauthForm.googleClientId}
                    onChange={(e) => setOauthForm({ ...oauthForm, googleClientId: e.target.value })}
                  />
                </label>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={oauthForm.allowSingleSignOn}
                    onChange={(e) => setOauthForm({ ...oauthForm, allowSingleSignOn: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Permit Google Single Sign-On (SSO) login fallback</span>
                </label>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" className="inline-flex items-center gap-1.5">
                    <Save className="h-4 w-4" /> Save OAuth Settings
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}
        </div>
      </div>
    </Page>
  );
}
