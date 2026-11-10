update public.wedding_events set date_label = '31 January 2027' where date_label = '31 January';
update public.wedding_events set date_label = '15 February 2027' where date_label = '15 February';
update public.wedding_details set wedding_date = '2027-02-15T00:00:00+05:30' where id = 1 and wedding_date is null;
