'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { GENDERS } from '@/lib/types';


interface ClassFiltersProps {
    selectedDate: Date;
    onDateChange: (date: Date | undefined) => void;
    selectedTime: string;
    onTimeChange: (time: string) => void;
    availableTimes: string[];
    onConfirmClass: () => void;
}

export default function ClassFilters({
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
    availableTimes,
    onConfirmClass
}: ClassFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TabsList className="w-full sm:w-auto">
                {GENDERS.map((gender) => (
                    <TabsTrigger key={gender} value={gender}>
                        {gender}
                    </TabsTrigger>
                ))}
            </TabsList>
            <div className="ml-auto flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                                'w-full justify-start text-left font-normal sm:w-[240px]',
                                !selectedDate && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={onDateChange}
                            initialFocus
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
                <Select value={selectedTime} onValueChange={onTimeChange}>
                    <SelectTrigger className="w-full sm:w-[120px]">
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
                <Button onClick={onConfirmClass} className="w-full sm:w-auto">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Confirmar Clase
                </Button>
            </div>
        </div>
    );
}
