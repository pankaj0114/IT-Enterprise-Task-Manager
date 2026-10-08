import React from 'react';

const HRSectionShell = ({
  title,
  description,
  children,
  maxWidth = 'max-w-7xl',
}) => (
  <div className={`mx-auto w-full min-w-0 ${maxWidth}`}>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          {description}
        </p>
      )}
    </div>
    {children}
  </div>
);

export default HRSectionShell;
