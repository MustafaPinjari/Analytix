import { useState } from 'react';
import { MOCK_REPORTS, MOCK_DASHBOARDS } from '../../../utils/mockData';
import { Report } from '../../../types';
import {
  FileText,
  Search,
  Plus,
  Play,
  Mail,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate } from '../../../utils';

export default function ReportsManager() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Report Modal states
  const [newReportOpen, setNewReportOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [selectedDashId, setSelectedDashId] = useState(MOCK_DASHBOARDS[0].id);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [reportFreq, setReportFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recipientEmails, setRecipientEmails] = useState('');
  
  // Execution trigger state
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRunNow = async (reportId: string, name: string) => {
    setTriggeringId(reportId);
    setSuccessMessage(null);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200)); // Sim compile time
      
      // Update reports last run time
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                lastRunAt: new Date().toISOString(),
                lastRunStatus: 'success',
              }
            : r
        )
      );
      setSuccessMessage(`Report "${name}" generated and dispatched to recipients successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to cancel this scheduled report?')) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleCreateReport = () => {
    if (!reportName || !recipientEmails) return;
    
    const matchedDashName = MOCK_DASHBOARDS.find(d => d.id === selectedDashId)?.name || 'Generic Board';
    const emailList = recipientEmails.split(',').map((e) => e.trim()).filter(Boolean);

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      name: reportName,
      dashboardId: selectedDashId,
      dashboardName: matchedDashName,
      format: reportFormat,
      frequency: reportFreq,
      recipientEmails: emailList,
      nextRunAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
    
    // Reset Form
    setReportName('');
    setRecipientEmails('');
    setNewReportOpen(false);
  };

  const filteredReports = reports.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dashboardName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Scheduled Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automate data exports and deliver PDF briefings or raw CSV streams directly to team emails.
          </p>
        </div>
        <button
          onClick={() => setNewReportOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Schedule Report
        </button>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 flex gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Dispatch Successful</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter schedules by report name or source dashboard..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Reports Table/Grid */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold">No report schedules</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Configure periodic PDF brief summaries of your KPI metrics or export database matrices on a recurring timeline.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Report Details</th>
                  <th className="p-4">Format & Cycle</th>
                  <th className="p-4">Recipients</th>
                  <th className="p-4">Last Run</th>
                  <th className="p-4">Next Scheduled Run</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-foreground">{rep.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Source: {rep.dashboardName}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground capitalize">
                        {rep.format === 'pdf' ? (
                          <FileText className="h-4 w-4 text-red-500" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                        )}
                        <span>{rep.format.toUpperCase()} • {rep.frequency}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[160px]" title={rep.recipientEmails.join(', ')}>
                          {rep.recipientEmails.length} emails ({rep.recipientEmails[0]})
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {rep.lastRunAt ? (
                        <div>
                          <p className="font-medium text-foreground">{formatDate(rep.lastRunAt)}</p>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold mt-1 ${
                              rep.lastRunStatus === 'success'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {rep.lastRunStatus === 'success' ? 'Succeeded' : 'Failed'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never run</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <Clock className="h-3.5 w-3.5 text-violet-500" />
                        <span>{formatDate(rep.nextRunAt)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRunNow(rep.id, rep.name)}
                          disabled={triggeringId === rep.id}
                          className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          <Play className="h-3 w-3" />
                          {triggeringId === rep.id ? 'Running...' : 'Run Now'}
                        </button>
                        <button
                          onClick={() => handleDelete(rep.id)}
                          className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Delete Schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW SCHEDULE MODAL DIALOG */}
      {newReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-xs" onClick={() => setNewReportOpen(false)} />
          
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in-up text-left text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold">Schedule Recurring Briefing</h3>
              </div>
              <button
                onClick={() => setNewReportOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Report Name</label>
              <input
                type="text"
                placeholder="e.g. Sales Executive Summary"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Source Dashboard</label>
                <select
                  value={selectedDashId}
                  onChange={(e) => setSelectedDashId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {MOCK_DASHBOARDS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Format</label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="pdf">PDF Briefing</option>
                  <option value="csv">Raw CSV Spreadsheet</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Frequency</label>
              <select
                value={reportFreq}
                onChange={(e) => setReportFreq(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="daily">Daily Briefing (06:00 UTC)</option>
                <option value="weekly">Weekly Digest (Mondays 08:00 UTC)</option>
                <option value="monthly">Monthly Audit (1st of month)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Recipients (Comma-separated emails)</label>
              <textarea
                rows={2}
                placeholder="email1@company.com, email2@company.com"
                value={recipientEmails}
                onChange={(e) => setRecipientEmails(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="border-t border-border pt-4 bg-card flex justify-end gap-2">
              <button
                onClick={() => setNewReportOpen(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
