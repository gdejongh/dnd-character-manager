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
  primary_casting_class text,
  current_hp  integer not null default 10,
  max_hp      integer not null default 10,
  temp_hp     integer not null default 0,
  armor_class integer not null default 10,
  death_save_successes integer not null default 0 check (death_save_successes between 0 and 3),
  death_save_failures  integer not null default 0 check (death_save_failures between 0 and 3),
  conditions  text[] not null default '{}',
  skill_proficiencies text[] not null default '{}',
  initiative_modifier integer,
  passive_perception integer,
  hit_dice_remaining integer,
  inspiration boolean not null default false,
  speed integer not null default 30,
  swim_speed integer,
  fly_speed integer,
  climb_speed integer,
  burrow_speed integer,
  concentration_spell_id uuid,
  wild_shape_active boolean not null default false,
  wild_shape_beast_name text,
  wild_shape_current_hp integer,
  wild_shape_max_hp integer,
  wild_shape_beast_ac integer,
  wild_shape_beast_str integer,
  wild_shape_beast_dex integer,
  wild_shape_beast_con integer,
  wild_shape_beast_speed integer,
  wild_shape_beast_swim_speed integer,
  wild_shape_beast_fly_speed integer,
  wild_shape_beast_climb_speed integer,
  wild_shape_beast_burrow_speed integer,
  theme       text,
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
  rest_type     text not null default 'long_rest' check (rest_type in ('long_rest','short_rest')),
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
  concentration boolean not null default false,
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

-- 7b. Weapons / Attacks -------------------------------------------
create table weapons (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid references characters(id) on delete cascade not null,
  name          text not null,
  damage_dice   text not null default '1d4',
  damage_type   text not null default 'slashing',
  ability_mod   text not null default 'STR' check (ability_mod in ('STR','DEX')),
  proficient    boolean not null default true,
  action_type   text not null default 'action' check (action_type in ('action','bonus_action','reaction','other')),
  created_at    timestamptz not null default now()
);

alter table weapons enable row level security;

create policy "View own weapons"
  on weapons for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own weapons"
  on weapons for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own weapons"
  on weapons for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own weapons"
  on weapons for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- 7c. Custom Beasts (Wild Shape) -----------------------------------
create table custom_beasts (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid references characters(id) on delete cascade not null,
  name            text not null,
  cr              real not null default 0,
  hp              integer not null default 1,
  ac              integer not null default 10,
  str             integer not null default 10,
  dex             integer not null default 10,
  con             integer not null default 10,
  speed           integer not null default 30,
  swim_speed      integer,
  fly_speed       integer,
  climb_speed     integer,
  burrow_speed    integer,
  senses          text not null default '',
  attacks         jsonb not null default '[]',
  special_traits  jsonb not null default '[]',
  created_at      timestamptz not null default now()
);

alter table custom_beasts enable row level security;

create policy "View own custom beasts"
  on custom_beasts for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own custom beasts"
  on custom_beasts for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own custom beasts"
  on custom_beasts for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own custom beasts"
  on custom_beasts for delete
  using (character_id in (select id from characters where user_id = auth.uid()));

-- 7d. Character Classes (Multiclass) ---------------------------------
create table character_classes (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid references characters(id) on delete cascade not null,
  class_name      text not null,
  level           integer not null default 1 check (level between 1 and 20),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table character_classes enable row level security;

create policy "View own character classes"
  on character_classes for select
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Insert own character classes"
  on character_classes for insert
  with check (character_id in (select id from characters where user_id = auth.uid()));
create policy "Update own character classes"
  on character_classes for update
  using (character_id in (select id from characters where user_id = auth.uid()));
create policy "Delete own character classes"
  on character_classes for delete
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
create policy "Participants can advance turn"
  on combat_sessions for update using (
    exists (
      select 1 from session_participants sp
      where sp.session_id = combat_sessions.id
        and sp.user_id = auth.uid()
    )
  );
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
--  12. Auth helper RPCs
-- =================================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid;
begin
  current_uid := auth.uid();
  if current_uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = current_uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

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

-- =================================================================
--  13. Character Sharing
-- =================================================================
create table character_shares (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid references characters(id) on delete cascade not null,
  sender_id       uuid references auth.users(id) on delete cascade not null,
  sender_email    text not null,
  sender_username text not null default '',
  recipient_email text not null,
  recipient_id    uuid references auth.users(id) on delete cascade,
  status          text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at      timestamptz not null default now(),
  unique (character_id, recipient_email)
);

alter table character_shares enable row level security;

-- Sender can view, create, and delete their own shares
create policy "Sender can view own shares"
  on character_shares for select using (sender_id = auth.uid());
create policy "Sender can insert shares"
  on character_shares for insert with check (sender_id = auth.uid());
create policy "Sender can delete own shares"
  on character_shares for delete using (sender_id = auth.uid());

-- Recipient can view and update (accept/decline) their shares
create policy "Recipient can view shares"
  on character_shares for select using (recipient_id = auth.uid());
create policy "Recipient can update share status"
  on character_shares for update using (recipient_id = auth.uid());

-- Read-only access to shared characters
create policy "Users can view shared characters"
  on characters for select using (
    exists (
      select 1 from character_shares cs
      where cs.character_id = characters.id
        and cs.recipient_id = auth.uid()
        and cs.status in ('pending', 'accepted')
    )
  );

-- Child table read access for accepted shares
create policy "View shared ability_scores"
  on ability_scores for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

create policy "View shared spell_slots"
  on spell_slots for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

create policy "View shared inventory_items"
  on inventory_items for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

create policy "View shared features"
  on features for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

create policy "View shared notes"
  on notes for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

create policy "View shared spells"
  on spells for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

create policy "View shared weapons"
  on weapons for select using (
    character_id in (
      select cs.character_id from character_shares cs
      where cs.recipient_id = auth.uid() and cs.status = 'accepted'
    )
  );

-- RPC: Share a character (resolves email to user_id server-side)
create or replace function public.share_character(p_character_id uuid, p_recipient_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid;
  v_sender_email text;
  v_sender_username text;
  v_recipient_id uuid;
  v_share_id uuid;
begin
  v_sender_id := auth.uid();
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from characters where id = p_character_id and user_id = v_sender_id) then
    raise exception 'Character not found';
  end if;

  select email, raw_user_meta_data->>'username'
  into v_sender_email, v_sender_username
  from auth.users where id = v_sender_id;

  if lower(v_sender_email) = lower(p_recipient_email) then
    raise exception 'Cannot share with yourself';
  end if;

  select id into v_recipient_id from auth.users where lower(email) = lower(p_recipient_email);
  if v_recipient_id is null then
    raise exception 'No user found with that email';
  end if;

  insert into character_shares (character_id, sender_id, sender_email, sender_username, recipient_email, recipient_id, status)
  values (p_character_id, v_sender_id, v_sender_email, coalesce(v_sender_username, ''), lower(p_recipient_email), v_recipient_id, 'pending')
  on conflict (character_id, recipient_email)
  do update set status = 'pending', created_at = now()
  returning id into v_share_id;

  return v_share_id;
end;
$$;

revoke all on function public.share_character(uuid, text) from public;
grant execute on function public.share_character(uuid, text) to authenticated;

-- RPC: Deep-copy a shared character
create or replace function public.copy_shared_character(p_share_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_source_char_id uuid;
  v_new_char_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select character_id into v_source_char_id
  from character_shares
  where id = p_share_id and recipient_id = v_user_id and status = 'accepted';

  if v_source_char_id is null then
    raise exception 'Share not found or not accepted';
  end if;

  insert into characters (user_id, name, race, class, level, current_hp, max_hp, temp_hp, armor_class, skill_proficiencies, initiative_modifier, passive_perception, hit_dice_remaining, inspiration, speed, image_url, image_position, theme)
  select v_user_id, name || ' (Copy)', race, class, level, current_hp, max_hp, temp_hp, armor_class, skill_proficiencies, initiative_modifier, passive_perception, null, false, speed, image_url, image_position, theme
  from characters where id = v_source_char_id
  returning id into v_new_char_id;

  insert into ability_scores (character_id, ability, score, saving_throw_proficiency)
  select v_new_char_id, ability, score, saving_throw_proficiency
  from ability_scores where character_id = v_source_char_id;

  insert into spell_slots (character_id, level, total, used)
  select v_new_char_id, level, total, 0
  from spell_slots where character_id = v_source_char_id;

  insert into spells (character_id, name, description, level, prepared, concentration, action_type)
  select v_new_char_id, name, description, level, prepared, concentration, action_type
  from spells where character_id = v_source_char_id;

  insert into inventory_items (character_id, name, quantity, weight, notes)
  select v_new_char_id, name, quantity, weight, notes
  from inventory_items where character_id = v_source_char_id;

  insert into features (character_id, title, description, source, action_type, max_uses, used_uses, rest_type)
  select v_new_char_id, title, description, source, action_type, max_uses, 0, rest_type
  from features where character_id = v_source_char_id;

  insert into weapons (character_id, name, damage_dice, damage_type, ability_mod, proficient, action_type)
  select v_new_char_id, name, damage_dice, damage_type, ability_mod, proficient, action_type
  from weapons where character_id = v_source_char_id;

  insert into notes (character_id, content)
  select v_new_char_id, content
  from notes where character_id = v_source_char_id;

  return v_new_char_id;
end;
$$;

revoke all on function public.copy_shared_character(uuid) from public;
grant execute on function public.copy_shared_character(uuid) to authenticated;

-- =================================================================
--  MIGRATION: AC, Death Saves, Conditions
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS armor_class integer NOT NULL DEFAULT 10;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS death_save_successes integer NOT NULL DEFAULT 0 CHECK (death_save_successes BETWEEN 0 AND 3);
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS death_save_failures integer NOT NULL DEFAULT 0 CHECK (death_save_failures BETWEEN 0 AND 3);
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS conditions text[] NOT NULL DEFAULT '{}';
--
-- =================================================================
--  MIGRATION: Initiative, Passive Perception, Hit Dice
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS initiative_modifier integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS passive_perception integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS hit_dice_remaining integer;
--
--   -- Update copy_shared_character function (re-run the CREATE OR REPLACE above)
--
-- =================================================================
--  MIGRATION: Inspiration, Speed, Concentration
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS inspiration boolean NOT NULL DEFAULT false;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS speed integer NOT NULL DEFAULT 30;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS concentration_spell_id uuid;
--   ALTER TABLE spells ADD COLUMN IF NOT EXISTS concentration boolean NOT NULL DEFAULT false;
--
--   -- Update copy_shared_character function (re-run the CREATE OR REPLACE above)
--
-- =================================================================
--  MIGRATION: Wild Shape
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_active boolean NOT NULL DEFAULT false;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_name text;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_current_hp integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_max_hp integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_ac integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_str integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_dex integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_con integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_speed integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_swim_speed integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_fly_speed integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_climb_speed integer;
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS wild_shape_beast_burrow_speed integer;
--
--   -- Create custom_beasts table (run full CREATE TABLE + RLS from above)
--
-- =================================================================
--  MIGRATION: Multiclass Support
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS primary_casting_class text;
--
--   -- Create character_classes table (run full CREATE TABLE + RLS from above)
--
-- =================================================================
--  MIGRATION: Feature Rest Type
-- =================================================================
-- Run these statements if upgrading an existing database:
--
--   ALTER TABLE features ADD COLUMN IF NOT EXISTS rest_type text;
--   UPDATE features SET rest_type = 'long_rest' WHERE rest_type IS NULL;
--   ALTER TABLE features ALTER COLUMN rest_type SET DEFAULT 'long_rest';
--   ALTER TABLE features ALTER COLUMN rest_type SET NOT NULL;
--   ALTER TABLE features DROP CONSTRAINT IF EXISTS features_rest_type_check;
--   ALTER TABLE features ADD CONSTRAINT features_rest_type_check CHECK (rest_type in ('long_rest','short_rest'));
--
--   -- Update copy_shared_character function (re-run the CREATE OR REPLACE above)
--
-- =================================================================
--  MIGRATION: Character Themes
-- =================================================================
-- Run this statement if upgrading an existing database:
--
--   ALTER TABLE characters ADD COLUMN IF NOT EXISTS theme text;
