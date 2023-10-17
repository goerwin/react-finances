import React, { useEffect } from 'react';
import Popup from './Popup';
import ItemForm from './ItemForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import supabaseClient from '../supabase/supabaseClient';
import { getSession, getUserWallets, signup } from '../supabase/api';

const emailSignupSchema = z
  .object({
    newEmail: z.string().email('Email inválido'),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type TemailSignupSchema = z.infer<typeof emailSignupSchema>;

export interface Props {}

export default function PopupSignup(props: Props) {
  const { register, handleSubmit, trigger } = useForm<TemailSignupSchema>({
    resolver: zodResolver(emailSignupSchema),
  });

  useEffect(() => {
    (async () => {
      console.log('bb', await getSession());
      console.log('bb', await getUserWallets());
    })();
  }, []);

  const handleFormSubmit = async (data: TemailSignupSchema) => {
    const resp = await signup({
      email: data.newEmail,
      password: data.newPassword,
    });
  };

  return (
    <Popup
      autoHeight
      title="Crear cuenta"
      bottomArea={
        <>
          <button onClick={() => {}}>Cerrar</button>
          <button className="btn-success ml-4" onClick={() => {}}>
            Registrarse
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div>
          <input type="email" placeholder="email" {...register('newEmail')} />
        </div>
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            autoComplete="new-password"
            {...register('newPassword')}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirmar contraseña"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </div>
        <button>lul</button>
      </form>
    </Popup>
  );
}
