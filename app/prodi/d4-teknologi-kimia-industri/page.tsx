import { getProdiData } from '../_components/data-fetcher';
import ProdiClientContent from '../_components/ProdiClientContent';

export const revalidate = 3600;

export default async function D4TeknologiKimiaIndustriPage() {
    const { prodiDetails, dosenList } = await getProdiData(
        'D4 Teknologi Kimia Industri',
        'D4 Teknologi Kimia Industri'
    );

    return (
        <ProdiClientContent
            prodiDetails={prodiDetails}
            dosenList={dosenList}
            prodiTitle="D4 Teknologi Kimia Industri"
            dosenSectionTitle="Dosen D4 Teknologi Kimia Industri"
            kurikulumPrefix="kurikulumD4tekkimindus"
            semesterCount={8}
        />
    );
}
