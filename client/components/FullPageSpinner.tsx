import React from 'react';

interface FullPageSpinnerProps {
  isVisible: boolean;
}

export default function FullPageSpinner({ isVisible }: FullPageSpinnerProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-[2px] z-50 flex items-center justify-center">
      <div className="text-center bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white border-opacity-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-geo-blue-500 mx-auto mb-4"></div>
        <div className="text-base font-medium text-geo-slate-700 mb-2">Analyzing Results</div>
        <div className="text-xs text-geo-slate-500">Please wait while we process your request...</div>
      </div>
    </div>
  );
}
