// Supabase-Verbindung der Checkliste. Beides steht in Supabase unter Project Settings → API (bzw. „API Keys“):
//   SUPABASE_URL  „Project URL“, z. B. https://abcdefghijklmnop.supabase.co
//   SUPABASE_KEY  der „Publishable key“ (sb_publishable_…) oder der alte „anon public“-Key (eyJ…)
// Beide sind dafür gemacht, öffentlich im Browser zu stehen. Ohne Code kommt man damit an keine Daten
// (siehe checkliste/supabase.sql). Den „secret“- bzw. „service_role“-Key NIE hier eintragen.
export const SUPABASE_URL = 'https://kxlntqjevvdiiefzkoiu.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_NaYW1ymFR8LhPH2pJSo83g_-spwRoci';
