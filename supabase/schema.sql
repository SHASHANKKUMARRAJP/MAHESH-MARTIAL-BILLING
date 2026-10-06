-- ============================================================
-- KARATE ACADEMY MANAGER — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. ACADEMIES
-- ============================================================
create table if not exists public.academies (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  instructor_name text,
  phone         text,
  address       text,
  logo_url      text,
  created_at    timestamptz default now()
);

alter table public.academies enable row level security;

-- ============================================================
-- 2. PROFILES (linked to Supabase Auth users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  academy_id    uuid references public.academies(id) on delete set null,
  name          text,
  email         text,
  role          text not null default 'owner',
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- 3. STUDENTS
-- ============================================================
create table if not exists public.students (
  id            uuid primary key default uuid_generate_v4(),
  academy_id    uuid not null references public.academies(id) on delete cascade,
  student_name  text not null,
  parent_name   text not null,
  parent_phone  text not null,
  monthly_fee   numeric(10,2) not null default 800,
  batch         text,
  joining_date  date,
  photo_url     text,
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_students_academy_id on public.students(academy_id);
create index if not exists idx_students_parent_phone on public.students(parent_phone);
create index if not exists idx_students_status on public.students(status);

alter table public.students enable row level security;

-- ============================================================
-- 4. PAYMENTS
-- ============================================================
create table if not exists public.payments (
  id                    uuid primary key default uuid_generate_v4(),
  academy_id            uuid not null references public.academies(id) on delete cascade,
  student_id            uuid not null references public.students(id) on delete cascade,
  month                 integer not null check (month between 1 and 12),
  year                  integer not null,
  amount                numeric(10,2) not null,
  status                text not null default 'pending' check (status in ('paid','pending')),
  payment_date          date,
  payment_method        text check (payment_method in ('cash','upi','bank_transfer','other')),
  transaction_reference text,
  created_at            timestamptz default now(),
  unique (student_id, month, year)
);

create index if not exists idx_payments_academy_id on public.payments(academy_id);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_payments_month_year on public.payments(month, year);
create index if not exists idx_payments_status on public.payments(status);

alter table public.payments enable row level security;

-- ============================================================
-- 5. REMINDERS
-- ============================================================
create table if not exists public.reminders (
  id           uuid primary key default uuid_generate_v4(),
  academy_id   uuid not null references public.academies(id) on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  month        integer not null check (month between 1 and 12),
  year         integer not null,
  amount       numeric(10,2) not null,
  message      text,
  status       text not null default 'pending' check (status in ('sent','pending')),
  initiated_at timestamptz,
  created_at   timestamptz default now(),
  unique (student_id, month, year)
);

create index if not exists idx_reminders_academy_id on public.reminders(academy_id);
create index if not exists idx_reminders_student_id on public.reminders(student_id);
create index if not exists idx_reminders_month_year on public.reminders(month, year);
create index if not exists idx_reminders_status on public.reminders(status);

alter table public.reminders enable row level security;

-- ============================================================
-- 6. SETTINGS
-- ============================================================
create table if not exists public.settings (
  id                  uuid primary key default uuid_generate_v4(),
  academy_id          uuid not null unique references public.academies(id) on delete cascade,
  default_fee         numeric(10,2) not null default 800,
  whatsapp_template   text not null default '🥋 Karate Academy Fee Reminder

Dear {{parent_name}},

This is a gentle reminder regarding {{student_name}}''s karate class fee for {{month}} {{year}}.

💰 Amount: ₹{{amount}}

Kindly complete the payment at your convenience.

Thank you 🙏

Karate Academy',
  competition_template text,
  manual_template text,
  competition_fee numeric default 0,
  manual_fee numeric default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.settings enable row level security;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper function: get current user's academy_id
create or replace function public.get_user_academy_id()
returns uuid
language sql stable
as $$
  select academy_id from public.profiles where id = auth.uid();
$$;

-- ACADEMIES: users can only see/modify their own academy
create policy "Users see their academy"
  on public.academies for select
  using (id = public.get_user_academy_id());

create policy "Users update their academy"
  on public.academies for update
  using (id = public.get_user_academy_id());

-- PROFILES: users manage their own profile
create policy "Users see own profile"
  on public.profiles for all
  using (id = auth.uid());

-- STUDENTS: restricted to same academy
create policy "Students: own academy"
  on public.students for all
  using (academy_id = public.get_user_academy_id());

-- PAYMENTS: restricted to same academy
create policy "Payments: own academy"
  on public.payments for all
  using (academy_id = public.get_user_academy_id());

-- REMINDERS: restricted to same academy
create policy "Reminders: own academy"
  on public.reminders for all
  using (academy_id = public.get_user_academy_id());

-- SETTINGS: restricted to same academy
create policy "Settings: own academy"
  on public.settings for all
  using (academy_id = public.get_user_academy_id());

-- ============================================================
-- TRIGGER: auto-update updated_at on students
-- ============================================================
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger students_updated_at
  before update on public.students
  for each row execute function public.update_updated_at();

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile when user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_academy_id uuid;
begin
  -- Create a new academy
  insert into public.academies (name)
  values ('My Karate Academy')
  returning id into new_academy_id;

  -- Create default settings
  insert into public.settings (academy_id)
  values (new_academy_id);

  -- Create profile linked to academy
  insert into public.profiles (id, academy_id, email, name)
  values (
    new.id,
    new_academy_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SEED DATA (Optional — remove for production)
-- Uncomment and run only if you want demo data in Supabase
-- ============================================================

-- INSERT INTO public.academies (id, name, instructor_name, phone, address)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Shotokan Karate Academy', 'Sensei Rajan Kumar', '9876543210', 'Koramangala, Bengaluru');

-- etc.
