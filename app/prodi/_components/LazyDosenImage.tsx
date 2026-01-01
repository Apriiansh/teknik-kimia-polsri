'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface LazyDosenImageProps {
    dosenId: string;
    nama: string;
}

export default function LazyDosenImage({ dosenId, nama }: LazyDosenImageProps) {
    const [foto, setFoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasLoaded && !isLoading) {
                        loadImage();
                    }
                });
            },
            {
                rootMargin: '100px',
                threshold: 0.1
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [hasLoaded, isLoading, dosenId]);

    const loadImage = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('dosen')
                .select('foto')
                .eq('id_dsn', dosenId)
                .single();

            if (!error && data?.foto) {
                setFoto(data.foto);
            }
        } catch (err) {
            console.error('Error loading image:', err);
        } finally {
            setIsLoading(false);
            setHasLoaded(true);
        }
    };

    return (
        <div ref={imgRef} className="w-48 aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
            {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse bg-gray-200 w-full h-full" />
                </div>
            ) : foto ? (
                <img
                    src={foto}
                    alt={nama}
                    className="object-cover w-full h-full"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-maroon-400">
                    {nama ? nama.charAt(0).toUpperCase() : '?'}
                </div>
            )}
        </div>
    );
}
