import React, { useState } from 'react';
import { Send, CheckCircle2, UserCheck, AlertCircle, Clock, ShieldCheck, X } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import api from '../utils/api';

const TransferLeadModal = ({ isOpen, onClose, lead, teamMembers = [], onSuccess }) => {
  if (!isOpen || !lead) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    targetUserId: lead.assignedTo?._id || lead.assignedTo || '',
    budgetVerified: lead.qualificationDetails?.budgetVerified || false,
    decisionMaker: lead.qualificationDetails?.decisionMaker || false,
    timeline: lead.qualificationDetails?.timeline || 'Immediate (< 15 Days)',
    requirementSummary: lead.qualificationDetails?.requirementSummary || '',
    preSalesNotes: lead.qualificationDetails?.preSalesNotes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/api/leads/${lead._id}/transfer`, formData);
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Failed to transfer lead:', err);
      setError(err.response?.data?.message || 'Failed to transfer lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-outline rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline flex items-center justify-between bg-surface-variant/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Transfer Lead to Sales</h2>
              <p className="text-xs text-on-surface-variant">Pre-Sales Qualification & Handoff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-variant transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-error text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lead Summary Pill */}
          <div className="p-3.5 bg-surface-variant/30 rounded-xl border border-outline/50 flex items-center justify-between">
            <div>
              <p className="font-semibold text-on-surface text-sm">{lead.name}</p>
              <p className="text-xs text-on-surface-variant">{lead.company} • {lead.phone}</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary border border-primary/20">
              {lead.status}
            </span>
          </div>

          {/* Assign Closer */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Assign to Sales Executive / Closer *
            </label>
            <Select
              value={formData.targetUserId}
              onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
              required
              className="w-full bg-surface"
            >
              <option value="">Select Sales Executive / Manager</option>
              {teamMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role.toUpperCase()})
                </option>
              ))}
            </Select>
          </div>

          {/* Pre-Sales Qualification Checklist */}
          <div className="space-y-3 bg-surface-variant/20 p-4 rounded-xl border border-outline/40">
            <p className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" />
              Qualification Verification
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-2.5 bg-surface rounded-lg border border-outline/50 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.budgetVerified}
                  onChange={(e) => setFormData({ ...formData, budgetVerified: e.target.checked })}
                  className="rounded border-outline text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium text-on-surface">Budget Confirmed</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-surface rounded-lg border border-outline/50 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.decisionMaker}
                  onChange={(e) => setFormData({ ...formData, decisionMaker: e.target.checked })}
                  className="rounded border-outline text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium text-on-surface">Decision Maker</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Client Decision Timeline
              </label>
              <Select
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full bg-surface text-xs"
              >
                <option value="Immediate (< 15 Days)">Immediate (&lt; 15 Days)</option>
                <option value="1 Month">Within 1 Month</option>
                <option value="2-3 Months">2-3 Months</option>
                <option value="Flexible">Exploratory / Flexible</option>
              </Select>
            </div>
          </div>

          {/* Requirement Summary */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Client Requirement Summary
            </label>
            <Input
              type="text"
              placeholder="e.g. 4BHK Villa 3D VR Tour & Elevation design"
              value={formData.requirementSummary}
              onChange={(e) => setFormData({ ...formData, requirementSummary: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Pre-Sales Notes for Closer */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Handoff Notes for Sales Team *
            </label>
            <Textarea
              rows={3}
              placeholder="Provide exact conversation highlights, client preferences, budget range, and next steps..."
              value={formData.preSalesNotes}
              onChange={(e) => setFormData({ ...formData, preSalesNotes: e.target.value })}
              required
              className="w-full text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Send size={15} />
              {loading ? 'Transferring...' : 'Confirm & Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferLeadModal;
