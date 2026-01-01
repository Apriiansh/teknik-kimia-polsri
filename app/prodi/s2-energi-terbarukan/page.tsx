import { getProdiData } from '../_components/data-fetcher';
import ProdiClientContent from '../_components/ProdiClientContent';

export const revalidate = 3600;

export default async function S2EnergiTerbarukanPage() {
    const { prodiDetails, dosenList } = await getProdiData(
        'S2 Energi Terbarukan',
        'S2 Energi Terbarukan'
    );

    return (
        <ProdiClientContent
            prodiDetails={prodiDetails}
            dosenList={dosenList}
            prodiTitle="S2 Energi Terbarukan"
            dosenSectionTitle="Dosen S2 Energi Terbarukan"
            kurikulumPrefix="kurikulumS2EnergiTerbarukan"
            singleKurikulumImage={true}
        />
    );
}
