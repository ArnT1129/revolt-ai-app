
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvgulvngvskpfegxgxln.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Z3Vsdm5ndnNrcGZlZ3hneGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NzU1NDMsImV4cCI6MjA1MDQ1MTU0M30.Jw1nZ8-zZhaBdIXZmLUNOdNTB-f3iHBNv_jUkQr7Gec';

export const supabase = createClient(supabaseUrl, supabaseKey);
