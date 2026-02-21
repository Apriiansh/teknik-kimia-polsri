'use client';

import { useState, useMemo } from 'react';
import LazyDosenImage from './LazyDosenImage';

// Define types
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

interface OrganizedDosenData {
    dosen: Dosen[];
    staff: Dosen[];
}

interface DosenStaffContentProps {
    dosenData: OrganizedDosenData;
}

export default function DosenStaffContent({ dosenData }: DosenStaffContentProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter dosen and staff based on search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) {
            return dosenData;
        }

        const query = searchQuery.toLowerCase().trim();

        const filterPerson = (person: Dosen) => {
            return (
                person.nama.toLowerCase().includes(query) ||
                person.nip?.toLowerCase().includes(query) ||
                person.nidn?.toLowerCase().includes(query) ||
                person.nuptk?.toLowerCase().includes(query) ||
                person.prodi?.toLowerCase().includes(query) ||
                person.jabatan_title?.toLowerCase().includes(query)
            );
        };

        return {
            dosen: dosenData.dosen.filter(filterPerson),
            staff: dosenData.staff.filter(filterPerson)
        };
    }, [dosenData, searchQuery]);

    // Card style - uniform maroon border
    const getCardStyle = (): string => {
        return 'bg-white border-2 border-maroon-500';
    };

    // Render a dosen card with lazy loaded image
    const renderDosenCard = (dosen: Dosen) => (
        <div
            key={dosen.id_dsn}
            className={`${getCardStyle()} rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center`}
        >
            {/* Lazy loaded image component */}
            <LazyDosenImage dosenId={dosen.id_dsn} nama={dosen.nama} />
            
            <div className="text-center flex-grow flex flex-col items-center justify-start space-y-1 w-full">
                <h3 className="text-base font-semibold text-maroon-800">{dosen.nama}</h3>
                {(dosen.role && dosen.role.trim().toLowerCase() !== 'dosen') ? (
                    <>
                        <p className="text-sm text-gray-600 mt-1">NIP: {dosen.nip || '-'}</p>
                        {dosen.role && <p className="text-sm text-gray-600">{dosen.role}</p>}
                    </>
                ) : (
                    <>
                        <p className="text-sm text-gray-600 mt-1">NIP: {dosen.nip || '-'}</p>
                        <p className="text-sm text-gray-600">NUPTK: {dosen.nuptk || '-'}</p>
                    </>
                )}
            </div>
        </div>
    );

    const hasData = dosenData.dosen.length > 0 || dosenData.staff.length > 0;

    if (!hasData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-700">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <p className="text-xl font-semibold mb-2">Data Tidak Tersedia</p>
                    <p>Tidak ada data dosen atau staff yang ditemukan.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-gradient-to-b from-gray-50 to-maroon-50 min-h-screen py-8 px-4 md:px-10 font-sans">
            <section className="max-w-7xl mx-auto space-y-12">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-maroon-800 mb-3">
                        Dosen dan Staff
                    </h1>
                    <p className="text-lg text-gray-600">Jurusan Teknik Kimia</p>
                </header>

                {/* Search Input */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama, NIP, NIDN, atau jabatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-12 border-2 border-maroon-300 rounded-xl focus:outline-none focus:border-maroon-500 focus:ring-2 focus:ring-maroon-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-maroon-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-maroon-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                            Ditemukan: {filteredData.dosen.length} dosen, {filteredData.staff.length} staff
                        </p>
                    )}
                </div>

                {/* No Results Message */}
                {searchQuery && filteredData.dosen.length === 0 && filteredData.staff.length === 0 && (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <p className="text-xl font-semibold text-gray-600 mb-2">Tidak ada hasil</p>
                        <p className="text-gray-500">Tidak ditemukan dosen atau staff dengan kata kunci &quot;{searchQuery}&quot;</p>
                    </div>
                )}

                {/* Dosen Section */}
                {filteredData.dosen.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold border-red-800 pb-3 border-b-2">
                            Dosen {searchQuery && `(${filteredData.dosen.length})`}
                        </h2>
                        <div className="flex justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-fit">
                                {filteredData.dosen.map(renderDosenCard)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Section */}
                {filteredData.staff.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold border-red-800 pb-3 border-b-2">
                            Tenaga Kependidikan {searchQuery && `(${filteredData.staff.length})`}
                        </h2>
                        <div className="flex justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-fit">
                                {filteredData.staff.map(renderDosenCard)}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
