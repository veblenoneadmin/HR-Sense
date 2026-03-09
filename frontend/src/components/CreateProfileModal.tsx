import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
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
      });
    } catch (e: any) {
      setError(e.message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    border: '1px solid #3c3c3c',
    backgroundColor: '#1e1e1e',
    color: '#cccccc',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
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
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#858585' }}>Employee Code *</label>
            <input value={form.employeeCode} onChange={set("employeeCode")} placeholder="e.g. EMP-001"
              className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#007acc')}
              onBlur={e => (e.target.style.borderColor = '#3c3c3c')} />
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#858585' }}>Title / Position *</label>
            <input value={form.title} onChange={set("title")} placeholder="e.g. Software Engineer"
              className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#007acc')}
              onBlur={e => (e.target.style.borderColor = '#3c3c3c')} />
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#858585' }}>Department *</label>
            <select value={form.departmentId} onChange={set("departmentId")}
              className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#007acc')}
              onBlur={e => (e.target.style.borderColor = '#3c3c3c')}>
              <option value="">Select department…</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: '#858585' }}>Start Date *</label>
            <input type="date" value={form.startDate} onChange={set("startDate")}
              className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#007acc')}
              onBlur={e => (e.target.style.borderColor = '#3c3c3c')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#858585' }}>Base Salary</label>
              <input type="number" min="0" step="0.01" value={form.baseSalary} onChange={set("baseSalary")} placeholder="0"
                className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#007acc')}
                onBlur={e => (e.target.style.borderColor = '#3c3c3c')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#858585' }}>Currency</label>
              <select value={form.currency} onChange={set("currency")}
                className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#007acc')}
                onBlur={e => (e.target.style.borderColor = '#3c3c3c')}>
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
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
