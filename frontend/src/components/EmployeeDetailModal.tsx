import { useState } from "react";
import { X, Save, Mail, Shield, Briefcase, CreditCard, Heart, Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { employeesApi, EmployeeRow, KpiMetric } from "@/lib/api";

interface Props {
  employee: EmployeeRow;
  perf?: KpiMetric;
  onClose: () => void;
  onSaved: (updated: EmployeeRow) => void;
}

const TIER_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  STAR:           { color: '#ffd54f', bg: 'rgba(255,213,79,0.1)',   border: 'rgba(255,213,79,0.3)'  },
  GOOD:           { color: '#7dbfff', bg: 'rgba(0,122,204,0.1)',    border: 'rgba(0,122,204,0.3)'   },
  AVERAGE:        { color: '#cccccc', bg: 'rgba(255,255,255,0.05)', border: '#3c3c3c'               },
  BURNOUT_RISK:   { color: '#ffb74d', bg: 'rgba(255,152,0,0.1)',    border: 'rgba(255,152,0,0.3)'   },
  UNDERPERFORMING:{ color: '#f44747', bg: 'rgba(244,71,71,0.1)',    border: 'rgba(244,71,71,0.3)'   },
};

const ROLE_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  OWNER: "destructive", ADMIN: "warning", MANAGER: "default",
  DEVELOPER: "secondary", STAFF: "outline", CLIENT: "secondary",
};

function Field({ label, value, type = "text", onChange }: {
  label: string;
  value: string | number | boolean;
  type?: string;
  onChange: (v: string) => void;
}) {
  if (type === "checkbox") {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs" style={{ color: '#858585' }}>{label}</span>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked ? "true" : "false")}
          className="w-4 h-4 accent-blue-500"
        />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="text-xs" style={{ color: '#858585' }}>{label}</label>
      <input
        type={type}
        value={value as string ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none transition-colors"
        style={{ border: '1px solid #3c3c3c', backgroundColor: '#1e1e1e', color: '#cccccc' }}
        onFocus={e => (e.target.style.borderColor = '#007acc')}
        onBlur={e => (e.target.style.borderColor = '#3c3c3c')}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
      />
    </div>
  );
}

export default function EmployeeDetailModal({ employee, perf, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    baseSalary: employee.baseSalary ?? 0,
    ratePerHour: employee.ratePerHour ?? "",
    sssNumber: employee.sssNumber ?? "",
    sssContribution: employee.sssContribution ?? 0,
    philHealthNumber: employee.philHealthNumber ?? "",
    philHealthContribution: employee.philHealthContribution ?? 0,
    pagIbigNumber: employee.pagIbigNumber ?? "",
    pagIbigContribution: employee.pagIbigContribution ?? 0,
    hasHealthCard: employee.hasHealthCard ?? false,
    healthCardProvider: employee.healthCardProvider ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (v: string) => {
    setForm(f => ({
      ...f,
      [key]: key === "hasHealthCard" ? v === "true"
        : ["baseSalary", "ratePerHour", "sssContribution", "philHealthContribution", "pagIbigContribution"].includes(key)
          ? (v === "" ? "" : parseFloat(v) || 0)
          : v,
    }));
  };

  async function handleSave() {
    if (!employee.profileId) {
      setError("No HR profile found — create a profile for this employee first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const ratePerHour = form.ratePerHour === "" ? undefined : Number(form.ratePerHour);
      const payload = { ...form, ratePerHour };
      await employeesApi.update(employee.profileId, payload);
      onSaved({ ...employee, ...payload });
    } catch (e: any) {
      setError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const totalDeductions =
    (Number(form.sssContribution) || 0) +
    (Number(form.philHealthContribution) || 0) +
    (Number(form.pagIbigContribution) || 0);

  const netSalary = Math.max(0, (Number(form.baseSalary) || 0) - totalDeductions);
  const currency = employee.currency ?? "PHP";
  const tierStyle = perf ? (TIER_STYLE[perf.tier] ?? TIER_STYLE.AVERAGE) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #3c3c3c' }}>
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold" style={{ color: '#e0e0e0' }}>{employee.name}</h2>
                <Badge variant={ROLE_COLORS[employee.role] ?? "secondary"}>{employee.role}</Badge>
              </div>
              <p className="text-xs" style={{ color: '#858585' }}>{employee.title ?? "—"} · {employee.department ?? "No department"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: '#6e6e6e' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.color = '#cccccc'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6e6e6e'; }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1e1e1e', border: '1px solid #3c3c3c' }}>
              <p className="text-xs mb-0.5" style={{ color: '#858585' }}>Employee Code</p>
              <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{employee.employeeCode ?? "—"}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1e1e1e', border: '1px solid #3c3c3c' }}>
              <p className="text-xs mb-0.5" style={{ color: '#858585' }}>Start Date</p>
              <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>
                {employee.startDate ? new Date(employee.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </p>
            </div>
            {perf && (
              <>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1e1e1e', border: '1px solid #3c3c3c' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#858585' }}>Hours (this month)</p>
                  <p className="text-sm font-semibold" style={{ color: '#7dbfff' }}>{perf.hoursLogged}h</p>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: tierStyle!.bg, border: `1px solid ${tierStyle!.border}` }}>
                  <p className="text-xs mb-0.5" style={{ color: '#858585' }}>Tier</p>
                  <p className="text-sm font-semibold" style={{ color: tierStyle!.color }}>{perf.tier.replace("_", " ")}</p>
                </div>
              </>
            )}
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2 text-sm" style={{ color: '#999999' }}>
            <Mail className="w-4 h-4" style={{ color: '#6e6e6e' }} />
            <span>{employee.email}</span>
          </div>

          {/* Compensation */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Compensation</h3>
              <span className="text-xs" style={{ color: '#6e6e6e' }}>({currency})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Base Salary" value={form.baseSalary} type="number" onChange={set("baseSalary")} />
              <Field label="Rate per Hour (leave blank to auto-compute)" value={form.ratePerHour} type="number" onChange={set("ratePerHour")} />
            </div>
            {Number(form.baseSalary) > 0 && (
              <p className="text-xs mt-2" style={{ color: '#6e6e6e' }}>
                Auto rate: {currency} {((Number(form.baseSalary) || 0) / (22 * 8)).toFixed(2)}/hr (22 working days × 8h)
              </p>
            )}
          </section>

          {/* Government Benefits */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Government Contributions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="SSS Number" value={form.sssNumber} onChange={set("sssNumber")} />
              <Field label={`SSS Contribution (${currency}/mo)`} value={form.sssContribution} type="number" onChange={set("sssContribution")} />
              <Field label="PhilHealth Number" value={form.philHealthNumber} onChange={set("philHealthNumber")} />
              <Field label={`PhilHealth Contribution (${currency}/mo)`} value={form.philHealthContribution} type="number" onChange={set("philHealthContribution")} />
              <Field label="PAG-IBIG Number" value={form.pagIbigNumber} onChange={set("pagIbigNumber")} />
              <Field label={`PAG-IBIG Contribution (${currency}/mo)`} value={form.pagIbigContribution} type="number" onChange={set("pagIbigContribution")} />
            </div>
          </section>

          {/* Health Card */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Health Card / HMO</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <Field label="Has Health Card" value={form.hasHealthCard} type="checkbox" onChange={set("hasHealthCard")} />
              {form.hasHealthCard && (
                <Field label="HMO Provider (e.g. Maxicare, Intellicare)" value={form.healthCardProvider} onChange={set("healthCardProvider")} />
              )}
            </div>
          </section>

          {/* Net Pay Summary */}
          {Number(form.baseSalary) > 0 && (
            <section className="rounded-lg p-4" style={{ backgroundColor: 'rgba(0,122,204,0.1)', border: '1px solid rgba(0,122,204,0.25)' }}>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold" style={{ color: '#7dbfff' }}>Estimated Net Pay</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between" style={{ color: '#cccccc' }}>
                  <span>Gross Salary</span>
                  <span>{currency} {Number(form.baseSalary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between" style={{ color: '#f44747' }}>
                  <span>Total Deductions (SSS + PhilHealth + PAG-IBIG)</span>
                  <span>- {currency} {totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1" style={{ color: '#7dbfff', borderTop: '1px solid rgba(0,122,204,0.2)' }}>
                  <span>Estimated Net Pay</span>
                  <span>{currency} {netSalary.toLocaleString()}</span>
                </div>
              </div>
            </section>
          )}

          {!employee.profileId && (
            <div className="text-xs rounded-lg px-3 py-2 flex items-center gap-2" style={{ color: '#ffb74d', backgroundColor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.25)' }}>
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              No HR profile exists for this employee yet. Create a profile first to save compensation data.
            </div>
          )}

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#f44747', backgroundColor: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.25)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #3c3c3c', backgroundColor: '#1e1e1e' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ border: '1px solid #3c3c3c', color: '#999999', backgroundColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !employee.profileId}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0e639c' }}
            onMouseEnter={e => { if (!saving && employee.profileId) e.currentTarget.style.backgroundColor = '#1177bb'; }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0e639c')}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
