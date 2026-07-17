-- ============================================================
-- SK NADĚJE – MS V HOKEJI 2027 + centrální registr hráčů
-- Spustit v Supabase SQL Editoru (celé najednou)
-- ============================================================

-- Centrální hráči (sdílené jméno napříč všemi turnaji/dlaždicemi)
create table if not exists hraci (
    user_id uuid primary key references auth.users(id) on delete cascade,
    jmeno text not null unique,
    vytvoreno timestamptz default now()
);
alter table hraci enable row level security;
create policy "hraci read" on hraci for select using (true);
create policy "hraci insert self" on hraci for insert with check (auth.uid() = user_id);
create policy "hraci update self" on hraci for update using (auth.uid() = user_id);

-- Zápasy MS 2027
create table if not exists hokej27_zapasy (
    id bigint generated always as identity primary key,
    domaci text not null,
    hoste text not null,
    kod_d text, kod_h text,
    skupina text,                          -- 'A' | 'B' | 'QF' | 'SF' | 'BRONZ' | 'FINALE'
    deadline timestamptz not null,
    status text default 'aktivni',         -- aktivni | vyhodnoceno
    vysledek_d int, vysledek_h int,        -- po 60 minutách
    strelci jsonb default '[]',
    bank_zapasu numeric default 0,         -- vyplacený bank (po vyhodnocení)
    vytvoreno timestamptz default now()
);
alter table hokej27_zapasy enable row level security;
create policy "z read" on hokej27_zapasy for select using (true);
create policy "z admin write" on hokej27_zapasy for all
    using (auth.uid() = '92a1e51b-e03c-48d7-99df-76c2f60a455f'::uuid)
    with check (auth.uid() = '92a1e51b-e03c-48d7-99df-76c2f60a455f'::uuid);

-- Sázky (25 Kč = 20 bank + 5 fond)
create table if not exists hokej27_sazky (
    id bigint generated always as identity primary key,
    zapas_id bigint not null references hokej27_zapasy(id) on delete cascade,
    user_id uuid not null references auth.users(id),
    jmeno text not null,
    skore text not null,                   -- "3:2"
    strelec text default '',
    skryt boolean default false,
    -- vyhodnocení (plní admin při evalu):
    hit_skore boolean, hit_strelec boolean, hit_trend boolean,
    nb int default 0,                      -- nadějné body za tuto sázku
    vyhra_kc numeric default 0,
    vytvoreno timestamptz default now(),
    unique (zapas_id, user_id)             -- 1 sázka na zápas na hráče
);
alter table hokej27_sazky enable row level security;
create policy "s read" on hokej27_sazky for select using (true);
create policy "s insert self" on hokej27_sazky for insert
    with check (auth.uid() = user_id);
create policy "s admin update" on hokej27_sazky for update
    using (auth.uid() = '92a1e51b-e03c-48d7-99df-76c2f60a455f'::uuid);

-- Dlouhodobé tipy (1 na hráče, vklad 50 Kč)
create table if not exists hokej27_dlouhodobe (
    user_id uuid primary key references auth.users(id),
    jmeno text not null,
    tip jsonb not null default '{}',
    -- {vitezA, vitezB, vitezTurnaje, vitezKB, allstar: {g, d1, d2, u1, u2, u3}}
    zaplaceno boolean default false,
    body int default 0,                    -- plní admin po vyhodnocení
    vytvoreno timestamptz default now()
);
alter table hokej27_dlouhodobe enable row level security;
create policy "d read" on hokej27_dlouhodobe for select using (true);
create policy "d insert self" on hokej27_dlouhodobe for insert with check (auth.uid() = user_id);
create policy "d update self" on hokej27_dlouhodobe for update
    using (auth.uid() = user_id or auth.uid() = '92a1e51b-e03c-48d7-99df-76c2f60a455f'::uuid);

-- Stav turnaje (1 řádek): fond, převedený bank, výsledky dlouhodobých
create table if not exists hokej27_stav (
    id int primary key default 1,
    fond numeric default 0,
    prevedeny_bank numeric default 0,      -- nevyhraný bank převedený do dalšího zápasu
    dlouhodobe_vysledky jsonb default '{}',-- {vitezA, vitezB, vitezTurnaje, vitezKB, allstar:{...}}
    turnaj_ukoncen boolean default false,
    aktualizovano timestamptz default now()
);
alter table hokej27_stav enable row level security;
create policy "st read" on hokej27_stav for select using (true);
create policy "st admin write" on hokej27_stav for all
    using (auth.uid() = '92a1e51b-e03c-48d7-99df-76c2f60a455f'::uuid)
    with check (auth.uid() = '92a1e51b-e03c-48d7-99df-76c2f60a455f'::uuid);
insert into hokej27_stav (id) values (1) on conflict do nothing;
