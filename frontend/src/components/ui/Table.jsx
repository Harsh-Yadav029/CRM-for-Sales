import React from 'react';

const Table = ({
  headers = [],
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full overflow-x-auto border border-line rounded-card shadow-card bg-surface ${className}`} {...props}>
      <table className="w-full text-left border-collapse font-sans">
        <thead>
          <tr className="border-b border-line bg-[#FAF9F6] text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
            {headers.map((h, idx) => (
              <th key={idx} className="py-3.5 px-5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-xs text-ink">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
export { Table };
