"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/admin";
import { ADMIN_ROLE_LABELS, ALL_ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";

export default function AdminTeamPage() {
  const { teamMembers, loading, syncTeam, inviteMember, updateMemberRole, removeMember } = useAdminStore();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", adminRole: "moderateur" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    syncTeam();
  }, [syncTeam]);

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) return;
    setActionLoading(true);
    const ok = await inviteMember(inviteForm);
    setActionLoading(false);
    if (ok) {
      setShowInvite(false);
      setInviteForm({ email: "", name: "", adminRole: "moderateur" });
    }
  };

  const handleRoleUpdate = async (memberId: string) => {
    setActionLoading(true);
    await updateMemberRole(memberId, editRole);
    setActionLoading(false);
    setEditingId(null);
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Retirer ${name} de l'equipe admin ?`)) return;
    setActionLoading(true);
    await removeMember(memberId);
    setActionLoading(false);
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-red-500/10 text-red-400 border-red-500/30",
      moderateur: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      validateur_kyc: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      analyste: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      support: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      financier: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    };
    return colors[role] || "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe d&apos;administration</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerez les membres et les roles de l&apos;equipe admin
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Inviter un membre
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_ADMIN_ROLES.map((role) => (
          <div key={role} className={`px-3 py-2 rounded-lg border text-xs font-semibold text-center ${roleColor(role)}`}>
            {ADMIN_ROLE_LABELS[role]}
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-dark border border-border-dark rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Inviter un membre</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm focus:outline-none focus:border-primary"
                  placeholder="Prenom Nom"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm focus:outline-none focus:border-primary"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Role</label>
                <select
                  value={inviteForm.adminRole}
                  onChange={(e) => setInviteForm({ ...inviteForm, adminRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm focus:outline-none focus:border-primary"
                >
                  {ALL_ADMIN_ROLES.filter((r) => r !== "super_admin").map((role) => (
                    <option key={role} value={role}>
                      {ADMIN_ROLE_LABELS[role as AdminRole]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleInvite}
                disabled={actionLoading || !inviteForm.email || !inviteForm.name}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? "Invitation..." : "Inviter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team list */}
      {loading.team ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-neutral-dark border border-border-dark rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Membre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Dernière connexion</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-border-dark/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-background-dark border border-border-dark text-white text-xs focus:outline-none focus:border-primary"
                        >
                          {ALL_ADMIN_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ADMIN_ROLE_LABELS[role as AdminRole]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(member.id)}
                          disabled={actionLoading}
                          className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-slate-400 hover:bg-slate-400/10"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${roleColor(member.adminRole)}`}>
                        {ADMIN_ROLE_LABELS[member.adminRole as AdminRole] || member.adminRole}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      member.status === "ACTIF" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                      : "Jamais"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.adminRole !== "super_admin" && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingId(member.id); setEditRole(member.adminRole); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-border-dark transition-colors"
                          title="Modifier le role"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleRemove(member.id, member.name)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                          title="Retirer de l'equipe"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Aucun membre dans l&apos;equipe
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Permissions reference */}
      <div className="bg-neutral-dark border border-border-dark rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Reference des permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ADMIN_ROLES.map((role) => {
            const permsMap: Record<string, string[]> = {
              super_admin: ["Acces complet a toutes les fonctionnalites"],
              moderateur: ["Services (moderation)", "Blog (edition)", "Categories", "Journal d'audit"],
              validateur_kyc: ["Utilisateurs (lecture)", "KYC (validation)", "Journal d'audit"],
              analyste: ["Dashboard", "Utilisateurs (lecture)", "Commandes (lecture)", "Finances (lecture)", "Analytics"],
              support: ["Utilisateurs (lecture)", "Commandes", "Litiges", "Messages", "Notifications"],
              financier: ["Commandes (lecture)", "Finances", "Plans", "Analytics"],
            };

            return (
              <div key={role} className={`p-4 rounded-xl border ${roleColor(role)}`}>
                <p className="font-bold text-sm mb-2">{ADMIN_ROLE_LABELS[role as AdminRole]}</p>
                <ul className="space-y-1">
                  {permsMap[role]?.map((p, i) => (
                    <li key={i} className="text-xs opacity-80 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[10px]">check_circle</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
