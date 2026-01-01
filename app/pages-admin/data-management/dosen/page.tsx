'use client';
import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User, FileEdit, Trash2, Search, AlertCircle, UserPlus, KeyRound, Filter, Users2Icon, Loader2, Save, RefreshCw, ArrowLeft } from 'lucide-react';
import SidebarAdmin from '@/components/SidebarAdmin';
import { addDosenAction, updateDosenAction, deleteDosenAction } from '@/app/dosen_actions';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
interface DosenData {
    id_dsn: string;
    email: string;
    nama: string;
    nip: string;
    nidn: string | null;
    nuptk: string | null;
    prodi: string | null;
    status_dosen: string | null;
    foto: string | null;
    role: string | null;
}

interface AlertState {
    show: boolean;
    message: string;
    type: 'success' | 'error' | '';
}

function DosenManagementContent() { 
    const [dosen, setDosen] = useState<DosenData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [alert, setAlert] = useState<AlertState>({ show: false, message: '', type: '' });
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [selectedDosen, setSelectedDosen] = useState<DosenData | null>(null);
    const [addMode, setAddMode] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [selectedRoleCategoryFilter, setSelectedRoleCategoryFilter] = useState<string>('');
    const [selectedProdiFilter, setSelectedProdiFilter] = useState<string>('');
    const [selectedStaffRoleFilter, setSelectedStaffRoleFilter] = useState<string>('');
    
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    
    const [editData, setEditData] = useState({
        id_dsn: '',
        email: '',
        nama: '',
        nip: '',
        nidn: '',
        nuptk: '',
        prodi: '',
        status_dosen: '',
        role: '',
        password: '',
        confirmPassword: '',
        current_foto: ''
    });

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); 

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const supabase = createClient();
    const searchParams = useSearchParams(); 
    const pathname = usePathname(); 


    const prodiOptions = [
        "D3 Teknik Kimia",
        "D4 Teknik Energi",
        "D4 Teknologi Kimia Industri",
        "S2 Energi Terbarukan",
         "D3 Teknik Kimia PSDKU SIAK"
    ];

    const roleOptions = [
        "Dosen", 
        "Administrasi", 
        "Teknisi", 
        "Pranata Lab Pendidikan (PLP)", 
        "Pramu Gedung"
    ];

    const staffRolesList = [
        "Administrasi", 
        "Teknisi", 
        "Pranata Lab Pendidikan (PLP)", 
        "Pramu Gedung"
    ];

    const fetchDosen = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('dosen')
                .select('*')
                .order('nama');

            if (error) throw error;
            setDosen(data || []);
        } catch (caughtError: any) {
            const displayMessage = caughtError?.message 
                ? `Failed to load dosen data: ${caughtError.message}`
                : 'Failed to load dosen data.';
            showAlert(displayMessage, 'error');
            setDosen([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        const type = searchParams.get('type');
        const message = searchParams.get('message');

        if (type && message) {
            showAlert(decodeURIComponent(message), type as 'success' | 'error');
            window.history.replaceState({}, '', pathname);
            return;
        }

        fetchDosen();
    }, [searchParams, pathname, fetchDosen]);

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    const confirmDelete = (dosenData: DosenData) => {
        setSelectedDosen(dosenData);
        setShowConfirmDelete(true);
    };
    
    const startEdit = (dosenData: DosenData) => {
        setEditData({
            id_dsn: dosenData.id_dsn,
            email: dosenData.email,
            nama: dosenData.nama,
            nip: dosenData.nip,
            nidn: dosenData.nidn || '',
            nuptk: dosenData.nuptk || '',
            prodi: dosenData.prodi || '',
            status_dosen: dosenData.status_dosen || '',
            role: dosenData.role || 'Dosen',
            password: '', 
            confirmPassword: '',
            current_foto: dosenData.foto || ''
        });
        setPreviewPhoto(dosenData.foto); 
        setSelectedDosen(dosenData); 
        setEditMode(true);
        setAddMode(false); 
    };

    const startAdd = () => {
        setEditData({ 
            id_dsn: '',
            email: '',
            nama: '',
            nip: '',
            nidn: '',
            nuptk: '',
            prodi: '',
            status_dosen: '', 
            role: '', 
            password: '',
            confirmPassword: '',
            current_foto: ''
        });
        setPreviewPhoto(null);
        setAddMode(true);
        setEditMode(false); 
        setSelectedDosen(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setPreviewPhoto(base64); 
            setSelectedPhotoFile(file); 
        } else {
            setPreviewPhoto(editMode && editData.current_foto ? editData.current_foto : null);
            setSelectedPhotoFile(null);
        }
    };

    const generatePassword = () => {
        if (!editData.nama || !editData.nip) {
            showAlert('Nama dan NIP diperlukan untuk membuat password', 'error');
            return;
        }
        const firstName = editData.nama.split(' ')[0].toLowerCase();
        const nipLast3 = editData.nip.length >= 3 ? editData.nip.slice(-3) : editData.nip.padStart(3, '0');
        const nidnLast3 = editData.nidn && editData.nidn.length >= 3 ? editData.nidn.slice(-3) : '000';
        const generatedPassword = `${firstName}${nipLast3}${nidnLast3}`;
        setEditData(prev => ({ ...prev, password: generatedPassword, confirmPassword: generatedPassword }));
        showAlert('Password berhasil dibuat', 'success');
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formPayload = new FormData(event.currentTarget);

        let fotoBase64 = editData.current_foto;
        if (selectedPhotoFile && previewPhoto) {
            fotoBase64 = previewPhoto;
            formPayload.set('foto', fotoBase64);
        } else if (addMode) {
            formPayload.set('foto', '');
        }
        if (editMode && !selectedPhotoFile && editData.current_foto) {
            formPayload.set('foto', editData.current_foto);
        }


        if (addMode) {
             await addDosenAction(formPayload);
             setAddMode(false);
        } else if (editMode && selectedDosen) { 
             await updateDosenAction(formPayload);
             setEditMode(false);
        }
        setIsSubmitting(false);
    };


    const handleRoleCategoryFilterChange = (category: string) => {
        setSelectedRoleCategoryFilter(category);
        setSelectedProdiFilter('');
        setSelectedStaffRoleFilter('');
    };

    const filteredDosen = useMemo(() => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        
        return dosen.filter(dsn => {
            const searchMatch = debouncedSearchTerm === '' ||
                dsn.nama?.toLowerCase().includes(searchLower) ||
                dsn.nip?.toLowerCase().includes(searchLower) ||
                dsn.email?.toLowerCase().includes(searchLower) ||
                dsn.prodi?.toLowerCase().includes(searchLower) ||
                dsn.status_dosen?.toLowerCase().includes(searchLower) ||
                dsn.nuptk?.toLowerCase().includes(searchLower) ||
                dsn.role?.toLowerCase().includes(searchLower);
            
            if (!searchMatch) return false;

            if (selectedRoleCategoryFilter === 'Dosen') {
                if (dsn.role !== 'Dosen') return false;
                if (selectedProdiFilter && dsn.prodi !== selectedProdiFilter) return false;
            } else if (selectedRoleCategoryFilter === 'Tenaga Kependidikan') {
                if (!dsn.role || !staffRolesList.includes(dsn.role)) return false;
                if (selectedStaffRoleFilter && dsn.role !== selectedStaffRoleFilter) return false;
            }
            return true;
        });
    }, [dosen, debouncedSearchTerm, selectedRoleCategoryFilter, selectedProdiFilter, selectedStaffRoleFilter, staffRolesList]);

    const totalPages = Math.ceil(filteredDosen.length / itemsPerPage);
    const paginatedDosen = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDosen.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDosen, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedRoleCategoryFilter, selectedProdiFilter, selectedStaffRoleFilter]);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="min-h-screen theme-admin">
            <SidebarAdmin />
            <main className="ml-72 px-2 py-4 md:px-4 md:py-6 bg-background w-[calc(100%-18rem)] min-h-screen overflow-y-auto">
                <div className="w-full">
                    {!(addMode || editMode) && (
                        <h1 className="text-2xl font-bold mb-6 text-foreground flex items-center">
                            <Users2Icon className="mr-3 w-6 h-6 text-primary" />
                            Manajemen Data Dosen/Tendik
                        </h1>
                    )}

                    {alert.show && (
                        <div className={`mb-4 p-3 rounded flex items-center ${alert.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-destructive/20 text-destructive'}`}>
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {alert.message}
                        </div>
                    )}

                    {!(addMode || editMode) && (
                        <>
                            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative flex-grow w-full md:w-auto">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari dosen/tendik..."
                                        className="pl-10 pr-4 py-2 w-full border border-input rounded-lg bg-background text-foreground focus:ring-ring focus:border-ring"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={startAdd}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center hover:bg-primary/90 w-full md:w-auto justify-center"
                                    disabled={editMode} 
                                >
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Tambah
                                </button>
                            </div>

                            <div className="bg-card rounded-xl shadow-lg overflow-hidden mb-8">
                                <div className="bg-muted px-5 py-3 border-b border-border">
                                    <h3 className="text-base font-semibold text-card-foreground flex items-center">
                                        <Filter className="mr-2 h-5 w-5 text-muted-foreground" />
                                        Filter Data Dosen/Tendik
                                    </h3>
                                </div>
                                <div className="px-5 py-4 space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                                            Kategori
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {['', 'Dosen', 'Tenaga Kependidikan'].map(category => (
                                                <button
                                                    key={category || 'Semua'}
                                                    type="button"
                                                    onClick={() => handleRoleCategoryFilterChange(category)}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ease-in-out
                                                        ${selectedRoleCategoryFilter === category
                                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                                        }`}
                                                >
                                                    {category === '' ? 'Semua' : category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedRoleCategoryFilter === 'Dosen' && (
                                        <div> 
                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                                                Program Studi
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProdiFilter('')}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ease-in-out
                                                        ${selectedProdiFilter === ''
                                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                                        }`}
                                                >
                                                    Semua Prodi
                                                </button>
                                                {prodiOptions.map((prodi) => (
                                                    <button
                                                        key={prodi}
                                                        type="button"
                                                        onClick={() => setSelectedProdiFilter(prodi)}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ease-in-out
                                                            ${selectedProdiFilter === prodi
                                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                                            }`}
                                                    >
                                                        {prodi}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedRoleCategoryFilter === 'Tenaga Kependidikan' && (
                                        <div> 
                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                                                Filter Tenaga Kependidikan
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedStaffRoleFilter('')}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ease-in-out
                                                        ${selectedStaffRoleFilter === ''
                                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                                        }`}
                                                >
                                                    Semua Tenaga Kependidikan
                                                </button>
                                                {staffRolesList.map(role => (
                                                    <button
                                                        key={role}
                                                        type="button"
                                                        onClick={() => setSelectedStaffRoleFilter(role)}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ease-in-out
                                                            ${selectedStaffRoleFilter === role
                                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                                            }`}
                                                    >
                                                        {role}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Add/Edit Form (Separate) */}
                    {(addMode || editMode) && (
                        <>
                            <div className="mb-4"> 
                                <div className="flex items-center">
                                    <button 
                                        onClick={() => { setAddMode(false); setEditMode(false); setSelectedDosen(null); setPreviewPhoto(null); }}
                                        className="text-foreground hover:text-foreground/80 mr-3 p-1 rounded-full hover:bg-muted transition-colors"
                                        title="Kembali ke daftar"
                                    >
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                    <h2 className="text-xl font-bold text-foreground">
                                        {addMode ? 'Tambah Dosen/Tendik' : 'Edit Data Dosen/Tendik'}
                                    </h2>
                                </div>
                            </div>
                            <div className="mb-6 bg-card p-4 rounded-lg shadow text-card-foreground">
                                <div className="flex justify-end mb-3">
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80 border border-border flex items-center justify-center"
                                        title="Muat Ulang Halaman"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} action={editMode ? updateDosenAction : addDosenAction}>
                                    {editMode && <input type="hidden" name="id_dsn" value={editData.id_dsn} />}
                                    {editMode && editData.current_foto && <input type="hidden" name="current_foto" value={editData.current_foto} />}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Email</label>
                                            <input type="email" name="email" value={editData.email} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Role</label>
                                            <select 
                                                name="role" 
                                                value={editData.role} 
                                                onChange={handleInputChange} 
                                                className={`w-full border border-input rounded-md px-3 py-2 bg-background text-foreground appearance-none ${editMode ? 'opacity-70 bg-gray-100 cursor-not-allowed pointer-events-none' : ''}`}
                                                // disabled={editMode} // Remove disabled, handle unchangeability via UI/UX or server-side logic
                                            >
                                                {/* In edit mode, the value is already set in editData.role. 
                                                    The browser will select it if it matches an option.
                                                    If you want to ensure it's always the selected one and unchangeable:
                                                */}
                                                {editMode ? (
                                                    <option value={editData.role}>{editData.role}</option>
                                                ) : (
                                                    <>
                                                        <option value="">-- Pilih Role --</option>
                                                        {roleOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Nama</label>
                                            <input type="text" name="nama" value={editData.nama} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NIP</label>
                                            <input type="text" name="nip" value={editData.nip} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NUPTK</label>
                                            <input type="text" name="nuptk" value={editData.nuptk} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NIDN</label>
                                            <input type="text" name="nidn" value={editData.nidn} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Golongan/Pangkat</label>
                                            <input type="text" name="status_dosen" value={editData.status_dosen} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Program Studi</label>
                                            <select 
                                                name="prodi" 
                                                value={editData.prodi || ''} 
                                                onChange={handleInputChange} 
                                                className={`w-full border border-input rounded-md px-3 py-2 bg-background text-foreground appearance-none ${editMode ? 'opacity-70 bg-gray-100 cursor-not-allowed pointer-events-none' : ''}`}
                                                // disabled={editMode} // Remove disabled
                                            >
                                                {editMode ? (
                                                    <option value={editData.prodi || ''}>{editData.prodi || '-- Tidak Ada --'}</option>
                                                ) : (
                                                    <>
                                                        <option value="">-- Pilih Program Studi --</option>
                                                        {prodiOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Foto</label>
                                            <input type="file" name="foto" onChange={handleFileChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" accept="image/*" />
                                            {editMode && editData.current_foto && !previewPhoto && (
                                                <p className="text-xs text-muted-foreground mt-1">Foto saat ini: <a href={editData.current_foto} target="_blank" rel="noopener noreferrer" className="underline">Lihat</a></p>
                                            )}
                                        </div>
                                        {previewPhoto && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Preview Foto Baru</label>
                                                <div className="w-32 h-32 relative overflow-hidden rounded-md border border-input">
                                                    <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                        {(addMode || (editMode && editData.password)) && ( // Show password only if adding or if password field in editData has a value (meaning user wants to change it)
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Password Baru (Opsional)</label>
                                                    <div className="flex">
                                                        <input type="password" name="password" value={editData.password} onChange={handleInputChange} className="w-full border border-input rounded-l-md px-3 py-2 bg-background text-foreground" placeholder={editMode ? "Kosongkan jika tidak ingin diubah" : ""}/>
                                                        {addMode && (
                                                            <button type="button" onClick={generatePassword} className="bg-muted border border-input px-3 rounded-r-md hover:bg-muted/80" title="Generate Password">
                                                                <KeyRound className="h-5 w-5 text-muted-foreground" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Konfirmasi Password Baru</label>
                                                    <input type="password" name="confirmPassword" value={editData.confirmPassword} onChange={handleInputChange} className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex justify-end pt-2"> 
                                        <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (addMode ? 'Tambah' : 'Simpan Perubahan')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}

                    {/* Dosen Table */}
                    {!(addMode || editMode) && (
                        <div className="bg-card rounded-lg shadow overflow-hidden">
                             {/* Loading state controls visibility of loader */}
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center animate-pulse">
                                    <Loader2 className="w-6 h-6 mb-3 animate-spin" />
                                    Memuat data dosen...
                                </div>
                            ) : filteredDosen.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground text-xs">
                                    {searchTerm || selectedRoleCategoryFilter || selectedProdiFilter || selectedStaffRoleFilter ? 'Tidak ada dosen yang sesuai dengan filter yang dipilih.' : 'Belum ada data dosen'}
                                </div>
                            ) : (
                                <>
                                    {/* Items per page selector and info */}
                                    <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-2 bg-muted/30">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>Tampilkan</span>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="border border-input rounded px-2 py-1 bg-background text-foreground text-sm"
                                            >
                                                {[5, 10, 20, 50, 100].map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                            <span>data per halaman</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDosen.length)} dari {filteredDosen.length} data
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full divide-y divide-border table-auto">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="px-1 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8%]">Foto</th>
                                                    <th className="px-1 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[18%]">Nama</th>
                                                    <th className="px-1 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">NIP</th>
                                                    <th className="px-1 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">Prodi</th>
                                                    <th className="px-1 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[12%]">Role</th>
                                                    {selectedRoleCategoryFilter !== 'Tenaga Kependidikan' && (
                                                        <th className="px-1 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">Status</th>
                                                    )}
                                                    <th className="px-1 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-card divide-y divide-border text-sm">
                                                {paginatedDosen.map((dsn, index) => (
                                                    <tr key={dsn.id_dsn} className={index % 2 !== 0 ? 'bg-muted/40' : ''}>
                                                        <td className="px-1 py-2 text-center">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted mx-auto">
                                                                {dsn.foto ? (<img src={dsn.foto} alt={dsn.nama} className="w-full h-full object-cover" />) 
                                                                            : (<div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Foto</div>)}
                                                            </div>
                                                        </td>
                                                        <td className="px-1 py-2 whitespace-nowrap text-xs text-left truncate" title={dsn.nama}>{dsn.nama}</td>
                                                        <td className="px-1 py-2 whitespace-nowrap text-xs text-left truncate text-muted-foreground" title={dsn.nip}>{dsn.nip}</td>
                                                        <td className="px-1 py-2 whitespace-nowrap text-xs text-muted-foreground text-left truncate" title={dsn.prodi || undefined}>{dsn.prodi || '-'}</td>
                                                        <td className="px-1 py-2 whitespace-nowrap text-xs text-muted-foreground text-center truncate" title={dsn.role || undefined}>{dsn.role || (selectedRoleCategoryFilter === 'Dosen' ? 'Dosen' : '-')}</td>
                                                        {selectedRoleCategoryFilter !== 'Tenaga Kependidikan' && (
                                                            <td className="px-1 py-2 whitespace-nowrap text-xs text-center">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${dsn.status_dosen === 'ASN' ? 'bg-green-100 text-green-800' : dsn.status_dosen === 'P3K' ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground'}`}>
                                                                    {dsn.status_dosen || 'Tidak diketahui'}
                                                                </span>
                                                            </td>
                                                        )}
                                                        <td className="px-1 py-2 whitespace-nowrap text-xs font-medium text-center">
                                                            <button onClick={() => startEdit(dsn)} className="text-secondary hover:text-secondary/80 mr-3" disabled={showConfirmDelete || addMode || editMode}>
                                                                <FileEdit className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => confirmDelete(dsn)} className="text-destructive hover:text-destructive/80" disabled={showConfirmDelete || addMode || editMode}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/30">
                                            <div className="text-sm text-muted-foreground">
                                                Halaman {currentPage} dari {totalPages}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* Previous Button */}
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1.5 text-sm rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    ←
                                                </button>
                                                
                                                {/* Page Numbers */}
                                                {getPageNumbers().map((page, index) => (
                                                    page === '...' ? (
                                                        <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-sm text-muted-foreground">...</span>
                                                    ) : (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page as number)}
                                                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                                                currentPage === page
                                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                                    : 'border-input bg-background hover:bg-muted'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                ))}
                                                
                                                {/* Next Button */}
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1.5 text-sm rounded-md border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    
                    {showConfirmDelete && selectedDosen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full text-card-foreground">
                                <h3 className="text-lg font-semibold mb-4">Konfirmasi Penghapusan</h3>
                                <p className="mb-6 text-sm">
                                    Apakah Anda yakin ingin menghapus data dosen: <span className="font-semibold">{selectedDosen.nama}</span> ({selectedDosen.nip})?
                                </p>
                                <form action={deleteDosenAction} className="flex justify-end"> {/* Use action prop */}
                                    <input type="hidden" name="id_dsn" value={selectedDosen.id_dsn} />
                                    <button type="button" onClick={() => setShowConfirmDelete(false)} className="mr-2 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-sm">Batal</button>
                                    <button type="submit" className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function DosenManagementPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /> <span className="ml-2">Memuat data dosen...</span></div>}>
            <DosenManagementContent />
        </Suspense>
    );
}