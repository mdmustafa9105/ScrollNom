import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast.isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-brand-gold" />
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm animate-slide-up">
      <div className="bg-brand-charcoal/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-floating border border-white/10 flex items-center space-x-3">
        {icons[toast.type] || icons.success}
        <p className="text-xs font-semibold leading-tight">{toast.message}</p>
      </div>
    </div>
  );
};
