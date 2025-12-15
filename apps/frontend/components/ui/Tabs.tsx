"use client";

import React, { useState, createContext, useContext } from "react";

// Tabs Context
interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Tabs Root
interface TabsProps {
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({
    defaultValue,
    value,
    onValueChange,
    children,
    className = "",
}: TabsProps) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const activeTab = value ?? internalValue;

    const setActiveTab = (newValue: string) => {
        if (!value) setInternalValue(newValue);
        onValueChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

// Tabs List (container for triggers)
interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
    return (
        <div
            className={`
                flex gap-1 p-1
                bg-gray-100 dark:bg-gray-800
                rounded-xl
                ${className}
            `}
            role="tablist"
        >
            {children}
        </div>
    );
}

// Tab Trigger (button)
interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export function TabsTrigger({
    value,
    children,
    disabled = false,
    className = "",
}: TabsTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => setActiveTab(value)}
            className={`
                flex-1 px-4 py-2
                text-sm font-medium
                rounded-lg
                transition-all duration-200
                cursor-pointer
                ${isActive
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Tab Content
interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    const { activeTab } = context;
    if (activeTab !== value) return null;

    return (
        <div
            role="tabpanel"
            className={`animate-fade-in ${className}`}
        >
            {children}
        </div>
    );
}
