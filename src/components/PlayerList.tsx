
'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    CheckCircle2,
    Trash2,
    Undo2,
    User,
    XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Player, AttendanceRecord } from '@/lib/types';
import { WhatsAppIcon } from '@/components/icons';
import { CLASS_CAPACITY } from '@/app/page';

interface PlayerListProps {
    players: Player[];
    attendance: AttendanceRecord[];
    confirmedCount: number;
    onAttendanceChange: (playerId: string, status: AttendanceRecord['status']) => void;
    onDeletePlayer: (playerId: string) => void;
    onViewPlayer: (player: Player) => void;
    selectedDate: Date;
    selectedTime: string;
}

export default function PlayerList({
    players,
    attendance,
    confirmedCount,
    onAttendanceChange,
    onDeletePlayer,
    onViewPlayer,
    selectedDate,
    selectedTime
}: PlayerListProps) {

    if (players.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>Aún no hay jugadores en esta categoría.</p>
                <p className="text-sm">Usa el botón "Añadir Jugador" para agregar a alguien.</p>
            </div>
        );
    }

    const formattedDate = format(selectedDate, 'PPP', { locale: es });

    return (
        <ul className="divide-y divide-border">
            {players.map((player) => {
                const playerAttendance = attendance.find((att) => att.playerId === player.id);
                const status = playerAttendance?.status ?? null;
                const message = `Hola ${player.name}, te escribo para confirmar tu asistencia a la clase de tenis de hoy, ${formattedDate} a las ${selectedTime}. ¡Gracias!`;
                const whatsappLink = `https://wa.me/${player.telefono}?text=${encodeURIComponent(message)}`;

                return (
                    <li key={player.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewPlayer(player)}>
                                        <User className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Ver Perfil</p></TooltipContent>
                            </Tooltip>
                            <div>
                                <p className="font-medium">{player.name} {player.surname}</p>
                                <p className="text-sm text-muted-foreground">{player.telefono}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={status === 'present' ? 'default' : 'ghost'}
                                        size="icon"
                                        className={cn('h-8 w-8', status === 'present' && 'bg-green-600 hover:bg-green-700')}
                                        onClick={() => onAttendanceChange(player.id, 'present')}
                                        disabled={
                                            (status !== 'present' && confirmedCount >= CLASS_CAPACITY) ||
                                            (player.subscription !== 'per_class' && player.classesRemaining === 0)
                                        }

                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {player.classesRemaining === 0 ? <p>Sin clases restantes</p> : <p>Confirmar</p>}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={status === 'absent' ? 'destructive' : 'ghost'}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onAttendanceChange(player.id, 'absent')}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Rechazar</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAttendanceChange(player.id, null)}>
                                        <Undo2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Deshacer</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <WhatsAppIcon className="h-5 w-5 text-green-500" />
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent><p>Enviar WhatsApp</p></TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Eliminar Jugador</p></TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente al jugador{' '}
                                            <span className="font-semibold">{player.name} {player.surname}</span>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeletePlayer(player.id)}>
                                            Eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
