
"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuthClient } from "@/utils/supabase/admin-client";
import { revalidatePath } from "next/cache";

const UNIQUE_JABATAN_KELAS = [
    'Ketua Kelas',
    'Wakil Ketua Kelas',
    'Sekretaris',
    'Bendahara',
];


export const signUpAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    const nim = formData.get("nim")?.toString() || "";
    const nama = formData.get("nama")?.toString() || "";
    const kelas = formData.get("kelas")?.toString() || "";
    const jabatan_kelas = formData.get("jabatan_kelas")?.toString() || "";
    const angkatan = formData.get("angkatan")?.toString() || "";
    const prodi = formData.get("prodi")?.toString() || "";
    const fotoProfilFile = formData.get("foto_profil") as File;

    if (!email || !password) {
        return encodedRedirect(
            "error",
            "/sign-up",
            "Email and password are required",
        );
    }

    const nimPattern = /^06\d{2}(304\d|404\d)\d{4}$/;
    if (!nimPattern.test(nim)) {
        return encodedRedirect(
            "error",
            "/sign-up",
            "Format NIM tidak valid atau kode prodi tidak sesuai (harus 304x atau 404x).",
        );
    }
    
    if (UNIQUE_JABATAN_KELAS.includes(jabatan_kelas)) {
        const { data: existingJabatan, error: jabatanError } = await supabase
            .from('mahasiswa')
            .select('id_mhs')
            .eq('kelas', kelas)
            .eq('prodi', prodi)
            .eq('jabatan_kelas', jabatan_kelas)
            .eq('angkatan', angkatan) // <-- Ini memastikan keunikan per angkatan
            .single();
    
            if (existingJabatan) {
                console.warn(`Jabatan ${jabatan_kelas} already exists for class ${kelas}, prodi ${prodi}, angkatan ${angkatan}. Signup prevented.`);
                return encodedRedirect(
                    "error",
                    "/sign-up",
                    `Jabatan ${jabatan_kelas} sudah ada untuk kelas ${kelas} (${prodi}) angkatan ${angkatan}. Silakan pilih jabatan lain.`
                );
            }

        if (jabatanError && jabatanError.code !== 'PGRST116') {
            console.error("Error checking jabatan during signup:", jabatanError);
             return encodedRedirect(
                 "error",
                 "/sign-up",
                 "An error occurred while checking class roles. Please try again."
             );
        }
    }



    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error(error.code + " " + error.message);
        return encodedRedirect("error", "/sign-up", error.message);
    }


    if (data.user) {
        const userId = data.user.id;
        let foto_profil_url = "";

        if (fotoProfilFile && fotoProfilFile.size > 0) {
            try {
                const fileExt = fotoProfilFile.name.split('.').pop();
                const fileName = `mahasiswa-${userId}-${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('foto') // Make sure this bucket exists in your Supabase project
                    .upload(fileName, fotoProfilFile);

                if (uploadError) {
                    console.error("Error uploading file:", uploadError);
                } else if (uploadData) {
                    const { data: urlData } = supabase
                        .storage
                        .from('foto')
                        .getPublicUrl(fileName);

                    foto_profil_url = urlData.publicUrl;
                }
            } catch (fileError) {
                console.error("File processing error:", fileError);
            }
        }

        const { error: insertError } = await supabase
            .from('mahasiswa')
            .insert({
                id_mhs: userId,
                nim: nim,
                email: email, // Tambahkan kolom email di sini
                nama: nama,
                kelas: kelas,
                jabatan_kelas: jabatan_kelas,
                angkatan: angkatan, // ANGKATAN DISIMPAN DI SINI
                prodi: prodi,
                foto_profil: foto_profil_url
            });
        

        if (insertError) {
            console.error("Error inserting mahasiswa data:", insertError);
            const adminAuthClient = getAdminAuthClient(); // Get admin client
            const { error: deleteAuthUserError } = await adminAuthClient.deleteUser(userId);
            if (deleteAuthUserError) {
                console.error("Error cleaning up auth user after mahasiswa insert failure:", deleteAuthUserError);
            }
             return encodedRedirect(
                 "error",
                 "/sign-up",
                 "Signup successful, but failed to save student data. Please contact support."
             );
        }
    }

    return encodedRedirect(
        "success",
        "/sign-in",
        "Thanks for signing up! Please check your email for a verification link.",
    );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", "Email atau password yang Anda masukkan salah");
  }

  const userId = data.user.id;
  let userRole = "unknown";
  let userData = null;
  let redirectUrl = "/";
  let message = "";
  
  if (email === "kimia@polsri.ac.id") { // Admin Jurusan
    userRole = "admin";
    message = `Admin login successful: ${email}`;
    redirectUrl = "/pages-admin";
  } else if (email === "hmjteknikkimia@gmail.com") { // HMJ Teknik Kimia
    userRole = "hmj";
    message = `HMJ Teknik Kimia login successful: ${email}`;
    
    redirectUrl = "/pages-hmj"; 
  } else {
    const { data: dosenData, error: dosenError } = await supabase
      .from('dosen')
      .select('*')
      .eq('id_dsn', userId)
      .single();
    
    if (dosenData) {
      userRole = "dosen";
      userData = dosenData;
      message = `Dosen login successful: ${dosenData.nama} (${dosenData.nip})`;
      redirectUrl = "/pages-dosen";
    } else {
      const { data: mahasiswaData, error: mahasiswaError } = await supabase
        .from('mahasiswa')
        .select('*')
        .eq('id_mhs', userId)
        .single();
      
      if (mahasiswaData) {
        userRole = "mahasiswa";
        userData = mahasiswaData;
        message = `Mahasiswa login successful: ${mahasiswaData.nama} (${mahasiswaData.nim})`;
        redirectUrl = "/pages-mahasiswa";
      } else {
        const { data: alumniData, error: alumniError } = await supabase
          .from('alumni')
          .select('*') 
          .eq('user_id', userId) 
          .single();

        if (alumniData) {
          userRole = "alumni";
          userData = alumniData;
          message = `Alumni login successful: ${alumniData.nama}`;
          redirectUrl = "/pages-alumni"; 
        } else {
          message = "User account exists but not linked to any role";
          redirectUrl = "/profile/setup";
        }
      }
    }
  }
  
  await supabase.auth.updateUser({
    data: { role: userRole }
  });
  
  return redirect(`${redirectUrl}?success=${encodeURIComponent(message)}`);
};

export const deleteMahasiswaAction = async (mahasiswaId: string) => {
    const supabase = await createClient();
    const adminAuthClient = getAdminAuthClient();


    if (!mahasiswaId) {
        return { success: false, message: "Mahasiswa ID is required for deletion" };
    }

    let mahasiswaName = "data mahasiswa"; 

    try {
        const { data: mahasiswaData, error: fetchError } = await supabase
            .from('mahasiswa')
            .select('nama, foto_profil')
            .eq('id_mhs', mahasiswaId)
            .single();

        if (fetchError) {
            console.error("Error fetching mahasiswa data:", fetchError);
        } else if (mahasiswaData) {
            mahasiswaName = mahasiswaData.nama || "data mahasiswa"; 

            if (mahasiswaData.foto_profil) {
                try {
                    const urlParts = mahasiswaData.foto_profil.split('/');
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
                         console.warn("Could not extract file path from photo URL:", mahasiswaData.foto_profil);
                    }
                } catch (storageError) {
                    console.error("Unexpected error during photo deletion:", storageError);
                }
            }
        }


        const { error: mahasiswaDeleteError } = await supabase
            .from('mahasiswa')
            .delete()
            .eq('id_mhs', mahasiswaId);

        if (mahasiswaDeleteError) {
            console.error("Error deleting from mahasiswa table:", mahasiswaDeleteError);
            return { success: false, message: `Failed to delete ${mahasiswaName} data: ${mahasiswaDeleteError.message}` };
        }

        const { error: authDeleteError } = await adminAuthClient.deleteUser(mahasiswaId);

        if (authDeleteError) {
            console.error("Error deleting auth user:", authDeleteError);
            return {
                success: false,
                partialSuccess: true,
                message: `${mahasiswaName} data deleted, but the user account could not be deleted: ${authDeleteError.message}`
            };
        }

        return { success: true, message: `${mahasiswaName} successfully deleted` };

    } catch (error: any) {
        console.error("Unexpected error during mahasiswa deletion:", error);
        return { success: false, message: "An unexpected error occurred during deletion: " + (error.message || "Unknown error") };
    }
}


export const forgotPasswordAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    const callbackUrl = formData.get("callbackUrl")?.toString(); 

    if (!email) {
        return encodedRedirect("error", "/forgot-password", "Email is required");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
        console.error(error.message);
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Could not reset password. Please check the email address.", 
        );
    }


    return encodedRedirect(
        "success",
        "/forgot-password",
        "Check your email for a link to reset your password.",
    );
};

export const resetPasswordAction = async (formData: FormData) => {
    const supabase = await createClient();

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
        return encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password and confirm password are required",
        );
    }

    if (password !== confirmPassword) {
        return encodedRedirect(
            "error",
            "/protected/reset-password",
            "Passwords do not match",
        );
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        console.error("Password update failed:", error);
        return encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password update failed: " + error.message, // Include error message for debugging
        );
    }

    return encodedRedirect("success", "/protected/reset-password", "Password updated successfully. You can now sign in with your new password.");
};

export async function changePasswordAction(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // Get the currently logged-in user

    if (!user) {
        console.error("Change password failed: User not authenticated.");
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

    if (new_password.length < 6) { // Match Supabase default minimum length
         return { type: 'error', message: 'Password baru minimal 6 karakter.' };
    }



    const { error } = await supabase.auth.updateUser({
        password: new_password,
    });

    if (error) {
        console.error("Error changing password:", error);
        return { type: 'error', message: `Gagal mengganti password: ${error.message}` };
    }

    


    revalidatePath('/pages-mahasiswa');
    revalidatePath('/pages-mahasiswa/settings');


    return { type: 'success', message: 'Password berhasil diganti!' };
}

export const signOutAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/");
};