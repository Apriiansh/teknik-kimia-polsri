import { getProdiData } from '../_components/data-fetcher';
import ProdiClientContent from '../_components/ProdiClientContent';

export const revalidate = 3600;

export default async function D4TeknikEnergiPage() {
    const { prodiDetails, dosenList } = await getProdiData(
        'D4 Teknik Energi',
        'D4 Teknik Energi',
        'Ir. Irawan Rusnadi, M.T.'
    );

    return (
        <ProdiClientContent
            prodiDetails={prodiDetails}
            dosenList={dosenList}
            prodiTitle="D4 Teknik Energi"
            dosenSectionTitle="Dosen D4 Teknik Energi"
            kurikulumPrefix="kurikulumD4tekenergi"
            semesterCount={8}
        />
    );
}
