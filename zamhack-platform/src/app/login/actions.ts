'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const platform = formData.get('platform') as string | null

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // On mobile (Capacitor), only allow student accounts
  if (platform === 'mobile') {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    if (profile?.role !== 'student') {
      await supabase.auth.signOut()
      return { error: 'This mobile app is for students only. Please use the web app to access your account.' }
    }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}