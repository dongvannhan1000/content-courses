"use client";

import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { ToastProvider } from "@/components/ui";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            <ThemeProvider defaultTheme="system">
                <ToastProvider maxToasts={5}>
                    {children}
                </ToastProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}
