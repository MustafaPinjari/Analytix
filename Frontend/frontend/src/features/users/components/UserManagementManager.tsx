import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Shield,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { useAuthStore } from '../../../store/useAuthStore';

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'invited';
  joinedAt: string;
}

export default function UserManagementManager() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Invite Dialog states
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgUser['role']>('viewer');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiClient.get('/users/');
      const results = response.data.results || [];
      const mapped: OrgUser[] = results.map((m: any) => {
        const u = m.user;
        const backendRole = m.role;
        const frontendRole: 'owner' | 'admin' | 'editor' | 'viewer' = 
          backendRole === "SUPER_ADMIN" ? "owner" :
          backendRole === "ORG_ADMIN" ? "admin" :
          backendRole === "ANALYST" ? "editor" : "viewer";

        return {
          id: u.id,
          name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
          email: u.email,
          role: frontendRole,
          status: u.is_active ? 'active' : 'invited',
          joinedAt: u.created_at || m.created_at,
        };
      });
      setUsers(mapped);
    } catch (err: any) {
      console.error('Error fetching organization users:', err);
      setErrorMsg('Failed to fetch organization users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleRoleChange = async (id: string, newRole: OrgUser['role']) => {
    try {
      const backendRole = 
        newRole === 'owner' ? 'SUPER_ADMIN' :
        newRole === 'admin' ? 'ORG_ADMIN' :
        newRole === 'editor' ? 'ANALYST' : 'VIEWER';

      await apiClient.put(`/organizations/${user?.organizationId}/users/${id}/`, {
        role: backendRole
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
      setSuccessMsg(`User role updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error changing user role:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to update user role.';
      alert(msg);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove user "${name}"?`)) {
      try {
        await apiClient.delete(`/organizations/${user?.organizationId}/users/${id}/`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setSuccessMsg(`User successfully removed from workspace.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        console.error('Error deleting user membership:', err);
        const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to remove user from workspace.';
        alert(msg);
      }
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setErrorMsg(null);
    try {
      const backendRole = 
        inviteRole === 'owner' ? 'SUPER_ADMIN' :
        inviteRole === 'admin' ? 'ORG_ADMIN' :
        inviteRole === 'editor' ? 'ANALYST' : 'VIEWER';

      await apiClient.post(`/organizations/${user?.organizationId}/invite/`, {
        email: inviteEmail,
        role: backendRole
      });

      setSuccessMsg(`Invitation successfully dispatched to ${inviteEmail}`);
      
      // Reset Form
      setInviteName('');
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteOpen(false);
      
      // Refresh list
      fetchUsers();
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error inviting user:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to dispatch user invitation.';
      alert(msg);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administer workspace roles, invite engineers, and control security levels.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 flex gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="relative w-full">
        <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter workspace collaborators by name or email address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Users List Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-4">Collaborator</th>
                <th className="p-4">Role Privileges</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-violet-600/10 text-violet-500 font-bold flex items-center justify-center border border-violet-500/10 text-xs">
                        {u.name.split(' ').map((n) => n[0] || '').join('').substring(0, 2).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.role === 'owner' ? (
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Shield className="h-3.5 w-3.5 text-violet-500" />
                        <span>Owner</span>
                      </div>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        className="rounded border border-border bg-background px-2.5 py-1 text-xs font-semibold outline-none focus:border-primary"
                      >
                        <option value="admin">Administrator</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(u.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      disabled={u.role === 'owner'}
                      className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Revoke user access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE DIALOG MODAL */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-xs" onClick={() => setInviteOpen(false)} />
          
          <form
            onSubmit={handleInviteSubmit}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in-up text-left text-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold">Invite Collaborator</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Kyle Reese"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Email Address</label>
              <input
                type="email"
                placeholder="kyle.reese@cyberdyne.com"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Role Level</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="admin">Administrator (Full Edit & User controls)</option>
                <option value="editor">Editor (Create charts & Connect datasets)</option>
                <option value="viewer">Viewer (Read-only dashboards)</option>
              </select>
            </div>

            <div className="border-t border-border pt-4 bg-card flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Dispatch Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
