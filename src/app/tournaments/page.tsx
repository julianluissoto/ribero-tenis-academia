'use client';

import * as React from 'react';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Hourglass, Trophy, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

import { CATEGORIES } from '@/lib/types';
import type { Player, Category, Tournament, Match, SetScore, Playoff, Group } from '@/lib/types';

interface Standings {
  [playerId: string]: {
    played: number;
    won: number;
    lost: number;
    points: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
  };
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<Category>('4to');
  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = React.useState<string[]>([]);
  const [tournamentName, setTournamentName] = React.useState('');

  React.useEffect(() => {
    try {
      const storedPlayers = localStorage.getItem('tennis-players');
      if (storedPlayers) {
        setAllPlayers(JSON.parse(storedPlayers));
      }
    } catch (error) {
      console.error("Error loading players from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTournaments = localStorage.getItem('tennis-tournaments');
        if (storedTournaments) {
          setTournaments(JSON.parse(storedTournaments));
        }
      } catch (error) {
        console.error("Error loading tournaments from localStorage", error);
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && tournaments.length > 0) {
      localStorage.setItem('tennis-tournaments', JSON.stringify(tournaments));
    }
  }, [tournaments]);


  React.useEffect(() => {
    const playersInCategory = allPlayers.filter(
      (p) => p.category === selectedCategory
    );
    setAvailablePlayers(playersInCategory);
    setSelectedPlayers([]);
  }, [selectedCategory, allPlayers]);

  const generateRoundRobinMatches = (players: Player[]): Match[] => {
    const matches: Match[] = [];
    if (players.length < 2) return matches;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: nanoid(),
          player1: players[i],
          player2: players[j],
          sets: [
            { score1: null, score2: null },
            { score1: null, score2: null },
            { score1: null, score2: null },
          ],
          winner: null,
        });
      }
    }
    return matches;
  };

  const createGroups = (players: Player[]): Group[] => {
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    const groupA_players: Player[] = [];
    const groupB_players: Player[] = [];

    shuffledPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        groupA_players.push(player);
      } else {
        groupB_players.push(player);
      }
    });

    const groupA: Group = {
      id: nanoid(),
      name: 'Grupo A',
      players: groupA_players,
      matches: generateRoundRobinMatches(groupA_players),
    };

    const groupB: Group = {
      id: nanoid(),
      name: 'Grupo B',
      players: groupB_players,
      matches: generateRoundRobinMatches(groupB_players),
    };

    return [groupA, groupB];
  }

  const handleCreateTournament = () => {
    if (tournamentName && selectedPlayers.length >= 4) {
      const playersForTournament = availablePlayers.filter((p) =>
        selectedPlayers.includes(p.id)
      );

      const groups = createGroups(playersForTournament);

      const newTournament: Tournament = {
        id: nanoid(),
        name: tournamentName,
        category: selectedCategory,
        players: playersForTournament,
        groups: groups,
      };
      setTournaments((prev) => [...prev, newTournament]);
      setTournamentName('');
      setSelectedPlayers([]);
    } else {
      alert("Se necesitan al menos 4 jugadores para crear un torneo con fase de grupos.");
    }
  };

  const handleScoreChange = (
    tournamentId: string,
    matchId: string,
    setIndex: number,
    player: 'score1' | 'score2',
    score: string
  ) => {
    const scoreValue = score === '' ? null : parseInt(score, 10);

    // Prevent negative numbers
    if (scoreValue !== null && scoreValue < 0) {
      return;
    }

    setTournaments(prevTournaments =>
      prevTournaments.map(t => {
        if (t.id !== tournamentId) {
          return t;
        }

        const updateMatchSets = (m: Match) => {
          if (m.id !== matchId) {
            return m;
          }
          const newSets = m.sets.map((s, idx) =>
            idx === setIndex ? { ...s, [player]: scoreValue } : s
          ) as [SetScore, SetScore, SetScore];
          return { ...m, sets: newSets };
        };

        const newGroups = t.groups.map(g => ({
          ...g,
          matches: g.matches.map(updateMatchSets),
        }));

        let newPlayoff = t.playoff;
        if (t.playoff) {
          const newSemifinals = t.playoff.semifinals.map(updateMatchSets) as [Match, Match];
          const newFinal = t.playoff.final ? updateMatchSets(t.playoff.final) : null;
          newPlayoff = { semifinals: newSemifinals, final: newFinal };
        }

        return { ...t, groups: newGroups, playoff: newPlayoff };
      })
    );
  };


  const handleWinnerChange = (tournamentId: string, matchId: string, winner: 'player1' | 'player2' | null) => {
    setTournaments(prev =>
      prev.map(t => {
        if (t.id !== tournamentId) return t;

        const updateWinner = (m: Match) => m.id === matchId ? { ...m, winner } : m;

        const newGroups = t.groups.map(g => ({
          ...g,
          matches: g.matches.map(updateWinner),
        }));

        let newPlayoff = t.playoff;
        if (newPlayoff) {
          const newSemifinals = newPlayoff.semifinals.map(updateWinner) as [Match, Match];

          let newFinal = newPlayoff.final;
          if (newFinal && newFinal.id === matchId) {
            newFinal = { ...newFinal, winner };
          }

          newPlayoff = { ...newPlayoff, semifinals: newSemifinals, final: newFinal };
        }

        return { ...t, groups: newGroups, playoff: newPlayoff };
      })
    );
  }

  const handleDeleteTournament = (tournamentId: string) => {
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
  };

  const getMatchWinner = (match: Match): 'player1' | 'player2' | null => {
    if (match.winner) return match.winner;

    let p1SetsWon = 0;
    let p2SetsWon = 0;
    for (const set of match.sets) {
      if (set.score1 !== null && set.score2 !== null) {
        if (set.score1 > set.score2) p1SetsWon++;
        else if (set.score2 > set.score1) p2SetsWon++;
      }
    }
    if (p1SetsWon >= 2) return 'player1';
    if (p2SetsWon >= 2) return 'player2';
    return null;
  }

  const calculateStandings = (group: Group): Standings => {
    const standings: Standings = {};

    group.players.forEach(p => {
      standings[p.id] = { played: 0, won: 0, lost: 0, points: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
    });

    group.matches.forEach(match => {
      const winner = getMatchWinner(match);
      const { player1, player2, sets } = match;

      let p1GamesWonTotal = 0;
      let p2GamesWonTotal = 0;
      let p1SetsWonTotal = 0;
      let p2SetsWonTotal = 0;

      sets.forEach(set => {
        if (set.score1 === null || set.score2 === null) {
          return;
        }
        const score1 = set.score1;
        const score2 = set.score2;
        p1GamesWonTotal += score1;
        p2GamesWonTotal += score2;

        if (score1 > score2) p1SetsWonTotal++;
        else if (score2 > score1) p2SetsWonTotal++;
      });

      if (standings[player1.id] && standings[player2.id]) {
        standings[player1.id].gamesWon += p1GamesWonTotal;
        standings[player1.id].gamesLost += p2GamesWonTotal;
        standings[player1.id].setsWon += p1SetsWonTotal;
        standings[player1.id].setsLost += p2SetsWonTotal;
        standings[player2.id].gamesWon += p2GamesWonTotal;
        standings[player2.id].gamesLost += p1GamesWonTotal;
        standings[player2.id].setsWon += p2SetsWonTotal;
        standings[player2.id].setsLost += p1SetsWonTotal;
      }

      if (winner && standings[player1.id] && standings[player2.id]) {
        const loser = winner === 'player1' ? 'player2' : 'player1';
        const winnerId = match[winner].id;
        const loserId = match[loser].id;

        standings[winnerId].played++;
        standings[winnerId].won++;
        standings[winnerId].points += 1;
        standings[loserId].played++;
        standings[loserId].lost++;
      }
    });

    return standings;
  };

  const getSortedStandings = (group: Group) => {
    const standings = calculateStandings(group);
    return Object.entries(standings)
      .map(([playerId, stats]) => ({
        player: group.players.find(p => p.id === playerId),
        ...stats,
      }))
      .filter(item => item.player)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aSetDiff = a.setsWon - a.setsLost;
        const bSetDiff = b.setsWon - b.setsLost;
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
        const aGameDiff = a.gamesWon - a.gamesLost;
        const bGameDiff = b.gamesWon - a.gamesLost;
        if (bGameDiff !== aGameDiff) return bGameDiff - aGameDiff;
        return b.gamesWon - a.gamesWon;
      });
  };

  const handleGeneratePlayoffs = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const groupA = tournament.groups.find(g => g.name === 'Grupo A');
    const groupB = tournament.groups.find(g => g.name === 'Grupo B');

    if (!groupA || !groupB) return;

    const sortedA = getSortedStandings(groupA);
    const sortedB = getSortedStandings(groupB);

    if (sortedA.length < 2 || sortedB.length < 2) {
      alert("Se necesitan al menos 2 jugadores en cada grupo que hayan completado sus partidos para generar playoffs.");
      return;
    }

    const semi1: Match = {
      id: nanoid(),
      player1: sortedA[0].player as Player,
      player2: sortedB[1].player as Player,
      sets: [{ score1: null, score2: null }, { score1: null, score2: null }, { score1: null, score2: null }],
      winner: null
    };
    const semi2: Match = {
      id: nanoid(),
      player1: sortedB[0].player as Player,
      player2: sortedA[1].player as Player,
      sets: [{ score1: null, score2: null }, { score1: null, score2: null }, { score1: null, score2: null }],
      winner: null
    };

    setTournaments(prev => prev.map(t =>
      t.id === tournamentId ? {
        ...t,
        playoff: {
          semifinals: [semi1, semi2],
          final: null
        }
      } : t
    ));
  };

  const handleAdvanceToFinal = (tournamentId: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id !== tournamentId || !t.playoff) return t;

      const semi1Winner = getMatchWinner(t.playoff.semifinals[0]);
      const semi2Winner = getMatchWinner(t.playoff.semifinals[1]);

      if (semi1Winner && semi2Winner) {
        const final: Match = {
          id: nanoid(),
          player1: t.playoff.semifinals[0][semi1Winner],
          player2: t.playoff.semifinals[1][semi2Winner],
          sets: [{ score1: null, score2: null }, { score1: null, score2: null }, { score1: null, score2: null }],
          winner: null,
        };
        return { ...t, playoff: { ...t.playoff, final } };
      }
      return t;
    }));
  };

  const allMatchesCompleted = (matches: Match[]) => {
    return matches.every(m => getMatchWinner(m) !== null);
  };

  const MatchRow = ({ match, tournamentId }: { match: Match; tournamentId: string }) => {
    const winner = getMatchWinner(match);
    return (
      <TableRow>
        <TableCell>{match.player1.name} {match.player1.surname}</TableCell>
        <TableCell>{match.player2.name} {match.player2.surname}</TableCell>
        <TableCell>
          <div className="flex flex-col items-center justify-center gap-1">
            {match.sets.map((set, setIndex) => (
              <div key={`${match.id}-${setIndex}`} className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-12 h-8 text-center"
                  value={set.score1 ?? ''}
                  onChange={(e) => handleScoreChange(tournamentId, match.id, setIndex, 'score1', e.target.value)}
                />
                <span>-</span>
                <Input
                  type="number"
                  className="w-12 h-8 text-center"
                  value={set.score2 ?? ''}
                  onChange={(e) => handleScoreChange(tournamentId, match.id, setIndex, 'score2', e.target.value)}
                />
              </div>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <RadioGroup
            value={match.winner ?? undefined}
            onValueChange={(val) => handleWinnerChange(tournamentId, match.id, val as 'player1' | 'player2')}
            className="flex justify-center gap-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="player1" id={`${match.id}-${match.player1.id}-p1`} />
              <Label htmlFor={`${match.id}-${match.player1.id}-p1`} className="text-xs">J1</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="player2" id={`${match.id}-${match.player2.id}-p2`} />
              <Label htmlFor={`${match.id}-${match.player2.id}-p2`} className="text-xs">J2</Label>
            </div>
          </RadioGroup>
        </TableCell>
        <TableCell className="text-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {winner ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <Hourglass className="h-5 w-5 text-yellow-500 mx-auto" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{winner ? 'Completado' : 'Pendiente'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      </TableRow>
    )
  }

  const GroupTable = ({ group, tournamentId }: { group: Group, tournamentId: string }) => {
    const sortedStandings = getSortedStandings(group);
    return (
      <div className="space-y-6">
        <h4 className="font-semibold mb-2">{group.name}</h4>
        <div>
          <h5 className="font-semibold mb-2 text-sm">Tabla de Posiciones</h5>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>PJ</TableHead>
                <TableHead>PG</TableHead>
                <TableHead>PP</TableHead>
                <TableHead>SG</TableHead>
                <TableHead>SP</TableHead>
                <TableHead>GF</TableHead>
                <TableHead>GC</TableHead>
                <TableHead>Puntos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStandings.map(item => (
                item.player && (
                  <TableRow key={item.player.id}>
                    <TableCell>{item.player.name} {item.player.surname}</TableCell>
                    <TableCell>{item.played}</TableCell>
                    <TableCell>{item.won}</TableCell>
                    <TableCell>{item.lost}</TableCell>
                    <TableCell>{item.setsWon}</TableCell>
                    <TableCell>{item.setsLost}</TableCell>
                    <TableCell>{item.gamesWon}</TableCell>
                    <TableCell>{item.gamesLost}</TableCell>
                    <TableCell>{item.points}</TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h5 className="font-semibold mb-2 text-sm">Partidos</h5>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador 1</TableHead>
                <TableHead>Jugador 2</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
                <TableHead className="text-center">Ganador</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.matches.map((match) => (
                <MatchRow key={match.id} match={match} tournamentId={tournamentId} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0">
      <TooltipProvider>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Torneo</CardTitle>
                <CardDescription>
                  Configura un nuevo torneo con fase de grupos y playoffs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament-name">Nombre del Torneo</Label>
                  <Input
                    id="tournament-name"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Ej: Torneo de Verano"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v as Category)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          Categoría {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Seleccionar Jugadores (mínimo 4)</Label>
                  <Card className="h-64 overflow-y-auto">
                    <CardContent className="p-4 space-y-2">
                      {availablePlayers.length > 0 ? (
                        availablePlayers.map((player) => (
                          <div key={player.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`player-${player.id}`}
                              checked={selectedPlayers.includes(player.id)}
                              onCheckedChange={(checked) => {
                                setSelectedPlayers((prev) =>
                                  checked
                                    ? [...prev, player.id]
                                    : prev.filter((id) => id !== player.id)
                                );
                              }}
                            />
                            <Label htmlFor={`player-${player.id}`}>
                              {player.name} {player.surname}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay jugadores en esta categoría.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <Button onClick={handleCreateTournament} className="w-full">
                  Crear Torneo
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {tournaments.map((tournament) => {
              const isGroupPhaseFinished = tournament.groups.every(g => allMatchesCompleted(g.matches));
              const areSemifinalsFinished = tournament.playoff ? allMatchesCompleted(tournament.playoff.semifinals) : false;

              return (
                <Card key={tournament.id}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{tournament.name}</CardTitle>
                      <CardDescription>Categoría {tournament.category}</CardDescription>
                    </div>
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent><p>Eliminar Torneo</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el torneo{' '}
                            <span className="font-semibold">{tournament.name}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTournament(tournament.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-center">Fase de Grupos</h3>
                      <div className="grid grid-cols-1 gap-8">
                        {tournament.groups.map(group => (
                          <GroupTable key={group.id} group={group} tournamentId={tournament.id} />
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex-col items-start gap-4">
                    {isGroupPhaseFinished && !tournament.playoff && (
                      <Button onClick={() => handleGeneratePlayoffs(tournament.id)} className="w-full">
                        Generar Playoffs
                      </Button>
                    )}
                    {tournament.playoff && (
                      <div className="w-full space-y-6">
                        <Separator />
                        <h3 className="text-xl font-bold text-center">Playoffs</h3>

                        <div>
                          <h4 className="font-semibold mb-2 text-center">Semifinales</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Jugador 1</TableHead>
                                <TableHead>Jugador 2</TableHead>
                                <TableHead className="text-center">Resultado</TableHead>
                                <TableHead className="text-center">Ganador</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tournament.playoff.semifinals.map(match => (
                                <MatchRow key={match.id} match={match} tournamentId={tournament.id} />
                              ))}
                            </TableBody>
                          </Table>
                          {areSemifinalsFinished && !tournament.playoff.final && (
                            <Button onClick={() => handleAdvanceToFinal(tournament.id)} className="w-full mt-4">
                              Generar Final
                            </Button>
                          )}
                        </div>

                        {tournament.playoff.final && (
                          <div>
                            <h4 className="font-semibold mb-2 text-center">Final</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Jugador 1</TableHead>
                                  <TableHead>Jugador 2</TableHead>
                                  <TableHead className="text-center">Resultado</TableHead>
                                  <TableHead className="text-center">Ganador</TableHead>
                                  <TableHead className="text-center">Estado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <MatchRow key={tournament.playoff.final.id} match={tournament.playoff.final} tournamentId={tournament.id} />
                              </TableBody>
                            </Table>
                            {getMatchWinner(tournament.playoff.final) && (
                              <div className="mt-4 text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                <p className="font-bold text-lg">Campeón del Torneo</p>
                                <p className="text-xl">{tournament.playoff.final[getMatchWinner(tournament.playoff.final)!].name} {tournament.playoff.final[getMatchWinner(tournament.playoff.final)!].surname}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    </main>
  );
}
