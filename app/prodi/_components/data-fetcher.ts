import { createClient } from '@/utils/supabase/server';
import type { ProcessedDosen, JabatanStruktural, ProdiContent, ProdiPageData } from './types';

// Helper function to check for academic titles
const hasAcademicTitle = (name: string): boolean => {
    const lowerName = name.toLowerCase();
    return lowerName.startsWith('prof.dr. ') || lowerName.startsWith('prof.dr ') ||
        lowerName.startsWith('prof. ') ||
        lowerName.startsWith('dr. ');
};

export async function getProdiData(
    prodiTitle: string,
    prodiFilter: string,
    specialLecturerName?: string
): Promise<ProdiPageData> {
    const supabase = await createClient();

    // Fetch prodi details
    const { data: prodiData } = await supabase
        .from('cms_prodi')
        .select('*')
        .eq('title', prodiTitle)
        .single();

    // Fetch dosen data WITHOUT foto (foto will be lazy loaded)
    const { data: dosenData, error: dosenError } = await supabase
        .from('dosen')
        .select('id_dsn, nama, nip, nuptk, nidn, role')
        .eq('prodi', prodiFilter)
        .ilike('role', 'dosen');

    if (dosenError || !dosenData) {
        return { prodiDetails: prodiData, dosenList: [] };
    }

    // Fetch structural positions
    const { data: jabatanData } = await supabase
        .from('struktural_jabatan')
        .select('id, title, dosen_id, category, order')
        .not('dosen_id', 'is', null);

    // Create jabatan map
    const jabatanMap = new Map<string, JabatanStruktural>();
    jabatanData?.forEach((jabatan: JabatanStruktural) => {
        const existingJabatan = jabatanMap.get(jabatan.dosen_id);
        if (!existingJabatan || jabatan.order < existingJabatan.order) {
            jabatanMap.set(jabatan.dosen_id, jabatan);
        }
    });

    // Process dosen with jabatan info
    let dosenWithJabatan: ProcessedDosen[] = dosenData.map(dosen => {
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

    // Handle special lecturer prioritization
    let specialLecturer: ProcessedDosen | null = null;
    if (specialLecturerName) {
        const specialIndex = dosenWithJabatan.findIndex(d => d.nama === specialLecturerName);
        if (specialIndex > -1) {
            specialLecturer = dosenWithJabatan[specialIndex];
            dosenWithJabatan.splice(specialIndex, 1);
        }
    }

    // Separate positioned and non-positioned dosen
    const positionedDosen = dosenWithJabatan.filter(d => d.has_position);
    const nonPositionedDosen = dosenWithJabatan.filter(d => !d.has_position);

    const profDrDosen = nonPositionedDosen.filter(d => hasAcademicTitle(d.nama));
    const otherRegularDosen = nonPositionedDosen.filter(d => !hasAcademicTitle(d.nama));

    // Sort positioned dosen
    const categoryOrder = { pimpinan: 1, kps: 2, laboratorium: 3 };
    positionedDosen.sort((a, b) => {
        const categoryAOrder = categoryOrder[a.position_category!];
        const categoryBOrder = categoryOrder[b.position_category!];

        if (categoryAOrder !== categoryBOrder) {
            return categoryAOrder - categoryBOrder;
        }

        const orderA = a.position_order ?? Infinity;
        const orderB = b.position_order ?? Infinity;
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return a.nama.localeCompare(b.nama);
    });

    // Sort other lists
    profDrDosen.sort((a, b) => a.nama.localeCompare(b.nama));
    otherRegularDosen.sort((a, b) => a.nama.localeCompare(b.nama));

    // Combine all
    let finalSortedDosen = [...positionedDosen, ...profDrDosen, ...otherRegularDosen];

    if (specialLecturer) {
        finalSortedDosen = [specialLecturer, ...finalSortedDosen];
    }

    return { prodiDetails: prodiData, dosenList: finalSortedDosen };
}
