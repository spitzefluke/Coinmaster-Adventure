-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
-- Coinmaster Adventure · Event-Läden: Zeiträume · Supabase
--
-- Voraussetzung: checkliste/supabase.sql ist schon ausgeführt (die Admins und ihre Codes kommen von dort).
--
-- So geht's: In Supabase → SQL Editor → New query → diese ganze Datei einfügen → Run.
-- Mehrfach ausführen ist ungefährlich; gesetzte Zeiträume bleiben.
--
-- Jeder sieht die Zeiträume (eventlaeden_laden). Ändern geht nur mit einem Admin-Code aus der Checkliste
-- (eventlaeden_setzen prüft ihn mit checkliste_admin, inklusive Sperre nach zu vielen falschen Codes).
-- Steht für ein Event nichts in der Tabelle, rechnet die Seite den Zeitraum automatisch aus.
--   modus 'auto': automatisch (z. B. Ostern beweglich) · 'fest': jedes Jahr von start bis ende (MM-TT)
--   modus 'aus': das Event kommt nicht
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.eventlaeden_zeitraeume (
  id text primary key check (id ~ '^[a-z0-9_-]{1,40}$'),
  modus text not null default 'auto' check (modus in ('auto', 'fest', 'aus')),
  start text not null default '' check (start ~ '^([0-9]{2}-[0-9]{2})?$'),
  ende text not null default '' check (ende ~ '^([0-9]{2}-[0-9]{2})?$'),
  geaendert timestamptz,
  von text
);
alter table public.eventlaeden_zeitraeume enable row level security;
revoke all on public.eventlaeden_zeitraeume from anon, authenticated;

-- ── Alle Zeiträume lesen (für jeden) ──
create or replace function public.eventlaeden_laden()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'modus', modus, 'start', start, 'ende', ende,
    'geaendert', geaendert, 'von', von) order by id), '[]'::jsonb)
  from eventlaeden_zeitraeume
$$;

-- ── Code prüfen: gibt den Namen zurück, damit die Seite die Bearbeitung freischaltet ──
create or replace function public.eventlaeden_pruefen(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  return jsonb_build_object('ich', n);
end $$;

-- ── Zeitraum eines Events setzen ──
create or replace function public.eventlaeden_setzen(p_code text, p_id text, p_modus text, p_start text, p_ende text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  if coalesce(p_id, '') !~ '^[a-z0-9_-]{1,40}$' then return jsonb_build_object('fehler', 'Unbekanntes Event.'); end if;
  if coalesce(p_modus, '') not in ('auto', 'fest', 'aus') then return jsonb_build_object('fehler', 'Unbekannte Einstellung.'); end if;
  if p_modus = 'fest' and (coalesce(p_start, '') !~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
                        or coalesce(p_ende, '') !~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$') then
    return jsonb_build_object('fehler', 'Bitte Start und Ende als TT.MM. angeben.');
  end if;
  insert into eventlaeden_zeitraeume (id, modus, start, ende, geaendert, von)
  values (p_id, p_modus, case when p_modus = 'fest' then p_start else '' end, case when p_modus = 'fest' then p_ende else '' end, now(), n)
  on conflict (id) do update set modus = excluded.modus, start = excluded.start, ende = excluded.ende, geaendert = now(), von = n;
  return jsonb_build_object('ok', true, 'zeitraeume', eventlaeden_laden());
end $$;

grant execute on function public.eventlaeden_laden() to anon, authenticated;
grant execute on function public.eventlaeden_pruefen(text) to anon, authenticated;
grant execute on function public.eventlaeden_setzen(text, text, text, text, text) to anon, authenticated;
