import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhopbbgknpfasfqunefv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhob3BiYmdrbnBmYXNmcXVuZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI4MzEsImV4cCI6MjA5Mzg2ODgzMX0._Frjv3Rd8bvAk5kdikqFVgJWynhpllp_-SS8QAhLj3I';

export const supabase = createClient(supabaseUrl, supabaseKey);
