"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Student, Fee, FeeFormData, ToastItem } from "../types";
import { apiFetch, handleUnauthorized } from "../lib/api";
import { getInitials, getAvatarColor } from "../lib/utils";
import { downloadExcel, downloadPDF } from "../lib/export";
import { ExportButton } from "./ExportButton";
import { FeeModal } from "./FeeModal";
import { ConfirmDelete } from "./ConfirmDelete";

export function FeesView({
  students,
  toast,
  addSignal,
}: {
  students: Student[];
  toast: (msg: string, type: ToastItem["type"]) => void;
  addSignal: number;
}) {
  const [fees, setFees]                         = useState<Fee[]>([]);
  const [fetching, setFetching]                 = useState(true);
  const [search, setSearch]                     = useState("");
  const [filterStatus, setFilterStatus]         = useState("");
  const [filterSemester, setFilterSemester]     = useState("");
  const [feeModalOpen, setFeeModalOpen]         = useState(false);
  const [editingFee, setEditingFee]             = useState<Fee | null>(null);
  const [savingFee, setSavingFee]               = useState(false);
  const [deletingFee, setDeletingFee]           = useState<Fee | null>(null);
  const [deletingFeeIP, setDeletingFeeIP]       = useState(false);
  const [paymentFee, setPaymentFee]             = useState<Fee | null>(null);
  const [paymentAmount, setPaymentAmount]       = useState("");
  const [paymentNote, setPaymentNote]           = useState("");
  const [savingPayment, setSavingPayment]       = useState(false);

  const fetchFees = useCallback(async () => {
    try {
      setFetching(true);
      const res = await apiFetch("/api/fees");
      if (res.status === 401) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setFees(json.data ?? json);
    } catch {
      toast("Failed to load fees.", "error");
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  useEffect(() => {
    if (addSignal > 0) { setEditingFee(null); setFeeModalOpen(true); }
  }, [addSignal]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return fees.filter((f) => {
      if (q && !f.student.name.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q))
        return false;
      if (filterStatus   && f.status   !== filterStatus)   return false;
      if (filterSemester && f.semester !== filterSemester) return false;
      return true;
    });
  }, [fees, search, filterStatus, filterSemester]);

  const summary = useMemo(() => ({
    totalBilled:    fees.reduce((s, f) => s + f.totalAmount, 0),
    totalCollected: fees.reduce((s, f) => s + f.paidAmount, 0),
    outstanding:    fees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0),
  }), [fees]);

  async function handleFeeSubmit(data: FeeFormData) {
    setSavingFee(true);
    const payload = {
      student: data.studentId,
      description: data.description,
      category: data.category,
      totalAmount: parseFloat(data.totalAmount),
      dueDate: data.dueDate || undefined,
      semester: data.semester || undefined,
      year: data.year ? parseInt(data.year) : undefined,
    };
    try {
      const path   = editingFee ? `/api/fees/${editingFee._id}` : "/api/fees";
      const method = editingFee ? "PUT" : "POST";
      const res    = await apiFetch(path, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast(editingFee ? "Fee updated" : "Fee added", "success");
      setFeeModalOpen(false);
      fetchFees();
    } catch {
      toast("Operation failed.", "error");
    } finally {
      setSavingFee(false);
    }
  }

  async function handleDeleteFee() {
    if (!deletingFee) return;
    setDeletingFeeIP(true);
    try {
      const res = await apiFetch(`/api/fees/${deletingFee._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Fee deleted", "success");
      setDeletingFee(null);
      fetchFees();
    } catch {
      toast("Failed to delete.", "error");
    } finally {
      setDeletingFeeIP(false);
    }
  }

  async function handlePayment() {
    if (!paymentFee || !paymentAmount) return;
    setSavingPayment(true);
    try {
      const res = await apiFetch(`/api/fees/${paymentFee._id}/payment`, {
        method: "PUT",
        body: JSON.stringify({ amount: parseFloat(paymentAmount), note: paymentNote }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      toast("Payment recorded", "success");
      setPaymentFee(null); setPaymentAmount(""); setPaymentNote("");
      fetchFees();
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to record payment.", "error");
    } finally {
      setSavingPayment(false);
    }
  }

  const statusStyle: Record<string, string> = {
    paid:    "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    unpaid:  "bg-red-50 text-red-700",
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Billed",    value: summary.totalBilled,    color: "text-slate-900"   },
          { label: "Total Collected", value: summary.totalCollected, color: "text-emerald-600" },
          { label: "Outstanding",     value: summary.outstanding,    color: "text-red-500"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>
              {value.toLocaleString()} ETB
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or description…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 bg-white transition-all"
        >
          <option value="">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 bg-white transition-all"
        >
          <option value="">All Semesters</option>
          <option value="Fall">Fall</option>
          <option value="Spring">Spring</option>
        </select>
        <ExportButton
          disabled={filtered.length === 0}
          onExcelClick={() => {
            const headers = ["Student", "Student ID", "Description", "Category", "Total (ETB)", "Paid (ETB)", "Balance (ETB)", "Status", "Due Date"];
            const rows = filtered.map((f) => [
              f.student.name, f.student.studentId ?? "", f.description, f.category,
              f.totalAmount, f.paidAmount, f.totalAmount - f.paidAmount, f.status,
              f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "",
            ]);
            downloadExcel("Fees_Report", headers, rows);
          }}
          onPDFClick={() => {
            const headers = ["Student", "Description", "Total", "Paid", "Balance", "Status"];
            const rows = filtered.map((f) => [
              f.student.name, f.description,
              `${f.totalAmount.toLocaleString()} ETB`,
              `${f.paidAmount.toLocaleString()} ETB`,
              `${(f.totalAmount - f.paidAmount).toLocaleString()} ETB`,
              f.status.toUpperCase(),
            ]);
            downloadPDF("Fees_Report", "School Fees Report", headers, rows);
          }}
        />
      </div>

      {fetching ? (
        <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
          <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="text-5xl">💰</div>
          <p className="text-slate-700 font-semibold">No fee records found</p>
          <p className="text-slate-400 text-sm">
            {fees.length === 0
              ? 'Click "Add Fee" to create the first record'
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Student", "Description", "Category", "Total", "Paid", "Balance", "Due Date", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                          h === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f._id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(f.student.name)}`}
                        >
                          {getInitials(f.student.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{f.student.name}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            {f.student.studentId ?? ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 text-sm max-w-36 truncate">
                      {f.description}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs capitalize">
                        {f.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 text-sm font-medium">
                      {f.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 text-sm font-medium">
                      {f.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {(f.totalAmount - f.paidAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {f.dueDate
                        ? new Date(f.dueDate).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                          statusStyle[f.status] ?? ""
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {f.status !== "paid" && (
                          <button
                            onClick={() => { setPaymentFee(f); setPaymentAmount(""); setPaymentNote(""); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingFee(f); setFeeModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingFee(f)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Delete
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

      <FeeModal
        open={feeModalOpen}
        onClose={() => { setFeeModalOpen(false); setEditingFee(null); }}
        onSubmit={handleFeeSubmit}
        editing={editingFee}
        saving={savingFee}
        students={students}
      />

      {paymentFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPaymentFee(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-0.5">Record Payment</h2>
            <p className="text-slate-500 text-sm mb-5">
              {paymentFee.student.name} ·{" "}
              <span className="font-medium">{paymentFee.description}</span>
              <br />
              <span className="text-emerald-600 font-medium">
                Remaining: {(paymentFee.totalAmount - paymentFee.paidAmount).toLocaleString()} ETB
              </span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Amount (ETB)
                </label>
                <input
                  type="number" value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1" max={paymentFee.totalAmount - paymentFee.paidAmount}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text" value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Cash payment"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setPaymentFee(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || savingPayment}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
              >
                {savingPayment ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDelete
        name={deletingFee?.description ?? null}
        entity="Fee Record"
        onConfirm={handleDeleteFee}
        onCancel={() => setDeletingFee(null)}
        deleting={deletingFeeIP}
      />
    </div>
  );
}

