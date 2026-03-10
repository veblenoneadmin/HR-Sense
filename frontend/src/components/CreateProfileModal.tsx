import { useState, useEffect, useCallback } from "react";
import { X, UserPlus, Shield, Heart, CreditCard } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { employeesApi, departmentsApi, EmployeeRow, DepartmentRow } from "@/lib/api";

interface Props {
  employee: EmployeeRow;
  onClose: () => void;
  onCreated: (updated: EmployeeRow) => void;
}

const inputCls = "w-full px-2.5 py-1.5 text-sm rounded-md outline-none";
const inputSx: React.CSSProperties = { border: '1px solid #3c3c3c', backgroundColor: '#1e1e1e', color: '#cccccc' };

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) { e.target.style.borderColor = '#007acc'; }
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) { e.target.style.borderColor = '#3c3c3c'; }

function Label({ text }: { text: string }) {
  return <label className="text-xs block mb-1" style={{ color: '#858585' }}>{text}</label>;
}

export default function CreateProfileModal({ employee, onClose, onCreated }: Props) {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [form, setForm] = useState({
    employeeCode: "", title: "", baseSalary: "", currency: "PHP", startDate: "",
    departmentId: "", sssNumber: "", sssContribution: "", philHealthNumber: "",
    philHealthContribution: "", pagIbigNumber: "", pagIbigContribution: "",
    hasHealthCard: false, healthCardProvider: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    departmentsApi.list().then(r => setDepartments(r.departments)).catch(() => {});
  }, []);

  // Single stable handler — reads field name from input's name attribute
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  async function handleSave() {
    if (!form.employeeCode.trim()) { setError("Employee code is required."); return; }
    if (!form.title.trim()) { setError("Title / position is required."); return; }
    if (!form.startDate) { setError("Start date is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await employeesApi.create({
        esUserId: employee.id,
        employeeCode: form.employeeCode.trim(),
        title: form.title.trim(),
        baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : 0,
        currency: form.currency,
        startDate: form.startDate,
        departmentId: form.departmentId || undefined,
      });

      const hasExtras = form.sssNumber || form.sssContribution || form.philHealthNumber ||
        form.philHealthContribution || form.pagIbigNumber || form.pagIbigContribution ||
        form.hasHealthCard || form.healthCardProvider;
      if (hasExtras) {
        await employeesApi.update(res.profile.id, {
          sssNumber: form.sssNumber || undefined,
          sssContribution: form.sssContribution ? parseFloat(form.sssContribution) : 0,
          philHealthNumber: form.philHealthNumber || undefined,
          philHealthContribution: form.philHealthContribution ? parseFloat(form.philHealthContribution) : 0,
          pagIbigNumber: form.pagIbigNumber || undefined,
          pagIbigContribution: form.pagIbigContribution ? parseFloat(form.pagIbigContribution) : 0,
          hasHealthCard: form.hasHealthCard,
          healthCardProvider: form.healthCardProvider || undefined,
        });
      }

      const dept = departments.find(d => d.id === form.departmentId);
      onCreated({
        ...employee,
        profileId: res.profile.id,
        employeeCode: res.profile.employeeCode,
        title: res.profile.title,
        baseSalary: res.profile.baseSalary,
        department: dept?.name,
        departmentId: form.departmentId || undefined,
        currency: form.currency,
        startDate: form.startDate,
        sssNumber: form.sssNumber || undefined,
        sssContribution: form.sssContribution ? parseFloat(form.sssContribution) : 0,
        philHealthNumber: form.philHealthNumber || undefined,
        philHealthContribution: form.philHealthContribution ? parseFloat(form.philHealthContribution) : 0,
        pagIbigNumber: form.pagIbigNumber || undefined,
        pagIbigContribution: form.pagIbigContribution ? parseFloat(form.pagIbigContribution) : 0,
        hasHealthCard: form.hasHealthCard,
        healthCardProvider: form.healthCardProvider || undefined,
      });
    } catch (e: any) {
      setError(e.message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const gross = parseFloat(form.baseSalary) || 0;
  const deductions = (parseFloat(form.sssContribution) || 0) + (parseFloat(form.philHealthContribution) || 0) + (parseFloat(form.pagIbigContribution) || 0);
  const net = Math.max(0, gross - deductions);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #3c3c3c' }}>
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="lg" />
            <div>
              <h2 className="font-bold text-sm" style={{ color: '#e0e0e0' }}>{employee.name}</h2>
              <p className="text-xs" style={{ color: '#858585' }}>Create HR Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#6e6e6e' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.color = '#cccccc'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6e6e6e'; }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label text="Employee Code *" />
              <input name="employeeCode" value={form.employeeCode} onChange={handleChange} placeholder="e.g. EMP-001"
                className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="space-y-1">
              <Label text="Title / Position *" />
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Software Engineer"
                className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          <div className="space-y-1">
            <Label text="Department (optional)" />
            <select name="departmentId" value={form.departmentId} onChange={handleChange}
              className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Select department…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <Label text="Start Date *" />
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange}
              className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label text="Base Salary" />
              <input name="baseSalary" type="number" min="0" step="0.01" value={form.baseSalary} onChange={handleChange} placeholder="0"
                className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="space-y-1">
              <Label text="Currency" />
              <select name="currency" value={form.currency} onChange={handleChange}
                className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur}>
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
          </div>

          {/* Government Contributions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Government Contributions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label text="SSS Number" />
                <input name="sssNumber" value={form.sssNumber} onChange={handleChange} placeholder="XX-XXXXXXX-X"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div className="space-y-1">
                <Label text="SSS Contribution / mo" />
                <input name="sssContribution" type="number" min="0" step="0.01" value={form.sssContribution} onChange={handleChange} placeholder="0"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div className="space-y-1">
                <Label text="PhilHealth Number" />
                <input name="philHealthNumber" value={form.philHealthNumber} onChange={handleChange} placeholder="XXXX-XXXX-XXXX"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div className="space-y-1">
                <Label text="PhilHealth Contribution / mo" />
                <input name="philHealthContribution" type="number" min="0" step="0.01" value={form.philHealthContribution} onChange={handleChange} placeholder="0"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div className="space-y-1">
                <Label text="PAG-IBIG Number" />
                <input name="pagIbigNumber" value={form.pagIbigNumber} onChange={handleChange} placeholder="XXXX-XXXX-XXXX"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div className="space-y-1">
                <Label text="PAG-IBIG Contribution / mo" />
                <input name="pagIbigContribution" type="number" min="0" step="0.01" value={form.pagIbigContribution} onChange={handleChange} placeholder="0"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          {/* Health Card */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Health Card / HMO</h3>
            </div>
            <div className="flex items-center justify-between py-1.5 mb-2">
              <span className="text-xs" style={{ color: '#858585' }}>Has Health Card</span>
              <input type="checkbox" checked={form.hasHealthCard}
                onChange={e => setForm(f => ({ ...f, hasHealthCard: e.target.checked }))}
                className="w-4 h-4 accent-blue-500" />
            </div>
            {form.hasHealthCard && (
              <div className="space-y-1">
                <Label text="HMO Provider" />
                <input name="healthCardProvider" value={form.healthCardProvider} onChange={handleChange} placeholder="e.g. Maxicare, Intellicare"
                  className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
              </div>
            )}
          </div>

          {/* Live Pay Computation */}
          {gross > 0 && (
            <section className="rounded-lg p-4" style={{ backgroundColor: 'rgba(0,122,204,0.1)', border: '1px solid rgba(0,122,204,0.25)' }}>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold" style={{ color: '#7dbfff' }}>Estimated Net Pay</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-1 font-medium" style={{ color: '#6e6e6e' }}>
                <span></span>
                <span className="text-right">Monthly</span>
                <span className="text-right">Semi-Monthly</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-3 gap-2" style={{ color: '#cccccc' }}>
                  <span>Gross Salary</span>
                  <span className="text-right">{form.currency} {fmt(gross)}</span>
                  <span className="text-right">{form.currency} {fmt(gross / 2)}</span>
                </div>
                {deductions > 0 && (
                  <div className="grid grid-cols-3 gap-2" style={{ color: '#f44747' }}>
                    <span>Deductions</span>
                    <span className="text-right">- {form.currency} {fmt(deductions)}</span>
                    <span className="text-right">- {form.currency} {fmt(deductions / 2)}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 font-bold pt-1" style={{ color: '#7dbfff', borderTop: '1px solid rgba(0,122,204,0.2)' }}>
                  <span>Net Pay</span>
                  <span className="text-right">{form.currency} {fmt(net)}</span>
                  <span className="text-right">{form.currency} {fmt(net / 2)}</span>
                </div>
              </div>
            </section>
          )}

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#f44747', backgroundColor: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.25)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #3c3c3c', backgroundColor: '#1e1e1e' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg"
            style={{ border: '1px solid #3c3c3c', color: '#999999', backgroundColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0e639c' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#1177bb'; }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0e639c')}>
            <UserPlus className="w-3.5 h-3.5" />
            {saving ? "Creating…" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
