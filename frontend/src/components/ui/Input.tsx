/**
 * Input component - shadcn/ui style.
 *
 * A text input component with consistent styling.
 */
import * as React from 'react'

/**
 * Input component props.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

/**
 * Input component.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={`
            flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className || ''}
          `}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
