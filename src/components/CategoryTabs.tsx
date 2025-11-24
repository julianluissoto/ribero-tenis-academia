
'use client';
import * as React from 'react';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';

import type { Player, AttendanceRecord, ConfirmedClass } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { CLASS_CAPACITY } from '@/app/page';
import { es } from 'date-fns/locale';
import PlayerList from './PlayerList';

interface CategoryTabProps {
    gender: string;
    players: Player[];
    attendance: Record<string, Record<string, AttendanceRecord[]>>;
    selectedDate: Date;
    selectedTime: string;
    onAttendanceChange: (playerId: string, status: AttendanceRecord['status']) => void;
    onConfirmSchedule: (classInfo: ConfirmedClass | null) => void;
    onDeletePlayer: (playerId: string) => void;
    onViewPlayer: (player: Player) => void;
}

export default function CategoryTab({
    gender,
    players,
    attendance,
    selectedDate,
    selectedTime,
    onAttendanceChange,
    onConfirmSchedule,
    onDeletePlayer,
    onViewPlayer,
}: CategoryTabProps) {

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const timeKey = selectedTime;

    const handleConfirmSchedule = (category: string) => {
        const categoryPlayers = players.filter((p) => p.category === category);
        const todaysAttendance = attendance[dateKey]?.[timeKey] ?? [];
        const confirmedPlayers = categoryPlayers.filter((player) =>
            todaysAttendance.some((att) => att.playerId === player.id && att.status === 'present')
        );

        onConfirmSchedule({
            date: format(selectedDate, 'PPP', { locale: es }),
            time: timeKey,
            category: category,
            gender: gender,
            players: confirmedPlayers,
        });
    };

    return (
        <Tabs defaultValue={CATEGORIES[0]}>
            <TabsList>
                {CATEGORIES.map((category) => (
                    <TabsTrigger key={category} value={category}>
                        Categoría {category}
                    </TabsTrigger>
                ))}
            </TabsList>
            {CATEGORIES.map((category) => {
                const categoryPlayers = players.filter((p) => p.category === category);
                const todaysAttendance = attendance[dateKey]?.[timeKey] ?? [];
                const confirmedPlayers = categoryPlayers.filter((player) =>
                    todaysAttendance.some((att) => att.playerId === player.id && att.status === 'present')
                );
                const confirmedCount = confirmedPlayers.length;

                return (
                    <TabsContent key={category} value={category}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="w-full md:col-span-2 lg:col-span-4">
                                <CardHeader>
                                    <CardTitle>Gestionar Asistencia</CardTitle>
                                    <CardDescription>
                                        Confirmar, rechazar o deshacer la asistencia de los jugadores.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <PlayerList
                                        players={categoryPlayers}
                                        attendance={todaysAttendance}
                                        confirmedCount={confirmedCount}
                                        onAttendanceChange={onAttendanceChange}
                                        onDeletePlayer={onDeletePlayer}
                                        onViewPlayer={onViewPlayer}
                                        selectedDate={selectedDate}
                                        selectedTime={selectedTime}
                                    />
                                </CardContent>
                            </Card>

                            <div className="w-full space-y-4 md:col-span-2 lg:col-span-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base font-medium">Asistentes Confirmados</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {confirmedCount} / {CLASS_CAPACITY}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Capacidad de la clase</p>
                                        <Progress value={(confirmedCount / CLASS_CAPACITY) * 100} className="mt-2" />
                                        <Button
                                            className="mt-4 w-full"
                                            onClick={() => handleConfirmSchedule(category)}
                                            disabled={confirmedPlayers.length === 0}
                                        >
                                            Confirmar Horario
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                );
            })}
        </Tabs>
    );
}
