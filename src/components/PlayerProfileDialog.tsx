'use client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit } from 'lucide-react';
import type { Player } from '@/lib/types';

interface PlayerProfileDialogProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (player: Player) => void;
}

export default function PlayerProfileDialog({ player, isOpen, onOpenChange, onEdit }: PlayerProfileDialogProps) {
    if (!player) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Perfil de Jugador</DialogTitle>
                    <DialogDescription>{player.name} {player.surname}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <p><strong>Género:</strong> {player.gender}</p>
                    <p><strong>Categoría:</strong> {player.category}</p>
                    <p><strong>Teléfono:</strong> {player.telefono}</p>
                    <p><strong>Suscripción:</strong> {player.subscription === 'monthly' ? 'Mensual' : 'Ninguna'}</p>
                    {player.subscription === 'monthly' && (
                        <div>
                            <p className="mb-2"><strong>Clases Consumidas:</strong></p>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    {8 - player.classesRemaining} de 8 clases utilizadas
                                </p>
                                <Progress value={((8 - player.classesRemaining) / 8) * 100} />
                            </div>
                        </div>
                    )}
                </div>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => onEdit(player)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                </AlertDialogFooter>
            </DialogContent>
        </Dialog>
    );
}
