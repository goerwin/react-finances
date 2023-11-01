import supabaseClient from './supabaseClient';

export async function signup(attrs: { email: string; password: string }) {
  const { data, error } = await supabaseClient.auth.signUp(attrs);
  const { user, session } = data;

  if (error) throw error;
  if (!user || !session) throw new Error('no user or session');

  return { user, session };
}

export async function signInWithPassword(attrs: { email: string; password: string }) {
  const { data, error } = await supabaseClient.auth.signInWithPassword(attrs);
  const { user, session } = data;

  if (error) throw error;
  if (!user || !session) throw new Error('no user or session');

  return { user, session };
}


export async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  const { session } = data;

  if (error) throw error;
  if (!session) throw new Error('no session');
  return { session };
}

export async function getWallets() {
  const { data, error } = await supabaseClient.from('wallets').select();

  if (error) throw error;
  return data;
}

export async function getActions() {
  const { data, error } = await supabaseClient.from('actions').select();

  if (error) throw error;
  return data;
}
