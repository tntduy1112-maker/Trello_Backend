import React from 'react'

export default function Input({
  label,
  error,
  helperText,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  leftIcon,
  rightIcon,
  ...rest
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#B6C2CF]">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8C9BAB]">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded bg-[#22272B] border text-[#B6C2CF] placeholder-[#8C9BAB]
            focus:outline-none focus:ring-2 focus:ring-[#0C66E4] focus:border-transparent
            transition-colors py-2 px-3
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-9' : ''}
            ${rightIcon ? 'pr-9' : ''}
            ${error ? 'border-red-500' : 'border-[#454F59] hover:border-[#596773]'}
            ${inputClassName}
          `}
          {...rest}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-3 flex items-center text-[#8C9BAB]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#8C9BAB]">{helperText}</p>}
    </div>
  )
}
