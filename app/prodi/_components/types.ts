export interface BaseDosen {
    id_dsn: string;
    nama: string;
    nip: string;
    nuptk?: string | null;
    nidn: string | null;
    role: string;
}

export interface ProcessedDosen extends BaseDosen {
    jabatan_title: string | null;
    position_category: 'pimpinan' | 'kps' | 'laboratorium' | null;
    position_order: number | null;
    has_position: boolean;
}

export interface JabatanStruktural {
    id: string;
    title: string;
    dosen_id: string;
    category: 'pimpinan' | 'kps' | 'laboratorium';
    order: number;
}

export interface ProdiContent {
    id_prodi: string;
    title: string | null;
    deskripsi: string | null;
    visi: string | null;
    misi: string | null;
    tujuan: string | null;
    profil_lulusan: string | null;
    file: string | null;
}

export interface ProdiPageData {
    prodiDetails: ProdiContent | null;
    dosenList: ProcessedDosen[];
}
