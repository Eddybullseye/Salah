-- ============================================================================
-- SALAH COMPANION DATABASE SCHEMA & SEED MIGRATION
-- Production-ready schema for Supabase Postgres with RLS, pg_cron, and pg_net
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Note: Enable pg_net and pg_cron in Supabase Database > Extensions
-- CREATE EXTENSION IF NOT EXISTS "pg_net";
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 21.4225,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 39.8262,
  city_name TEXT NOT NULL DEFAULT 'Makkah',
  country_name TEXT NOT NULL DEFAULT 'Saudi Arabia',
  calculation_method TEXT NOT NULL DEFAULT 'MuslimWorldLeague',
  asr_method TEXT NOT NULL DEFAULT 'Standard',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  adjustments JSONB NOT NULL DEFAULT '{"fajr":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}'::JSONB,
  reminder_settings JSONB NOT NULL DEFAULT '{
    "fajr": {"enabled": true, "offset": 0, "nudge": 15},
    "dhuhr": {"enabled": true, "offset": 0, "nudge": 15},
    "asr": {"enabled": true, "offset": 0, "nudge": 15},
    "maghrib": {"enabled": true, "offset": 0, "nudge": 15},
    "isha": {"enabled": true, "offset": 0, "nudge": 15},
    "fajr_wakeup": true,
    "fajr_wakeup_offset": 20,
    "ayah_of_day": true,
    "ayah_time": "08:00"
  }'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. PUSH SUBSCRIPTIONS TABLE (Multi-device support: iPhone + iPad + Desktop)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_label TEXT NOT NULL DEFAULT 'Web Browser',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATION LOG TABLE (Deduplication)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer TEXT NOT NULL,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  type TEXT NOT NULL, -- 'exact', 'before_15', 'nudge_15', 'fajr_wakeup', 'daily_ayah'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_notification UNIQUE (user_id, prayer, date, type)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_lookup ON public.notification_log(user_id, date, prayer);

-- ----------------------------------------------------------------------------
-- 4. PRAYER LOGS TABLE (Tracker)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  prayer TEXT NOT NULL, -- 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'
  status TEXT NOT NULL CHECK (status IN ('on_time', 'late', 'missed', 'qada')),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_prayer_date UNIQUE (user_id, date, prayer)
);

CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_date ON public.prayer_logs(user_id, date DESC);

-- ----------------------------------------------------------------------------
-- 5. ISLAMIC STORIES, CATEGORIES & TAGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.story_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'prophets',
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  order_index INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories(category);

-- ----------------------------------------------------------------------------
-- 6. DUAS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  arabic TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  translation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'daily',
  source TEXT NOT NULL,
  benefits TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duas_category ON public.duas(category);

-- ----------------------------------------------------------------------------
-- 7. DAILY CONTENT (Ayah & Hadith)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('ayah', 'hadith')),
  arabic TEXT NOT NULL,
  translation TEXT NOT NULL,
  source TEXT NOT NULL,
  theme TEXT NOT NULL,
  reflection TEXT,
  day_of_year INTEGER, -- 1 to 366
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. USER INTERACTION TABLES (Bookmarks & Read Stories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('story', 'dua', 'daily_content')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_bookmark UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.user_story_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_story_read UNIQUE (user_id, story_id)
);

-- ----------------------------------------------------------------------------
-- 9. HELPER FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Trigger to automatically create a profile row for new auth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on profile edit
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_story_reads ENABLE ROW LEVEL SECURITY;

-- Profiles: users read and update their own profile; admins can read all
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Push Subscriptions: user accesses their own subscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification Log: users can read their notifications
CREATE POLICY "Users can read own notification logs"
  ON public.notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Prayer Logs: user has full access to their own prayer logs
CREATE POLICY "Users can manage own prayer logs"
  ON public.prayer_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Stories: publicly readable if published, editable only by admins
CREATE POLICY "Anyone can read published stories"
  ON public.stories FOR SELECT
  USING (published = TRUE OR public.is_admin());

CREATE POLICY "Admins can insert stories"
  ON public.stories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update stories"
  ON public.stories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete stories"
  ON public.stories FOR DELETE
  USING (public.is_admin());

-- Story Categories and Tags: readable by all, managed by admins
CREATE POLICY "Anyone can read story categories"
  ON public.story_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage story categories"
  ON public.story_categories FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can read story tags"
  ON public.story_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage story tags"
  ON public.story_tags FOR ALL
  USING (public.is_admin());

-- Duas: readable by all, managed by admins
CREATE POLICY "Anyone can read duas"
  ON public.duas FOR SELECT USING (true);

CREATE POLICY "Admins can manage duas"
  ON public.duas FOR ALL
  USING (public.is_admin());

-- Daily Content: readable by all, managed by admins
CREATE POLICY "Anyone can read daily content"
  ON public.daily_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage daily content"
  ON public.daily_content FOR ALL
  USING (public.is_admin());

-- Bookmarks: user owns their bookmarks
CREATE POLICY "Users can manage own bookmarks"
  ON public.user_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Story Reads: user owns their read history
CREATE POLICY "Users can manage own story reads"
  ON public.user_story_reads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 11. SEED DATA: CATEGORIES, STORIES, DUAS, AND DAILY CONTENT
-- ----------------------------------------------------------------------------

-- Categories
INSERT INTO public.story_categories (slug, title, description) VALUES
  ('prophets', 'Stories of the Prophets', 'Timeless lessons of faith, perseverance, and devotion from the Messengers of Allah (AS).'),
  ('companions', 'Stories of the Sahabah', 'The lives of the noble companions who stood beside the Prophet Muhammad (PBUH).'),
  ('parables', 'Quranic Parables', 'Profound metaphors and stories revealed in the Holy Quran for reflection.')
ON CONFLICT (slug) DO NOTHING;

-- Seed 5 Diverse Authentic Stories
INSERT INTO public.stories (title, slug, category, summary, content, source, tags, read_time_minutes, order_index) VALUES
(
  'Prophet Ibrahim (AS): The Search for Truth and Absolute Trust',
  'prophet-ibrahim-search-for-truth',
  'prophets',
  'How Ibrahim (AS) contemplated the celestial bodies, reasoned with his people, and placed complete tawakkul in Allah when cast into the fire.',
  'Prophet Ibrahim (peace be upon him) grew up in an environment where people carved stone idols with their own hands and worshipped celestial bodies. Gifted with profound intellect and a pure heart (qalb saleem), Ibrahim gazed at the night sky. When he saw a radiant star, he said: "This is my lord!" But when it set, he concluded: "I do not love that which sets." Next, seeing the moon ascending in splendour, he made the same observation, until it too vanished. Then the sun rose in brilliance, yet it set at dusk.

Ibrahim proclaimed to his people: "O my people! I am free from all that you associate with Allah. I have turned my face toward Him who originated the heavens and the earth, upright in devotion."

When Ibrahim smashed the idols in the temple to show their helplessness, the tyrants condemned him to a colossal furnace. Yet, as he was catapulted into the flames, the Angel Jibreel came to him and asked: "Do you have any need?" Ibrahim replied with unshakeable certainty: "From you, no. But from Allah, yes. Sufficient for us is Allah, and He is the best disposer of affairs (Hasbunallahu wa ni''mal wakeel)."

Allah commanded the fire: "O fire! Be cool and peaceful for Ibrahim." (Surah Al-Anbiya 21:69). The blazing furnace became a garden of safety.',
  'Surah Al-An''am (6:74-79), Surah Al-Anbiya (21:51-70), Tafsir Ibn Kathir',
  ARRAY['tawakkul', 'prophets', 'monotheism', 'ibrahim'],
  5,
  1
),
(
  'Prophet Musa (AS) and the Parting of the Sea',
  'prophet-musa-parting-sea',
  'prophets',
  'Trapped between Pharaoh''s formidable army and the vast Red Sea, Musa (AS) demonstrated unwavering certainty in Allah''s divine promise.',
  'After enduring decades of tyranny in Egypt, Prophet Musa (peace be upon him) led the Children of Israel away under the cover of night. At dawn, Pharaoh and his legion of chariots and armored warriors pursued them fiercely.

As the morning light broke, the Children of Israel stood on the shore of the Red Sea. In front lay deep, impassable waters; behind marched the merciless Egyptian army. In sheer panic, his people cried out: "Indeed, we are doomed!" (Inna lamudrakun).

Musa did not hesitate for a second. With towering faith, he declared: "Never! Indeed, with me is my Lord; He will guide me!" (Kalla! Inna ma''iya Rabbi sayahdeen - Surah Ash-Shu''ara 26:62).

At that very instant, Allah inspired Musa: "Strike the sea with your staff." As the staff made contact with the water, the sea miraculously parted into twelve distinct pathways. Each side towered like a monumental mountain of crystalline water. Musa and his followers crossed over dry ground in peace. When Pharaoh and his soldiers plunged into the sea in reckless pursuit, the waters converged upon them.',
  'Surah Ash-Shu''ara (26:61-67), Surah Ta-Ha (20:77-79)',
  ARRAY['faith', 'musa', 'miracles', 'deliverance'],
  4,
  2
),
(
  'Prophet Yunus (AS) in the Depths: The Supplication of Hope',
  'prophet-yunus-belly-of-whale',
  'prophets',
  'In the triple darkness of night, the sea, and the belly of the whale, Yunus (AS) uttered the supplication that saves believers in distress.',
  'Prophet Yunus (peace be upon him) had called the people of Nineveh to righteousness for years. Frustrated by their obstinate defiance, he departed without waiting for divine permission, boarding a crowded ship out to sea.

A violent tempest arose, threatening to capsize the vessel. The sailors cast lots to determine who must leave the ship to lighten the load; the lot fell three times upon Yunus. Accepting his fate, Yunus cast himself into the tumultuous waves.

By Allah''s decree, a massive whale swallowed him whole, without breaking a bone or harming his flesh. Inside the belly of the creature, in the triple darkness of the night, the abyss of the ocean, and the beast''s interior, Yunus heard the pebbles on the ocean floor glorifying Allah.

Realizing his impatience, Yunus turned his entire soul to Allah and cried out with the timeless prayer: "La ilaha illa Anta, Subhanaka, inni kuntu minaz-zalimeen" (There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers - Surah Al-Anbiya 21:87).

Allah answered his call, commanding the whale to cast him gently onto the shore, and caused a gourd vine to grow over him to shade and nourish his weakened body. The Prophet Muhammad (PBUH) said: "No Muslim supplicates with the prayer of Dhun-Nun (Yunus) in any matter, except that Allah answers him."',
  'Surah Al-Anbiya (21:87-88), Jami` at-Tirmidhi 3505 (Sahih)',
  ARRAY['repentance', 'yunus', 'dua', 'hope'],
  4,
  3
),
(
  'Prophet Yusuf (AS): Patience, Virtue, and Divine Destiny',
  'prophet-yusuf-patience-and-destiny',
  'prophets',
  'From the dark cistern and wrongful imprisonment to minister of Egypt: the supreme lesson that Allah never wastes the reward of the righteous.',
  'The story of Prophet Yusuf (peace be upon him) is described in the Quran as the "Best of Stories" (Ahsan al-Qasas). Betrayed by his envious brothers and cast into a desolate well, sold into servitude for a few dirhams, and wrongfully imprisoned for years after maintaining moral chastity, Yusuf never lost his connection with Allah.

In prison, he interpreted the dreams of his fellow inmates with kindness, always giving credit to his Creator: "That is from what my Lord has taught me." When the King of Egypt dreamt of seven lean cows devouring seven fat ones and seven withered ears of corn, Yusuf provided the economic interpretation and the strategic plan to save the realm from famine.

Exonerated and elevated to the high office of Aziz of Egypt, his brothers eventually traveled to him seeking grain, completely unaware of his identity. When Yusuf revealed himself, rather than retaliating, he offered forgiveness: "No blame will there be upon you today. Allah will forgive you, and He is the most merciful of the merciful."

Yusuf reflected: "Indeed, he who fears Allah and remains patient—Allah does not allow the reward of those who do good to be lost." (Surah Yusuf 12:90).',
  'Surah Yusuf (12:1-101)',
  ARRAY['patience', 'yusuf', 'forgiveness', 'character'],
  6,
  4
),
(
  'The Night Journey (Al-Isra'' wal-Mi''raj) and the Gift of Salah',
  'night-journey-gift-of-salah',
  'prophets',
  'The miraculous celestial journey of Prophet Muhammad (PBUH) from Makkah to Jerusalem, and into the heavens where the five daily prayers were ordained.',
  'During the "Year of Sorrow", following the loss of his beloved wife Khadijah and protector Abu Talib, the Prophet Muhammad (peace and blessings be upon him) was granted the sublime journey of Al-Isra'' wal-Mi''raj.

In the dead of night, the Angel Jibreel brought the celestial steed Al-Buraq. The Prophet traveled instantaneously from Al-Masjid al-Haram in Makkah to Al-Masjid al-Aqsa in Jerusalem, where he led all the prior Prophets in prayer.

Then, ascending through the seven heavens, he met Adam, Yahya, Isa, Yusuf, Idris, Harun, and Ibrahim (peace be upon them all). Finally, he reached Sidrat al-Muntaha (the Lote Tree of the Utmost Boundary), beyond which no created being had passed.

It was in this intimate presence of the Divine that Allah ordained the greatest gift for the Muslim ummah: the daily Salah. Initially mandated as fifty prayers, Musa (AS) advised the Prophet to ask for ease. The obligation was mercifully reduced to five daily prayers, with Allah declaring: "They are five, but they carry the reward of fifty, for My word does not change."

Salah thus became the spiritual ascension (mi''raj) of every believer—a direct meeting with Allah five times each day.',
  'Sahih al-Bukhari 349, Sahih Muslim 162, Surah Al-Isra (17:1)',
  ARRAY['salah', 'prophet-muhammad', 'isra-miraj', 'prayer'],
  5,
  5
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content = EXCLUDED.content,
  source = EXCLUDED.source,
  tags = EXCLUDED.tags,
  read_time_minutes = EXCLUDED.read_time_minutes;

-- Seed 10 Authentic Duas
INSERT INTO public.duas (title, arabic, transliteration, translation, category, source, benefits) VALUES
(
  'Dua for Morning & Evening (Master of Forgiveness - Sayyid al-Istighfar)',
  'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  'Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana ''abduka, wa ana ''ala ''ahdika wa wa''dika mastata''tu, a''udhu bika min sharri ma sana''tu, abu''u laka bini''matika ''alayya, wa abu''u bidhanbi faghfir li fa-innahu la yaghfirudh-dhunuba illa Ant.',
  'O Allah, You are my Lord, there is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your blessing upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.',
  'morning_evening',
  'Sahih al-Bukhari 6306',
  'The Prophet (PBUH) stated that whoever recites this with conviction during the morning or evening and dies that day/night will be among the people of Paradise.'
),
(
  'Dua After Wudu (Purification)',
  'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
  'Ash-hadu alla ilaha illallahu wahdahu la sharika lahu, wa ash-hadu anna Muhammadan ''abduhu wa rasuluh. Allahummaj''alni minat-tawwabina waj''alni minal-mutatahhireen.',
  'I testify that there is no deity except Allah alone, without partner, and I testify that Muhammad is His servant and messenger. O Allah, make me of those who repent and make me of those who purify themselves.',
  'prayer',
  'Sahih Muslim 234, Jami` at-Tirmidhi 55',
  'The eight gates of Paradise are opened for whoever recites this after completing ablution.'
),
(
  'Dua for Entering the Mosque',
  'بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
  'Bismillah, was-salatu was-salamu ''ala Rasulillah. Allahummaftah li abwaba rahmatik.',
  'In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, open for me the gates of Your mercy.',
  'prayer',
  'Sahih Muslim 713',
  'Said upon stepping into the house of Allah with the right foot.'
),
(
  'Dua for Leaving the Mosque',
  'بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
  'Bismillah, was-salatu was-salamu ''ala Rasulillah. Allahumma inni as-aluka min fadlik.',
  'In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, I ask You from Your bounty.',
  'prayer',
  'Sahih Muslim 713',
  'Said upon departing the mosque with the left foot.'
),
(
  'Dua for the Best of This World and the Hereafter',
  'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ''adhaban-nar.',
  'Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.',
  'daily',
  'Surah Al-Baqarah (2:201), Sahih al-Bukhari 6389',
  'The most frequent supplication made by the Prophet Muhammad (peace and blessings be upon him).'
),
(
  'Dua for Parents',
  'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
  'Rabbir-hamhuma kama rabbayani sagheera.',
  'My Lord, have mercy upon them both as they brought me up when I was small.',
  'daily',
  'Surah Al-Isra (17:24)',
  'A Quranic prayer honoring mother and father.'
),
(
  'Dua When in Distress or Anxiety',
  'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
  'La ilaha illa Anta subhanaka inni kuntu minaz-zalimeen.',
  'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
  'forgiveness',
  'Surah Al-Anbiya (21:87), Jami` at-Tirmidhi 3505',
  'The dua of Prophet Yunus (AS) in the belly of the whale; relieves distress when called upon.'
),
(
  'Dua for Steadfastness in Faith and Prayer',
  'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
  'Rabbij''alni muqeemas-salati wa min dhurriyyati, Rabbana wa taqabbal du''a.',
  'My Lord, make me an establisher of prayer, and [many] from my descendants. Our Lord, and accept my supplication.',
  'prayer',
  'Surah Ibrahim (14:40)',
  'The heartfelt prayer of Prophet Ibrahim (AS) for consistency in prayer across generations.'
),
(
  'Dua Before Sleeping',
  'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
  'Bismika Allahumma amutu wa ahya.',
  'In Your name, O Allah, I die and I live.',
  'morning_evening',
  'Sahih al-Bukhari 6312',
  'Recited when retiring to bed at night.'
),
(
  'Dua for Protection from Evil and Harm',
  'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
  'Bismillahil-ladhi la yadurru ma''asmihi shay''un fil-ardi wa la fis-sama''i wa Huwas-Sami''ul-''Aleem.',
  'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
  'morning_evening',
  'Sunan Abi Dawud 5088, Jami` at-Tirmidhi 3388 (Sahih)',
  'Whoever recites this three times in the morning and evening will not be harmed by anything.'
);

-- Seed 10 Authentic Ayahs & Hadiths
INSERT INTO public.daily_content (type, arabic, translation, source, theme, reflection, day_of_year) VALUES
(
  'ayah',
  'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',
  'Indeed, prayer has been decreed upon the believers a decree of specified times.',
  'Surah An-Nisa (4:103)',
  'Importance of Timely Prayer',
  'Prayer anchors our daily schedule around the remembrance of Allah rather than squeezing worship into our worldly calendar.',
  1
),
(
  'hadith',
  'سَأَلْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم أَيُّ الْعَمَلِ أَفْضَلُ قَالَ ‏"‏ الصَّلاَةُ عَلَى مِيقَاتِهَا ‏"‏',
  'I asked the Messenger of Allah (PBUH): "Which deed is the best?" He replied: "To offer the prayers at their early stated, fixed times."',
  'Sahih al-Bukhari 527, Sahih Muslim 85',
  'Virtue of Prayer on Time',
  'Prioritizing prayer the moment the call is made is the most beloved action to the Creator.',
  2
),
(
  'ayah',
  'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
  'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.',
  'Surah Al-Baqarah (2:153)',
  'Patience & Prayer in Hardship',
  'When overwhelmed by worldly trials, find sanctuary in prostration and calm steadfastness.',
  3
),
(
  'hadith',
  'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
  'He who observes the two cold prayers (Fajr and Asr) will enter Paradise.',
  'Sahih al-Bukhari 574, Sahih Muslim 635',
  'Fajr and Asr Protection',
  'Fajr tests our sacrifice of sleep; Asr tests our detachment from mid-day work.',
  4
),
(
  'ayah',
  'وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ',
  'And establish prayer at the two ends of the day and at the approach of the night. Indeed, good deeds do away with misdeeds.',
  'Surah Hud (11:114)',
  'Purification Through Salah',
  'Every genuine prayer washes away minor faults, resetting the soul with light and clarity.',
  5
),
(
  'hadith',
  'أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسًا، مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ... فَذَلِكَ مَثَلُ الصَّلَوَاتِ الْخَمْسِ',
  'Consider this: If there were a river at your doorstep and you bathed in it five times a day, would any dirt remain on you? That is the parable of the five daily prayers: by them Allah wipes away sins.',
  'Sahih al-Bukhari 528, Sahih Muslim 667',
  'The River of Cleansing',
  'Five times each day, a Muslim steps into a spiritual stream of purification.',
  6
),
(
  'ayah',
  'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
  'Surah Ar-Ra''d (13:28)',
  'Tranquility of the Heart',
  'True peace of mind cannot be found in digital distractions or material wealth; it resides in constant remembrance of the Creator.',
  7
),
(
  'hadith',
  'أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ فَأَكْثِرُوا الدُّعَاءَ',
  'The nearest that a servant comes to his Lord is when he is prostrating, so make abundant supplication then.',
  'Sahih Muslim 482',
  'Intimacy of Sujood',
  'The physical act of placing our forehead upon the earth places our soul directly before the throne of Mercy.',
  8
),
(
  'ayah',
  'اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ ۖ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
  'Recite what has been revealed to you of the Book and establish prayer. Indeed, prayer prohibits immorality and wrongdoing.',
  'Surah Al-Ankabut (29:45)',
  'Moral Shield of Prayer',
  'A conscious prayer performed with presence acts as a daily behavioral compass against negative habits.',
  9
),
(
  'hadith',
  'عَجَبًا لأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ... إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ',
  'Wondrous is the affair of the believer, for there is good in every matter. If prosperity comes to him, he gives thanks and that is good for him; and if adversity befalls him, he is patient and that is good for him.',
  'Sahih Muslim 2999',
  'Gratefulness and Sabr',
  'The believer never loses: gratitude in blessing elevates them, and patience in trial purifies them.',
  10
);

-- ----------------------------------------------------------------------------
-- 12. PG_CRON SCHEDULER (Supabase pg_cron + pg_net invocation setup)
-- ----------------------------------------------------------------------------
-- To schedule the send-prayer-reminders Edge function every minute, execute this
-- in the Supabase SQL editor once pg_net and pg_cron are enabled in your project:
--
-- SELECT cron.schedule(
--   'send-prayer-reminders-every-minute',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT-REF>.supabase.co/functions/v1/send-prayer-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
