-- ─── InterviewAI — Supabase Schema ────────────────────────────────────────
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)

-- ── Users Profile ──────────────────────────────────────────────────────────
create table public.users_profile (
  id                uuid references auth.users primary key,
  email             text,
  full_name         text,
  plan              text default 'free',             -- free | starter | pro | enterprise
  tokens_used       integer default 0,
  tokens_allowance  integer default 50000,
  sessions_used     integer default 0,
  sessions_limit    integer default 3,
  billing_date      timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── Token Usage Ledger ─────────────────────────────────────────────────────
create table public.user_usage (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.users_profile(id) on delete cascade,
  feature          text not null,     -- resume_parse | question_gen | answer_eval | report_gen
  tokens_consumed  integer not null,
  session_id       uuid,
  model_used       text,              -- claude-haiku-4-5 | claude-sonnet-4
  created_at       timestamptz default now()
);

-- ── Interview Sessions ──────────────────────────────────────────────────────
create table public.interview_sessions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.users_profile(id) on delete cascade,
  tech_stack      text,
  role            text,
  seniority       text,               -- junior | mid | senior | staff
  questions       jsonb default '[]',
  answers         jsonb default '[]',
  scores          jsonb default '[]',
  speech_stats    jsonb default '[]', -- per-answer speech analytics
  avg_clarity     integer,
  avg_confidence  integer,
  total_fillers   integer default 0,
  overall_score   integer,
  status          text default 'active',  -- active | completed
  report          jsonb,
  tokens_used     integer default 0,
  created_at      timestamptz default now(),
  completed_at    timestamptz
);

-- ── Transactions ────────────────────────────────────────────────────────────
create table public.transactions (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references public.users_profile(id) on delete cascade,
  stripe_payment_id  text unique,
  stripe_invoice_id  text,
  plan               text,
  amount_cents       integer,
  currency           text default 'usd',
  status             text,            -- succeeded | failed | refunded
  description        text,
  created_at         timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.users_profile      enable row level security;
alter table public.user_usage         enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.transactions        enable row level security;

-- users_profile policies
create policy "Users can read own profile"
  on public.users_profile for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.users_profile for update using (auth.uid() = id);
create policy "Service role can manage all profiles"
  on public.users_profile for all using (auth.role() = 'service_role');

-- user_usage policies
create policy "Users can read own usage"
  on public.user_usage for select using (auth.uid() = user_id);
create policy "Service role can insert usage"
  on public.user_usage for insert with check (auth.role() = 'service_role');

-- interview_sessions policies
create policy "Users can read own sessions"
  on public.interview_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.interview_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on public.interview_sessions for update using (auth.uid() = user_id);

-- transactions policies
create policy "Users can read own transactions"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Service role can manage transactions"
  on public.transactions for all using (auth.role() = 'service_role');

-- ── Helper Functions ────────────────────────────────────────────────────────

-- Check if user has enough tokens before an API call
create or replace function check_token_quota(p_user_id uuid, p_tokens_needed integer)
returns boolean as $$
declare
  v_used integer;
  v_allowance integer;
begin
  select tokens_used, tokens_allowance
  into v_used, v_allowance
  from public.users_profile
  where id = p_user_id;

  return (v_used + p_tokens_needed) <= v_allowance;
end;
$$ language plpgsql security definer;

-- Deduct tokens after a successful API call
create or replace function deduct_tokens(p_user_id uuid, p_tokens integer, p_feature text, p_session_id uuid default null)
returns void as $$
begin
  update public.users_profile
  set tokens_used = tokens_used + p_tokens,
      updated_at = now()
  where id = p_user_id;

  insert into public.user_usage (user_id, feature, tokens_consumed, session_id)
  values (p_user_id, p_feature, p_tokens, p_session_id);
end;
$$ language plpgsql security definer;

-- Monthly token reset (call via pg_cron: select cron.schedule('reset-tokens', '0 0 1 * *', 'select reset_monthly_tokens()'))
create or replace function reset_monthly_tokens()
returns void as $$
begin
  update public.users_profile
  set tokens_used = 0,
      sessions_used = 0,
      updated_at = now()
  where billing_date is not null
    and date_trunc('month', billing_date) < date_trunc('month', now());
end;
$$ language plpgsql security definer;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_profile (id, email, full_name, billing_date)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index idx_user_usage_user_id      on public.user_usage(user_id);
create index idx_user_usage_created_at   on public.user_usage(created_at);
create index idx_sessions_user_id        on public.interview_sessions(user_id);
create index idx_sessions_created_at     on public.interview_sessions(created_at);
create index idx_transactions_user_id    on public.transactions(user_id);
