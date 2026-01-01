'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Pencil, Trash2, PlusCircle, Search, Image as ImageIcon, AlertTriangle, Activity, Images } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import SidebarAdmin from '@/components/SidebarAdmin';

interface KegiatanItem {
    id: string;
    image_urls: string[];
    description: string | null;
    created_at: string;
    updated_at: string | null;
}

const BUCKET_NAME = 'kegiatan-images';

export default function KegiatanManagementPage() {
    const [kegiatanList, setKegiatanList] = useState<KegiatanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchKegiatan();
    }, []);

    async function fetchKegiatan() {
        setLoading(true);
        setError(null);
        const { data, error: dbError } = await supabase
            .from('kegiatan') 
            .select('*')
            .order('created_at', { ascending: false });

        if (dbError) {
            setError('Gagal memuat data kegiatan. Coba lagi nanti.');
            setKegiatanList([]);
        } else {
            setKegiatanList(data || []);
        }
        setLoading(false);
    }

    async function deleteKegiatan(item: KegiatanItem) {
        if (confirm(`Apakah Anda yakin ingin menghapus kegiatan "${item.description || 'Tanpa Deskripsi'}"?`)) {
            setLoading(true);
            if (item.image_urls && item.image_urls.length > 0) {
                const imagePathsToDelete: string[] = [];
                for (const imageUrl of item.image_urls) {
                    try {
                        const url = new URL(imageUrl);
                        const pathSegments = url.pathname.split('/');
                        const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
                        if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
                            imagePathsToDelete.push(pathSegments.slice(bucketIndex + 1).join('/'));
                        }
                    } catch (e) {
                    }
                }

                if (imagePathsToDelete.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from(BUCKET_NAME)
                        .remove(imagePathsToDelete);

                    if (storageError) {
                        alert(`Peringatan: Gagal menghapus beberapa file gambar dari storage. Error: ${storageError.message}`);
                    }
                }
            }

            const { error: dbError } = await supabase
                .from('kegiatan')
                .delete()
                .eq('id', item.id);

            if (dbError) {
                alert(`Gagal menghapus kegiatan dari database. Error: ${dbError.message}`);
                setError(`Gagal menghapus kegiatan dari database. Error: ${dbError.message}`);
            } else {
                alert('Kegiatan berhasil dihapus.');
                fetchKegiatan(); 
            }
            setLoading(false);
        }
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    const filteredKegiatan = kegiatanList.filter(item =>
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen theme-admin">
            <SidebarAdmin />
            <main className="ml-72 px-4 py-6 md:px-6 md:py-8 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto"> 
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground flex items-center">
                            <Images className="w-7 h-7 mr-3 text-primary" />
                            Manajemen Kegiatan
                        </h1>
                        <Link href="/pages-admin/cms/info/kegiatan/create">
                            <button className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow hover:shadow-md transition-all duration-200 text-sm font-medium">
                                <PlusCircle className="w-5 h-5 mr-2" />
                                <span>Tambah Kegiatan</span>
                            </button>
                        </Link>
                    </div>

                    <div className="bg-card p-4 rounded-lg shadow-md mb-6 border border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="cari kegiatan..."
                                className="pl-10 pr-3 py-2 w-full border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-ring focus:outline-none text-sm" // Styling input disesuaikan
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive text-destructive px-6 py-4 rounded-lg mb-6 text-sm" role="alert"> {/* Styling disesuaikan */}
                            <p className="font-bold flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/>Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div> 
                            <p className="mt-4 text-muted-foreground">Memuat data kegiatan...</p> 
                        </div>
                    ) : filteredKegiatan.length === 0 ? (
                        <div className="p-8 text-center bg-card rounded-lg shadow-md border border-border">
                            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" /> 
                            <p className="text-muted-foreground">{searchTerm ? "Tidak ada kegiatan yang cocok dengan pencarian Anda." : "Belum ada kegiatan yang ditambahkan."}</p>
                            {!searchTerm && <p className="text-sm text-muted-foreground/80 mt-1">Klik "Tambah Kegiatan" untuk memulai.</p>}
                        </div>
                    ) : (
                        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border"> 
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border"> 
                                    <thead className="bg-muted/50"> 
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Gambar
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Deskripsi
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Dibuat
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Diperbarui
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border">
                                        {filteredKegiatan.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="w-16 h-16 relative rounded-md overflow-hidden bg-muted"> 
                                                        <NextImage
                                                            src={(item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : '/placeholder-image.png')}
                                                            alt={item.description || 'Gambar Kegiatan Utama'}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-foreground line-clamp-3 max-w-md"> 
                                                        {item.description || <span className="italic text-muted-foreground/80">Tidak ada deskripsi</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {formatDate(item.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {item.updated_at && item.updated_at !== item.created_at ? formatDate(item.updated_at) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-3">
                                                        <Link href={`/pages-admin/cms/info/kegiatan/edit/${item.id}`} className="text-primary hover:text-primary/80" title="Edit">
                                                            <Pencil className="w-5 h-5" />
                                                        </Link>
                                                        <button onClick={() => deleteKegiatan(item)} className="text-destructive hover:text-destructive/80" title="Hapus" disabled={loading}> 
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}