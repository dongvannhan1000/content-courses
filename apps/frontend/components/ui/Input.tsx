import React, { forwardRef } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helper, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-400 dark:text-gray-500">
                                {leftIcon}
                            </span>
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`
                            w-full px-4 py-3 
                            bg-white dark:bg-slate-800 
                            border rounded-xl
                            text-gray-900 dark:text-white 
                            placeholder:text-gray-400 dark:placeholder:text-gray-500
                            focus:outline-none focus:ring-2 focus:border-transparent
                            transition-colors duration-200
                            ${leftIcon ? "pl-12" : ""}
                            ${rightIcon || error ? "pr-12" : ""}
                            ${error
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"
                            }
                            ${className}
                        `}
                        {...props}
                    />
                    {(rightIcon || error) && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            {error ? (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                                <span className="text-gray-400 dark:text-gray-500">
                                    {rightIcon}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                {helper && !error && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

// Password Input with toggle
interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> { }

export function PasswordInput({ ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <div className="relative">
            <Input
                type={showPassword ? "text" : "password"}
                rightIcon={
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                }
                {...props}
            />
        </div>
    );
}
