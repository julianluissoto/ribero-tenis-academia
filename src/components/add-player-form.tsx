'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_CATEGORIES, FEMENINO_CATEGORIES, MASCULINO_CATEGORIES, SUBSCRIPTION_TYPES, type Player, type PlayerFormData, GENDERS, SUBSCRIPTION_DETAILS, Category } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  surname: z.string().min(2, {
    message: 'El apellido debe tener al menos 2 caracteres.',
  }),
  telefono: z
    .string()
    .min(9, {
      message: 'El número de teléfono debe tener al menos 9 caracteres.',
    })
    .regex(/^\+?[0-9\s]+$/, {
      message: 'Por favor, introduce un número de teléfono válido.',
    }),
  gender: z.enum(GENDERS, {
    required_error: 'Debes seleccionar un género.',
  }),
  category: z.enum(ALL_CATEGORIES, {
    required_error: 'Debes seleccionar una categoría.',
  }),
  subscription: z.enum(SUBSCRIPTION_TYPES, {
    required_error: 'Debes seleccionar un tipo de suscripción.',
  }),
});

interface AddPlayerFormProps {
  onSubmit: (data: PlayerFormData, playerId?: string) => void;
  player?: Player | null;
}

export default function AddPlayerForm({ onSubmit, player }: AddPlayerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: player?.name || '',
      surname: player?.surname || '',
      telefono: player?.telefono || '',
      gender: player?.gender || 'Masculino',
      category: player?.category,
      subscription: player?.subscription || 'per_class',
    },
  });

  const selectedGender = form.watch('gender');
  const availableCategories: Category[] =
    selectedGender === "Femenino"
      ? [...FEMENINO_CATEGORIES]
      : [...MASCULINO_CATEGORIES];


  React.useEffect(() => {
    if (player) {
      form.reset({
        name: player.name,
        surname: player.surname,
        telefono: player.telefono,
        gender: player.gender,
        category: player.category,
        subscription: player.subscription,
      });
    }
  }, [player, form]);

  React.useEffect(() => {
    const currentCategory = form.getValues("category") as Category | undefined;

    if (currentCategory && !availableCategories.includes(currentCategory)) {
      form.setValue("category", "" as any, { shouldValidate: true });
    }
  }, [selectedGender, form, availableCategories]);




  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values, player?.id);
    if (!player) {
      form.reset();
    }
  }

  const isEditing = !!player;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono de Contacto</FormLabel>
              <FormControl>
                <Input placeholder="+54911..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Género</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un género" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      Categoría {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subscription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suscripción</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de suscripción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUBSCRIPTION_TYPES.map((subType) => (
                    <SelectItem key={subType} value={subType}>
                      {SUBSCRIPTION_DETAILS[subType].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Añadir Jugador'}</Button>
        </div>
      </form>
    </Form>
  );
}
