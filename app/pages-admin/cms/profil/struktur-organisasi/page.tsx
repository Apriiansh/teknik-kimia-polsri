'use client';

import { FC, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Edit3, UserPlus, Image as ImageIcon, Save, Loader2 } from 'lucide-react'; // Import ikon UserPlus
import SidebarAdmin from '@/components/SidebarAdmin'; // Import SidebarAdmin

// Updated types to match database schema with UUID
interface Dosen {
    id_dsn: string;
    nama: string;
    nip: string;
    email: string;
    nidn: string;
    prodi: string;
}

interface JabatanStruktural {
    id: string; // UUID format
    title: string;
    dosen_id: string | null;
    category: 'pimpinan' | 'kps' | 'laboratorium';
    order: number;
}

interface StrukturContent {
    id: string;
    narasi: string;
    gambar: string | null;
}

export default function StrukturOrganisasiAdmin() {
    const supabase = createClient();
    const router = useRouter();
    const [dosen, setDosen] = useState<Dosen[]>([]);
    const [jabatan, setJabatan] = useState<JabatanStruktural[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // State for struktur organisasi content
    const [content, setContent] = useState<StrukturContent | null>(null);
    const [editingContent, setEditingContent] = useState<StrukturContent | null>(null);
    const [savingContent, setSavingContent] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Predefined jabatan if none exist in database
    const defaultJabatan = [
        { title: 'Ketua Jurusan', dosen_id: null, category: 'pimpinan', order: 1 },
        { title: 'Sekretaris Jurusan', dosen_id: null, category: 'pimpinan', order: 2 },
        { title: 'KPS DIII - Teknik Kimia', dosen_id: null, category: 'kps', order: 1 },
        { title: 'KPS DIV - Teknik Energi', dosen_id: null, category: 'kps', order: 2 },
        { title: 'KPS DIV - Teknologi Kimia Industri', dosen_id: null, category: 'kps', order: 3 },
        { title: 'KPS S2 - Teknik Energi Terbarukan', dosen_id: null, category: 'kps', order: 4 },
        { title: 'Kepala Laboratorium Analisis', dosen_id: null, category: 'laboratorium', order: 1 },
        { title: 'Kepala Laboratorium Rekayasa', dosen_id: null, category: 'laboratorium', order: 2 },
        { title: 'Kepala Laboratorium Mini Plant', dosen_id: null, category: 'laboratorium', order: 3 },
        { title: 'Kepala Laboratorium Energi', dosen_id: null, category: 'laboratorium', order: 4 },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                // Fetch relevant dosen fields only
                const { data: dosenData, error: dosenError } = await supabase
                    .from('dosen')
                    .select('id_dsn, nama, nip, email, nidn, prodi')
                    .order('nama');

                if (dosenError) {
                    console.error('Error fetching dosen:', dosenError);
                    setMessage({ text: 'Error fetching dosen data', type: 'error' });
                } else {
                    setDosen(dosenData || []);
                }

                // Fetch struktur organisasi content from MySQL API
                try {
                    const response = await fetch('/api/struktur-organisasi');
                    const data = await response.json();
                    
                    if (data.data) {
                        setContent(data.data);
                        setEditingContent({ ...data.data });
                    } else {
                        // Initialize empty content
                        const emptyContent: StrukturContent = {
                            id: '',
                            narasi: '',
                            gambar: null
                        };
                        setEditingContent(emptyContent);
                    }
                } catch (contentError) {
                    console.error('Error fetching content:', contentError);
                    // Initialize empty content
                    const emptyContent: StrukturContent = {
                        id: '',
                        narasi: '',
                        gambar: null
                    };
                    setEditingContent(emptyContent);
                }
               

                // Fetch existing jabatan
                const { data: jabatanData, error: jabatanError } = await supabase
                    .from('struktural_jabatan')
                    .select('id, title, dosen_id, category, order')
                    .order('category, order');

                if (jabatanError) {
                    console.error('Error fetching jabatan:', jabatanError);
                    setMessage({ text: 'Error fetching structural position data', type: 'error' });
                } else if (jabatanData && jabatanData.length === 0) {
                    // If no data, initialize with defaults (without id field, as it will be auto-generated)
                    const { data: insertedData, error: insertError } = await supabase
                        .from('struktural_jabatan')
                        .insert(defaultJabatan)
                        .select();

                    if (insertError) {
                        console.error('Error initializing default jabatan (full error object):', JSON.stringify(insertError, null, 2));
                        let errorText = 'Failed to initialize default positions.';
                        if (insertError.message) {
                            errorText += ` Message: ${insertError.message}`;
                        }
                        // You can add more details from insertError if they exist, e.g., insertError.details, insertError.code
                        setMessage({ text: errorText, type: 'error' });
                    } else {
                        setJabatan(insertedData as JabatanStruktural[] || []);
                    }
                } else {
                    setJabatan(jabatanData as JabatanStruktural[] || []);
                }
            } catch (err) {
                console.error('Error in fetch operation:', err);
                setMessage({ text: 'An unexpected error occurred', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ text: 'File harus berupa gambar', type: 'error' });
            return;
        }

        // Validate file size (max 2MB for base64)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ text: 'Ukuran file terlalu besar (max 2MB untuk base64)', type: 'error' });
            return;
        }

        setUploadingImage(true);
        try {
            // Convert to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            if (editingContent) {
                setEditingContent({
                    ...editingContent,
                    gambar: base64
                });
                setMessage({ text: 'Gambar berhasil diproses', type: 'success' });
            }
        } catch (err) {
            setMessage({ 
                text: `Error saat memproses gambar: ${err instanceof Error ? err.message : 'Unknown error'}`, 
                type: 'error' 
            });
        } finally {
            setUploadingImage(false);
        }
    };

    const saveContentChanges = async () => {
        if (!editingContent) return;

        setSavingContent(true);
        try {
            if (content?.id) {
                // Update existing content
                const response = await fetch('/api/struktur-organisasi', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: content.id,
                        narasi: editingContent.narasi,
                        gambar: editingContent.gambar
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    setMessage({ text: `Gagal menyimpan: ${result.error || 'Unknown error'}`, type: 'error' });
                } else {
                    setContent(editingContent);
                    setMessage({ text: 'Konten berhasil diperbarui', type: 'success' });
                }
            } else {
                // Insert new content
                const response = await fetch('/api/struktur-organisasi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        narasi: editingContent.narasi,
                        gambar: editingContent.gambar
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    setMessage({ text: `Gagal menyimpan: ${result.error || 'Unknown error'}`, type: 'error' });
                } else if (result.data) {
                    setContent(result.data);
                    setEditingContent(result.data);
                    setMessage({ text: 'Konten berhasil disimpan', type: 'success' });
                }
            }
        } catch (err) {
            setMessage({ 
                text: `Error saat menyimpan: ${err instanceof Error ? err.message : 'Unknown error'}`, 
                type: 'error' 
            });
        } finally {
            setSavingContent(false);
        }
    };

    const cancelContentEdit = () => {
        if (content) {
            setEditingContent({ ...content });
        } else {
            setEditingContent({
                id: '',
                narasi: '',
                gambar: null
            });
        }
    };

    const handleAssignDosen = async (jabatanId: string, dosenId: string | null) => {
        setLoading(true);

        try {
            const { error } = await supabase
                .from('struktural_jabatan')
                .update({ dosen_id: dosenId })
                .eq('id', jabatanId);

            if (error) {
                console.error('Error updating jabatan:', error);
                setMessage({ text: `Failed to update position: ${error.message}`, type: 'error' });
            } else {
                setJabatan(jabatan.map(j =>
                    j.id === jabatanId ? { ...j, dosen_id: dosenId } : j
                ));
                setMessage({ text: 'Position updated successfully', type: 'success' });
                setIsEditing(null);
            }
        } catch (err) {
            console.error('Error in assignment operation:', err);
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const addNewPosition = async () => {
        const newPosition = {
            title: 'New Position',
            dosen_id: null,
            category: 'pimpinan' as const,
            order: jabatan.filter(j => j.category === 'pimpinan').length + 1
        };

        try {
            const { data, error } = await supabase
                .from('struktural_jabatan')
                .insert(newPosition)
                .select();

            if (error) {
                console.error('Error adding new position:', error);
                setMessage({ text: `Failed to add new position: ${error.message}`, type: 'error' });
            } else if (data && data.length > 0) {
                setJabatan([...jabatan, data[0] as JabatanStruktural]);
                setMessage({ text: 'New position added successfully', type: 'success' });
            }
        } catch (err) {
            console.error('Error in add operation:', err);
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        }
    };

    const updatePositionTitle = async (jabatanId: string, newTitle: string) => {
        try {
            const { error } = await supabase
                .from('struktural_jabatan')
                .update({ title: newTitle })
                .eq('id', jabatanId);

            if (error) {
                console.error('Error updating position title:', error);
                setMessage({ text: `Failed to update position title: ${error.message}`, type: 'error' });
            } else {
                setJabatan(jabatan.map(j =>
                    j.id === jabatanId ? { ...j, title: newTitle } : j
                ));
                setMessage({ text: 'Position title updated successfully', type: 'success' });
            }
        } catch (err) {
            console.error('Error in update title operation:', err);
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        }
    };

    const updatePositionCategory = async (jabatanId: string, category: 'pimpinan' | 'kps' | 'laboratorium') => {
        const order = jabatan.filter(j => j.category === category).length + 1;

        try {
            const { error } = await supabase
                .from('struktural_jabatan')
                .update({ category, order })
                .eq('id', jabatanId);

            if (error) {
                console.error('Error updating position category:', error);
                setMessage({ text: `Failed to update position category: ${error.message}`, type: 'error' });
            } else {
                setJabatan(jabatan.map(j =>
                    j.id === jabatanId ? { ...j, category, order } : j
                ));
                setMessage({ text: 'Position category updated successfully', type: 'success' });
            }
        } catch (err) {
            console.error('Error in update category operation:', err);
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        }
    };

    const deletePosition = async (jabatanId: string) => {
        if (!confirm('Are you sure you want to delete this position?')) return;

        try {
            const { error } = await supabase
                .from('struktural_jabatan')
                .delete()
                .eq('id', jabatanId);

            if (error) {
                console.error('Error deleting position:', error);
                setMessage({ text: `Failed to delete position: ${error.message}`, type: 'error' });
            } else {
                setJabatan(jabatan.filter(j => j.id !== jabatanId));
                setMessage({ text: 'Position deleted successfully', type: 'success' });
            }
        } catch (err) {
            console.error('Error in delete operation:', err);
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        }
    };

    const getDosenById = (id: string | null): Dosen | undefined => {
        if (!id) return undefined;
        return dosen.find(d => d.id_dsn === id);
    };

    const renderPositionsByCategory = (category: 'pimpinan' | 'kps' | 'laboratorium') => {
        const filtered = jabatan.filter(j => j.category === category);

        return (
            <div className="space-y-4">
                {filtered.map((position) => {
                    const assignedDosen = getDosenById(position.dosen_id);

                    return ( // Padding diubah dari p-4 menjadi p-3
                        <div key={position.id} className="bg-card text-card-foreground p-1 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary"> {/* Padding diubah dari p-2 menjadi p-1 */}
                            <div className="flex justify-between items-center">
                                <div>
                                    {isEditing === `title-${position.id}` ? (
                                        <input
                                            type="text"
                                            className="border border-input bg-background text-foreground rounded p-1 text-lg font-medium focus:ring-2 focus:ring-ring focus:border-ring"
                                            defaultValue={position.title}
                                            onBlur={(e) => {
                                                updatePositionTitle(position.id, e.target.value);
                                                setIsEditing(null);
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <h3
                                            className="text-lg font-medium text-foreground cursor-pointer hover:text-primary"
                                            onClick={() => setIsEditing(`title-${position.id}`)}
                                        >
                                            {position.title}
                                        </h3>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    {isEditing === `category-${position.id}` ? (
                                        <select
                                            className="border border-input bg-background text-foreground rounded p-1 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                                            defaultValue={position.category}
                                            onChange={(e) => {
                                                updatePositionCategory(
                                                    position.id,
                                                    e.target.value as 'pimpinan' | 'kps' | 'laboratorium'
                                                );
                                                setIsEditing(null);
                                            }}
                                            autoFocus
                                        >
                                            <option value="pimpinan">Pimpinan</option>
                                            <option value="kps">Program Studi</option>
                                            <option value="laboratorium">Laboratorium</option>
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(`category-${position.id}`)}
                                            className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded"
                                        >
                                            {position.category === 'pimpinan' ? 'Pimpinan' :
                                                position.category === 'kps' ? 'Program Studi' : 'Laboratorium'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deletePosition(position.id)}
                                        className="text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 rounded"
                                        aria-label="Hapus Posisi"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3">
                                {isEditing === position.id ? (
                                    <div className="flex space-x-2">
                                        <select
                                            className="flex-1 border border-input bg-background text-foreground rounded p-2 focus:ring-2 focus:ring-ring focus:border-ring"
                                            value={position.dosen_id || ''}
                                            onChange={(e) => handleAssignDosen(position.id, e.target.value || null)}
                                        >
                                            <option value="">-- Select Dosen --</option>
                                            {dosen.map((d) => (
                                                <option key={d.id_dsn} value={d.id_dsn}>
                                                    {d.nama} - {d.nip}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsEditing(null)}
                                            className="bg-muted hover:bg-muted/80 text-muted-foreground px-3 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="flex justify-between items-center cursor-pointer p-2 border border-dashed border-border rounded hover:bg-muted/50"
                                        onClick={() => setIsEditing(position.id)}
                                    >
                                        {assignedDosen ? (
                                            <div>
                                                <p className="font-medium text-foreground">{assignedDosen.nama}</p>
                                                <p className="text-sm text-muted-foreground">NIP: {assignedDosen.nip}</p>
                                                <p className="text-xs text-muted-foreground/80">{assignedDosen.prodi}</p>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground italic">Click to assign dosen</p>
                                        )}
                                        <Edit3 className="h-4 w-4 text-primary" aria-label="Ubah Penugasan Dosen" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen theme-admin">
                <SidebarAdmin />
                <main className="ml-72 px-4 py-6 md:px-6 md:py-8 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="ml-3 mt-4 text-muted-foreground">Memuat data struktur organisasi...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen theme-admin">
            <SidebarAdmin />
            <main className="ml-72 px-4 py-6 md:px-6 md:py-8 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto"> {/* Container asli dipertahankan di dalam main */}
                    <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Manajemen Struktur Organisasi</h1>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={addNewPosition}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md" // Mengubah padding agar lebih cocok untuk ikon
                                aria-label="Tambah Posisi Baru" // Menambahkan aria-label untuk aksesibilitas
                            >
                                <UserPlus className="h-5 w-5" /> {/* Mengganti teks dengan ikon */}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                            {message.text}
                            <button
                                className="float-right font-semibold"
                                onClick={() => setMessage(null)}
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {/* Content Management Section */}
                    <div className="mb-8 bg-card border border-border rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-6 text-foreground">Narasi & Gambar Struktur Organisasi</h2>
                        
                        {editingContent && (
                            <div className="space-y-6">
                                {/* Narasi Section */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Narasi
                                    </label>
                                    <textarea
                                        value={editingContent.narasi}
                                        onChange={(e) => setEditingContent({
                                            ...editingContent,
                                            narasi: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-ring focus:outline-none text-sm"
                                        rows={6}
                                        placeholder="Masukkan narasi struktur organisasi..."
                                    />
                                </div>

                                {/* Gambar Section */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        <div className="flex items-center">
                                            <ImageIcon className="w-4 h-4 mr-1" />
                                            <span>Gambar Struktur Organisasi</span>
                                        </div>
                                    </label>

                                    {editingContent.gambar && (
                                        <div className="mb-4">
                                            <img 
                                                src={editingContent.gambar} 
                                                alt="Struktur Organisasi" 
                                                className="max-h-64 rounded-lg border border-border object-contain"
                                                onError={(e) => {
                                                    console.error('Error loading image', e);
                                                }}
                                            />
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={cancelContentEdit}
                                        disabled={savingContent || uploadingImage}
                                        className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveContentChanges}
                                        disabled={savingContent || uploadingImage}
                                        className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {savingContent ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                <span>Simpan Perubahan</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border text-foreground">Pimpinan Jurusan</h2>
                            {renderPositionsByCategory('pimpinan')}
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border text-foreground">Ketua Program Studi</h2>
                            {renderPositionsByCategory('kps')}
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border text-foreground">Kepala Laboratorium</h2>
                            {renderPositionsByCategory('laboratorium')}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}