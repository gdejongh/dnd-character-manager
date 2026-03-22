-- =============================================================
--  D&D 5e Character Manager — Supabase Schema
--  Run this entire file in the Supabase SQL Editor (one shot).
-- =============================================================

-- 1. Characters ---------------------------------------------------
create table characters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default 'New Character',
  race        text not null default '',
  class       text not null default '',
  level       integer not null default 1 check (level between 1 and 20),
  current_hp  integer not null default 10,
  max_hp      integer not null default 10,
  temp_hp     integer not null default 0,
  skill_proficiencies text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Ability Scores -----------------------------------------------
create table ability_scores (
  id                       uuid primary key default gen_random_uuid(),
  character_id             uuid references characters(id) on delete cascade not null,
  ability                  text not null check (ability in ('STR','DEX','CON','INT','WIS','CHA')),
  score                    integer not null default 10 check (score between 1 and 30),
  saving_throw_proficiency boolean not null default false,
  unique (character_id, ability)
);

-- 3. Spell Slots --------------------------------------------------
create table spell_slots (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid references characters(id) on delete cascade not null,
  level         integer not null check (level between 1 and 9),
  total         integer not null default 0,
  used          integer not null default 0,
  unique (character_id, level)
);

-- 4. Inventory Items ----------------------------------------------
create table inventory_items (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid references characters(id) on delete cascade not null,
  name          text not null,
  quantity      integer not null default 1,
  weight        numeric(10,2) not null default 0,
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

-- 5. Features & Traits --------------------------------------------
create table features (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid references characters(id) on delete cascade not null,
  title         text not null,
  description   text not null default '',
  source        text not null default '',
  created_at    timestamptz not null default now()
);

-- 6. Notes --------------------------------------------------------
create table notes (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid references characters(id) on delete cascade not null,
  content       text not null default '',
  updated_at    timestamptz not null default now()
);

-- =================================================================
--  Row Level Security
-- =================================================================
alter table characters      enable row level security;
alter table ability_scores  enable row level security;
alter table spell_slots     enable row level security;
alter table inventory_items enable row level security;
alter table features        enable row level security;
alter table notes           enable row level security;

-- characters ------------------------------------------------------
create policy "Users can view own characters"
  on characters for select using (auth.uid() = user_id);
create policy "Users can insert own characters"
  on characters for insert with check (auth.uid() = user_id);
create policy "Users can update own characters"
  on characters for update using (auth.uid() = user_id);
create policy "Users can delete own characters"
  on characters for delete using (auth.uid() = user_id);

-- helper: ownership sub-query used by child tables
-- ability_scores --------------------------------------------------
create policy "View own ability_scores"
  on ability_scores for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own ability_scores"
  on ability_scores for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own ability_scores"
  on ability_scores for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own ability_scores"
  on ability_scores for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- spell_slots -----------------------------------------------------
create policy "View own spell_slots"
  on spell_slots for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own spell_slots"
  on spell_slots for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own spell_slots"
  on spell_slots for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own spell_slots"
  on spell_slots for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- inventory_items -------------------------------------------------
create policy "View own inventory_items"
  on inventory_items for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own inventory_items"
  on inventory_items for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own inventory_items"
  on inventory_items for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own inventory_items"
  on inventory_items for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- features --------------------------------------------------------
create policy "View own features"
  on features for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own features"
  on features for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own features"
  on features for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own features"
  on features for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- notes -----------------------------------------------------------
create policy "View own notes"
  on notes for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own notes"
  on notes for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own notes"
  on notes for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own notes"
  on notes for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- 7. Spells (named spells per level) ------------------------------
create table spells (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid references characters(id) on delete cascade not null,
  name          text not null,
  description   text not null default '',
  level         integer not null default 0 check (level between 0 and 9),
  prepared      boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table spells enable row level security;

create policy "View own spells"
  on spells for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own spells"
  on spells for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own spells"
  on spells for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own spells"
  on spells for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- =================================================================
--  Auto-update `updated_at` triggers
-- =================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();
