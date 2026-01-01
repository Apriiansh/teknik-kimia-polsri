
"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

import { getAdminAuthClient } from "@/utils/supabase/admin-client";
import { revalidatePath } from "next/cache";

export const addDosenAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const adminAuthClient = getAdminAuthClient();
  const origin = (await headers()).get("origin");

  const nip = formData.get("nip")?.toString() || "";
  const nama = formData.get("nama")?.toString() || "";
  const nidn = formData.get("nidn")?.toString() || "";
  const nuptk = formData.get("nuptk")?.toString() || "";
  const prodi = formData.get("prodi")?.toString() || "";
  const status_dosen = formData.get("status_dosen")?.toString() || "";
  const role = formData.get("role")?.toString() || "Dosen";
  const fotoUrl = formData.get("foto")?.toString() || "";

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/pages-admin/data-management/dosen",
      "Email and password are required",
    );
  }

  const { data: authData, error: authError } = await adminAuthClient.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: role.toLowerCase()
    }
  });

  if (authError) {
    console.error(authError.message);
    return encodedRedirect("error", "/pages-admin/data-management/dosen", authError.message);
  }

  if (authData.user) {
    const userId = authData.user.id;
    const { error: insertError } = await supabase
      .from('dosen')
      .insert({
        id_dsn: userId,
        email: email,
        nip: nip,
        nama: nama,
        nidn: nidn,
        nuptk: nuptk,
        prodi: prodi,
        status_dosen: status_dosen,
        foto: fotoUrl,
        role: role
      });
    if (insertError) {
      console.error("Error inserting dosen data:", insertError);
      const { error: deleteUserError } = await adminAuthClient.deleteUser(userId);
      if (deleteUserError) {
        console.error("Error cleaning up auth user:", deleteUserError);
      }
      return encodedRedirect(
        "error",
        "/pages-admin/data-management/dosen",
        "Failed to add dosen data: " + insertError.message,
      );
    }
  }

  return encodedRedirect(
    "success",
    "/pages-admin/data-management/dosen",
    `Dosen ${nama} berhasil ditambahkan. Email verifikasi telah dikirim ke ${email}`,
  );
};

export const updateDosenAction = async (formData: FormData) => {
  const id_dsn = formData.get("id_dsn")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const supabase = await createClient();
  const adminAuthClient = getAdminAuthClient();

  const nip = formData.get("nip")?.toString() || "";
  const nama = formData.get("nama")?.toString() || "";
  const nidn = formData.get("nidn")?.toString() || "";
  const nuptk = formData.get("nuptk")?.toString() || "";
  const prodi = formData.get("prodi")?.toString() || "";
  const status_dosen = formData.get("status_dosen")?.toString() || "";
  const role = formData.get("role")?.toString() || "Dosen";
  const fotoUrl = formData.get("foto")?.toString() || formData.get("current_foto")?.toString() || "";

  if (!id_dsn || !email || !nama || !nip) {
    return encodedRedirect(
      "error",
      "/pages-admin/data-management/dosen",
      "ID, Email, Nama, and NIP are required",
    );
  }

  const { error: updateError } = await supabase
    .from('dosen')
    .update({
      email: email,
      nip: nip,
      nama: nama,
      nidn: nidn,
      nuptk: nuptk,
      prodi: prodi,
      status_dosen: status_dosen,
      foto: fotoUrl,
      role: role
    })
    .eq('id_dsn', id_dsn);

  if (updateError) {
    console.error("Error updating dosen data:", updateError);
    return encodedRedirect(
      "error",
      "/pages-admin/data-management/dosen",
      "Failed to update dosen data: " + updateError.message,
    );
  }
  
  const { data: currentDosenData, error: fetchError } = await supabase
    .from('dosen')
    .select('email')
    .eq('id_dsn', id_dsn)
    .single();
  
  if (fetchError) {
      console.error("Error fetching current email for auth update check:", fetchError);
  } else if (currentDosenData && currentDosenData.email !== email) {
    const { error: updateAuthError } = await adminAuthClient.updateUserById(
      id_dsn,
      { 
        email: email,
        user_metadata: { role: role.toLowerCase() }
      }
    );
    
    if (updateAuthError) {
      console.error("Error updating auth email:", updateAuthError);
      return encodedRedirect( 
        "error", 
        "/pages-admin/data-management/dosen",
        `Data dosen ${nama} berhasil diperbarui, tetapi gagal memperbarui email di sistem autentikasi: ${updateAuthError.message}`, // Pesan error yang lebih jelas
      );
    } 
  } else {
    const { error: updateMetadataError } = await adminAuthClient.updateUserById(
      id_dsn,
      { 
        user_metadata: { role: role.toLowerCase() }
      }
    );
    
    if (updateMetadataError) {
      console.error("Error updating user metadata:", updateMetadataError);
    }
  }
  
  if (password && confirmPassword && password === confirmPassword) {
    const { error: passwordError } = await adminAuthClient.updateUserById(
      id_dsn,
      { password: password }
    );
    
    if (passwordError) {
      console.error("Error updating password:", passwordError);
      return encodedRedirect(
        "success",
        "/pages-admin/data-management/dosen",
        `Data dosen ${nama} berhasil diperbarui tetapi gagal memperbarui password: ${passwordError.message}`,
      );
    }
    
    return encodedRedirect(
      "success",
      "/pages-admin/data-management/dosen",
      `Data dosen ${nama} berhasil diperbarui termasuk password`,
    );
  }
  
  return encodedRedirect(
    "success",
    "/pages-admin/data-management/dosen",
    `Data dosen ${nama} berhasil diperbarui`,
  );
};

export const deleteDosenAction = async (formData: FormData) => {
  const id_dsn = formData.get("id_dsn")?.toString();
  const supabase = await createClient();
  const adminAuthClient = getAdminAuthClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.email !== 'kimia@polsri.ac.id') {
    return encodedRedirect(
      "error",
      "/pages-admin/data-management/dosen",
      "Only kimia@polsri.ac.id can delete dosen accounts"
    );
  }

  if (!id_dsn) {
    return encodedRedirect(
      "error",
      "/pages-admin/data-management/dosen",
      "ID dosen is required for deletion"
    );
  }

  try {
    const { data: dosenData, error: fetchError } = await supabase
      .from('dosen')
      .select('nama, foto')
      .eq('id_dsn', id_dsn)
      .single();

    if (fetchError) {
      console.error("Error fetching dosen data:", fetchError);
      return encodedRedirect(
        "error",
        "/pages-admin/data-management/dosen",
        "Failed to retrieve dosen data: " + fetchError.message
      );
    }

    if (dosenData.foto) {
      try {
        const urlParts = dosenData.foto.split('/');
        const bucketName = 'foto';
        const bucketIndex = urlParts.indexOf(bucketName);
        
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
             const filePathInBucket = urlParts.slice(bucketIndex + 1).join('/');

             const { error: deleteStorageError } = await supabase
                 .storage
                 .from(bucketName)
                 .remove([filePathInBucket]);

             if (deleteStorageError) {
                 console.error("Error deleting photo from storage:", deleteStorageError);
             }
        } else {
             console.warn("Could not extract file path from photo URL:", dosenData.foto);
        }
      } catch (storageError) {
          console.error("Unexpected error during photo deletion:", storageError);
      }
    }

    const { error: deleteError } = await supabase
      .from('dosen')
      .delete()
      .eq('id_dsn', id_dsn);

    if (deleteError) {
      console.error("Error deleting dosen data:", deleteError);
      return encodedRedirect(
        "error",
        "/pages-admin/data-management/dosen",
        "Failed to delete dosen data: " + deleteError.message
      );
    }

    const { error: authDeleteError } = await adminAuthClient.deleteUser(id_dsn);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return encodedRedirect(
        "error",
        "/pages-admin/data-management/dosen",
        `Dosen data deleted but the auth account may still exist: ${authDeleteError.message}`
      );
    }

    return encodedRedirect(
      "success",
      "/pages-admin/data-management/dosen",
      `Dosen ${dosenData.nama} has been successfully deleted`
    );
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT') {

    }

    console.error("Unexpected error during dosen deletion:", error);
    return encodedRedirect(
      "error",
      "/pages-admin/data-management/dosen",
      "An unexpected error occurred: " + (error.message || "Unknown error")
    );
  }
};

export async function changeDosenPasswordAction(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); 

    if (!user) { 
        console.error("Change dosen password failed: User not authenticated or not a dosen.");
        return { type: 'error', message: 'Anda tidak terautentikasi. Silakan login kembali.' };
    }

    const new_password = formData.get('new_password')?.toString();
    const confirm_password = formData.get('confirm_password')?.toString();

    if (!new_password || !confirm_password) {
        return { type: 'error', message: 'Password baru dan konfirmasi password harus diisi.' };
    }

    if (new_password !== confirm_password) {
        return { type: 'error', message: 'Password baru dan konfirmasi password tidak cocok.' };
    }

    if (new_password.length < 6) { 
         return { type: 'error', message: 'Password baru minimal 6 karakter.' };
    }



    const { error } = await supabase.auth.updateUser({
        password: new_password,
    });

    if (error) {
        console.error("Error changing dosen password:", error);
        return { type: 'error', message: `Gagal mengganti password: ${error.message}` };
    }

    

    revalidatePath('/pages-dosen'); 
    revalidatePath('/pages-dosen/settings'); 


    return { type: 'success', message: 'Password berhasil diganti!' };
}
