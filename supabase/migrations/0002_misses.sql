-- Abgelehnte Antworten: zeigt, welche richtigen Antworten in den Listen fehlen
create table if not exists public.misses (
  id          bigserial primary key,
  round_date  date        not null,
  cat         smallint    not null,
  answer      text        not null,
  created_at  timestamptz not null default now()
);
create index if not exists misses_round_idx on public.misses (round_date, cat);
alter table public.misses enable row level security;

-- Auswertung: häufigste abgelehnte Antworten je Runde/Kategorie
create or replace view public.misses_top as
  select round_date, cat, lower(trim(answer)) as answer, count(*) as anzahl
  from public.misses
  group by 1, 2, 3
  order by round_date desc, anzahl desc;
