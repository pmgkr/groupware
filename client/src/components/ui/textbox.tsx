import * as React from "react"

import { cn } from "@/lib/utils"

interface TextboxProps extends React.ComponentProps<"input"> {
  error?: boolean;
  errorMessage?: string;
}

function Textbox({
  className,
  type = "text",
  error = false,
  errorMessage,
  disabled,
  value,
  ...props
}: TextboxProps) {
  const [focused, setFocused] = React.useState(false);
  const isFilled = value !== undefined && value !== "";

  return (
    <>
      <input
        type={type}
        data-slot="input"
        aria-invalid={error}
        disabled={disabled}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          focused && !error && "border-blue-500 ring-2 ring-blue-200",
          isFilled && !error && "border-green-400",
          error && "border-red-500 ring-2 ring-red-200",
          disabled && "bg-gray-100 text-gray-400 border-gray-200",
          className
        )}
        {...props}
      />
      {error && errorMessage && (
        <div className="mt-1 text-xs text-red-500">{errorMessage}</div>
      )}
    </>
  );
}

export { Textbox }