import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tfnzmybzwuiprieyiaoz.supabase.co"

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbnpteWJ6d3VpcHJpZXlpYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTg4MzUsImV4cCI6MjA5NzIzNDgzNX0.JcYO6ZzI4vhDnSgw44RjfgVtXZGv6OVmv7Rc1NaMz1k"; // Deja tu clave completa aquí dentro de las comillas

// Exportamos el cliente directo y blindado, libre de bloqueos
export const supabase = createClient(supabaseUrl, supabaseAnonKey)