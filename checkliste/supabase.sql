-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
-- Coinmaster Adventure · Checkliste für Admins · Supabase
--
-- So geht's:
--   1. In Supabase: SQL Editor → New query → diese ganze Datei einfügen → Run. Hier steht kein Code drin.
--   2. Project Settings → API: „Project URL“ und den „Publishable key“ (oder „anon public“) in
--      checkliste/js/config.js eintragen.
--   3. Jeder Admin öffnet die Checkliste und legt beim ersten Mal unter „Zum ersten Mal hier?“ seinen eigenen
--      Code fest (mindestens 8 Zeichen). Das geht je Name nur einmal; danach meldet man sich damit an und kann
--      ihn unter „Konto“ ändern. Am besten legen beide ihren Code gleich nach dem Einrichten fest.
--
-- Code vergessen (oder hat jemand Fremdes einen Namen belegt)? Im SQL Editor zurücksetzen, dann legt der Admin
-- auf der Seite einen neuen fest:
--   update public.checkliste_admins set code_hash = null where name = 'Axseleins';
--
-- Mehrfach ausführen ist ungefährlich: Tabellen, Admins und Startpunkte werden nur angelegt, wenn sie fehlen;
-- schon festgelegte Codes und gesetzte Häkchen bleiben.
--
-- Sicherheit: Die Tabellen haben Row Level Security ohne Regeln, mit dem öffentlichen Schlüssel kann niemand
-- direkt lesen oder schreiben. Alles geht über die Funktionen unten, und jede prüft zuerst den Code (gespeichert
-- nur als bcrypt-Hash). Nach 30 falschen Codes in 15 Minuten nehmen sie für 15 Minuten gar keinen Code mehr an.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── Tabellen ──
create table if not exists public.checkliste_admins (
  name text primary key,
  code_hash text, -- leer: Code noch nicht festgelegt
  reihenfolge int not null default 0
);
alter table public.checkliste_admins alter column code_hash drop not null;
create table if not exists public.checkliste_gruppen (
  id text primary key,
  titel text not null,
  reihenfolge int not null default 0
);
create table if not exists public.checkliste_punkte (
  id text primary key,
  gruppe text not null references public.checkliste_gruppen (id) on delete cascade,
  titel text not null check (length(titel) between 1 and 120),
  status text not null default 'offen' check (status in ('offen', 'arbeit', 'fertig')),
  wer text not null default '',
  notiz text not null default '' check (length(notiz) <= 2000),
  reihenfolge int not null default 0,
  geaendert timestamptz,
  von text
);
create table if not exists public.checkliste_fehlversuche (
  zeit timestamptz not null default now()
);

alter table public.checkliste_admins enable row level security;
alter table public.checkliste_gruppen enable row level security;
alter table public.checkliste_punkte enable row level security;
alter table public.checkliste_fehlversuche enable row level security;
revoke all on public.checkliste_admins, public.checkliste_gruppen, public.checkliste_punkte, public.checkliste_fehlversuche from anon, authenticated;

-- ── Code prüfen (intern): gibt den Namen des Admins zurück oder null ──
-- Ohne Ausnahme (raise), damit der Fehlversuch gespeichert bleibt.
create or replace function public.checkliste_admin(p_code text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  n text;
begin
  if (select count(*) from checkliste_fehlversuche where zeit > now() - interval '15 minutes') >= 30 then
    return '!gesperrt';
  end if;
  select name into n from checkliste_admins where code_hash is not null and code_hash = crypt(coalesce(p_code, ''), code_hash);
  if n is null then
    insert into checkliste_fehlversuche default values;
    delete from checkliste_fehlversuche where zeit < now() - interval '1 day';
  end if;
  return n;
end $$;

create or replace function public.checkliste_fehler(n text)
returns jsonb language sql immutable as $$
  select jsonb_build_object('fehler', case when n = '!gesperrt' then 'Zu viele falsche Codes. Bitte 15 Minuten warten.' else 'Falscher Code.' end)
$$;

-- ── Alles laden ──
create or replace function public.checkliste_laden(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  return jsonb_build_object(
    'ich', n,
    'admins', (select coalesce(jsonb_agg(name order by reihenfolge, name), '[]') from checkliste_admins),
    'gruppen', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'titel', titel) order by reihenfolge), '[]') from checkliste_gruppen),
    'punkte', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'gruppe', gruppe, 'titel', titel, 'status', status, 'wer', wer,
                 'notiz', notiz, 'geaendert', geaendert, 'von', von) order by reihenfolge, id), '[]') from checkliste_punkte)
  );
end $$;

-- ── Ein Feld eines Punkts setzen: status (offen, arbeit, fertig), wer (Admin, 'Beide' oder ''), notiz, titel ──
create or replace function public.checkliste_setzen(p_code text, p_id text, p_feld text, p_wert text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
  r checkliste_punkte;
  w text := coalesce(p_wert, '');
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  if p_feld not in ('status', 'wer', 'notiz', 'titel') then return jsonb_build_object('fehler', 'Unbekanntes Feld.'); end if;
  if p_feld = 'status' and w not in ('offen', 'arbeit', 'fertig') then return jsonb_build_object('fehler', 'Unbekannter Status.'); end if;
  if p_feld = 'wer' and w not in ('', 'Beide') and not exists (select 1 from checkliste_admins where name = w) then
    return jsonb_build_object('fehler', 'Unbekannter Admin.');
  end if;
  if p_feld = 'titel' and length(trim(w)) = 0 then return jsonb_build_object('fehler', 'Der Name darf nicht leer sein.'); end if;
  update checkliste_punkte set
    status = case when p_feld = 'status' then w else status end,
    wer = case when p_feld = 'wer' then w else wer end,
    notiz = case when p_feld = 'notiz' then left(w, 2000) else notiz end,
    titel = case when p_feld = 'titel' then left(trim(w), 120) else titel end,
    geaendert = now(),
    von = n
  where id = p_id
  returning * into r;
  if not found then return jsonb_build_object('fehler', 'Den Punkt gibt es nicht mehr.'); end if;
  return jsonb_build_object('punkt', jsonb_build_object('id', r.id, 'gruppe', r.gruppe, 'titel', r.titel, 'status', r.status,
    'wer', r.wer, 'notiz', r.notiz, 'geaendert', r.geaendert, 'von', r.von));
end $$;

-- ── Neuer Punkt in einer Gruppe ──
create or replace function public.checkliste_neu(p_code text, p_gruppe text, p_titel text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
  r checkliste_punkte;
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  if not exists (select 1 from checkliste_gruppen where id = p_gruppe) then return jsonb_build_object('fehler', 'Unbekannte Gruppe.'); end if;
  if length(trim(coalesce(p_titel, ''))) = 0 then return jsonb_build_object('fehler', 'Der Name darf nicht leer sein.'); end if;
  insert into checkliste_punkte (id, gruppe, titel, reihenfolge, geaendert, von)
  values ('p-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10), p_gruppe, left(trim(p_titel), 120),
          (select coalesce(max(reihenfolge), 0) + 1 from checkliste_punkte), now(), n)
  returning * into r;
  return jsonb_build_object('punkt', jsonb_build_object('id', r.id, 'gruppe', r.gruppe, 'titel', r.titel, 'status', r.status,
    'wer', r.wer, 'notiz', r.notiz, 'geaendert', r.geaendert, 'von', r.von));
end $$;

-- ── Punkt entfernen ──
create or replace function public.checkliste_loeschen(p_code text, p_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  delete from checkliste_punkte where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- ── Welche Admins haben schon einen Code? (für „Zum ersten Mal hier?“, ohne Code aufrufbar) ──
create or replace function public.checkliste_status()
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'hat_code', code_hash is not null) order by reihenfolge, name), '[]')
  from checkliste_admins
$$;

-- ── Eigenen Code festlegen: nur einmal je Name, solange noch keiner festgelegt ist ──
-- Gibt bei Erfolg dasselbe zurück wie checkliste_laden (man ist danach angemeldet).
create or replace function public.checkliste_festlegen(p_name text, p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  c text := coalesce(p_code, '');
begin
  if (select count(*) from checkliste_fehlversuche where zeit > now() - interval '15 minutes') >= 30 then
    return checkliste_fehler('!gesperrt');
  end if;
  if not exists (select 1 from checkliste_admins where name = p_name) then
    return jsonb_build_object('fehler', 'Diesen Namen gibt es nicht.');
  end if;
  if exists (select 1 from checkliste_admins where name = p_name and code_hash is not null) then
    return jsonb_build_object('fehler', 'Für ' || p_name || ' ist schon ein Code festgelegt. Bitte anmelden.');
  end if;
  if length(c) < 8 then return jsonb_build_object('fehler', 'Der Code muss mindestens 8 Zeichen lang sein.'); end if;
  -- zwei gleiche Codes gehen nicht (am Code erkennt die Liste, wer man ist); zählt als Fehlversuch
  if exists (select 1 from checkliste_admins where code_hash is not null and code_hash = crypt(c, code_hash)) then
    insert into checkliste_fehlversuche default values;
    return jsonb_build_object('fehler', 'Bitte einen anderen Code wählen.');
  end if;
  update checkliste_admins set code_hash = crypt(c, gen_salt('bf')) where name = p_name and code_hash is null;
  if not found then -- jemand war im selben Moment schneller
    return jsonb_build_object('fehler', 'Für ' || p_name || ' ist schon ein Code festgelegt. Bitte anmelden.');
  end if;
  return checkliste_laden(c);
end $$;

-- ── Eigenen Code ändern (mit dem bisherigen Code) ──
create or replace function public.checkliste_code_aendern(p_code text, p_neu text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n text := checkliste_admin(p_code);
  c text := coalesce(p_neu, '');
begin
  if n is null or n = '!gesperrt' then return checkliste_fehler(n); end if;
  if length(c) < 8 then return jsonb_build_object('fehler', 'Der Code muss mindestens 8 Zeichen lang sein.'); end if;
  if exists (select 1 from checkliste_admins where name <> n and code_hash is not null and code_hash = crypt(c, code_hash)) then
    return jsonb_build_object('fehler', 'Bitte einen anderen Code wählen.');
  end if;
  update checkliste_admins set code_hash = crypt(c, gen_salt('bf')) where name = n;
  return jsonb_build_object('ok', true, 'ich', n);
end $$;

-- Rechte: nur diese Funktionen sind von außen aufrufbar
revoke execute on function public.checkliste_admin(text) from public, anon, authenticated;
revoke execute on function public.checkliste_fehler(text) from public, anon, authenticated;
revoke execute on function public.checkliste_laden(text) from public;
revoke execute on function public.checkliste_setzen(text, text, text, text) from public;
revoke execute on function public.checkliste_neu(text, text, text) from public;
revoke execute on function public.checkliste_loeschen(text, text) from public;
revoke execute on function public.checkliste_status() from public;
revoke execute on function public.checkliste_festlegen(text, text) from public;
revoke execute on function public.checkliste_code_aendern(text, text) from public;
grant execute on function public.checkliste_laden(text) to anon, authenticated;
grant execute on function public.checkliste_setzen(text, text, text, text) to anon, authenticated;
grant execute on function public.checkliste_neu(text, text, text) to anon, authenticated;
grant execute on function public.checkliste_loeschen(text, text) to anon, authenticated;
grant execute on function public.checkliste_status() to anon, authenticated;
grant execute on function public.checkliste_festlegen(text, text) to anon, authenticated;
grant execute on function public.checkliste_code_aendern(text, text) to anon, authenticated;

-- ── Startdaten (nur was fehlt) ──
insert into public.checkliste_gruppen (id, titel, reihenfolge) values
  ('webseite', 'Webseite', 1),
  ('welten-p1', 'Welten · Spawn und Planet 1', 2),
  ('welten-p2', 'Welten · Planet 2', 3),
  ('welten-p3', 'Welten · Planet 3', 4),
  ('welten-p4', 'Welten · Planet 4', 5),
  ('welten-juwel', 'Welten · Juwelnebel', 6),
  ('spiel', 'Roblox-Spiel', 7),
  ('studio', 'In Roblox Studio erledigen', 8)
on conflict (id) do nothing;

insert into public.checkliste_punkte (id, gruppe, titel, status, wer, notiz, reihenfolge) values
  ('seite-start', 'webseite', 'Startseite', 'offen', '', '', 1),
  ('seite-design', 'webseite', 'Navigation und Design', 'offen', '', '', 2),
  ('seite-muenzen', 'webseite', 'Münzkabinett', 'offen', '', '', 3),
  ('seite-muenzindex', 'webseite', 'Münzindex', 'offen', '', '', 4),
  ('seite-eier', 'webseite', 'Eierhalle', 'offen', '', '', 5),
  ('seite-rollen', 'webseite', 'Münzrollen', 'offen', '', '', 6),
  ('seite-garten', 'webseite', 'Münzbaumgarten', 'offen', '', '', 7),
  ('seite-haustiere', 'webseite', 'Haustiere', 'offen', '', '', 8),
  ('seite-taschen', 'webseite', 'Taschen', 'offen', '', '', 9),
  ('seite-edelsteine', 'webseite', 'Edelsteine', 'offen', '', '', 10),
  ('seite-auren', 'webseite', 'Auras', 'offen', '', '', 11),
  ('seite-welten', 'webseite', 'Welten (Weltkarte)', 'offen', '', '', 12),
  ('seite-wetter', 'webseite', 'Wetter', 'offen', '', '', 13),
  ('seite-spiel', 'webseite', 'Spiel-Oberfläche', 'offen', '', '', 14),
  ('seite-roblox', 'webseite', 'Roblox-Studio-Seite (Export)', 'offen', '', '', 15),
  ('welt-spawn', 'welten-p1', 'Spawn', 'offen', '', '', 16),
  ('welt-normal', 'welten-p1', 'Normal', 'offen', '', '', 17),
  ('welt-wald', 'welten-p1', 'Wald', 'offen', '', '', 18),
  ('welt-stadt', 'welten-p1', 'Stadt', 'offen', '', '', 19),
  ('welt-eis', 'welten-p1', 'Eis', 'offen', '', '', 20),
  ('welt-lava', 'welten-p1', 'Lava', 'offen', '', '', 21),
  ('welt-hoehle', 'welten-p1', 'Höhle', 'offen', '', '', 22),
  ('welt-candy', 'welten-p1', 'Candy', 'offen', '', '', 23),
  ('welt-mond', 'welten-p2', 'Mond', 'offen', '', '', 24),
  ('welt-neptun', 'welten-p2', 'Neptun', 'offen', '', '', 25),
  ('welt-mars', 'welten-p2', 'Mars', 'offen', '', '', 26),
  ('welt-saturn', 'welten-p2', 'Saturn', 'offen', '', '', 27),
  ('welt-alien', 'welten-p2', 'Alien', 'offen', '', '', 28),
  ('welt-sonne', 'welten-p2', 'Sonne', 'offen', '', '', 29),
  ('welt-korallenriff', 'welten-p3', 'Korallenriff', 'offen', '', '', 30),
  ('welt-muschelland', 'welten-p3', 'Muschelland', 'offen', '', '', 31),
  ('welt-atlantis', 'welten-p3', 'Atlantis', 'offen', '', '', 32),
  ('welt-tiefseegraben', 'welten-p3', 'Tiefseegraben', 'offen', '', '', 33),
  ('welt-wolkenburg', 'welten-p4', 'Wolkenburg', 'offen', '', '', 34),
  ('welt-engelsgarten', 'welten-p4', 'Engelsgarten', 'offen', '', '', 35),
  ('welt-goetterthron', 'welten-p4', 'Götterthron', 'offen', '', '', 36),
  ('welt-quarzfeld', 'welten-juwel', 'Quarzfeld', 'offen', '', '', 37),
  ('welt-amethystgrotte', 'welten-juwel', 'Amethystgrotte', 'offen', '', '', 38),
  ('welt-topasduenen', 'welten-juwel', 'Topasdünen', 'offen', '', '', 39),
  ('welt-smaragdwald', 'welten-juwel', 'Smaragdwald', 'offen', '', '', 40),
  ('welt-jadetempel', 'welten-juwel', 'Jadetempel', 'offen', '', '', 41),
  ('welt-saphirsee', 'welten-juwel', 'Saphirsee', 'offen', '', '', 42),
  ('welt-rubinvulkan', 'welten-juwel', 'Rubinvulkan', 'offen', '', '', 43),
  ('welt-opalwolken', 'welten-juwel', 'Opalwolken', 'offen', '', '', 44),
  ('welt-diamantkern', 'welten-juwel', 'Diamantkern', 'offen', '', '', 45),
  ('spiel-muenzen', 'spiel', 'Münzen suchen und Index', 'offen', '', '', 46),
  ('spiel-mutationen', 'spiel', 'Wetter und Mutationen', 'offen', '', '', 47),
  ('spiel-eier', 'spiel', 'Eier und Haustiere', 'offen', '', '', 48),
  ('spiel-taschen', 'spiel', 'Taschen', 'offen', '', '', 49),
  ('spiel-garten', 'spiel', 'Münzrollen und Garten', 'offen', '', '', 50),
  ('spiel-auren', 'spiel', 'Auras', 'offen', '', '', 51),
  ('spiel-edelsteine', 'spiel', 'Edelsteine und Supernova', 'offen', '', '', 52),
  ('spiel-welten', 'spiel', 'Welten, Portale und Wiedergeburt', 'offen', '', '', 53),
  ('spiel-hud', 'spiel', 'HUD und Fenster', 'offen', '', '', 54),
  ('spiel-shop', 'spiel', 'Shop und Boosts', 'offen', '', '', 55),
  ('spiel-skills', 'spiel', 'Skilltree', 'offen', '', '', 56),
  ('spiel-belohnungen', 'spiel', 'Belohnungen, Glücksrad und Codes', 'offen', '', '', 57),
  ('spiel-ranglisten', 'spiel', 'Ranglisten', 'offen', '', '', 58),
  ('spiel-admin', 'spiel', 'Admin Panel', 'offen', '', '', 59),
  ('spiel-speichern', 'spiel', 'Speichern (DataStore)', 'offen', '', '', 60),
  ('spiel-klang', 'spiel', 'Klänge und Musik', 'offen', '', '', 61),
  ('studio-installer', 'studio', 'Installer ausführen und alles testen', 'offen', '', '', 62),
  ('studio-welten', 'studio', 'Welten exportieren und einfügen', 'offen', '', '', 63),
  ('studio-modelle', 'studio', 'Modelle importieren (bibliothek.glb → CoinmasterModelle)', 'offen', '', '', 64),
  ('studio-decals', 'studio', 'Münz-Motive als Decals hochladen, DecalIds eintragen', 'offen', '', '', 65),
  ('studio-himmel', 'studio', 'Himmelsbilder hochladen, Bild-IDs eintragen', 'offen', '', '', 66),
  ('studio-sounds', 'studio', 'Klänge hochladen, SoundIds eintragen', 'offen', '', '', 67),
  ('studio-admins', 'studio', 'Admin-UserIds eintragen', 'offen', '', '', 68),
  ('studio-api', 'studio', 'API-Zugriff für das Speichern einschalten', 'offen', '', '', 69),
  ('studio-veroeffentlichen', 'studio', 'Spiel veröffentlichen', 'offen', '', '', 70)
on conflict (id) do nothing;

-- ── Admins (ohne Code; den legt jeder auf der Seite selbst fest) ──
-- Weiterer Admin: Zeile ergänzen und nochmal ausführen. Schon festgelegte Codes bleiben.
insert into public.checkliste_admins (name, code_hash, reihenfolge) values
  ('spitzefluke', null, 1),
  ('Axseleins', null, 2)
on conflict (name) do nothing;
