import { createClient } from '@/utils/supabase/server';
import DosenStaffContent from './DosenStaffContent';

interface Dosen {
    id_dsn: string;
    nama: string;
    nip: string;
    email: string;
    nidn: string | null;
    prodi: string | null;
    role: string;
    jabatan_title?: string | null;
    position_category?: 'pimpinan' | 'kps' | 'laboratorium' | null;
    position_order?: number | null;
    has_position: boolean;
    nuptk?: string | null;
}

interface FetchedDosen {
    id_dsn: string;
    nama: string;
    nip: string;
    email: string;
    nidn: string | null;
    prodi: string | null;
    role: string;
    nuptk?: string | null;
}

interface JabatanStruktural {
    id: string;
    title: string;
    dosen_id: string;
    category: 'pimpinan' | 'kps' | 'laboratorium';
    order: number;
}

interface OrganizedDosenData {
    dosen: Dosen[];
    staff: Dosen[];
}

async function getDosenData(): Promise<OrganizedDosenData> {
    const supabase = await createClient();

    const { data: dosenData, error: dosenError } = await supabase
        .from('dosen')
        .select('id_dsn, nama, nip, email, nidn, prodi, role, nuptk')
        .order('nama');

    if (dosenError || !dosenData) {
        console.error('Error fetching dosen:', dosenError);
        return { dosen: [], staff: [] };
    }

    const { data: jabatanData } = await supabase
        .from('struktural_jabatan')
        .select('id, title, dosen_id, category, order')
        .not('dosen_id', 'is', null);

    const jabatanMap = new Map<string, JabatanStruktural>();
    jabatanData?.forEach((jabatan: JabatanStruktural) => {
        const existingJabatan = jabatanMap.get(jabatan.dosen_id);
        if (!existingJabatan || jabatan.order < existingJabatan.order) {
            jabatanMap.set(jabatan.dosen_id, jabatan);
        }
    });

    const enhancedDosenData: Dosen[] = dosenData.map((dosen: FetchedDosen) => {
        const jabatan = jabatanMap.get(dosen.id_dsn);

        if (jabatan) {
            return {
                ...dosen,
                jabatan_title: jabatan.title,
                position_category: jabatan.category,
                position_order: jabatan.order,
                has_position: true
            };
        }

        return {
            ...dosen,
            jabatan_title: null,
            position_category: null,
            position_order: null,
            has_position: false
        };
    });

    const targetLecturerName = "Ir. Irawan Rusnadi, M.T.";
    let prioritizedLecturer: Dosen | null = null;

    const filteredEnhancedDosenData = enhancedDosenData.filter(dosen => {
        if (dosen.nama.trim() === targetLecturerName) {
            prioritizedLecturer = dosen;
            return false;
        }
        return true;
    });

    const allDosen: Dosen[] = [];
    const allStaff: Dosen[] = [];
    const pimpinanList: Dosen[] = [];
    const kpsList: Dosen[] = [];
    const laboratoriumList: Dosen[] = [];
    const potentialProfDrOrOtherDosenList: Dosen[] = [];

    filteredEnhancedDosenData.forEach((dosen: Dosen) => {
        const normalizedRole = dosen.role ? dosen.role.trim().toLowerCase() : null;

        if (normalizedRole !== 'dosen') {
            if (dosen.role) {
                allStaff.push(dosen);
            }
            return;
        }

        if (dosen.has_position) {
            const category = dosen.position_category;
            if (category === 'pimpinan') {
                pimpinanList.push(dosen);
                return;
            }
            if (category === 'kps') {
                kpsList.push(dosen);
                return;
            }
            if (category === 'laboratorium') {
                laboratoriumList.push(dosen);
                return;
            }
        }
        potentialProfDrOrOtherDosenList.push(dosen);
    });

    const profesorList: Dosen[] = [];
    const doktorList: Dosen[] = [];
    const otherDosenList: Dosen[] = [];

    potentialProfDrOrOtherDosenList.forEach(dosen => {
        if (/\bprof\./i.test(dosen.nama)) {
            profesorList.push(dosen);
        } else if (/\bdr\./i.test(dosen.nama)) {
            doktorList.push(dosen);
        } else {
            otherDosenList.push(dosen);
        }
    });

    pimpinanList.sort((a, b) => (a.position_order ?? Infinity) - (b.position_order ?? Infinity) || a.nama.localeCompare(b.nama));
    kpsList.sort((a, b) => (a.position_order ?? Infinity) - (b.position_order ?? Infinity) || a.nama.localeCompare(b.nama));
    laboratoriumList.sort((a, b) => (a.position_order ?? Infinity) - (b.position_order ?? Infinity) || a.nama.localeCompare(b.nama));
    profesorList.sort((a, b) => a.nama.localeCompare(b.nama));
    doktorList.sort((a, b) => a.nama.localeCompare(b.nama));
    otherDosenList.sort((a, b) => a.nama.localeCompare(b.nama));

    if (prioritizedLecturer) {
        allDosen.push(prioritizedLecturer);
    }

    allDosen.push(
        ...pimpinanList,
        ...kpsList,
        ...laboratoriumList,
        ...profesorList,
        ...doktorList,
        ...otherDosenList
    );

    allStaff.sort((a, b) => a.nama.localeCompare(b.nama));

    return { dosen: allDosen, staff: allStaff };
}

export const revalidate = 3600; 

export default async function DaftarDosenPage() {
    const dosenData = await getDosenData();

    return <DosenStaffContent dosenData={dosenData} />;
}