'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { initialPlayers } from '@/lib/data';
import type { Player, AttendanceRecord, PlayerFormData, ConfirmedClass } from '@/lib/types';
import { GENDERS, SUBSCRIPTION_TYPES } from '@/lib/types';
import { SUBSCRIPTION_DETAILS } from '@/lib/types';

import AddPlayerForm from '@/components/add-player-form';
import DashboardHeader from '@/components/DashboardHeader';
import ClassFilters from '@/components/ClassFilters';
import CategoryTab from '@/components/CategoryTabs';
import PlayerProfileDialog from '@/components/PlayerProfileDialog';
import ConfirmedClassView from '@/components/ConfirmedClassView';
import Loading from '@/components/Loading';

import type { SubscriptionType } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import { CLASS_CAPACITY } from '@/lib/types';

const availableTimes = Array.from({ length: 15 }, (_, i) => `${i + 9}:00`);

export default function DashboardPage() {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [attendance, setAttendance] = React.useState<Record<string, Record<string, AttendanceRecord[]>>>({});

  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = React.useState<string>('18:00');
  const [selectedGender, setSelectedGender] = React.useState<string>(GENDERS[0]);

  const [confirmedClass, setConfirmedClass] = React.useState<ConfirmedClass | null>(null);

  const [playerToView, setPlayerToView] = React.useState<Player | null>(null);
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null);
  const [isAddPlayerOpen, setAddPlayerOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const { toast } = useToast();

  // ------------------------
  //     LOAD DATA
  // ------------------------
  React.useEffect(() => {
    try {
      const storedPlayers = localStorage.getItem('tennis-players');
      let loadedPlayers: any[] = storedPlayers ? JSON.parse(storedPlayers) : initialPlayers;

      loadedPlayers = loadedPlayers.map((p: any) => {
        const sub: SubscriptionType = SUBSCRIPTION_TYPES.includes(p?.subscription)
          ? p.subscription
          : 'per_class';

        const classesRemainingFromData = Number.isFinite(Number(p?.classesRemaining))
          ? Number(p.classesRemaining)
          : undefined;

        return {
          id: p?.id ?? nanoid(),
          name: p?.name ?? '',
          surname: p?.surname ?? '',
          telefono: p?.telefono ?? '',
          category: p?.category ?? initialPlayers[0]?.category ?? '4to',
          gender: p?.gender ?? initialPlayers[0]?.gender ?? 'Masculino',
          subscription: sub,
          classesRemaining: classesRemainingFromData ?? SUBSCRIPTION_DETAILS[sub].classes,
        } as Player;
      });

      setPlayers(loadedPlayers);

      const storedAttendance = localStorage.getItem('tennis-attendance');
      if (storedAttendance) {
        try {
          setAttendance(JSON.parse(storedAttendance));
        } catch {
          setAttendance({});
        }
      }
    } catch {
      setPlayers(initialPlayers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // SAVE players
  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tennis-players', JSON.stringify(players));
    }
  }, [players, isLoading]);

  // SAVE attendance
  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tennis-attendance', JSON.stringify(attendance));
    }
  }, [attendance, isLoading]);

  // ------------------------
  //     ADD PLAYER
  // ------------------------
  const handleAddPlayer = (newPlayerData: PlayerFormData) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: nanoid(),
      classesRemaining: SUBSCRIPTION_DETAILS[newPlayerData.subscription].classes,
    };

    setPlayers(prev => [...prev, newPlayer]);

    toast({
      title: 'Jugador Agregado',
      description: `${newPlayer.name} ${newPlayer.surname} ha sido agregado.`,
    });

    setAddPlayerOpen(false);
  };

  // ------------------------
  //   EDIT PLAYER
  // ------------------------
  const handleEditPlayer = (updatedPlayerData: PlayerFormData, playerId: string) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === playerId) {
          let classesRemaining = p.classesRemaining;
          if (p.subscription !== updatedPlayerData.subscription) {
            classesRemaining = SUBSCRIPTION_DETAILS[updatedPlayerData.subscription].classes;
          }
          return { ...p, ...updatedPlayerData, classesRemaining };
        }
        return p;
      })
    );

    toast({
      title: 'Jugador Actualizado',
      description: `Los datos de ${updatedPlayerData.name} ${updatedPlayerData.surname} han sido actualizados.`,
    });

    setPlayerToEdit(null);
    setPlayerToView(null);
  };

  // ------------------------
  //   DELETE PLAYER
  // ------------------------
  const handleDeletePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setPlayers(prev => prev.filter(p => p.id !== playerId));

    toast({
      title: 'Jugador Eliminado',
      description: `${player.name} ${player.surname} ha sido eliminado.`,
    });
  };

  // ------------------------
  //   ATTENDANCE
  // ------------------------
  const handleAttendanceChange = (
    playerId: string,
    status: AttendanceRecord['status']
  ) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const timeKey = selectedTime;

    const dayAttendance = attendance[dateKey] ?? {};
    const timeAttendance = dayAttendance[timeKey] ?? [];

    // CHECK CAPACITY
    const confirmed = timeAttendance.filter(a => a.status === 'present').length;
    if (status === 'present' && confirmed >= CLASS_CAPACITY) {
      toast({
        variant: 'destructive',
        title: 'Clase Llena',
        description: 'No se puede confirmar la asistencia, la clase está llena.',
      });
      return;
    }

    // FIND PLAYER
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const isPerClass = player.subscription === 'per_class';
    const prevStatus = timeAttendance.find(a => a.playerId === playerId)?.status ?? null;

    // CHECK remaining classes
    if (!isPerClass && status === 'present' && player.classesRemaining <= 0) {
      toast({
        variant: 'destructive',
        title: 'Sin clases',
        description: 'Este jugador no tiene clases disponibles.',
      });
      return;
    }

    // UPDATE attendance
    const newAttendanceRow = [...timeAttendance];
    const idx = newAttendanceRow.findIndex(a => a.playerId === playerId);

    if (idx > -1) {
      newAttendanceRow[idx].status = status;
    } else {
      newAttendanceRow.push({ playerId, date: dateKey, time: timeKey, status });
    }

    setAttendance(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [timeKey]: newAttendanceRow,
      },
    }));

    // Update classesRemaining
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === playerId && p.subscription !== 'per_class') {
          const total = SUBSCRIPTION_DETAILS[p.subscription].classes;
          let remaining = p.classesRemaining;

          if (prevStatus !== 'present' && status === 'present') remaining = Math.max(0, remaining - 1);
          if (prevStatus === 'present' && status !== 'present') remaining = Math.min(total, remaining + 1);

          return { ...p, classesRemaining: remaining };
        }
        return p;
      })
    );
  };

  // ------------------------
  // CONFIRM CLASS
  // ------------------------
  const handleConfirmClass = () => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const timeKey = selectedTime;
    const todaysAttendance = attendance[dateKey]?.[timeKey] ?? [];

    const confirmedPlayers = players.filter((player) =>
      todaysAttendance.some(
        (att) => att.playerId === player.id && att.status === "present"
      )
    );

    if (confirmedPlayers.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay jugadores",
        description: "No hay jugadores confirmados para esta clase.",
      });
      return;
    }

    const categoriesInClass: Record<string, Player[]> = {};
    confirmedPlayers.forEach(p => {
      if (!categoriesInClass[p.category]) {
        categoriesInClass[p.category] = [];
      }
      categoriesInClass[p.category].push(p);
    });

    const categoryNames = Object.keys(categoriesInClass);

    if (categoryNames.length > 2) {
      toast({
        variant: "destructive",
        title: "Demasiadas categorías",
        description: "No se pueden mezclar más de 2 categorías en el mismo horario.",
      });
      return;
    }

    if (categoryNames.length === 2) {
      const countCat1 = categoriesInClass[categoryNames[0]].length;
      const countCat2 = categoriesInClass[categoryNames[1]].length;
      if (countCat1 !== 4 && countCat2 !== 4) {
        toast({
          variant: "destructive",
          title: "Canchas no completas",
          description: "Para usar 2 categorías, una debe tener 4 jugadores (cancha llena).",
        });
        return;
      }
    }

    setConfirmedClass({
      date: format(selectedDate, 'PPP', { locale: es }),
      time: timeKey,
      categories: categoryNames,
      gender: selectedGender,
      players: confirmedPlayers,
    });
  }

  // ------------------------
  //     EXPORT CSV
  // ------------------------
  const exportToCSV = () => {
    const records: { date: string; player: Player; record: AttendanceRecord }[] = [];

    Object.keys(attendance).forEach(dateKey => {
      Object.keys(attendance[dateKey]).forEach(timeKey => {
        attendance[dateKey][timeKey].forEach(rec => {
          const player = players.find(p => p.id === rec.playerId);
          if (!player) return;

          records.push({ date: dateKey, player, record: rec });
        });
      });
    });

    records.sort((a, b) => {
      if (a.player.category < b.player.category) return -1;
      if (a.player.category > b.player.category) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const csvRows = records.map(({ date, player, record }) => {
      const dateObj = new Date(date + "T00:00:00");
      const month = format(dateObj, 'MMMM yyyy', { locale: es });

      return [
        month,
        format(dateObj, 'yyyy-MM-dd'),
        player.gender,
        player.category,
        `${player.name} ${player.surname}`,
        SUBSCRIPTION_DETAILS[player.subscription].label,
        record.status === 'present' ? 'Si' : 'No'
      ]
        .map(v => (v ?? "")) // 👈 evita errores
        .join(',');
    });

    const csvHeader = "Mes,Fecha,Género,Categoría,Jugador,Suscripción,Asistió\n";
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows.join('\n');

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "asistencia_tenis.csv");
    link.click();
  };

  // ------------------------
  //         UI
  // ------------------------
  if (isLoading) return <Loading />;

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col">
        <DashboardHeader onExportCSV={exportToCSV} onAddPlayer={() => setAddPlayerOpen(true)} />

        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <Tabs value={selectedGender} onValueChange={setSelectedGender}>
            <ClassFilters
              selectedDate={selectedDate}
              onDateChange={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setConfirmedClass(null);
                }
              }}
              selectedTime={selectedTime}
              onTimeChange={(time) => {
                setSelectedTime(time);
                setConfirmedClass(null);
              }}
              availableTimes={availableTimes}
              onConfirmClass={handleConfirmClass}
            />

            {GENDERS.map((gender) => (
              <TabsContent key={gender} value={gender} className="mt-4">
                <CategoryTab
                  gender={gender}
                  players={players.filter(p => p.gender === gender)}
                  attendance={attendance}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onAttendanceChange={handleAttendanceChange}
                  onDeletePlayer={handleDeletePlayer}
                  onViewPlayer={setPlayerToView}
                />
              </TabsContent>
            ))}
          </Tabs>

          {confirmedClass && confirmedClass.players.length > 0 && (
            <ConfirmedClassView confirmedClass={confirmedClass} />
          )}
        </main>
      </div>

      {/* View Player */}
      <PlayerProfileDialog
        player={playerToView}
        isOpen={!!playerToView}
        onOpenChange={(open) => !open && setPlayerToView(null)}
        onEdit={(p) => {
          setPlayerToEdit(p);
          setPlayerToView(null);
        }}
      />

      {/* Add Player */}
      <Dialog open={isAddPlayerOpen} onOpenChange={setAddPlayerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Jugador</DialogTitle>
            <DialogDescription>Completa los detalles para añadir un nuevo jugador.</DialogDescription>
          </DialogHeader>
          <AddPlayerForm onSubmit={handleAddPlayer} />
        </DialogContent>
      </Dialog>

      {/* Edit Player */}
      {playerToEdit && (
        <Dialog open={!!playerToEdit} onOpenChange={(open) => !open && setPlayerToEdit(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Jugador</DialogTitle>
              <DialogDescription>Actualiza los detalles del jugador.</DialogDescription>
            </DialogHeader>
            <AddPlayerForm onSubmit={(data) => handleEditPlayer(data, playerToEdit.id)} player={playerToEdit} />
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
