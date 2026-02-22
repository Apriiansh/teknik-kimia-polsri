import { createClient } from '@/utils/supabase/server'; // Atau client jika digunakan di client component

interface Mahasiswa {
  id_mhs: string;
  nama: string;
  nim: string;
}

export async function getDaftarMahasiswaKelas(targetKelas: string, targetProdi: string, targetAngkatan: string) {
  const supabase = await createClient(); 

  const { data: mahasiswaList, error } = await supabase
    .from('mahasiswa')
    .select('id_mhs, nama, nim') 
    .eq('kelas', targetKelas)
    .eq('prodi', targetProdi)
    .eq('angkatan', targetAngkatan)
    .order('nama', { ascending: true }); 

  if (error) {
    console.error("Error fetching daftar mahasiswa:", error);
    return [];
  }
  return mahasiswaList as Mahasiswa[];
}
