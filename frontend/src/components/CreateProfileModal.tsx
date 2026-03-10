import { useState, useEffect } from "react";
import { X, UserPlus, Shield, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { employeesApi, departmentsApi, EmployeeRow, DepartmentRow } from "@/lib/api";

interface Props {
  employee: EmployeeRow;
  onClose: () => void;
  onCreated: (updated: EmployeeRow) => void;
}

export default function CreateProfileModal({ employee, onClose, onCreated }: Props) {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [form, setForm] = useState({
    employeeCode: "",
    title: "",
    baseSalary: "",
    currency: "PHP",
    startDate: "",
    departmentId: "",
    sssNumber: "",
    sssContribution: "",
    philHealthNumber: "",
    philHealthContribution: "",
    pagIbigNumber: "",
    pagIbigContribution: "",
    hasHealthCard: false,
    healthCardProvider: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    departmentsApi.list().then(r => setDepartments(r.departments)).catch(() => {});
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    if (!form.employeeCode.trim()) { setError("Employee code is required."); return; }
    if (!form.title.trim()) { setError("Title / position is required."); return; }
    if (!form.startDate) { setError("Start date is required."); return; }
    if (!form.departmentId) { setError("Department is required."); return; }
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
        departmentId: form.departmentId,
      });

      // Save benefit fields via PATCH if any are filled
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
        departmentId: form.departmentId,
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

  const inputStyle = { border: '1px solid #3c3c3c', backgroundColor: '#1e1e1e', color: '#cccccc' };
  const focusBlur = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#007acc'),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#3c3c3c'),
  };

  function Field({ label, name, type = "text", placeholder }: { label: string; name: keyof typeof form; type?: string; placeholder?: string }) {
    return (
      <div className="space-y-1">
        <label className="text-xs" style={{ color: '#858585' }}>{label}</label>
        <input type={type} value={form[name] as string} onChange={set(name)} placeholder={placeholder}
          className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none" style={inputStyle} {...focusBlur} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
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
            <Field label="Employee Code *" name="employeeCode" placeholder="e.g. EMP-001" />
            <Field label="Title / Position *" name="title" placeholder="e.g. Software Engineer" />
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#858585' }}>Department *</label>
            <select value={form.departmentId} onChange={set("departmentId")}
              className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none" style={inputStyle} {...focusBlur}>
              <option value="">Select department…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <Field label="Start Date *" name="startDate" type="date" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Base Salary" name="baseSalary" type="number" placeholder="0" />
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#858585' }}>Currency</label>
              <select value={form.currency} onChange={set("currency")}
                className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none" style={inputStyle} {...focusBlur}>
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
              <Field label="SSS Number" name="sssNumber" placeholder="XX-XXXXXXX-X" />
              <Field label="SSS Contribution / mo" name="sssContribution" type="number" placeholder="0" />
              <Field label="PhilHealth Number" name="philHealthNumber" placeholder="XXXX-XXXX-XXXX" />
              <Field label="PhilHealth Contribution / mo" name="philHealthContribution" type="number" placeholder="0" />
              <Field label="PAG-IBIG Number" name="pagIbigNumber" placeholder="XXXX-XXXX-XXXX" />
              <Field label="PAG-IBIG Contribution / mo" name="pagIbigContribution" type="number" placeholder="0" />
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
              <Field label="HMO Provider" name="healthCardProvider" placeholder="e.g. Maxicare, Intellicare" />
            )}
          </div>

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
