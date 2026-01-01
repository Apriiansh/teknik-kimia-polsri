import { getProdiData } from '../_components/data-fetcher';
import ProdiClientContent from '../_components/ProdiClientContent';

export const revalidate = 3600;

export default async function D3TeknikKimiaPage() {
    const { prodiDetails, dosenList } = await getProdiData(
        'D3 Teknik Kimia',          
        'D3 Teknik Kimia',           
        'Ir. Irawan Rusnadi, M.T.'   
    );

    return (
        <ProdiClientContent
            prodiDetails={prodiDetails}
            dosenList={dosenList}
            prodiTitle="D3 Teknik Kimia"
            dosenSectionTitle="Dosen D3 Teknik Kimia"
            kurikulumPrefix="kurikulumD3tekkim"
            semesterCount={6}
        />
    );
}
