import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Upload, Check, AlertTriangle, Loader2 } from 'lucide-react';

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Name *' },
  { key: 'company', label: 'Company *' },
  { key: 'email', label: 'Email Address *' },
  { key: 'phone', label: 'Phone Number *' }
];

const OPTIONAL_FIELDS = [
  { key: 'source', label: 'Lead Source' },
  { key: 'expectedRevenue', label: 'Expected Revenue (₹)' }
];

const ImportWizardModal = ({ onClose, onImportSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Importing/Summary
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // File parsing state
  const [csvText, setCsvText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [fileName, setFileName] = useState('');

  // Mapping state: { [targetFieldKey]: csvHeader }
  const [mappings, setMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    // Fetch dynamic custom fields for column mapping
    api.get('/api/custom-fields')
      .then(r => setCustomFields(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvText(text);

      // Lightweight CSV parser (handles simple comma-separated lines and quotes)
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        alert('CSV file is empty');
        return;
      }

      // Parse headers
      const headers = parseCsvLine(lines[0]);
      setCsvHeaders(headers);

      // Parse rows
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const rowCells = parseCsvLine(lines[i]);
        if (rowCells.length > 0) {
          rows.push(rowCells);
        }
      }
      setCsvRows(rows);

      // Pre-map obvious column header names
      const initialMappings = {};
      const lowerHeaders = headers.map(h => h.toLowerCase());

      const mapObvious = (targetKey, matches) => {
        const matchIdx = lowerHeaders.findIndex(lh => matches.some(m => lh.includes(m)));
        if (matchIdx !== -1) {
          initialMappings[targetKey] = headers[matchIdx];
        }
      };

      mapObvious('name', ['name', 'full name', 'client', 'prospect', 'contact']);
      mapObvious('company', ['company', 'firm', 'organization', 'org']);
      mapObvious('email', ['email', 'mail', 'email address']);
      mapObvious('phone', ['phone', 'mobile', 'cell', 'telephone']);
      mapObvious('source', ['source', 'origin', 'channel']);
      mapObvious('expectedRevenue', ['revenue', 'budget', 'value', 'amount', 'expected']);

      setMappings(initialMappings);
      setStep(2);
    };
    reader.readAsText(file);
  };

  // Helper helper to handle quotes inside CSV lines
  const parseCsvLine = (text) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    // Validate required fields mapping
    const missingRequired = REQUIRED_FIELDS.filter(f => !mappings[f.key]);
    if (missingRequired.length > 0) {
      alert(`Please map all required columns: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setImporting(true);
    setStep(3);

    // Map rows to lead objects
    const leadsToImport = csvRows.map(row => {
      const lead = { customFields: {} };
      
      // Map standard fields
      [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach(f => {
        const mappedHeader = mappings[f.key];
        if (mappedHeader) {
          const headerIdx = csvHeaders.indexOf(mappedHeader);
          if (headerIdx !== -1 && row[headerIdx] !== undefined) {
            lead[f.key] = f.key === 'expectedRevenue' ? Number(row[headerIdx]) || 0 : row[headerIdx];
          }
        }
      });

      // Map dynamic custom fields
      customFields.forEach(cf => {
        const mappedHeader = mappings[`custom_${cf.fieldName}`];
        if (mappedHeader) {
          const headerIdx = csvHeaders.indexOf(mappedHeader);
          if (headerIdx !== -1 && row[headerIdx] !== undefined) {
            lead.customFields[cf.fieldName] = cf.fieldType === 'number' ? Number(row[headerIdx]) || 0 : row[headerIdx];
          }
        }
      });

      return lead;
    });

    try {
      const { data } = await api.post('/api/leads/import', { leads: leadsToImport });
      setImportResult(data);
    } catch (err) {
      setImportResult({
        message: err.response?.data?.message || 'Error occurred during batch import',
        importedCount: 0,
        failedCount: csvRows.length,
        errors: [err.response?.data?.message || 'Server connection error']
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-outline-variant flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">publish</span>
            <h3 className="font-bold text-sm md:text-base text-on-surface">Prospect Import Wizard</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={18} />
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/80 rounded-2xl p-10 hover:border-primary/50 transition-colors bg-surface-container-low/10">
              <Upload className="text-outline mb-3" size={40} />
              <h4 className="text-xs font-bold text-on-surface">Upload Lead CSV File</h4>
              <p className="text-[10px] text-on-surface-variant/80 mt-1 max-w-xs text-center leading-normal">
                Make sure your CSV file includes a header row containing contact details.
              </p>
              <label className="mt-4 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                Select CSV File
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {step === 2 && !loading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/60 text-xs text-on-surface-variant font-medium">
                <span>File loaded: <strong>{fileName}</strong></span>
                <span>Rows parsed: <strong>{csvRows.length}</strong></span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-on-surface mb-2">Map CSV Headers to CRM Fields</h4>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Map each required and optional CRM field to a corresponding column header from your CSV file. Choose "None" to skip optional parameters.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Required fields group */}
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Required Fields</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REQUIRED_FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">
                        {f.label}
                      </label>
                      <select
                        value={mappings[f.key] || ''}
                        onChange={(e) => setMappings({ ...mappings, [f.key]: e.target.value })}
                        className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary text-on-surface"
                      >
                        <option value="">-- Choose Column --</option>
                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Optional fields group */}
                <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-wider pt-2 border-t border-outline-variant/60">Optional Fields</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {OPTIONAL_FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">
                        {f.label}
                      </label>
                      <select
                        value={mappings[f.key] || ''}
                        onChange={(e) => setMappings({ ...mappings, [f.key]: e.target.value })}
                        className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary text-on-surface"
                      >
                        <option value="">None / Skip</option>
                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Custom fields group */}
                {customFields.length > 0 && (
                  <>
                    <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-wider pt-2 border-t border-outline-variant/60">
                      Configure Layout Custom Fields
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customFields.map(cf => (
                        <div key={cf._id}>
                          <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">
                            {cf.fieldName} ({cf.fieldType})
                          </label>
                          <select
                            value={mappings[`custom_${cf.fieldName}`] || ''}
                            onChange={(e) => setMappings({ ...mappings, [`custom_${cf.fieldName}`]: e.target.value })}
                            className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary text-on-surface"
                          >
                            <option value="">None / Skip</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              {importing ? (
                <>
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <h4 className="text-xs font-bold text-on-surface">Uploading and Processing Batch Leads...</h4>
                  <p className="text-[10px] text-on-surface-variant/80 max-w-xs leading-relaxed">
                    Connecting to MERN API server. Inserting records and running automation trigger sequences...
                  </p>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${importResult?.importedCount > 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                    {importResult?.importedCount > 0 ? <Check size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  
                  <h4 className="text-sm font-bold text-on-surface">Import Complete</h4>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-xs w-full py-4 border-y border-outline-variant/60 text-xs font-semibold">
                    <div className="text-left">
                      <span className="text-on-surface-variant block">Imported Successfully:</span>
                      <strong className="text-secondary text-base">{importResult?.importedCount || 0}</strong>
                    </div>
                    <div className="text-left">
                      <span className="text-on-surface-variant block">Failed Rows:</span>
                      <strong className="text-error text-base">{importResult?.failedCount || 0}</strong>
                    </div>
                  </div>

                  {importResult?.errors && importResult.errors.length > 0 && (
                    <div className="w-full text-left space-y-1">
                      <span className="text-[10px] font-extrabold text-error uppercase tracking-wider block">Import Warning Logs</span>
                      <div className="max-h-36 overflow-y-auto p-3 bg-error-container/10 border border-error-container/20 rounded-xl text-[10px] font-bold text-on-error-container font-mono space-y-1 custom-scroll">
                        {importResult.errors.map((err, idx) => (
                          <div key={idx}>{err}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/40 shrink-0 flex justify-end gap-3">
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Import Leads
              </button>
            </>
          )}

          {step === 3 && !importing && (
            <button
              type="button"
              onClick={() => {
                onImportSuccess();
                onClose();
              }}
              className="px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizardModal;
