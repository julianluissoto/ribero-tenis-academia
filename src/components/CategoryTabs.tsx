'use client';
import * as React from 'react';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';


import { MASCULINO_CATEGORIES, FEMENINO_CATEGORIES } from '@/lib/types';

import { COURT_CAPACITY, TOTAL_COURTS } from '@/lib/types';



import PlayerList from './PlayerList';

import type { Player, AttendanceRecord, Gender } from '@/lib/types';

interface CategoryTabProps {
    gender: Gender;
    players: Player[];
    attendance: Record<string, Record<string, AttendanceRecord[]>>;
    selectedDate: Date;
    selectedTime: string;
    onAttendanceChange: (playerId: string, status: AttendanceRecord['status']) => void;
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
    onDeletePlayer,
    onViewPlayer,
}: CategoryTabProps) {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const timeKey = selectedTime;
    const genderCategories = gender === 'Femenino' ? FEMENINO_CATEGORIES : MASCULINO_CATEGORIES;

    return (
        <Tabs defaultValue={genderCategories[0]}>
            <TabsList>
                {genderCategories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                        Categoría {category}
                    </TabsTrigger>
                ))}
            </TabsList>
            {genderCategories.map((category) => {
                const categoryPlayers = players.filter((p) => p.category === category);
                const todaysAttendance = attendance[dateKey]?.[timeKey] ?? [];

                const allConfirmedPlayersForTime = players.filter(p =>
                    todaysAttendance.some(att => att.playerId === p.id && att.status === 'present')
                );
                const confirmedCount = allConfirmedPlayersForTime.length;


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
                                        <CardTitle className="text-base font-medium">Asistentes Confirmados (Total)</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {confirmedCount} / {COURT_CAPACITY * TOTAL_COURTS}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-4">Capacidad total de la clase</p>

                                        {Array.from({ length: TOTAL_COURTS }).map((_, courtIndex) => {
                                            const start = courtIndex * COURT_CAPACITY;
                                            const courtPlayers = Math.max(0, Math.min(COURT_CAPACITY, confirmedCount - start));

                                            return (
                                                <div key={courtIndex} className="mb-3">
                                                    <p className="text-sm font-medium">Cancha {courtIndex + 1}: {courtPlayers} / {COURT_CAPACITY}</p>
                                                    <Progress value={(courtPlayers / COURT_CAPACITY) * 100} className="mt-1 h-2" />
                                                </div>
                                            );
                                        })}
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
