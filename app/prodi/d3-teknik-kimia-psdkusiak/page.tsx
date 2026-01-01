import { getProdiData } from '../_components/data-fetcher';
import ProdiClientContent from '../_components/ProdiClientContent';

export const revalidate = 3600;

export default async function D3TeknikKimiaPSDKUSIAKPage() {
    const { prodiDetails, dosenList } = await getProdiData(
        'D3 Teknik Kimia PSDKU SIAK',
        'D3 Teknik Kimia PSDKU SIAK'
    );

    return (
        <ProdiClientContent
            prodiDetails={prodiDetails}
            dosenList={dosenList}
            prodiTitle="D3 Teknik Kimia PSDKU SIAK"
            dosenSectionTitle="Dosen D3 Teknik Kimia PSDKU SIAK"
            kurikulumPrefix="kurikulumD3tekkim"
            semesterCount={6}
        />
    );
}
