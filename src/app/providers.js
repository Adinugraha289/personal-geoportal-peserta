"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
    return (
        <SessionProvider basePath="/portal/api/auth">
            {children}
        </SessionProvider>
    );
}