'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  PlusCircle,
  Trash2,
  Undo2,
  Users,
  XCircle,
  User,
} from 'lucide-react';
import { nanoid } from 'nanoid';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { initialPlayers } from '@/lib/data';
import type { AttendanceRecord, Player, SubscriptionType } from '@/lib/types';
import { CATEGORIES, GENDERS } from '@/lib/types';
import { cn } from '@/lib/utils';
import AddPlayerForm from '@/components/add-player-form';
import { TennisBallIcon, WhatsAppIcon } from '@/components/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const CLASS_CAPACITY = 8;
const availableTimes = Array.from({ length: 15 }, (_, i) => `${i + 9}:00`);

type ConfirmedClass = {
  date: string;
  time: string;
  category: string;
  gender: string;
  players: Player[];
};

type PlayerFormData = Omit<Player, 'id' | 'classesRemaining'> & { subscription: SubscriptionType };

export default function DashboardPage() {
    const [players, setPlayers] = React.useState<Player[]>([]);
  const [attendance, setAttendance] = React.useState<
    Record<string, Record<string, AttendanceRecord[]>>
  >({});
  
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = React.useState<string>('18:00');
  const [confirmedClass, setConfirmedClass] =
    React.useState<ConfirmedClass | null>(null);
  const [playerToView, setPlayerToView] = React.useState<Player | null>(null);
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null);

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
    }
  }, []);

  React.useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem('tennis-players', JSON.stringify(players));
    }
  }, [players]);

  React.useEffect(() => {
     if (Object.keys(attendance).length > 0) {
      localStorage.setItem('tennis-attendance', JSON.stringify(attendance));
    }
  }, [attendance]);


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

    // Update player's remaining classes
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

  const handleConfirmSchedule = (category: string, gender: string) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const timeKey = selectedTime;
    const categoryPlayers = players.filter((p) => p.category === category && p.gender === gender);
    const todaysAttendance = attendance[dateKey]?.[timeKey] ?? [];

    const confirmedPlayers = categoryPlayers.filter((player) =>
      todaysAttendance.some(
        (att) => att.playerId === player.id && att.status === 'present'
      )
    );

    setConfirmedClass({
      date: format(selectedDate, 'PPP', { locale: es }),
      time: timeKey,
      category: category,
      gender: gender,
      players: confirmedPlayers,
    });
  };
  
  const handleViewPlayer = (player: Player) => {
    setPlayerToView(player);
  };
  
  const handleOpenEditModal = (player: Player) => {
    setPlayerToView(null);
    setPlayerToEdit(player);
  };
  
  const exportToCSV = () => {
    const records: any[] = [];
    Object.keys(attendance).forEach(dateKey => {
      Object.keys(attendance[dateKey]).forEach(timeKey => {
        const timeSlotAttendance = attendance[dateKey][timeKey];
        timeSlotAttendance.forEach(record => {
          const player = players.find(p => p.id === record.playerId);
          if (player) {
            records.push({
              date: dateKey,
              player: player,
              record: record
            });
          }
        });
      });
    });

    // Sort records by category, then by date
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


  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const timeKey = selectedTime;
  const formattedDate = format(selectedDate, 'PPP', { locale: es });

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <TennisBallIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">
              Gestor de Clases de Tenis
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Jugador
                </Button>
              </DialogTrigger>
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
          </div>
        </header>

        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <Tabs defaultValue={GENDERS[0]}>
            <div className="flex items-center">
              <TabsList>
                {GENDERS.map((gender) => (
                  <TabsTrigger key={gender} value={gender}>
                    {gender}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, 'PPP', { locale: es })
                      ) : (
                        <span>Elige una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setConfirmedClass(null);
                        }
                      }}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <Select
                  value={selectedTime}
                  onValueChange={(value) => {
                    setSelectedTime(value);
                    setConfirmedClass(null);
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {GENDERS.map((gender) => (
              <TabsContent key={gender} value={gender} className="mt-4">
                <Tabs defaultValue={CATEGORIES[0]}>
                  <TabsList>
                    {CATEGORIES.map((category) => (
                      <TabsTrigger key={category} value={category}>
                        Categoría {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {CATEGORIES.map((category) => {
                    const categoryPlayers = players.filter(
                      (p) => p.category === category && p.gender === gender
                    );
                    const todaysAttendance = attendance[dateKey]?.[timeKey] ?? [];
                    const confirmedPlayers = categoryPlayers.filter((player) =>
                      todaysAttendance.some(
                        (att) => att.playerId === player.id && att.status === 'present'
                      )
                    );
                    const confirmedCount = confirmedPlayers.length;

                    return (
                      <TabsContent key={category} value={category}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                          <Card className="lg:col-span-4">
                            <CardHeader>
                              <CardTitle>Gestionar Asistencia</CardTitle>
                              <CardDescription>
                                Confirmar, rechazar o deshacer la asistencia de los jugadores.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {categoryPlayers.length > 0 ? (
                                <ul className="divide-y divide-border">
                                  {categoryPlayers.map((player) => {
                                    const playerAttendance = todaysAttendance.find(
                                      (att) => att.playerId === player.id
                                    );
                                    const status = playerAttendance?.status ?? null;
                                    const message = `Hola ${player.name}, te escribo para confirmar tu asistencia a la clase de tenis de hoy, ${formattedDate} a las ${selectedTime}. ¡Gracias!`;
                                    const whatsappLink = `https://wa.me/${player.telefono}?text=${encodeURIComponent(
                                      message
                                    )}`;

                                    return (
                                      <li
                                        key={player.id}
                                        className="flex items-center justify-between p-3"
                                      >
                                        <div className="flex items-center gap-2">
                                           <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleViewPlayer(player)}
                                              >
                                                <User className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Ver Perfil</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <div>
                                            <p className="font-medium">
                                              {player.name} {player.surname}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {player.telefono}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant={
                                                  status === 'present'
                                                    ? 'default'
                                                    : 'ghost'
                                                }
                                                size="icon"
                                                className={cn(
                                                  'h-8 w-8',
                                                  status === 'present' &&
                                                    'bg-green-600 hover:bg-green-700'
                                                )}
                                                onClick={() =>
                                                  handleAttendanceChange(
                                                    player.id,
                                                    'present'
                                                  )
                                                }
                                                disabled={
                                                  (status !== 'present' &&
                                                  confirmedCount >= CLASS_CAPACITY) || player.classesRemaining === 0
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
                                                variant={
                                                  status === 'absent'
                                                    ? 'destructive'
                                                    : 'ghost'
                                                }
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                  handleAttendanceChange(
                                                    player.id,
                                                    'absent'
                                                  )
                                                }
                                              >
                                                <XCircle className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Rechazar</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                  handleAttendanceChange(
                                                    player.id,
                                                    null
                                                  )
                                                }
                                              >
                                                <Undo2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Deshacer</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <a
                                                href={whatsappLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                >
                                                  <WhatsAppIcon className="h-5 w-5 text-green-500" />
                                                </Button>
                                              </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Enviar WhatsApp</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <AlertDialog>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Eliminar Jugador</p>
                                              </TooltipContent>
                                            </Tooltip>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  ¿Estás seguro?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Esta acción no se puede deshacer. Esto eliminará permanentemente al jugador{' '}
                                                  <span className="font-semibold">
                                                    {player.name} {player.surname}
                                                  </span>
                                                  .
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleDeletePlayer(player.id)
                                                  }
                                                >
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
                              ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                  <p>Aún no hay jugadores en esta categoría.</p>
                                  <p className="text-sm">
                                    Usa el botón "Añadir Jugador" para agregar a alguien.
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <div className="lg:col-span-3 space-y-4">
                            <Card>
                              <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base font-medium">
                                  Asistentes Confirmados
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {confirmedCount} / {CLASS_CAPACITY}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Capacidad de la clase
                                </p>
                                <Progress
                                  value={(confirmedCount / CLASS_CAPACITY) * 100}
                                  className="mt-2"
                                />
                                <Button
                                  className="mt-4 w-full"
                                  onClick={() => handleConfirmSchedule(category, gender)}
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
              </TabsContent>
            ))}
          </Tabs>
          {confirmedClass && confirmedClass.players.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  Clase Confirmada - {confirmedClass.date} a las{' '}
                  {confirmedClass.time}
                </CardTitle>
                <CardDescription>
                  {confirmedClass.gender} - Categoría {confirmedClass.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto aspect-[1/2] max-w-sm rounded-lg border-4 border-[#6b8e23] bg-[#a0d468] p-4">
                  <div className="absolute left-0 top-1/2 w-full h-1 -mt-0.5 bg-white/50"></div>
                  <div className="absolute left-1/2 top-0 h-full w-1 -ml-0.5 bg-white/50"></div>
                  <div className="absolute inset-x-4 top-1/4 h-px bg-white/50"></div>
                  <div className="absolute inset-x-4 bottom-1/4 h-px bg-white/50"></div>
                  <div className="relative h-full w-full grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-around">
                      {confirmedClass.players
                        .slice(0, Math.ceil(confirmedClass.players.length / 2))
                        .map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 shadow"
                          >
                            <TennisBallIcon className="h-4 w-4" />
                            <span>
                              {player.name} {player.surname}
                            </span>
                          </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-center justify-around">
                      {confirmedClass.players
                        .slice(Math.ceil(confirmedClass.players.length / 2))
                        .map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 shadow"
                          >
                            <TennisBallIcon className="h-4 w-4" />
                            <span>
                              {player.name} {player.surname}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      {playerToView && (
        <Dialog open={!!playerToView} onOpenChange={(open) => !open && setPlayerToView(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Perfil de Jugador</DialogTitle>
              <DialogDescription>{playerToView.name} {playerToView.surname}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p><strong>Género:</strong> {playerToView.gender}</p>
              <p><strong>Categoría:</strong> {playerToView.category}</p>
              <p><strong>Teléfono:</strong> {playerToView.telefono}</p>
              <p><strong>Suscripción:</strong> {playerToView.subscription === 'monthly' ? 'Mensual' : 'Ninguna'}</p>
              {playerToView.subscription === 'monthly' && (
                 <div>
                    <p className="mb-2"><strong>Clases Consumidas:</strong></p>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {8 - playerToView.classesRemaining} de 8 clases utilizadas
                      </p>
                      <Progress value={((8 - playerToView.classesRemaining) / 8) * 100} />
                    </div>
                 </div>
              )}
            </div>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => handleOpenEditModal(playerToView)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
            </AlertDialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {playerToEdit && (
        <Dialog open={!!playerToEdit} onOpenChange={(open) => !open && setPlayerToEdit(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Jugador</DialogTitle>
                    <DialogDescription>
                        Actualiza los detalles del jugador.
                    </DialogDescription>
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
