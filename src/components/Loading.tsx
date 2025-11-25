'use client';

import Image from 'next/image';

export default function Loading() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
            <div className="flex w-full max-w-xs flex-col items-center gap-4 sm:max-w-sm">
                <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                    <Image
                        src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGR2aThkNnZweG1qZ3B0dTg2cDZ4ZnBremdoNm5tdWVweGZhYjh3cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4FGKkmXLgqi5wfG8/giphy.gif"
                        alt="Loading tennis racket"
                        layout="fill"
                        objectFit="contain"
                        unoptimized
                    />
                </div>
                <span className="text-xl font-semibold text-primary">Cargando datos...</span>
            </div>
            <p className="mt-2 text-muted-foreground">¡Ribero Tenis Academy!</p>
        </div>
    );
}
