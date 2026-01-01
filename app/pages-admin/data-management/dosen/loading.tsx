import { Loader2, Users2Icon } from 'lucide-react';
import SidebarAdmin from '@/components/SidebarAdmin';

export default function Loading() {
    return (
        <div className="min-h-screen theme-admin">
            <SidebarAdmin />
            <main className="ml-72 px-2 py-4 md:px-4 md:py-6 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto">
                <div className="w-full">
                    <h1 className="text-2xl font-bold mb-6 text-foreground flex items-center">
                        <Users2Icon className="mr-3 w-6 h-6 text-primary" />
                        Manajemen Data Dosen/Tendik
                    </h1>

                    {/* Search skeleton */}
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="h-10 bg-muted rounded-lg animate-pulse flex-grow w-full md:w-auto" />
                        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
                    </div>

                    {/* Filter skeleton */}
                    <div className="bg-card rounded-xl shadow-lg overflow-hidden mb-8">
                        <div className="bg-muted px-5 py-3 border-b border-border">
                            <div className="h-5 w-48 bg-muted-foreground/20 rounded animate-pulse" />
                        </div>
                        <div className="px-5 py-4">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-8 w-24 bg-muted rounded-md animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table skeleton */}
                    <div className="bg-card rounded-lg shadow overflow-hidden">
                        <div className="p-8 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                            <p className="text-muted-foreground">Memuat data dosen...</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
