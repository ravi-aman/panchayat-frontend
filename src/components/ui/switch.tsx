import React from 'react';

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ checked, onChange, className = '', ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      className={`
                relative inline-flex h-5 w-10 items-center rounded-full
                border border-gray-300
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                shadow-sm
                ${checked ? 'bg-blue-600' : 'bg-gray-200'}
                disabled:cursor-not-allowed disabled:opacity-50
                ${className}
            `}
      {...props}
    >
      <span
        className={`
                    absolute left-0 top-0 h-5 w-10 rounded-full pointer-events-none
                    transition-colors duration-200
                    ${checked ? 'bg-blue-600/20' : 'bg-gray-200/40'}
                `}
        aria-hidden="true"
      />
      <span
        className={`
                    relative z-10 block h-4 w-4 rounded-full bg-gray-50 shadow-md
                    transition-transform duration-200
                    transform
                    ${checked ? 'translate-x-5' : 'translate-x-1'}
                `}
      />
    </button>
  );
}
