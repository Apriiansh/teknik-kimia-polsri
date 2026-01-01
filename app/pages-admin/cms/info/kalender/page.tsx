'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, FileText, Trash2 } from 'lucide-react';
import SidebarAdmin from '@/components/SidebarAdmin';

interface KalenderAkademik {
    id: string;
    tahun_ajaran: string;
    file_url: string;
    created_at: string;
    updated_at: string;
}

const KalenderAkademikAdminPage = () => {
    const [kalenders, setKalenders] = useState<KalenderAkademik[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [tahunAjaran, setTahunAjaran] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchKalenders();
    }, []);

    const fetchKalenders = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('kalender_akademik')
                .select('*')
                .order('tahun_ajaran', { ascending: false }); 
            if (error) throw error;

            setKalenders(data || []);

        } catch (err: any) {
            setError(`Gagal memuat daftar kalender: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!tahunAjaran || !selectedFile) {
            setError("Mohon lengkapi Tahun Ajaran dan pilih file.");
            return;
        }

        setUploading(true);

        try {
            const fileName = selectedFile.name;
            const filePath = `${tahunAjaran}/${fileName}`; 

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('kalender') 
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false, 
                });

            if (uploadError) {
                if (uploadError.message.includes('duplicate key value') || uploadError.message.includes('already exists')) {
                    setError('File dengan nama yang sama sudah ada untuk tahun ajaran ini.');
                    setUploading(false);
                    return;
                }
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage
                .from('kalender')
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error('Gagal mendapatkan URL publik file yang diunggah.');
            }

            const fileUrl = publicUrlData.publicUrl;

            const { data: existingEntry, error: checkError } = await supabase
                .from('kalender_akademik')
                .select('id')
                .eq('tahun_ajaran', tahunAjaran)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingEntry) {
                setError(`Entri kalender untuk tahun ajaran ${tahunAjaran} sudah ada di database.`);
                await supabase.storage.from('kalender').remove([filePath]);
                setUploading(false);
                return;
            }


            const { data: insertData, error: insertError } = await supabase
                .from('kalender_akademik')
                .insert([
                    { tahun_ajaran: tahunAjaran, file_url: fileUrl }
                ])
                .select(); 

            if (insertError) {
                await supabase.storage.from('kalender').remove([filePath]);
                throw insertError;
            }

            setSuccess("Kalender akademik berhasil diunggah dan disimpan!");
            setTahunAjaran(''); 
            setSelectedFile(null); 
            fetchKalenders();

        } catch (err: any) {
            console.error("Submission error:", err.message);
            setError(`Gagal menyimpan kalender: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (kalender: KalenderAkademik) => {
        if (!confirm(`Anda yakin ingin menghapus kalender tahun ajaran ${kalender.tahun_ajaran}?`)) {
            return;
        }

        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const urlParts = kalender.file_url.split('/storage/v1/object/public/kalender/');
            const filePathInStorage = urlParts.length > 1 ? urlParts[1] : null;

            if (filePathInStorage) {
                const { error: deleteStorageError } = await supabase.storage
                    .from('kalender')
                    .remove([filePathInStorage]);

                if (deleteStorageError) {
                } else {
                }
            } else {
            }


            const { error: deleteDbError } = await supabase
                .from('kalender_akademik')
                .delete()
                .eq('id', kalender.id);

            if (deleteDbError) throw deleteDbError;

            setSuccess(`Kalender tahun ajaran ${kalender.tahun_ajaran} berhasil dihapus.`);
            fetchKalenders(); 

        } catch (err: any) {
            setError(`Gagal menghapus kalender: ${err.message}`);
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen theme-admin">
            <SidebarAdmin />
            <main className="ml-72 px-4 py-6 md:px-6 md:py-8 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold mb-8 text-foreground flex items-center">
                        <CalendarDays className="mr-3 h-6 w-6" /> Manajemen Kalender Akademik
                    </h1>

                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-sm">
                            {success}
                        </div>
                    )}

                    <Card className="mb-6 bg-card border-border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-card-foreground">Upload Kalender Akademik</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="tahun_ajaran" className="text-muted-foreground">Tahun Ajaran</Label>
                                    <Input
                                        id="tahun_ajaran"
                                        type="text"
                                        value={tahunAjaran}
                                        onChange={(e) => setTahunAjaran(e.target.value)}
                                        required
                                        disabled={uploading}
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="file" className="text-muted-foreground">Pilih File Kalender (PDF, dll.)</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.png" 
                                        onChange={handleFileChange}
                                        required
                                        disabled={uploading}
                                        className="bg-background border-input text-foreground file:text-primary file:font-medium"
                                    />
                                    {selectedFile && (
                                        <p className="mt-2 text-sm text-muted-foreground">File terpilih: {selectedFile.name}</p>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        {uploading ? (
                                            <>
                                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-solid border-current border-r-transparent mr-2"></span>
                                                Mengunggah...
                                            </>
                                        ) : (
                                            <>
                                                Simpan
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-card-foreground">Daftar Kalender Tersimpan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                                    <p className="mt-2 text-sm">Memuat daftar kalender...</p>
                                </div>
                            ) : kalenders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-md">
                                    <p>Belum ada kalender akademik yang tersimpan.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader><TableRow className="border-border"><TableHead className="text-muted-foreground">Tahun Ajaran</TableHead><TableHead className="text-muted-foreground">File</TableHead><TableHead className="text-right text-muted-foreground">Aksi</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {kalenders.map((kalender) => (
                                            <TableRow key={kalender.id} className="border-border hover:bg-muted/50">
                                                <TableCell className="font-medium text-foreground">{kalender.tahun_ajaran}</TableCell>
                                                <TableCell>
                                                    <a
                                                        href={kalender.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline flex items-center"
                                                    >
                                                        <FileText className="h-4 w-4 mr-1" /> Lihat File
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(kalender)}
                                                        disabled={uploading || loading} 
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default KalenderAkademikAdminPage;
