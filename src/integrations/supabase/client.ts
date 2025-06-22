
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://bvgulvngvskpfegxgxln.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Z3Vsdm5ndnNrcGZlZ3hneGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDA4OTIsImV4cCI6MjA2NTU3Njg5Mn0.9kfKj_Ko_h_VKM4mtTQ9iG94lQtSQmKyAckPPFHa3B0'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
