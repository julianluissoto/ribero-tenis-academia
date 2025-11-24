
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConfirmedClass } from '@/lib/types';
import { TennisBallIcon } from './icons';

interface ConfirmedClassViewProps {
  confirmedClass: ConfirmedClass;
}

export default function ConfirmedClassView({ confirmedClass }: ConfirmedClassViewProps) {
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
        <div className="relative mx-auto aspect-[1/2] max-w-sm rounded-lg border-4 border-[#6b8e23] bg-[#a0d468] p-4">
          <div className="absolute left-0 top-1/2 -mt-0.5 h-1 w-full bg-white/50"></div>
          <div className="absolute left-1/2 top-0 -ml-0.5 h-full w-1 bg-white/50"></div>
          <div className="absolute inset-x-4 top-1/4 h-px bg-white/50"></div>
          <div className="absolute inset-x-4 bottom-1/4 h-px bg-white/50"></div>
          <div className="relative grid h-full w-full grid-cols-2 gap-4">
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
  );
}
