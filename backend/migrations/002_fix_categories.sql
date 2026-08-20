-- Frontendda 15 ta kategoriya taklif qilinadi, lekin bazada faqat 3 tasi ruxsat etilgan edi.
-- Bu yulduzlarning aksariyati profilini saqlay olmasligiga olib kelardi.
ALTER TABLE star_profiles DROP CONSTRAINT IF EXISTS star_profiles_category_check;
ALTER TABLE star_profiles ADD CONSTRAINT star_profiles_category_check
  CHECK (category IN (
    'actors','singers','bloggers','youtubers','vtubers','sportsmen',
    'esports','comedians','tv-hosts','voice-actors','musicians',
    'mentors','fitness','kids'
  ));
