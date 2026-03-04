update silverleaf_news
set media_urls_text = to_json(string_to_array(media_urls_text, '||'))::text
where media_urls_text is not null
  and btrim(media_urls_text) <> ''
  and left(btrim(media_urls_text), 1) <> '[';

update board_poll
set options_text = to_json(string_to_array(options_text, '||'))::text
where options_text is not null
  and btrim(options_text) <> ''
  and left(btrim(options_text), 1) <> '[';

update violation_report
set media_urls_text = to_json(string_to_array(media_urls_text, '||'))::text
where media_urls_text is not null
  and btrim(media_urls_text) <> ''
  and left(btrim(media_urls_text), 1) <> '[';
