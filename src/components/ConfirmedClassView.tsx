'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConfirmedClass, Player } from '@/lib/types';
import { TennisBallIcon } from './icons';
import { COURT_CAPACITY } from '@/lib/types';

interface ConfirmedClassViewProps {
  confirmedClass: ConfirmedClass;
}

const Court = ({ players, courtNumber }: { players: Player[]; courtNumber: number }) => {
  if (players.length === 0) return null;

  const side1Players = players.slice(0, Math.ceil(players.length / 2));
  const side2Players = players.slice(Math.ceil(players.length / 2));

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="font-bold">Cancha {courtNumber}</h3>
      <div className="relative mx-auto aspect-[1/2] w-full max-w-sm rounded-lg border-4 border-[#6b8e23] bg-[#a0d468] p-4">
        {/* Líneas de la cancha */}
        <div className="absolute left-0 top-1/2 w-full h-1 -mt-0.5 bg-white/50"></div>
        <div className="absolute left-1/2 top-0 h-full w-1 -ml-0.5 bg-white/50"></div>
        <div className="absolute inset-x-4 top-1/4 h-px bg-white/50"></div>
        <div className="absolute inset-x-4 bottom-1/4 h-px bg-white/50"></div>

        <div className="relative h-full w-full flex flex-col justify-between">
          {/* Lado 1 (Arriba) */}
          <div className="h-1/2 flex items-center justify-around">
            {side1Players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 rounded-full bg-blue-100/80 backdrop-blur-sm px-2 py-1 text-xs font-medium text-blue-900 shadow"
              >
                <TennisBallIcon className="h-3 w-3" />
                <span>{player.name}</span>
              </div>
            ))}
          </div>

          {/* Lado 2 (Abajo) */}
          <div className="h-1/2 flex items-center justify-around">
            {side2Players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 rounded-full bg-red-100/80 backdrop-blur-sm px-2 py-1 text-xs font-medium text-red-900 shadow"
              >
                <TennisBallIcon className="h-3 w-3" />
                <span>{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmedClassView({ confirmedClass }: ConfirmedClassViewProps) {
  const court1Players = confirmedClass.players.slice(0, COURT_CAPACITY);
  const court2Players = confirmedClass.players.slice(COURT_CAPACITY, COURT_CAPACITY * 2);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          Clase Confirmada - {confirmedClass.date} a las {confirmedClass.time}
        </CardTitle>
        <CardDescription>
          {confirmedClass.gender} - Categoría {confirmedClass.category}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Court players={court1Players} courtNumber={1} />
          <Court players={court2Players} courtNumber={2} />
        </div>
      </CardContent>
    </Card>
  );
}
