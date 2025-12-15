"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is fresh for 5 minutes
                        staleTime: 5 * 60 * 1000,
                        // Cache for 30 minutes
                        gcTime: 30 * 60 * 1000,
                        // Retry failed requests 2 times
                        retry: 2,
                        // Don't refetch on window focus in development
                        refetchOnWindowFocus: process.env.NODE_ENV === "production",
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
