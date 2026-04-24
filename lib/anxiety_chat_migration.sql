-- 2AM Anxiety Chat table
-- Run this in Supabase SQL Editor before using the 2AM Chat feature

create table if not exists anxiety_chat (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  message text not null,
  response text not null,
  mood text,
  created_at timestamptz default now()
);

create index if not exists idx_anxiety_chat_user 
  on anxiety_chat(user_id);
