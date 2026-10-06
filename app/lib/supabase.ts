import 'server-only' // Evita que este archivo (y la key secreta) termine en el navegador
import { createClient } from '@supabase/supabase-js'

// Se leen desde .env.local (local) o desde las variables de entorno del hosting
const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_SECRET_KEY')
}

// La key secreta solo se usa en el servidor (server actions de app/action.ts)
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})
