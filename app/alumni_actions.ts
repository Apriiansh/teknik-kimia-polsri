'use server';

import { createClient as createServerClient } from '@/utils/supabase/server'; 
import { getAdminAuthClient } from '@/utils/supabase/admin-client'; 
import { revalidatePath } from 'next/cache';
import { encodedRedirect } from '@/utils/utils'; 

const ALUMNI_FOTO_BUCKET = 'alumni-photos'; 

export async function addAlumniAction(formData: FormData) {
    const supabaseDbClient = await createServerClient(); 
    const adminAuthClient = getAdminAuthClient(); 

    const rawFormData = {
        email: formData.get('email') as string, 
        password: formData.get('password') as string, 
        nama: formData.get('nama') as string,
        prodi: formData.get('prodi') as string || null,
        angkatan: formData.get('angkatan') ? parseInt(formData.get('angkatan') as string) : null,
        pekerjaan: formData.get('pekerjaan') as string || null,
    };

    if (!rawFormData.email || !rawFormData.password) {
        return encodedRedirect("error", "/pages-admin/data-management/alumni", "Email dan password alumni wajib diisi");
    }

    const { data: authData, error: authError } = await adminAuthClient.createUser({
        email: rawFormData.email,
        password: rawFormData.password,
        email_confirm: true,
        user_metadata: {
            full_name: rawFormData.nama,
            role: 'alumni',
        }
    });

    if (authError || !authData.user) {
        console.error('Auth createUser error (admin alumni):', authError);
        const message = authError?.message || 'Gagal membuat akun autentikasi alumni';
        return encodedRedirect("error", "/pages-admin/data-management/alumni", message);
    }

    const { error: insertError } = await supabaseDbClient.from('alumni').insert({
        nama: rawFormData.nama,
        prodi: rawFormData.prodi,
        angkatan: rawFormData.angkatan,
        pekerjaan: rawFormData.pekerjaan,
        user_id: authData.user.id, 
    });

    if (insertError) {
        console.error('Insert alumni data error (admin):', insertError);
        await adminAuthClient.deleteUser(authData.user.id); 
        return encodedRedirect("error", "/pages-admin/data-management/alumni", `Gagal menyimpan data alumni: ${insertError.message}`);
    }

    revalidatePath('/pages-admin/data-management/alumni');
    revalidatePath('/alumni'); 
    return encodedRedirect("success", "/pages-admin/data-management/alumni", "Data alumni berhasil ditambahkan");
}

export async function updateAlumniAction(formData: FormData) {
    const supabase = await createServerClient();
    const id = parseInt(formData.get('id') as string);
    const currentFotoPath = formData.get('current_foto') as string | null;

    const rawFormData = {
        nama: formData.get('nama') as string,
        prodi: formData.get('prodi') as string || null,
        angkatan: formData.get('angkatan') ? parseInt(formData.get('angkatan') as string) : null,
        pekerjaan: formData.get('pekerjaan') as string || null,
        testimoni: formData.get('testimoni') as string || null,
        fotoFile: formData.get('foto') as File | null,
    };

    let fotoUrl: string | null = currentFotoPath;

    if (rawFormData.fotoFile && rawFormData.fotoFile.size > 0) {
        if (currentFotoPath) {
            const oldFileName = currentFotoPath.split('/').pop();
            if (oldFileName) await supabase.storage.from(ALUMNI_FOTO_BUCKET).remove([oldFileName]);
        }
        const fileName = `${Date.now()}-${rawFormData.fotoFile.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from(ALUMNI_FOTO_BUCKET).upload(fileName, rawFormData.fotoFile);
        if (uploadError) {
            console.error('Upload error (admin):', uploadError);
            return encodedRedirect("error", "/pages-admin/data-management/alumni", "Gagal mengunggah foto baru");
        }
        const { data: publicUrlData } = supabase.storage.from(ALUMNI_FOTO_BUCKET).getPublicUrl(fileName);
        fotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('alumni').update({
        nama: rawFormData.nama,
        prodi: rawFormData.prodi,
        angkatan: rawFormData.angkatan,
        pekerjaan: rawFormData.pekerjaan,
        testimoni: rawFormData.testimoni,
        foto: fotoUrl,
        updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
        console.error('Update error (admin):', error);
        return encodedRedirect("error", "/pages-admin/data-management/alumni", `Gagal memperbarui data alumni: ${error.message}`);
    }

    revalidatePath('/pages-admin/data-management/alumni');
    revalidatePath('/alumni');
    return encodedRedirect("success", "/pages-admin/data-management/alumni", "Data alumni berhasil diperbarui");
}

export async function deleteAlumniAction(formData: FormData) {
    const supabase = await createServerClient();
    const adminAuthClient = getAdminAuthClient(); 
    const id = parseInt(formData.get('id') as string);
    const fotoPath = formData.get('foto_path') as string | null;

    const { data: alumniData, error: fetchError } = await supabase
        .from('alumni')
        .select('user_id, nama, foto') 
        .eq('id', id)
        .single();

    if (fetchError) {
        console.error('Error fetching alumni data for deletion:', fetchError);
        return encodedRedirect("error", "/pages-admin/data-management/alumni", `Gagal mengambil data alumni untuk dihapus: ${fetchError.message}`);
    }

    if (!alumniData) {
        return encodedRedirect("error", "/pages-admin/data-management/alumni", "Data alumni tidak ditemukan.");
    }

    const userIdToDelete = alumniData.user_id;
    const alumniName = alumniData.nama || "Alumni";
    const actualFotoPath = fotoPath || alumniData.foto; 

    if (actualFotoPath) {
        const fileName = actualFotoPath.split('/').pop();
        if (fileName) {
            const { error: storageError } = await supabase.storage.from(ALUMNI_FOTO_BUCKET).remove([fileName]);
            if (storageError) {
                console.warn('Failed to delete alumni photo from storage, continuing deletion:', storageError);
            }
        }
    }

    const { error: deleteDbError } = await supabase.from('alumni').delete().eq('id', id);

    if (deleteDbError) {
        console.error('Delete alumni DB error (admin):', deleteDbError);
        return encodedRedirect("error", "/pages-admin/data-management/alumni", `Gagal menghapus data alumni ${alumniName}: ${deleteDbError.message}`);
    }

    if (userIdToDelete) {
        const { error: authDeleteError } = await adminAuthClient.deleteUser(userIdToDelete);
        if (authDeleteError) {
            console.error('Delete alumni auth user error:', authDeleteError);
            return encodedRedirect("error", "/pages-admin/data-management/alumni", `Data alumni ${alumniName} berhasil dihapus, tetapi akun autentikasinya gagal dihapus: ${authDeleteError.message}`);
        }
    }

    revalidatePath('/pages-admin/data-management/alumni');
    revalidatePath('/alumni'); 
    return encodedRedirect("success", "/pages-admin/data-management/alumni", `Data alumni ${alumniName} dan akunnya berhasil dihapus`);
}



export interface AlumniProfileData {
    id: number;
    nama: string;
    prodi: string | null;
    angkatan: number | null;
    pekerjaan: string | null;
    testimoni: string | null;
    foto: string | null;
    user_id: string;
}

export async function getMyAlumniProfileWithTestimonial(): Promise<AlumniProfileData | null> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("User not authenticated for getMyAlumniProfileWithTestimonial");
        return null;
    }

    const { data: alumniProfile, error } = await supabase
        .from('alumni')
        .select('id, nama, prodi, angkatan, pekerjaan, testimoni, foto, user_id')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching current alumni profile:', error);
        return null;
    }
    return alumniProfile as AlumniProfileData;
}

export async function updateMyAlumniProfileAndTestimonial(formData: FormData) {
    const supabase = await createServerClient();
    const alumniId = formData.get('alumni_id') as string; 
    const currentFotoPath = formData.get('current_foto_path') as string | null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Pengguna tidak terautentikasi.' };

    const { data: existingAlumni, error: fetchError } = await supabase
        .from('alumni')
        .select('user_id')
        .eq('id', parseInt(alumniId))
        .single();

    if (fetchError || !existingAlumni || existingAlumni.user_id !== user.id) {
        console.error('Authorization error or alumni not found for update:', fetchError);
        return { error: 'Anda tidak diizinkan memperbarui profil ini atau profil tidak ditemukan.' };
    }

    const rawData = {
        nama: formData.get('nama') as string | undefined, 
        prodi: formData.get('prodi') as string | undefined,
        angkatan: formData.get('angkatan') ? parseInt(formData.get('angkatan') as string) : undefined,
        pekerjaan: formData.get('pekerjaan') as string | undefined,
        testimoni: formData.get('testimoni') as string | null, 
        fotoFile: formData.get('foto') as File | null,
    };

    const dataToUpdate: { [key: string]: any } = {
        updated_at: new Date().toISOString(),
    };

    if (formData.has('nama') && rawData.nama !== undefined) dataToUpdate.nama = rawData.nama;
    if (formData.has('prodi')) dataToUpdate.prodi = rawData.prodi || null; 
    if (formData.has('angkatan') && rawData.angkatan !== undefined) dataToUpdate.angkatan = rawData.angkatan;
    if (formData.has('pekerjaan')) dataToUpdate.pekerjaan = rawData.pekerjaan || null; 
    if (formData.has('testimoni')) dataToUpdate.testimoni = rawData.testimoni;

    let newFotoUrl: string | null = currentFotoPath;
    if (rawData.fotoFile && rawData.fotoFile.size > 0) {
        if (currentFotoPath) {
            const oldFileName = currentFotoPath.split('/').pop();
            if (oldFileName) await supabase.storage.from(ALUMNI_FOTO_BUCKET).remove([oldFileName]);
        }
        const fileName = `${Date.now()}-${rawData.fotoFile.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from(ALUMNI_FOTO_BUCKET).upload(fileName, rawData.fotoFile);
        if (uploadError) return { error: `Gagal mengunggah foto baru: ${uploadError.message}` };
        const { data: publicUrlData } = supabase.storage.from(ALUMNI_FOTO_BUCKET).getPublicUrl(fileName);
        newFotoUrl = publicUrlData.publicUrl;
        dataToUpdate.foto = newFotoUrl; 
    } else if (formData.has('foto') && (!rawData.fotoFile || rawData.fotoFile.size === 0) && currentFotoPath && !formData.get('foto')) {
    }
    if (newFotoUrl !== currentFotoPath) {
        dataToUpdate.foto = newFotoUrl;
    }


    if (Object.keys(dataToUpdate).length <= 1) {
    }

    const { error: updateError } = await supabase.from('alumni')
        .update(dataToUpdate)
        .eq('id', parseInt(alumniId)); 

    if (updateError) {
        console.error('Update error (alumni self-service):', updateError);
        return { error: `Gagal memperbarui profil: ${updateError.message}` };
    }

    revalidatePath('/pages-alumni'); 
    revalidatePath(`/pages-alumni/testimoni-alumni/edit/${alumniId}`);
    revalidatePath('/pages-alumni/testimoni-alumni');
    revalidatePath('/alumni'); 
    return { success: 'Profil dan testimoni berhasil diperbarui!' };
}

export async function deleteMyTestimonial(formData: FormData) {
    const supabase = await createServerClient();
    const alumniId = formData.get('alumni_id') as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Pengguna tidak terautentikasi.' };

    const { data: existingAlumni, error: fetchError } = await supabase
        .from('alumni')
        .select('user_id')
        .eq('id', parseInt(alumniId))
        .single();

    if (fetchError || !existingAlumni || existingAlumni.user_id !== user.id) {
        console.error('Authorization error or alumni not found for delete testimonial:', fetchError);
        return { error: 'Anda tidak diizinkan menghapus testimoni ini atau profil tidak ditemukan.' };
    }

    const { error: updateError } = await supabase.from('alumni')
        .update({ testimoni: null, updated_at: new Date().toISOString() }) 
        .eq('id', parseInt(alumniId));

    if (updateError) {
        console.error('Delete testimonial error (alumni self-service):', updateError);
        return { error: `Gagal menghapus testimoni: ${updateError.message}` };
    }

    revalidatePath('/pages-alumni');
    revalidatePath(`/pages-alumni/testimoni-alumni/edit/${alumniId}`);
    revalidatePath('/pages-alumni/testimoni-alumni');
    revalidatePath('/alumni'); 
    return { success: 'Testimoni berhasil dihapus!' };
}
