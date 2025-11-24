'use client';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle } from 'lucide-react';
import Image from 'next/image';

interface DashboardHeaderProps {
    onExportCSV: () => void;
    onAddPlayer: () => void;
}

export default function DashboardHeader({ onExportCSV, onAddPlayer }: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b bg-background px-3 py-2 sm:px-6 sm:py-3">
            <div className="flex items-center gap-3 font-semibold">
                <Image
                    src="/logo-ribero.png"
                    alt="logo"
                    width={40}
                    height={40}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                />
                <h1 className="text-base font-bold tracking-tight sm:text-xl">
                    Gestor de Clases de Tenis
                </h1>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={onExportCSV} className="text-sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
                <Button onClick={onAddPlayer} className="text-sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Jugador
                </Button>
            </div>
        </header>
    );
}
