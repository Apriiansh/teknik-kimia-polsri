'use client';

import LazyDosenImage from './LazyDosenImage';
import type { ProcessedDosen, ProdiContent } from './types';

interface ProdiContentProps {
    prodiDetails: ProdiContent | null;
    dosenList: ProcessedDosen[];
    prodiTitle: string;
    dosenSectionTitle: string;
    kurikulumPrefix: string;
    semesterCount?: number; 
    singleKurikulumImage?: boolean;
}

const getCardStyle = (): string => {
    return 'bg-white border-2 border-maroon-500';
};

export default function ProdiClientContent({
    prodiDetails,
    dosenList,
    prodiTitle,
    dosenSectionTitle,
    kurikulumPrefix,
    semesterCount,
    singleKurikulumImage = false
}: ProdiContentProps) {
    const renderDosenCard = (dosen: ProcessedDosen) => (
        <div
            key={dosen.id_dsn}
            className={`${getCardStyle()} rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center`}
        >
            <LazyDosenImage dosenId={dosen.id_dsn} nama={dosen.nama} />
            <div className="text-center flex-grow flex flex-col items-center justify-start space-y-1 w-full">
                <h3 className="text-lg font-semibold text-maroon-800">{dosen.nama}</h3>
                <p className="text-sm text-gray-600">NIP: {dosen.nip || '-'}</p>
                <p className="text-sm text-gray-600">NUPTK: {dosen.nuptk || '-'}</p>
            </div>
        </div>
    );

    return (
        <main className="bg-gradient-to-b from-gray-50 to-gray-200 min-h-screen py-8 px-2 md:px-4 font-sans">
            <section className="px-2 md:px-4">
                <h1 className="text-3xl font-bold text-maroon-700 mb-8 text-center">
                    Program Studi {prodiDetails?.title || prodiTitle}
                </h1>

                {prodiDetails?.deskripsi ? (
                    <p className="text-lg text-gray-700 mb-8 text-justify whitespace-pre-line">
                        {prodiDetails.deskripsi}
                    </p>
                ) : (
                    <p className="text-lg text-gray-700 mb-8 text-justify">Deskripsi program studi belum tersedia.</p>
                )}
            </section>

            <section className="px-2 md:px-4 mb-8">
                {prodiDetails?.visi && (
                    <div className="mb-8 p-6 bg-maroon-50 rounded-xl shadow">
                        <h2 className="text-2xl font-semibold text-maroon-700 mb-3">Visi</h2>
                        <p className="text-lg text-gray-700 text-justify whitespace-pre-line leading-relaxed">
                            {prodiDetails.visi}
                        </p>
                    </div>
                )}
                {!prodiDetails?.visi && <p className="text-gray-500">Visi belum tersedia.</p>}

                {prodiDetails?.misi && (
                    <div className="p-6 bg-maroon-50 rounded-xl shadow">
                        <h2 className="text-2xl font-semibold text-maroon-700 mb-3">Misi</h2>
                        <ul className="space-y-3 text-lg text-gray-700 text-justify list-disc list-outside pl-5">
                            {prodiDetails.misi.split('\n').map((item, index) =>
                                item.trim() ? (
                                    <li key={index} className="leading-relaxed">
                                        {item.trim()}
                                    </li>
                                ) : null
                            )}
                        </ul>
                    </div>
                )}
                {!prodiDetails?.misi && <p className="text-gray-500 mt-6">Misi belum tersedia.</p>}
            </section>

            <section className="px-2 md:px-4 mb-8">
                {prodiDetails?.tujuan && (
                    <div className="p-6 bg-maroon-50 rounded-xl shadow">
                        <h2 className="text-2xl font-semibold text-maroon-700 mb-3">Tujuan</h2>
                        <ul className="space-y-3 text-lg text-gray-700 text-justify list-disc list-outside pl-5">
                            {prodiDetails.tujuan.split('\n').map((item, index) =>
                                item.trim() ? (
                                    <li key={index} className="leading-relaxed">
                                        {item.trim()}
                                    </li>
                                ) : null
                            )}
                        </ul>
                    </div>
                )}
                {!prodiDetails?.tujuan && <p className="text-gray-500">Tujuan belum tersedia.</p>}
            </section>

            <section className="px-2 md:px-4 mb-8">
                {prodiDetails?.profil_lulusan && (
                    <div className="p-6 bg-maroon-50 rounded-xl shadow">
                        <h2 className="text-2xl font-semibold text-maroon-700 mb-3">Profil Lulusan</h2>
                        <ul className="space-y-3 text-lg text-gray-700 text-justify list-disc list-outside pl-5">
                            {prodiDetails.profil_lulusan.split('\n').map((item, index) =>
                                item.trim() ? (
                                    <li key={index} className="leading-relaxed">
                                        {item.trim()}
                                    </li>
                                ) : null
                            )}
                        </ul>
                    </div>
                )}
                {!prodiDetails?.profil_lulusan && (
                    <p className="text-gray-500">Profil Lulusan belum tersedia.</p>
                )}
            </section>

            {prodiDetails?.file ? (
                <section className="flex justify-center mb-10">
                    <img
                        src={prodiDetails.file}
                        alt={`Sertifikat Akreditasi ${prodiDetails.title || prodiTitle}`}
                        className="w-full max-w-3xl shadow-md rounded-lg"
                    />
                </section>
            ) : (
                <section className="text-center mb-10">
                    <p className="text-gray-500">Sertifikat belum tersedia.</p>
                </section>
            )}

            <section className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-maroon-700 mb-8 text-center">
                    {dosenSectionTitle}
                </h1>

                {dosenList.length === 0 ? (
                    <div className="text-center p-8 bg-gray-100 text-gray-700 rounded-lg shadow-md w-full">
                        <p className="text-xl font-semibold mb-2">Data Tidak Tersedia</p>
                        <p>Tidak ada data dosen untuk Program Studi ini.</p>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-fit">
                            {dosenList.map(renderDosenCard)}
                        </div>
                    </div>
                )}
            </section>

            <section className="px-2 md:px-4 mt-12">
                <h1 className="text-3xl font-bold text-maroon-700 mb-8 text-center">
                    Kurikulum
                </h1>

                {singleKurikulumImage ? (
                    <div className="flex">
                        <img
                            src={`/${kurikulumPrefix}.jpg`}
                            alt="Kurikulum"
                            className="w-full max-w-3xl shadow-md rounded-lg"
                        />
                    </div>
                ) : (
                    Array.from({ length: semesterCount ?? 0 }, (_, i) => i + 1).map((semester) => (
                        <div key={semester} className="mb-8">
                            <h2 className="text-xl font-semibold text-maroon-700 mb-4 text-left">
                                Semester {semester}
                            </h2>
                            <div className="flex">
                                <img
                                    src={`/${kurikulumPrefix}S${semester}.jpg`}
                                    alt={`Kurikulum Semester ${semester}`}
                                    className="w-full max-w-3xl shadow-md rounded-lg"
                                />
                            </div>
                        </div>
                    ))
                )}
            </section>
        </main>
    );
}
