-- Raritour: Antworten der Spieler (eine pro Spieler, Runde und Kategorie)
create table if not exists public.submissions (
  id          bigserial primary key,
  round_date  date        not null,
  cat         smallint    not null check (cat between 0 and 15),
  answer_key  text        not null,
  player_id   uuid        not null,
  created_at  timestamptz not null default now(),
  unique (round_date, cat, player_id)
);

create index if not exists submissions_stats_idx on public.submissions (round_date, cat, answer_key);

-- Zugriff nur über den Server (Service-Role-Key). Keine öffentlichen Policies.
alter table public.submissions enable row level security;
