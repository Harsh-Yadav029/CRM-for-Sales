import React from 'react';

export const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="h-10 w-10 bg-slate-800 rounded-xl"></div>
      <div className="h-6 w-16 bg-slate-800 rounded-lg"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
      <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
    </div>
    <div className="border-t border-slate-850 pt-3 flex justify-between">
      <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
      <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="w-full border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-900/50 border-b border-slate-800 flex items-center px-4 gap-4">
      <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
      <div className="h-4 w-1/4 bg-slate-800 rounded"></div>
      <div className="h-4 w-1/6 bg-slate-800 rounded"></div>
    </div>
    <div className="divide-y divide-slate-850">
      {[1, 2, 3, 4].map(idx => (
        <div key={idx} className="h-14 flex items-center px-4 gap-4">
          <div className="h-3.5 w-1/4 bg-slate-850 rounded"></div>
          <div className="h-3.5 w-1/3 bg-slate-850 rounded"></div>
          <div className="h-3.5 w-1/5 bg-slate-850 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export const DetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center pb-4 border-b border-slate-800">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-slate-800 rounded"></div>
        <div className="h-3 w-32 bg-slate-800 rounded"></div>
      </div>
      <div className="h-10 w-24 bg-slate-800 rounded-xl"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-4">
        <div className="h-48 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
      </div>
      <div className="lg:col-span-4 space-y-4">
        <div className="h-36 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
        <div className="h-48 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
      </div>
    </div>
  </div>
);
