'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { initialPlayers } from '@/lib/data';
import type { Player, AttendanceRecord, PlayerFormData, ConfirmedClass } from '@/lib/types';
import { GENDERS } from '@/lib/types';
import AddPlayerForm from '@/components/add-player-form';
import DashboardHeader from '@/components/DashboardHeader';
import ClassFilters from '@/components/ClassFilters';
import CategoryTab from '@/components/CategoryTabs';
import PlayerProfileDialog from '@/components/PlayerProfileDialog';
import ConfirmedClassView from '@/components/ConfirmedClassView';
import Loading from '@/components/Loading';
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
      if (storedPlayers) {
        setPlayers(JSON.parse(storedPlayers));
      } else {
        setPlayers(initialPlayers);
      }

      const storedAttendance = localStorage.getItem('tennis-attendance');
      if (storedAttendance) {
        setAttendance(JSON.parse(storedAttendance));
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
      classesRemaining: newPlayerData.subscription === 'monthly' ? 8 : 0,
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
        const classesRemaining = updatedPlayerData.subscription === 'monthly'
          ? (p.subscription === 'monthly' ? p.classesRemaining : 8)
          : 0;
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

    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId && p.subscription === 'monthly') {
        let newClassesRemaining = p.classesRemaining;
        if (previousStatus !== 'present' && status === 'present') {
          newClassesRemaining = Math.max(0, p.classesRemaining - 1);
        } else if (previousStatus === 'present' && status !== 'present') {
          newClassesRemaining = Math.min(8, p.classesRemaining + 1);
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

    const csvRows = records.map(fullRecord => {
      const { date, player, record } = fullRecord;
      const dateObj = new Date(date + 'T00:00:00');
      const month = format(dateObj, 'MMMM yyyy', { locale: es });
      return [
        month,
        format(dateObj, 'yyyy-MM-dd'),
        player.gender,
        player.category,
        `${player.name} ${player.surname}`,
        player.subscription === 'monthly' ? 'Si' : 'No',
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
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
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
