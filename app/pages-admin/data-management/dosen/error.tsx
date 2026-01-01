'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SidebarAdmin from '@/components/SidebarAdmin';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error ke service monitoring (opsional)
        console.error('Dosen Management Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen theme-admin">
            <SidebarAdmin />
            <main className="ml-72 px-2 py-4 md:px-4 md:py-6 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto">
                <div className="w-full flex items-center justify-center min-h-[60vh]">
                    <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        
                        <h2 className="text-xl font-bold text-card-foreground mb-2">
                            Terjadi Kesalahan
                        </h2>
                        
                        <p className="text-muted-foreground mb-6 text-sm">
                            {error.message || 'Gagal memuat halaman manajemen dosen. Silakan coba lagi.'}
                        </p>

                        {error.digest && (
                            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
                                Error ID: {error.digest}
                            </p>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Link
                                href="/pages-admin"
                                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-sm flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali
                            </Link>
                            <button
                                onClick={reset}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Coba Lagi
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
