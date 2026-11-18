-- Temple opening hours (Day | Morning | Evening table on the home page)
-- Run once in Supabase → SQL Editor. Older rows are only hidden (is_active = false), not deleted.
begin;
update public.worship_schedule set is_active = false where is_active;

insert into public.worship_schedule (day_of_week, title_en, title_bn, start_time, end_time, sort_order) values
  (null, 'Temple open', 'মন্দির খোলা', '06:30', '07:00', 10),  -- every day, morning
  (null, 'Temple open', 'মন্দির খোলা', '18:30', '19:15', 11),  -- every day, evening
  (1,    'Temple open', 'মন্দির খোলা', '18:00', '19:00', 20),  -- Monday
  (2,    'Temple open', 'মন্দির খোলা', '18:00', '19:00', 30),  -- Tuesday
  (3,    'Temple open', 'মন্দির খোলা', '18:00', '19:00', 40),  -- Wednesday
  (4,    'Temple open', 'মন্দির খোলা', '18:00', '19:00', 50),  -- Thursday
  (5,    'Temple open', 'মন্দির খোলা', '19:00', '20:30', 60),  -- Friday
  (6,    'Temple open', 'মন্দির খোলা', '18:00', '19:00', 70),  -- Saturday
  (0,    'Temple open', 'মন্দির খোলা', '17:30', '18:30', 80),  -- Sunday, first slot
  (0,    'Temple open', 'মন্দির খোলা', '19:00', '22:00', 81);  -- Sunday, second slot
commit;
