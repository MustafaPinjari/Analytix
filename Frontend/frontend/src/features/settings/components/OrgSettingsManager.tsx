import { useState } from 'react';
import {
  Building,
  CreditCard,
  Webhook,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
}

export default function OrgSettingsManager() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'webhooks'>('profile');
  
  // Profile forms
  const [orgName, setOrgName] = useState('Cyberdyne Systems');
  const [orgDomain, setOrgDomain] = useState('cyberdyne.com');
  const [billingEmail, setBillingEmail] = useState('accounts@cyberdyne.com');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Webhook states
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    {
      id: 'wh-1',
      url: 'https://api.cyberdyne.com/webhooks/v1/ingest',
      events: ['dataset.refreshed', 'report.fired'],
      status: 'active',
    },
  ]);
  const [newUrl, setNewUrl] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('dataset.refreshed');

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 800)); // Network delay
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleAddWebhook = () => {
    if (!newUrl) return;
    const newWh: WebhookItem = {
      id: `wh-${Date.now()}`,
      url: newUrl,
      events: [triggerEvent],
      status: 'active',
    };
    setWebhooks((prev) => [...prev, newWh]);
    setNewUrl('');
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure system integrations, inspect billing invoices, and update organizational attributes.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building className="inline-block mr-1 h-3.5 w-3.5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'billing'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="inline-block mr-1 h-3.5 w-3.5" />
            Billing
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'webhooks'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Webhook className="inline-block mr-1 h-3.5 w-3.5" />
            Webhooks & API
          </button>
        </div>
      </div>

      {/* Profile settings Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-muted-foreground">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Custom Org Domain</label>
                <input
                  type="text"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Billing Contact Email</label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Config'}
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
            <div className="text-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Building className="h-4 w-4 text-primary" />
                <h3 className="font-bold">Tenant Info</h3>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Organization ID</p>
                <p className="font-mono text-zinc-500 mt-0.5">org-9912-cyberdyne</p>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Subdomain Mapping</p>
                <p className="font-semibold mt-0.5">cyberdyne.analytix.com</p>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Active Admin</p>
                <p className="font-semibold mt-0.5">{user?.name} (Owner)</p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Billing & Subscription */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col gap-6 text-xs">
            {/* Plan Display */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-primary/5 rounded-xl border border-primary/10 p-5 gap-4">
              <div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary uppercase text-[9px]">
                  Current Subscription
                </span>
                <h3 className="text-lg font-extrabold text-foreground mt-2">Enterprise Scale Pro</h3>
                <p className="text-muted-foreground mt-1">Unlimited visualizations, charts, database aggregates and up to 100 collaborators.</p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-2xl font-black text-foreground">$499<span className="text-xs font-normal">/mo</span></p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Renews Jan 01, 2027</p>
              </div>
            </div>

            {/* Limits Progress bars */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">Resource Allocation Limits</h4>
              
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Connected Datasets</span>
                  <span>3 of 10 sources</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Collaborators</span>
                  <span>4 of 100 users</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '4%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Dashboard Boards</span>
                  <span>5 of Unlimited</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card Details */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between text-xs gap-6">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="font-bold">Payment Methods</h3>
              </div>
              <div className="mt-4 flex items-start gap-3 bg-muted/15 p-3 rounded-lg border border-border/40">
                <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-zinc-950 font-bold border border-zinc-800 text-[10px]">
                  VISA
                </div>
                <div>
                  <p className="font-bold">Visa Ending in 4242</p>
                  <p className="text-muted-foreground mt-0.5">Expires 12/28</p>
                </div>
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-xs font-semibold hover:bg-muted transition-colors">
              Update Billing Card
            </button>
          </div>
        </div>
      )}

      {/* Webhooks & API */}
      {activeTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-foreground">Active Webhook Listeners</h3>
              <p className="text-muted-foreground mt-0.5">Post payload metadata changes to external endpoint systems.</p>
            </div>

            <div className="space-y-3">
              {webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border text-center">
                  <p className="text-muted-foreground">No webhooks configured.</p>
                </div>
              ) : (
                webhooks.map((wh) => (
                  <div key={wh.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-xl gap-4 bg-muted/5">
                    <div className="space-y-1 font-mono text-[10px]">
                      <p className="font-bold text-foreground">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wh.events.map((e) => (
                          <span key={e} className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-primary">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500 uppercase">
                        {wh.status}
                      </span>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded p-1 transition-all"
                        title="Delete Webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Webhook form */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between text-xs gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-bold">Register Webhook</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Endpoint Destination URL</label>
                <input
                  type="url"
                  placeholder="https://api.yourdomain.com/listener"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Event Trigger</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                >
                  <option value="dataset.refreshed">dataset.refreshed</option>
                  <option value="report.fired">report.fired</option>
                  <option value="dashboard.shared">dashboard.shared</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAddWebhook}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Add Event Listener
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
