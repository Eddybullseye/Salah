import { IslamicStory, DuaItem, DailyAyahHadith } from './types';

export const INITIAL_STORIES: IslamicStory[] = [
  {
    id: 'story-1',
    title: 'Prophet Ibrahim (AS): The Search for Truth and Absolute Trust',
    slug: 'prophet-ibrahim-search-for-truth',
    category: 'prophets',
    summary: 'How Ibrahim (AS) contemplated the celestial bodies, reasoned with his people, and placed complete tawakkul in Allah when cast into the fire.',
    content: `Prophet Ibrahim (peace be upon him) grew up in an environment where people carved stone idols with their own hands and worshipped celestial bodies. Gifted with profound intellect and a pure heart (qalb saleem), Ibrahim gazed at the night sky. When he saw a radiant star, he said: "This is my lord!" But when it set, he concluded: "I do not love that which sets." Next, seeing the moon ascending in splendour, he made the same observation, until it too vanished. Then the sun rose in brilliance, yet it set at dusk.

Ibrahim proclaimed to his people: "O my people! I am free from all that you associate with Allah. I have turned my face toward Him who originated the heavens and the earth, upright in devotion."

When Ibrahim smashed the idols in the temple to show their helplessness, the tyrants condemned him to a colossal furnace. Yet, as he was catapulted into the flames, the Angel Jibreel came to him and asked: "Do you have any need?" Ibrahim replied with unshakeable certainty: "From you, no. But from Allah, yes. Sufficient for us is Allah, and He is the best disposer of affairs (Hasbunallahu wa ni'mal wakeel)."

Allah commanded the fire: "O fire! Be cool and peaceful for Ibrahim." (Surah Al-Anbiya 21:69). The blazing furnace became a garden of safety.`,
    source: "Surah Al-An'am (6:74-79), Surah Al-Anbiya (21:51-70), Tafsir Ibn Kathir",
    tags: ['tawakkul', 'prophets', 'monotheism', 'ibrahim'],
    read_time_minutes: 5,
    order_index: 1,
    published: true,
  },
  {
    id: 'story-2',
    title: 'Prophet Musa (AS) and the Parting of the Sea',
    slug: 'prophet-musa-parting-sea',
    category: 'prophets',
    summary: "Trapped between Pharaoh's formidable army and the vast Red Sea, Musa (AS) demonstrated unwavering certainty in Allah's divine promise.",
    content: `After enduring decades of tyranny in Egypt, Prophet Musa (peace be upon him) led the Children of Israel away under the cover of night. At dawn, Pharaoh and his legion of chariots and armored warriors pursued them fiercely.

As the morning light broke, the Children of Israel stood on the shore of the Red Sea. In front lay deep, impassable waters; behind marched the merciless Egyptian army. In sheer panic, his people cried out: "Indeed, we are doomed!" (Inna lamudrakun).

Musa did not hesitate for a second. With towering faith, he declared: "Never! Indeed, with me is my Lord; He will guide me!" (Kalla! Inna ma'iya Rabbi sayahdeen - Surah Ash-Shu'ara 26:62).

At that very instant, Allah inspired Musa: "Strike the sea with your staff." As the staff made contact with the water, the sea miraculously parted into twelve distinct pathways. Each side towered like a monumental mountain of crystalline water. Musa and his followers crossed over dry ground in peace. When Pharaoh and his soldiers plunged into the sea in reckless pursuit, the waters converged upon them.`,
    source: "Surah Ash-Shu'ara (26:61-67), Surah Ta-Ha (20:77-79)",
    tags: ['faith', 'musa', 'miracles', 'deliverance'],
    read_time_minutes: 4,
    order_index: 2,
    published: true,
  },
  {
    id: 'story-3',
    title: 'Prophet Yunus (AS) in the Depths: The Supplication of Hope',
    slug: 'prophet-yunus-belly-of-whale',
    category: 'prophets',
    summary: 'In the triple darkness of night, the sea, and the belly of the whale, Yunus (AS) uttered the supplication that saves believers in distress.',
    content: `Prophet Yunus (peace be upon him) had called the people of Nineveh to righteousness for years. Frustrated by their obstinate defiance, he departed without waiting for divine permission, boarding a crowded ship out to sea.

A violent tempest arose, threatening to capsize the vessel. The sailors cast lots to determine who must leave the ship to lighten the load; the lot fell three times upon Yunus. Accepting his fate, Yunus cast himself into the tumultuous waves.

By Allah's decree, a massive whale swallowed him whole, without breaking a bone or harming his flesh. Inside the belly of the creature, in the triple darkness of the night, the abyss of the ocean, and the beast's interior, Yunus heard the pebbles on the ocean floor glorifying Allah.

Realizing his impatience, Yunus turned his entire soul to Allah and cried out with the timeless prayer: "La ilaha illa Anta, Subhanaka, inni kuntu minaz-zalimeen" (There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers - Surah Al-Anbiya 21:87).

Allah answered his call, commanding the whale to cast him gently onto the shore, and caused a gourd vine to grow over him to shade and nourish his weakened body. The Prophet Muhammad (PBUH) said: "No Muslim supplicates with the prayer of Dhun-Nun (Yunus) in any matter, except that Allah answers him."`,
    source: 'Surah Al-Anbiya (21:87-88), Jami` at-Tirmidhi 3505 (Sahih)',
    tags: ['repentance', 'yunus', 'dua', 'hope'],
    read_time_minutes: 4,
    order_index: 3,
    published: true,
  },
  {
    id: 'story-4',
    title: 'Prophet Yusuf (AS): Patience, Virtue, and Divine Destiny',
    slug: 'prophet-yusuf-patience-and-destiny',
    category: 'prophets',
    summary: 'From the dark cistern and wrongful imprisonment to minister of Egypt: the supreme lesson that Allah never wastes the reward of the righteous.',
    content: `The story of Prophet Yusuf (peace be upon him) is described in the Quran as the "Best of Stories" (Ahsan al-Qasas). Betrayed by his envious brothers and cast into a desolate well, sold into servitude for a few dirhams, and wrongfully imprisoned for years after maintaining moral chastity, Yusuf never lost his connection with Allah.

In prison, he interpreted the dreams of his fellow inmates with kindness, always giving credit to his Creator: "That is from what my Lord has taught me." When the King of Egypt dreamt of seven lean cows devouring seven fat ones and seven withered ears of corn, Yusuf provided the economic interpretation and the strategic plan to save the realm from famine.

Exonerated and elevated to the high office of Aziz of Egypt, his brothers eventually traveled to him seeking grain, completely unaware of his identity. When Yusuf revealed himself, rather than retaliating, he offered forgiveness: "No blame will there be upon you today. Allah will forgive you, and He is the most merciful of the merciful."

Yusuf reflected: "Indeed, he who fears Allah and remains patient—Allah does not allow the reward of those who do good to be lost." (Surah Yusuf 12:90).`,
    source: 'Surah Yusuf (12:1-101)',
    tags: ['patience', 'yusuf', 'forgiveness', 'character'],
    read_time_minutes: 6,
    order_index: 4,
    published: true,
  },
  {
    id: 'story-5',
    title: "The Night Journey (Al-Isra' wal-Mi'raj) and the Gift of Salah",
    slug: 'night-journey-gift-of-salah',
    category: 'prophets',
    summary: 'The miraculous celestial journey of Prophet Muhammad (PBUH) from Makkah to Jerusalem, and into the heavens where the five daily prayers were ordained.',
    content: `During the "Year of Sorrow", following the loss of his beloved wife Khadijah and protector Abu Talib, the Prophet Muhammad (peace and blessings be upon him) was granted the sublime journey of Al-Isra' wal-Mi'raj.

In the dead of night, the Angel Jibreel brought the celestial steed Al-Buraq. The Prophet traveled instantaneously from Al-Masjid al-Haram in Makkah to Al-Masjid al-Aqsa in Jerusalem, where he led all the prior Prophets in prayer.

Then, ascending through the seven heavens, he met Adam, Yahya, Isa, Yusuf, Idris, Harun, and Ibrahim (peace be upon them all). Finally, he reached Sidrat al-Muntaha (the Lote Tree of the Utmost Boundary), beyond which no created being had passed.

It was in this intimate presence of the Divine that Allah ordained the greatest gift for the Muslim ummah: the daily Salah. Initially mandated as fifty prayers, Musa (AS) advised the Prophet to ask for ease. The obligation was mercifully reduced to five daily prayers, with Allah declaring: "They are five, but they carry the reward of fifty, for My word does not change."

Salah thus became the spiritual ascension (mi'raj) of every believer—a direct meeting with Allah five times each day.`,
    source: "Sahih al-Bukhari 349, Sahih Muslim 162, Surah Al-Isra (17:1)",
    tags: ['salah', 'prophet-muhammad', 'isra-miraj', 'prayer'],
    read_time_minutes: 5,
    order_index: 5,
    published: true,
  },
];

export const INITIAL_DUAS: DuaItem[] = [
  {
    id: 'dua-1',
    title: 'Master of Forgiveness (Sayyid al-Istighfar)',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: "Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfir li fa-innahu la yaghfirudh-dhunuba illa Ant.",
    translation: 'O Allah, You are my Lord, there is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your blessing upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.',
    category: 'morning_evening',
    source: 'Sahih al-Bukhari 6306',
    benefits: 'The Prophet (PBUH) stated that whoever recites this with conviction during the morning or evening and dies that day/night will enter Paradise.',
  },
  {
    id: 'dua-2',
    title: 'Dua After Wudu (Purification)',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
    transliteration: "Ash-hadu alla ilaha illallahu wahdahu la sharika lahu, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh. Allahummaj'alni minat-tawwabina waj'alni minal-mutatahhireen.",
    translation: 'I testify that there is no deity except Allah alone, without partner, and I testify that Muhammad is His servant and messenger. O Allah, make me of those who repent and make me of those who purify themselves.',
    category: 'prayer',
    source: 'Sahih Muslim 234, Jami` at-Tirmidhi 55',
    benefits: 'The eight gates of Paradise are opened for whoever recites this after completing ablution.',
  },
  {
    id: 'dua-3',
    title: 'Dua for Entering the Mosque',
    arabic: 'بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: "Bismillah, was-salatu was-salamu 'ala Rasulillah. Allahummaftah li abwaba rahmatik.",
    translation: 'In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, open for me the gates of Your mercy.',
    category: 'prayer',
    source: 'Sahih Muslim 713',
    benefits: 'Recited with step of the right foot upon entering the sanctuary of Allah.',
  },
  {
    id: 'dua-4',
    title: 'Dua for Leaving the Mosque',
    arabic: 'بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: "Bismillah, was-salatu was-salamu 'ala Rasulillah. Allahumma inni as-aluka min fadlik.",
    translation: 'In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, I ask You from Your bounty.',
    category: 'prayer',
    source: 'Sahih Muslim 713',
    benefits: 'Recited with step of the left foot when stepping back into worldly affairs.',
  },
  {
    id: 'dua-5',
    title: 'The Comprehensive Quranic Supplication',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",
    translation: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.',
    category: 'daily',
    source: 'Surah Al-Baqarah (2:201), Sahih al-Bukhari 6389',
    benefits: 'The most frequent supplication uttered by the Prophet Muhammad (PBUH).',
  },
  {
    id: 'dua-6',
    title: 'Dua for Parents',
    arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: 'Rabbir-hamhuma kama rabbayani sagheera.',
    translation: 'My Lord, have mercy upon them both as they brought me up when I was small.',
    category: 'daily',
    source: 'Surah Al-Isra (17:24)',
    benefits: 'Divine prayer honoring parents with mercy in their old age and after passing.',
  },
  {
    id: 'dua-7',
    title: 'Supplication in Distress (Dua of Yunus AS)',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa Anta subhanaka inni kuntu minaz-zalimeen.',
    translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    category: 'forgiveness',
    source: 'Surah Al-Anbiya (21:87), Jami` at-Tirmidhi 3505',
    benefits: 'Relieves distress, hardship, anxiety, and sorrow when called with sincerity.',
  },
  {
    id: 'dua-8',
    title: 'Dua for Steadfastness in Salah',
    arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    transliteration: "Rabbij'alni muqeemas-salati wa min dhurriyyati, Rabbana wa taqabbal du'a.",
    translation: 'My Lord, make me an establisher of prayer, and [many] from my descendants. Our Lord, and accept my supplication.',
    category: 'prayer',
    source: 'Surah Ibrahim (14:40)',
    benefits: 'The prayer of Ibrahim (AS) for steadfastness in worship across families.',
  },
  {
    id: 'dua-9',
    title: 'Dua Before Sleep',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya.',
    translation: 'In Your name, O Allah, I die and I live.',
    category: 'morning_evening',
    source: 'Sahih al-Bukhari 6312',
    benefits: 'Hands over one’s soul to Allah during nocturnal sleep.',
  },
  {
    id: 'dua-10',
    title: 'Dua for Divine Protection',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-'Aleem.",
    translation: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
    category: 'morning_evening',
    source: 'Sunan Abi Dawud 5088, Jami` at-Tirmidhi 3388 (Sahih)',
    benefits: 'Protective shield when recited three times in morning and evening.',
  },
];

export const INITIAL_DAILY_CONTENT: DailyAyahHadith[] = [
  {
    id: 'daily-1',
    type: 'ayah',
    arabic: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',
    translation: 'Indeed, prayer has been decreed upon the believers a decree of specified times.',
    source: 'Surah An-Nisa (4:103)',
    theme: 'Importance of Timely Prayer',
    reflection: 'Prayer anchors our daily schedule around the remembrance of Allah rather than squeezing worship into our worldly calendar.',
    day_of_year: 1,
  },
  {
    id: 'daily-2',
    type: 'hadith',
    arabic: 'سَأَلْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم أَيُّ الْعَمَلِ أَفْضَلُ قَالَ ‏"‏ الصَّلاَةُ عَلَى مِيقَاتِهَا ‏"‏',
    translation: 'I asked the Messenger of Allah (PBUH): "Which deed is the best?" He replied: "To offer the prayers at their early stated, fixed times."',
    source: 'Sahih al-Bukhari 527, Sahih Muslim 85',
    theme: 'Virtue of Prayer on Time',
    reflection: 'Prioritizing prayer the moment the call is made is the most beloved action to the Creator.',
    day_of_year: 2,
  },
  {
    id: 'daily-3',
    type: 'ayah',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.',
    source: 'Surah Al-Baqarah (2:153)',
    theme: 'Patience & Prayer in Hardship',
    reflection: 'When overwhelmed by worldly trials, find sanctuary in prostration and calm steadfastness.',
    day_of_year: 3,
  },
  {
    id: 'daily-4',
    type: 'hadith',
    arabic: 'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
    translation: 'He who observes the two cold prayers (Fajr and Asr) will enter Paradise.',
    source: 'Sahih al-Bukhari 574, Sahih Muslim 635',
    theme: 'Fajr and Asr Protection',
    reflection: 'Fajr tests our sacrifice of sleep; Asr tests our detachment from mid-day work.',
    day_of_year: 4,
  },
  {
    id: 'daily-5',
    type: 'ayah',
    arabic: 'وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ',
    translation: 'And establish prayer at the two ends of the day and at the approach of the night. Indeed, good deeds do away with misdeeds.',
    source: 'Surah Hud (11:114)',
    theme: 'Purification Through Salah',
    reflection: 'Every genuine prayer washes away minor faults, resetting the soul with light and clarity.',
    day_of_year: 5,
  },
  {
    id: 'daily-6',
    type: 'hadith',
    arabic: 'أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسًا، مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ... فَذَلِكَ مَثَلُ الصَّلَوَاتِ الْخَمْسِ',
    translation: 'Consider this: If there were a river at your doorstep and you bathed in it five times a day, would any dirt remain on you? That is the parable of the five daily prayers: by them Allah wipes away sins.',
    source: 'Sahih al-Bukhari 528, Sahih Muslim 667',
    theme: 'The River of Cleansing',
    reflection: 'Five times each day, a Muslim steps into a spiritual stream of purification.',
    day_of_year: 6,
  },
  {
    id: 'daily-7',
    type: 'ayah',
    arabic: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
    source: "Surah Ar-Ra'd (13:28)",
    theme: 'Tranquility of the Heart',
    reflection: 'True peace of mind cannot be found in digital distractions or material wealth; it resides in constant remembrance of the Creator.',
    day_of_year: 7,
  },
  {
    id: 'daily-8',
    type: 'hadith',
    arabic: 'أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ فَأَكْثِرُوا الدُّعَاءَ',
    translation: 'The nearest that a servant comes to his Lord is when he is prostrating, so make abundant supplication then.',
    source: 'Sahih Muslim 482',
    theme: 'Intimacy of Sujood',
    reflection: 'The physical act of placing our forehead upon the earth places our soul directly before the throne of Mercy.',
    day_of_year: 8,
  },
  {
    id: 'daily-9',
    type: 'ayah',
    arabic: 'اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ ۖ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
    translation: 'Recite what has been revealed to you of the Book and establish prayer. Indeed, prayer prohibits immorality and wrongdoing.',
    source: 'Surah Al-Ankabut (29:45)',
    theme: 'Moral Shield of Prayer',
    reflection: 'A conscious prayer performed with presence acts as a daily behavioral compass against negative habits.',
    day_of_year: 9,
  },
  {
    id: 'daily-10',
    type: 'hadith',
    arabic: 'عَجَبًا لأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ... إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ',
    translation: 'Wondrous is the affair of the believer, for there is good in every matter. If prosperity comes to him, he gives thanks and that is good for him; and if adversity befalls him, he is patient and that is good for him.',
    source: 'Sahih Muslim 2999',
    theme: 'Gratefulness and Sabr',
    reflection: 'The believer never loses: gratitude in blessing elevates them, and patience in trial purifies them.',
    day_of_year: 10,
  },
];
