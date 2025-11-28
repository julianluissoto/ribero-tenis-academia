'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { initialPlayers } from '@/lib/data';
import type { Player, AttendanceRecord, PlayerFormData, ConfirmedClass } from '@/lib/types';
import { GENDERS, SUBSCRIPTION_DETAILS, SUBSCRIPTION_TYPES } from '@/lib/types';
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

const availableTimes = Array.from({ length: 15 }, (_, i) => `${i + 9}:00`);
export const CLASS_CAPACITY = 8;

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

  React.useEffect(() => {
    try {
      const storedPlayers = localStorage.getItem('tennis-players');
      let loadedPlayers: any[] = storedPlayers ? JSON.parse(storedPlayers) : initialPlayers;

      // 🔥 SANEAR jugadores legacy sin subscription o con datos malformados
      loadedPlayers = loadedPlayers.map((p: any) => {
        // aseguramos que subscription sea uno de los permitidos
        const sub: SubscriptionType = SUBSCRIPTION_TYPES.includes(p?.subscription)
          ? p.subscription
          : 'per_class';

        const classesRemainingFromData = Number.isFinite(Number(p?.classesRemaining))
          ? Number(p.classesRemaining)
          : undefined;

        return {
          // garantizamos shape mínimo
          id: p?.id ?? nanoid(),
          name: p?.name ?? '',
          surname: p?.surname ?? '',
          telefono: p?.telefono ?? '',
          category: p?.category ?? (typeof initialPlayers[0] !== 'undefined' ? initialPlayers[0].category : '4to'),
          gender: p?.gender ?? (typeof initialPlayers[0] !== 'undefined' ? initialPlayers[0].gender : 'Masculino'),
          subscription: sub,
          classesRemaining: classesRemainingFromData ?? SUBSCRIPTION_DETAILS[sub].classes,
        } as Player;
      });

      setPlayers(loadedPlayers);

      const storedAttendance = localStorage.getItem('tennis-attendance');
      if (storedAttendance) {
        try {
          setAttendance(JSON.parse(storedAttendance));
        } catch (err) {
          console.error('Attendance parse error, ignoring stored attendance', err);
          setAttendance({});
        }
      }
    } catch (error) {
      console.error("Error loading data from localStorage", error);
      setPlayers(initialPlayers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (players.length > 0 && !isLoading) {
      localStorage.setItem('tennis-players', JSON.stringify(players));
    }
  }, [players, isLoading]);

  React.useEffect(() => {
    if (Object.keys(attendance).length > 0 && !isLoading) {
      localStorage.setItem('tennis-attendance', JSON.stringify(attendance));
    }
  }, [attendance, isLoading]);

  const handleAddPlayer = (newPlayerData: PlayerFormData) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: nanoid(),
      classesRemaining: SUBSCRIPTION_DETAILS[newPlayerData.subscription].classes,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    toast({
      title: 'Jugador Agregado',
      description: `${newPlayer.name} ${newPlayer.surname} ha sido agregado.`,
    });
    setAddPlayerOpen(false);
  };

  const handleEditPlayer = (updatedPlayerData: PlayerFormData, playerId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        let classesRemaining = p.classesRemaining;
        // If subscription type changes, reset the class count
        if (p.subscription !== updatedPlayerData.subscription) {
          classesRemaining = SUBSCRIPTION_DETAILS[updatedPlayerData.subscription].classes;
        }
        return { ...p, ...updatedPlayerData, classesRemaining };
      }
      return p;
    }));
    toast({
      title: 'Jugador Actualizado',
      description: `Los datos de ${updatedPlayerData.name} ${updatedPlayerData.surname} han sido actualizados.`,
    });
    setPlayerToEdit(null);
    setPlayerToView(null);
  };

  const handleDeletePlayer = (playerId: string) => {
    const playerToDelete = players.find((p) => p.id === playerId);
    if (playerToDelete) {
      setPlayers((prev) => prev.filter((player) => player.id !== playerId));
      toast({
        title: 'Jugador Eliminado',
        description: `${playerToDelete.name} ${playerToDelete.surname} ha sido eliminado.`,
      });
    }
  };

  const handleAttendanceChange = (
    playerId: string,
    status: AttendanceRecord['status']
  ) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const timeKey = selectedTime;
    const dayAttendance = attendance[dateKey] ?? {};
    const timeSlotAttendance = dayAttendance[timeKey] ?? [];

    const confirmedCount = timeSlotAttendance.filter(
      (att) => att.status === 'present'
    ).length;
    if (status === 'present' && confirmedCount >= CLASS_CAPACITY) {
      toast({
        variant: 'destructive',
        title: 'Clase Llena',
        description: 'No se puede confirmar la asistencia, la clase está a su máxima capacidad.',
      });
      return;
    }

    // Antes de actualizar attendance, verifico el player actual y permito per_class aún con 0 clasesRemaining
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const isPerClass = player.subscription === 'per_class';
    if (!isPerClass && status === 'present' && player.classesRemaining <= 0) {
      toast({
        variant: 'destructive',
        title: 'Sin clases disponibles',
        description: 'Este jugador ya no tiene clases disponibles.',
      });
      return;
    }

    const newTimeSlotAttendance = [...timeSlotAttendance];
    const playerAttIndex = newTimeSlotAttendance.findIndex(
      (att) => att.playerId === playerId
    );

    const previousStatus = playerAttIndex > -1 ? newTimeSlotAttendance[playerAttIndex].status : null;

    if (playerAttIndex > -1) {
      newTimeSlotAttendance[playerAttIndex].status = status;
    } else {
      newTimeSlotAttendance.push({
        playerId,
        date: dateKey,
        time: timeKey,
        status,
      });
    }

    setAttendance((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [timeKey]: newTimeSlotAttendance,
      },
    }));

    // Actualizo players: solo los que no son per_class afectan classesRemaining
    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId && p.subscription !== 'per_class') {
        const totalClasses = SUBSCRIPTION_DETAILS[p.subscription].classes;
        let newClassesRemaining = p.classesRemaining;

        if (previousStatus !== 'present' && status === 'present') {
          newClassesRemaining = Math.max(0, p.classesRemaining - 1);
        } else if (previousStatus === 'present' && status !== 'present') {
          newClassesRemaining = Math.min(totalClasses, p.classesRemaining + 1);
        }
        return { ...p, classesRemaining: newClassesRemaining };
      }
      return p;
    }));
  };

  const exportToCSV = () => {
    const records: any[] = [];
    Object.keys(attendance).forEach(dateKey => {
      Object.keys(attendance[dateKey]).forEach(timeKey => {
        const timeSlotAttendance = attendance[dateKey][timeKey];
        timeSlotAttendance.forEach(record => {
          const player = players.find(p => p.id === record.playerId);
          if (player) {
            records.push({ date: dateKey, player: player, record: record });
          }
        });
      });
    });

    records.sort((a, b) => {
      if (a.player.category < b.player.category) return -1;
      if (a.player.category > b.player.category) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const csvRows = records.map((fullRecord: {
      date: string;
      player: Player;
      record: AttendanceRecord;
    }) => {
      const { date, player, record } = fullRecord;
      const dateObj = new Date(date + 'T00:00:00');
      const month = format(dateObj, 'MMMM yyyy', { locale: es });

      return [
        month,
        format(dateObj, 'yyyy-MM-dd'),
        player.gender,
        player.category,
        `${player.name} ${player.surname}`,
        SUBSCRIPTION_DETAILS[player.subscription as SubscriptionType].label,
        record.status === 'present' ? 'Si' : 'No'
      ].join(',');
    });

    const csvHeader = "Mes,Fecha,Género,Categoría,Jugador,Suscripción,Asistió\n";
    let csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "asistencia_tenis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditModal = (player: Player) => {
    setPlayerToView(null);
    setPlayerToEdit(player);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col">
        <DashboardHeader
          onExportCSV={exportToCSV}
          onAddPlayer={() => setAddPlayerOpen(true)}
        />

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
                  onConfirmSchedule={setConfirmedClass}
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

      <PlayerProfileDialog
        player={playerToView}
        isOpen={!!playerToView}
        onOpenChange={(open) => !open && setPlayerToView(null)}
        onEdit={handleOpenEditModal}
      />

      <Dialog open={isAddPlayerOpen} onOpenChange={setAddPlayerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Jugador</DialogTitle>
            <DialogDescription>
              Completa los detalles para añadir un nuevo jugador a tu lista.
            </DialogDescription>
          </DialogHeader>
          <AddPlayerForm onSubmit={handleAddPlayer} />
        </DialogContent>
      </Dialog>

      {playerToEdit && (
        <Dialog open={!!playerToEdit} onOpenChange={(open) => !open && setPlayerToEdit(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Jugador</DialogTitle>
              <DialogDescription>Actualiza los detalles del jugador.</DialogDescription>
            </DialogHeader>
            <AddPlayerForm
              onSubmit={(data) => handleEditPlayer(data, playerToEdit.id)}
              player={playerToEdit}
            />
          </DialogContent>
        </Dialog>
      )}

    </TooltipProvider>
  );
}
