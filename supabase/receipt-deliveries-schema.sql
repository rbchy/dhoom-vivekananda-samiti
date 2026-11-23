-- =====================================================================
-- Dhoom Vivekananda Samiti — RECEIPT DELIVERY LOG
--
-- One row per attempt to send a money receipt to a donor / subscriber by
-- e-mail or SMS. Written only by the send-receipt Edge Function (server key);
-- staff (main admin, accounts admin, secretary) can read it on the receipt page.
-- RUN AFTER roles-and-approvals.sql. Safe to re-run.
-- =====================================================================

create table if not exists public.receipt_deliveries (
  id           uuid primary key default gen_random_uuid(),
  earning_type text not null check (earning_type in ('donation', 'subscription', 'income')),
  earning_id   uuid not null,
  receipt_no   text not null check (char_length(receipt_no) <= 60),
  channel      text not null check (channel in ('email', 'sms')),
  recipient    text not null check (char_length(recipient) <= 254),
  status       text not null check (status in ('sent', 'failed')),
  provider_id  text check (provider_id is null or char_length(provider_id) <= 200),
  error        text check (error is null or char_length(error) <= 500),
  automatic    boolean not null default false,
  sent_by      uuid,
  created_at   timestamptz not null default now()
);
create index if not exists receipt_deliveries_earning_idx on public.receipt_deliveries (earning_type, earning_id, channel, status);

alter table public.receipt_deliveries enable row level security;

drop policy if exists "receipt_deliveries staff read" on public.receipt_deliveries;
create policy "receipt_deliveries staff read" on public.receipt_deliveries
  for select to authenticated
  using (public.staff_role() in ('admin', 'accounts_admin', 'secretary'));

-- No insert / update / delete from the website: only the Edge Function (service role) writes.
