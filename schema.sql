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
  action_type   text not null default 'other' check (action_type in ('action','bonus_action','reaction','other')),
  max_uses      integer default null,
  used_uses     integer not null default 0,
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
create policy "DM can update characters in own combat sessions"
  on characters for update using (
    exists (
      select 1 from session_participants sp
      join combat_sessions cs on cs.id = sp.session_id
      where sp.character_id = characters.id
        and cs.dm_user_id = auth.uid()
        and cs.status in ('lobby', 'active')
    )
  );
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
  action_type   text not null default 'action' check (action_type in ('action','bonus_action','reaction','other')),
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

-- =================================================================
--  8. Combat Sessions
-- =================================================================
create table combat_sessions (
  id                uuid primary key default gen_random_uuid(),
  room_code         text not null unique,
  dm_user_id        uuid references auth.users(id) on delete cascade not null,
  status            text not null default 'lobby' check (status in ('lobby','active','ended')),
  current_turn_index integer not null default 0,
  round_number      integer not null default 1,
  created_at        timestamptz not null default now()
);

-- 9. Session Participants (players who joined a combat session)
create table session_participants (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references combat_sessions(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null,
  character_id      uuid references characters(id) on delete cascade not null,
  character_name    text not null,
  character_class   text not null default '',
  current_hp        integer not null default 0,
  max_hp            integer not null default 0,
  joined_at         timestamptz not null default now(),
  unique (session_id, user_id)
);

-- 10. Combatants (initiative order — players + enemies)
create table combatants (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references combat_sessions(id) on delete cascade not null,
  name              text not null,
  combatant_type    text not null default 'enemy' check (combatant_type in ('player','enemy','ally')),
  initiative        integer not null default 0,
  participant_id    uuid references session_participants(id) on delete cascade,
  character_id      uuid references characters(id) on delete set null,
  current_hp        integer not null default 0,
  max_hp            integer not null default 0,
  sort_order        integer not null default 0
);

-- =================================================================
--  RLS — Combat tables
-- =================================================================
alter table combat_sessions      enable row level security;
alter table session_participants enable row level security;
alter table combatants           enable row level security;

-- combat_sessions: anyone authenticated can view active/lobby sessions; DM can modify their own
create policy "Anyone can view sessions"
  on combat_sessions for select using (auth.uid() is not null);
create policy "Users can create sessions"
  on combat_sessions for insert with check (auth.uid() = dm_user_id);
create policy "DM can update own sessions"
  on combat_sessions for update using (auth.uid() = dm_user_id);
create policy "DM can delete own sessions"
  on combat_sessions for delete using (auth.uid() = dm_user_id);

-- session_participants: viewable by anyone in the session; users can insert/update their own
create policy "View participants in any session"
  on session_participants for select using (auth.uid() is not null);
create policy "Users can join sessions"
  on session_participants for insert with check (auth.uid() = user_id);
create policy "Users can update own participant"
  on session_participants for update using (auth.uid() = user_id);
create policy "DM can update participants in own sessions"
  on session_participants for update using (
    exists (
      select 1 from combat_sessions cs
      where cs.id = session_participants.session_id
        and cs.dm_user_id = auth.uid()
    )
  );
create policy "Users can leave sessions"
  on session_participants for delete using (auth.uid() = user_id);

-- combatants: viewable by anyone authenticated; DM of session or the linked participant can modify
create policy "View combatants in any session"
  on combatants for select using (auth.uid() is not null);
create policy "Insert combatants"
  on combatants for insert with check (auth.uid() is not null);
create policy "Update combatants"
  on combatants for update using (auth.uid() is not null);
create policy "Delete combatants"
  on combatants for delete using (auth.uid() is not null);

-- =================================================================
--  Realtime — enable for combat tables
-- =================================================================
alter publication supabase_realtime add table combat_sessions;
alter publication supabase_realtime add table session_participants;
alter publication supabase_realtime add table combatants;

-- =================================================================
--  11. Character Images (migration)
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS image_url text;
--   ALTER TABLE combatants ADD COLUMN IF NOT EXISTS image_url text;
--
-- Storage RLS policies for the "character-images" bucket.
-- The bucket must be PUBLIC so other players can view images in combat.
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('character-images', 'character-images', true)
--   ON CONFLICT (id) DO UPDATE SET public = true;
--
--   CREATE POLICY "Users can upload own character images"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--       bucket_id = 'character-images'
--       AND (storage.foldername(name))[1] = auth.uid()::text
--     );
--
--   CREATE POLICY "Users can update own character images"
--     ON storage.objects FOR UPDATE
--     USING (
--       bucket_id = 'character-images'
--       AND (storage.foldername(name))[1] = auth.uid()::text
--     );
--
--   CREATE POLICY "Users can delete own character images"
--     ON storage.objects FOR DELETE
--     USING (
--       bucket_id = 'character-images'
--       AND (storage.foldername(name))[1] = auth.uid()::text
--     );
--
--   CREATE POLICY "Anyone can view character images"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'character-images');
