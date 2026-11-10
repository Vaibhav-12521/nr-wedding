update public.wedding_details set
  story_intro        = '[Sample] Our families warmly invite you to celebrate with us.',
  story_timeline     = '[{"date":"[Sample] 2019","title":"[Sample] We met","text":"Replace this in Admin → Wedding details."}]',
  faqs               = '[{"question":"[Sample] Is there parking at the venue?","answer":"Replace this in Admin → Wedding details."}]',
  contacts           = '[{"name":"[Sample] Family contact","role":"Travel & stay","phone":"+91 00000 00000"}]'
where id = 1;

insert into public.albums (name, slug, visibility, sort_order, event_id) values
  ('31 January Celebration',     '31-january-celebration',     'members',    0, (select id from public.wedding_events where date_label like '31 January%' limit 1)),
  ('Wedding Day – 15 February',  'wedding-day-15-february',    'members',    1, (select id from public.wedding_events where date_label like '15 February%' limit 1)),
  ('Family Moments',             'family-moments',             'members',    2, null),
  ('Bride''s Collection',        'bride-s-collection',         'restricted', 3, null),
  ('Groom''s Collection',        'groom-s-collection',         'restricted', 4, null),
  ('Friends and Relatives',      'friends-and-relatives',      'members',    5, null),
  ('Behind the Scenes',          'behind-the-scenes',          'members',    6, null)
on conflict (slug) do nothing;
