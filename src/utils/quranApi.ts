import { QuranSurah, QuranVerse, QuranTranslation, QuranReciter, QuranTafsir } from '../types';
import { secureLogger } from './secureLogger';
import { networkHandler } from './networkHandler';

// Add console logging for immediate debugging
const debugLog = (message: string, data?: any) => {
  console.log(`🔍 QURAN API DEBUG: ${message}`, data || '');
  secureLogger.info(message, data || {});
};

const debugError = (message: string, error?: any) => {
  console.error(`❌ QURAN API ERROR: ${message}`, error || '');
  secureLogger.error(message, error || {});
};

// API Configuration
const QURAN_API_CONFIG = {
  BASE_URL: 'https://api.alquran.cloud/v1',
  QURAN_COM_API: 'https://api.quran.com/api/v4',
  EVERY_AYAH_API: 'https://www.everyayah.com/data',
  BACKUP_API: 'https://api.quran.sutanlab.id',
};

// Surah metadata (114 surahs)
export const SURAH_METADATA: Omit<QuranSurah, 'verses'>[] = [
  { id: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', meaning: 'The Opening', totalVerses: 7, revelationType: 'meccan', revelationOrder: 5, bismillahPre: true },
  { id: 2, name: 'البقرة', englishName: 'Al-Baqarah', meaning: 'The Cow', totalVerses: 286, revelationType: 'medinan', revelationOrder: 87, bismillahPre: true },
  { id: 3, name: 'آل عمران', englishName: 'Ali \'Imran', meaning: 'Family of Imran', totalVerses: 200, revelationType: 'medinan', revelationOrder: 89, bismillahPre: true },
  { id: 4, name: 'النساء', englishName: 'An-Nisa', meaning: 'The Women', totalVerses: 176, revelationType: 'medinan', revelationOrder: 92, bismillahPre: true },
  { id: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', meaning: 'The Table Spread', totalVerses: 120, revelationType: 'medinan', revelationOrder: 112, bismillahPre: true },
  { id: 6, name: 'الأنعام', englishName: 'Al-An\'am', meaning: 'The Cattle', totalVerses: 165, revelationType: 'meccan', revelationOrder: 55, bismillahPre: true },
  { id: 7, name: 'الأعراف', englishName: 'Al-A\'raf', meaning: 'The Heights', totalVerses: 206, revelationType: 'meccan', revelationOrder: 39, bismillahPre: true },
  { id: 8, name: 'الأنفال', englishName: 'Al-Anfal', meaning: 'The Spoils of War', totalVerses: 75, revelationType: 'medinan', revelationOrder: 88, bismillahPre: true },
  { id: 9, name: 'التوبة', englishName: 'At-Tawbah', meaning: 'The Repentance', totalVerses: 129, revelationType: 'medinan', revelationOrder: 113, bismillahPre: false },
  { id: 10, name: 'يونس', englishName: 'Yunus', meaning: 'Jonah', totalVerses: 109, revelationType: 'meccan', revelationOrder: 51, bismillahPre: true },
  { id: 11, name: 'هود', englishName: 'Hud', meaning: 'Hud', totalVerses: 123, revelationType: 'meccan', revelationOrder: 52, bismillahPre: true },
  { id: 12, name: 'يوسف', englishName: 'Yusuf', meaning: 'Joseph', totalVerses: 111, revelationType: 'meccan', revelationOrder: 53, bismillahPre: true },
  { id: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', meaning: 'The Thunder', totalVerses: 43, revelationType: 'medinan', revelationOrder: 96, bismillahPre: true },
  { id: 14, name: 'إبراهيم', englishName: 'Ibrahim', meaning: 'Abraham', totalVerses: 52, revelationType: 'meccan', revelationOrder: 72, bismillahPre: true },
  { id: 15, name: 'الحجر', englishName: 'Al-Hijr', meaning: 'The Rocky Tract', totalVerses: 99, revelationType: 'meccan', revelationOrder: 54, bismillahPre: true },
  { id: 16, name: 'النحل', englishName: 'An-Nahl', meaning: 'The Bee', totalVerses: 128, revelationType: 'meccan', revelationOrder: 70, bismillahPre: true },
  { id: 17, name: 'الإسراء', englishName: 'Al-Isra', meaning: 'The Night Journey', totalVerses: 111, revelationType: 'meccan', revelationOrder: 50, bismillahPre: true },
  { id: 18, name: 'الكهف', englishName: 'Al-Kahf', meaning: 'The Cave', totalVerses: 110, revelationType: 'meccan', revelationOrder: 69, bismillahPre: true },
  { id: 19, name: 'مريم', englishName: 'Maryam', meaning: 'Mary', totalVerses: 98, revelationType: 'meccan', revelationOrder: 44, bismillahPre: true },
  { id: 20, name: 'طه', englishName: 'Taha', meaning: 'Ta-Ha', totalVerses: 135, revelationType: 'meccan', revelationOrder: 45, bismillahPre: true },
  { id: 21, name: 'الأنبياء', englishName: 'Al-Anbya', meaning: 'The Prophets', totalVerses: 112, revelationType: 'meccan', revelationOrder: 73, bismillahPre: true },
  { id: 22, name: 'الحج', englishName: 'Al-Hajj', meaning: 'The Pilgrimage', totalVerses: 78, revelationType: 'medinan', revelationOrder: 103, bismillahPre: true },
  { id: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', meaning: 'The Believers', totalVerses: 118, revelationType: 'meccan', revelationOrder: 74, bismillahPre: true },
  { id: 24, name: 'النور', englishName: 'An-Nur', meaning: 'The Light', totalVerses: 64, revelationType: 'medinan', revelationOrder: 102, bismillahPre: true },
  { id: 25, name: 'الفرقان', englishName: 'Al-Furqan', meaning: 'The Criterion', totalVerses: 77, revelationType: 'meccan', revelationOrder: 42, bismillahPre: true },
  { id: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', meaning: 'The Poets', totalVerses: 227, revelationType: 'meccan', revelationOrder: 47, bismillahPre: true },
  { id: 27, name: 'النمل', englishName: 'An-Naml', meaning: 'The Ant', totalVerses: 93, revelationType: 'meccan', revelationOrder: 48, bismillahPre: true },
  { id: 28, name: 'القصص', englishName: 'Al-Qasas', meaning: 'The Stories', totalVerses: 88, revelationType: 'meccan', revelationOrder: 49, bismillahPre: true },
  { id: 29, name: 'العنكبوت', englishName: 'Al-\'Ankabut', meaning: 'The Spider', totalVerses: 69, revelationType: 'meccan', revelationOrder: 85, bismillahPre: true },
  { id: 30, name: 'الروم', englishName: 'Ar-Rum', meaning: 'The Romans', totalVerses: 60, revelationType: 'meccan', revelationOrder: 84, bismillahPre: true },
  { id: 31, name: 'لقمان', englishName: 'Luqman', meaning: 'Luqman', totalVerses: 34, revelationType: 'meccan', revelationOrder: 57, bismillahPre: true },
  { id: 32, name: 'السجدة', englishName: 'As-Sajdah', meaning: 'The Prostration', totalVerses: 30, revelationType: 'meccan', revelationOrder: 75, bismillahPre: true },
  { id: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', meaning: 'The Clans', totalVerses: 73, revelationType: 'medinan', revelationOrder: 90, bismillahPre: true },
  { id: 34, name: 'سبأ', englishName: 'Saba', meaning: 'Sheba', totalVerses: 54, revelationType: 'meccan', revelationOrder: 58, bismillahPre: true },
  { id: 35, name: 'فاطر', englishName: 'Fatir', meaning: 'Originator', totalVerses: 45, revelationType: 'meccan', revelationOrder: 43, bismillahPre: true },
  { id: 36, name: 'يس', englishName: 'Ya-Sin', meaning: 'Ya Sin', totalVerses: 83, revelationType: 'meccan', revelationOrder: 41, bismillahPre: true },
  { id: 37, name: 'الصافات', englishName: 'As-Saffat', meaning: 'Those who set the Ranks', totalVerses: 182, revelationType: 'meccan', revelationOrder: 56, bismillahPre: true },
  { id: 38, name: 'ص', englishName: 'Sad', meaning: 'The Letter Sad', totalVerses: 88, revelationType: 'meccan', revelationOrder: 38, bismillahPre: true },
  { id: 39, name: 'الزمر', englishName: 'Az-Zumar', meaning: 'The Troops', totalVerses: 75, revelationType: 'meccan', revelationOrder: 59, bismillahPre: true },
  { id: 40, name: 'غافر', englishName: 'Ghafir', meaning: 'The Forgiver', totalVerses: 85, revelationType: 'meccan', revelationOrder: 60, bismillahPre: true },
  { id: 41, name: 'فصلت', englishName: 'Fussilat', meaning: 'Explained in Detail', totalVerses: 54, revelationType: 'meccan', revelationOrder: 61, bismillahPre: true },
  { id: 42, name: 'الشورى', englishName: 'Ash-Shuraa', meaning: 'The Consultation', totalVerses: 53, revelationType: 'meccan', revelationOrder: 62, bismillahPre: true },
  { id: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', meaning: 'The Ornaments of Gold', totalVerses: 89, revelationType: 'meccan', revelationOrder: 63, bismillahPre: true },
  { id: 44, name: 'الدخان', englishName: 'Ad-Dukhan', meaning: 'The Smoke', totalVerses: 59, revelationType: 'meccan', revelationOrder: 64, bismillahPre: true },
  { id: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', meaning: 'The Crouching', totalVerses: 37, revelationType: 'meccan', revelationOrder: 65, bismillahPre: true },
  { id: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', meaning: 'The Wind-Curved Sandhills', totalVerses: 35, revelationType: 'meccan', revelationOrder: 66, bismillahPre: true },
  { id: 47, name: 'محمد', englishName: 'Muhammad', meaning: 'Muhammad', totalVerses: 38, revelationType: 'medinan', revelationOrder: 95, bismillahPre: true },
  { id: 48, name: 'الفتح', englishName: 'Al-Fath', meaning: 'The Victory', totalVerses: 29, revelationType: 'medinan', revelationOrder: 111, bismillahPre: true },
  { id: 49, name: 'الحجرات', englishName: 'Al-Hujurat', meaning: 'The Rooms', totalVerses: 18, revelationType: 'medinan', revelationOrder: 106, bismillahPre: true },
  { id: 50, name: 'ق', englishName: 'Qaf', meaning: 'The Letter Qaf', totalVerses: 45, revelationType: 'meccan', revelationOrder: 34, bismillahPre: true },
  { id: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', meaning: 'The Winnowing Winds', totalVerses: 60, revelationType: 'meccan', revelationOrder: 67, bismillahPre: true },
  { id: 52, name: 'الطور', englishName: 'At-Tur', meaning: 'The Mount', totalVerses: 49, revelationType: 'meccan', revelationOrder: 76, bismillahPre: true },
  { id: 53, name: 'النجم', englishName: 'An-Najm', meaning: 'The Star', totalVerses: 62, revelationType: 'meccan', revelationOrder: 23, bismillahPre: true },
  { id: 54, name: 'القمر', englishName: 'Al-Qamar', meaning: 'The Moon', totalVerses: 55, revelationType: 'meccan', revelationOrder: 37, bismillahPre: true },
  { id: 55, name: 'الرحمن', englishName: 'Ar-Rahman', meaning: 'The Beneficent', totalVerses: 78, revelationType: 'medinan', revelationOrder: 97, bismillahPre: true },
  { id: 56, name: 'الواقعة', englishName: 'Al-Waqi\'ah', meaning: 'The Inevitable', totalVerses: 96, revelationType: 'meccan', revelationOrder: 46, bismillahPre: true },
  { id: 57, name: 'الحديد', englishName: 'Al-Hadid', meaning: 'The Iron', totalVerses: 29, revelationType: 'medinan', revelationOrder: 94, bismillahPre: true },
  { id: 58, name: 'المجادلة', englishName: 'Al-Mujadilah', meaning: 'The Pleading Woman', totalVerses: 22, revelationType: 'medinan', revelationOrder: 105, bismillahPre: true },
  { id: 59, name: 'الحشر', englishName: 'Al-Hashr', meaning: 'The Exile', totalVerses: 24, revelationType: 'medinan', revelationOrder: 101, bismillahPre: true },
  { id: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', meaning: 'She that is to be examined', totalVerses: 13, revelationType: 'medinan', revelationOrder: 91, bismillahPre: true },
  { id: 61, name: 'الصف', englishName: 'As-Saff', meaning: 'The Ranks', totalVerses: 14, revelationType: 'medinan', revelationOrder: 109, bismillahPre: true },
  { id: 62, name: 'الجمعة', englishName: 'Al-Jumu\'ah', meaning: 'Friday', totalVerses: 11, revelationType: 'medinan', revelationOrder: 110, bismillahPre: true },
  { id: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', meaning: 'The Hypocrites', totalVerses: 11, revelationType: 'medinan', revelationOrder: 104, bismillahPre: true },
  { id: 64, name: 'التغابن', englishName: 'At-Taghabun', meaning: 'The Mutual Disillusion', totalVerses: 18, revelationType: 'medinan', revelationOrder: 108, bismillahPre: true },
  { id: 65, name: 'الطلاق', englishName: 'At-Talaq', meaning: 'The Divorce', totalVerses: 12, revelationType: 'medinan', revelationOrder: 99, bismillahPre: true },
  { id: 66, name: 'التحريم', englishName: 'At-Tahrim', meaning: 'The Prohibition', totalVerses: 12, revelationType: 'medinan', revelationOrder: 107, bismillahPre: true },
  { id: 67, name: 'الملك', englishName: 'Al-Mulk', meaning: 'The Sovereignty', totalVerses: 30, revelationType: 'meccan', revelationOrder: 77, bismillahPre: true },
  { id: 68, name: 'القلم', englishName: 'Al-Qalam', meaning: 'The Pen', totalVerses: 52, revelationType: 'meccan', revelationOrder: 2, bismillahPre: true },
  { id: 69, name: 'الحاقة', englishName: 'Al-Haqqah', meaning: 'The Reality', totalVerses: 52, revelationType: 'meccan', revelationOrder: 78, bismillahPre: true },
  { id: 70, name: 'المعارج', englishName: 'Al-Ma\'arij', meaning: 'The Ascending Stairways', totalVerses: 44, revelationType: 'meccan', revelationOrder: 79, bismillahPre: true },
  { id: 71, name: 'نوح', englishName: 'Nuh', meaning: 'Noah', totalVerses: 28, revelationType: 'meccan', revelationOrder: 71, bismillahPre: true },
  { id: 72, name: 'الجن', englishName: 'Al-Jinn', meaning: 'The Jinn', totalVerses: 28, revelationType: 'meccan', revelationOrder: 40, bismillahPre: true },
  { id: 73, name: 'المزمل', englishName: 'Al-Muzzammil', meaning: 'The Enshrouded One', totalVerses: 20, revelationType: 'meccan', revelationOrder: 3, bismillahPre: true },
  { id: 74, name: 'المدثر', englishName: 'Al-Muddaththir', meaning: 'The Cloaked One', totalVerses: 56, revelationType: 'meccan', revelationOrder: 4, bismillahPre: true },
  { id: 75, name: 'القيامة', englishName: 'Al-Qiyamah', meaning: 'The Resurrection', totalVerses: 40, revelationType: 'meccan', revelationOrder: 31, bismillahPre: true },
  { id: 76, name: 'الإنسان', englishName: 'Al-Insan', meaning: 'The Human', totalVerses: 31, revelationType: 'medinan', revelationOrder: 98, bismillahPre: true },
  { id: 77, name: 'المرسلات', englishName: 'Al-Mursalat', meaning: 'The Emissaries', totalVerses: 50, revelationType: 'meccan', revelationOrder: 33, bismillahPre: true },
  { id: 78, name: 'النبأ', englishName: 'An-Naba', meaning: 'The Tidings', totalVerses: 40, revelationType: 'meccan', revelationOrder: 80, bismillahPre: true },
  { id: 79, name: 'النازعات', englishName: 'An-Nazi\'at', meaning: 'Those who drag forth', totalVerses: 46, revelationType: 'meccan', revelationOrder: 81, bismillahPre: true },
  { id: 80, name: 'عبس', englishName: '\'Abasa', meaning: 'He Frowned', totalVerses: 42, revelationType: 'meccan', revelationOrder: 24, bismillahPre: true },
  { id: 81, name: 'التكوير', englishName: 'At-Takwir', meaning: 'The Overthrowing', totalVerses: 29, revelationType: 'meccan', revelationOrder: 7, bismillahPre: true },
  { id: 82, name: 'الانفطار', englishName: 'Al-Infitar', meaning: 'The Cleaving', totalVerses: 19, revelationType: 'meccan', revelationOrder: 82, bismillahPre: true },
  { id: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', meaning: 'The Defrauding', totalVerses: 36, revelationType: 'meccan', revelationOrder: 86, bismillahPre: true },
  { id: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', meaning: 'The Sundering', totalVerses: 25, revelationType: 'meccan', revelationOrder: 83, bismillahPre: true },
  { id: 85, name: 'البروج', englishName: 'Al-Buruj', meaning: 'The Mansions of the Stars', totalVerses: 22, revelationType: 'meccan', revelationOrder: 27, bismillahPre: true },
  { id: 86, name: 'الطارق', englishName: 'At-Tariq', meaning: 'The Morning Star', totalVerses: 17, revelationType: 'meccan', revelationOrder: 36, bismillahPre: true },
  { id: 87, name: 'الأعلى', englishName: 'Al-A\'la', meaning: 'The Most High', totalVerses: 19, revelationType: 'meccan', revelationOrder: 8, bismillahPre: true },
  { id: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', meaning: 'The Overwhelming', totalVerses: 26, revelationType: 'meccan', revelationOrder: 68, bismillahPre: true },
  { id: 89, name: 'الفجر', englishName: 'Al-Fajr', meaning: 'The Dawn', totalVerses: 30, revelationType: 'meccan', revelationOrder: 10, bismillahPre: true },
  { id: 90, name: 'البلد', englishName: 'Al-Balad', meaning: 'The City', totalVerses: 20, revelationType: 'meccan', revelationOrder: 35, bismillahPre: true },
  { id: 91, name: 'الشمس', englishName: 'Ash-Shams', meaning: 'The Sun', totalVerses: 15, revelationType: 'meccan', revelationOrder: 26, bismillahPre: true },
  { id: 92, name: 'الليل', englishName: 'Al-Layl', meaning: 'The Night', totalVerses: 21, revelationType: 'meccan', revelationOrder: 9, bismillahPre: true },
  { id: 93, name: 'الضحى', englishName: 'Ad-Duhaa', meaning: 'The Morning Hours', totalVerses: 11, revelationType: 'meccan', revelationOrder: 11, bismillahPre: true },
  { id: 94, name: 'الشرح', englishName: 'Ash-Sharh', meaning: 'The Relief', totalVerses: 8, revelationType: 'meccan', revelationOrder: 12, bismillahPre: true },
  { id: 95, name: 'التين', englishName: 'At-Tin', meaning: 'The Fig', totalVerses: 8, revelationType: 'meccan', revelationOrder: 28, bismillahPre: true },
  { id: 96, name: 'العلق', englishName: 'Al-\'Alaq', meaning: 'The Clot', totalVerses: 19, revelationType: 'meccan', revelationOrder: 1, bismillahPre: true },
  { id: 97, name: 'القدر', englishName: 'Al-Qadr', meaning: 'The Power', totalVerses: 5, revelationType: 'meccan', revelationOrder: 25, bismillahPre: true },
  { id: 98, name: 'البينة', englishName: 'Al-Bayyinah', meaning: 'The Evidence', totalVerses: 8, revelationType: 'medinan', revelationOrder: 100, bismillahPre: true },
  { id: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', meaning: 'The Earthquake', totalVerses: 8, revelationType: 'medinan', revelationOrder: 93, bismillahPre: true },
  { id: 100, name: 'العاديات', englishName: 'Al-\'Adiyat', meaning: 'The Courser', totalVerses: 11, revelationType: 'meccan', revelationOrder: 14, bismillahPre: true },
  { id: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', meaning: 'The Calamity', totalVerses: 11, revelationType: 'meccan', revelationOrder: 30, bismillahPre: true },
  { id: 102, name: 'التكاثر', englishName: 'At-Takathur', meaning: 'The Rivalry in world increase', totalVerses: 8, revelationType: 'meccan', revelationOrder: 16, bismillahPre: true },
  { id: 103, name: 'العصر', englishName: 'Al-\'Asr', meaning: 'The Declining Day', totalVerses: 3, revelationType: 'meccan', revelationOrder: 13, bismillahPre: true },
  { id: 104, name: 'الهمزة', englishName: 'Al-Humazah', meaning: 'The Traducer', totalVerses: 9, revelationType: 'meccan', revelationOrder: 32, bismillahPre: true },
  { id: 105, name: 'الفيل', englishName: 'Al-Fil', meaning: 'The Elephant', totalVerses: 5, revelationType: 'meccan', revelationOrder: 19, bismillahPre: true },
  { id: 106, name: 'قريش', englishName: 'Quraysh', meaning: 'Quraysh', totalVerses: 4, revelationType: 'meccan', revelationOrder: 29, bismillahPre: true },
  { id: 107, name: 'الماعون', englishName: 'Al-Ma\'un', meaning: 'The Small kindnesses', totalVerses: 7, revelationType: 'meccan', revelationOrder: 17, bismillahPre: true },
  { id: 108, name: 'الكوثر', englishName: 'Al-Kawthar', meaning: 'The Abundance', totalVerses: 3, revelationType: 'meccan', revelationOrder: 15, bismillahPre: true },
  { id: 109, name: 'الكافرون', englishName: 'Al-Kafirun', meaning: 'The Disbelievers', totalVerses: 6, revelationType: 'meccan', revelationOrder: 18, bismillahPre: true },
  { id: 110, name: 'النصر', englishName: 'An-Nasr', meaning: 'The Divine Support', totalVerses: 3, revelationType: 'medinan', revelationOrder: 114, bismillahPre: true },
  { id: 111, name: 'المسد', englishName: 'Al-Masad', meaning: 'The Palm Fibre', totalVerses: 5, revelationType: 'meccan', revelationOrder: 6, bismillahPre: true },
  { id: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', meaning: 'The Sincerity', totalVerses: 4, revelationType: 'meccan', revelationOrder: 22, bismillahPre: true },
  { id: 113, name: 'الفلق', englishName: 'Al-Falaq', meaning: 'The Daybreak', totalVerses: 5, revelationType: 'meccan', revelationOrder: 20, bismillahPre: true },
  { id: 114, name: 'الناس', englishName: 'An-Nas', meaning: 'Mankind', totalVerses: 6, revelationType: 'meccan', revelationOrder: 21, bismillahPre: true },
];

// Popular translations
export const AVAILABLE_TRANSLATIONS: QuranTranslation[] = [
  {
    id: 'en_sahih',
    name: 'Sahih International',
    author: 'Sahih International',
    language: 'English',
    languageCode: 'en',
    isDefault: true,
  },
  {
    id: 'en_pickthall',
    name: 'Pickthall',
    author: 'Mohammed Marmaduke William Pickthall',
    language: 'English',
    languageCode: 'en',
  },
  {
    id: 'en_yusufali',
    name: 'Yusuf Ali',
    author: 'Abdullah Yusuf Ali',
    language: 'English',
    languageCode: 'en',
  },
  {
    id: 'en_shakir',
    name: 'Shakir',
    author: 'M. H. Shakir',
    language: 'English',
    languageCode: 'en',
  },
  {
    id: 'en_hilali',
    name: 'Hilali & Khan',
    author: 'Muhammad Taqi-ud-Din al-Hilali and Muhammad Muhsin Khan',
    language: 'English',
    languageCode: 'en',
  },
  {
    id: 'ar_quran_simple',
    name: 'القرآن الكريم',
    author: 'Arabic Original',
    language: 'Arabic',
    languageCode: 'ar',
  },
];

// Popular reciters
export const AVAILABLE_RECITERS: QuranReciter[] = [
  {
    id: 'mishary_rashid_alafasy',
    name: 'Mishary Rashid Alafasy',
    language: 'Arabic',
    style: 'murattal',
    audioQuality: 'high',
    baseUrl: 'https://www.everyayah.com/data/Mishary_Rashid_Alafasy_128kbps',
  },
  {
    id: 'abdul_basit_murattal',
    name: 'Abdul Basit Abdul Samad (Murattal)',
    language: 'Arabic',
    style: 'murattal',
    audioQuality: 'high',
    baseUrl: 'https://www.everyayah.com/data/Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'abdul_basit_mujawwad',
    name: 'Abdul Basit Abdul Samad (Mujawwad)',
    language: 'Arabic',
    style: 'murattal',
    audioQuality: 'high',
    baseUrl: 'https://www.everyayah.com/data/Abdul_Basit_Mujawwad_128kbps',
  },
  {
    id: 'maher_almuaiqly',
    name: 'Maher Al Muaiqly',
    language: 'Arabic',
    style: 'murattal',
    audioQuality: 'high',
    baseUrl: 'https://www.everyayah.com/data/Maher_AlMuaiqly_128kbps',
  },
  {
    id: 'saad_alghamdi',
    name: 'Saad Al Ghamdi',
    language: 'Arabic',
    style: 'murattal',
    audioQuality: 'high',
    baseUrl: 'https://www.everyayah.com/data/Saad_Al_Ghamdi_128kbps',
  },
  {
    id: 'sudais_shuraim',
    name: 'Sudais & Shuraim',
    language: 'Arabic',
    style: 'murattal',
    audioQuality: 'high',
    baseUrl: 'https://www.everyayah.com/data/Sudais_and_Shuraim_128kbps',
  },
];

// Quran API service class
export class QuranApiService {
  private static instance: QuranApiService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  static getInstance(): QuranApiService {
    if (!QuranApiService.instance) {
      QuranApiService.instance = new QuranApiService();
    }
    return QuranApiService.instance;
  }

  // Test API connectivity
  async testConnectivity(): Promise<{ [key: string]: boolean }> {
    debugLog('🚀 Starting API connectivity test');
    const testEndpoints = [
      { name: 'AlQuran.cloud', url: `${QURAN_API_CONFIG.BASE_URL}/meta` },
      { name: 'Quran.com', url: `${QURAN_API_CONFIG.QURAN_COM_API}/chapters` },
    ];

    const results: { [key: string]: boolean } = {};

    for (const endpoint of testEndpoints) {
      try {
        debugLog(`Testing API connectivity for ${endpoint.name}`, { url: endpoint.url });
        
        // Use standard fetch instead of networkHandler.fetch to avoid potential issues
        const response = await fetch(endpoint.url, {
          headers: { 'Accept': 'application/json' },
          method: 'GET'
        });
        
        results[endpoint.name] = response.ok;
        debugLog(`API connectivity test result for ${endpoint.name}`, { 
          success: response.ok,
          status: response.status
        });
      } catch (error: unknown) {
        results[endpoint.name] = false;
        debugError(`API connectivity test failed for ${endpoint.name}`, { 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    debugLog('API connectivity test completed', results);
    return results;
  }

  private async fetchWithFallback(endpoints: string[]): Promise<any> {
    debugLog('Starting API fallback fetch', { 
      endpointCount: endpoints.length,
      endpoints: endpoints.map(e => e.substring(0, 50) + '...')
    });

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      try {
        debugLog(`Attempting API call ${i + 1}/${endpoints.length}`, { 
          endpoint: endpoint.substring(0, 100) + '...',
          attempt: i + 1
        });

        const startTime = Date.now();
        
        // Use standard fetch with timeout to ensure it works
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'QuranApp/1.0'
          },
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        debugLog(`API call completed`, { 
          endpoint: endpoint.substring(0, 50) + '...',
          status: response.status,
          ok: response.ok,
          duration: `${duration}ms`,
          attempt: i + 1
        });

        if (response.ok) {
          const data = await response.json();
          
          // Log the FULL API response structure for debugging
          debugLog(`🔍 COMPLETE API RESPONSE STRUCTURE:`, {
            endpoint: endpoint.substring(0, 80),
            responseSize: JSON.stringify(data).length,
            fullResponseData: data, // Log the complete response
            attempt: i + 1
          });
          
          debugLog(`API call successful`, { 
            endpoint: endpoint.substring(0, 50) + '...',
            dataSize: JSON.stringify(data).length,
            hasData: !!data,
            dataKeys: data ? Object.keys(data).slice(0, 10) : [],
            attempt: i + 1
          });
          return data;
        } else {
          debugError(`API call failed with status`, { 
            endpoint: endpoint.substring(0, 50) + '...',
            status: response.status,
            statusText: response.statusText,
            attempt: i + 1
          });
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          debugError(`API call timeout`, { 
            endpoint: endpoint.substring(0, 50) + '...',
            attempt: i + 1
          });
        } else {
          debugError(`API call error`, { 
            endpoint: endpoint.substring(0, 50) + '...',
            error: error.message || String(error),
            attempt: i + 1
          });
        }
        continue;
      }
    }
    
    debugError('All API endpoints failed', { 
      totalAttempts: endpoints.length,
      endpoints: endpoints.map(e => e.substring(0, 50) + '...')
    });
    throw new Error('All API endpoints failed');
  }

  private getCacheKey(key: string): string {
    return `quran_api_${key}`;
  }

  private async getFromCache(key: string): Promise<any | null> {
    const cacheKey = this.getCacheKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    this.cache.delete(cacheKey);
    return null;
  }

  private async setCache(key: string, data: any): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  // Get all surahs with basic info
  async getSurahs(): Promise<QuranSurah[]> {
    const cacheKey = 'surahs_list';
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // For demo purposes, return metadata with mock success
      const surahs = SURAH_METADATA.map(surah => ({ ...surah, verses: [] }));
      await this.setCache(cacheKey, surahs);
      debugLog('Surahs loaded successfully', { count: surahs.length });
      return surahs;
    } catch (error: unknown) {
      debugError('Error fetching surahs', error instanceof Error ? error.message : String(error));
      // Return metadata as fallback
      return SURAH_METADATA.map(surah => ({ ...surah, verses: [] }));
    }
  }

  // Get specific surah with verses
  async getSurah(surahNumber: number, translationId: string = 'en_sahih'): Promise<QuranSurah> {
    debugLog('Starting getSurah request', { 
      surahNumber, 
      translationId,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      const error = new Error(`Invalid surah number: ${surahNumber}`);
      debugError('Invalid surah number provided', { surahNumber });
      throw error;
    }

    const cacheKey = `surah_${surahNumber}_${translationId}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      debugLog('Returning cached surah data', { 
        surahNumber, 
        verses: cached.verses?.length || 0,
        cacheKey 
      });
      return cached;
    }

    try {
      // Try to fetch from real API first - Use simpler, more reliable endpoints
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/surah/${surahNumber}`, // Just Arabic text first
        `${QURAN_API_CONFIG.QURAN_COM_API}/chapters/${surahNumber}/verses?language=en&translations=131`, // Quran.com with Sahih International
      ];

      debugLog('Attempting API calls for surah', { 
        surahNumber,
        translationId,
        endpoints: endpoints.map(e => e.substring(0, 80) + '...')
      });

      let apiSuccess = false;
      let surah: QuranSurah | null = null;

      try {
        const response = await this.fetchWithFallback(endpoints);
        
        debugLog('🔍 DETAILED API RESPONSE ANALYSIS:', { 
          surahNumber,
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : [],
          responseType: typeof response,
          fullResponse: response, // Log complete response for debugging
          hasData: !!response?.data,
          dataKeys: response?.data ? Object.keys(response.data) : [],
          hasAyahs: !!response?.data?.ayahs,
          ayahsCount: response?.data?.ayahs?.length || 0,
          hasVerses: !!response?.verses,
          versesCount: response?.verses?.length || 0,
          hasTranslations: !!response?.translations,
          translationsCount: response?.translations?.length || 0
        });

        // Parse API response based on data structure
        if (response && response.data && response.data.ayahs) {
          // Al-Quran Cloud format (single edition)
          debugLog('✅ Parsing Al-Quran Cloud single edition format', { 
            surahNumber,
            ayahsCount: response.data.ayahs.length,
            surahName: response.data.englishName
          });

          // Try to get translation separately
          let translationResponse: any = null;
          try {
            debugLog('🔄 Fetching translation separately...', { surahNumber, translationId });
            const translationEndpoint = `${QURAN_API_CONFIG.BASE_URL}/surah/${surahNumber}/en.sahih`;
            
            // Use standard fetch instead of networkHandler to avoid potential issues
            const response = await fetch(translationEndpoint, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'QuranApp/1.0'
              },
              method: 'GET'
            });
            
            if (response.ok) {
              translationResponse = await response.json();
              debugLog('✅ Translation fetched successfully', { 
                surahNumber,
                translationVersesCount: translationResponse?.data?.ayahs?.length || 0,
                translationStructure: JSON.stringify(translationResponse).substring(0, 200)
              });
            }
          } catch (translationError: unknown) {
            debugLog('⚠️ Failed to fetch translation separately', { 
              error: translationError instanceof Error ? translationError.message : String(translationError),
              surahNumber,
              translationId
            });
          }

          const verses: QuranVerse[] = response.data.ayahs.map((ayah: any, index: number) => {
            const translationVerse = translationResponse?.data?.ayahs?.[index];
            
            // Better fallback translations based on actual Quranic content
            let fallbackTranslation = '';
            if (surahNumber === 1) {
              const alFatihahTranslations = [
                'In the name of Allah, the Most Gracious, the Most Merciful',
                'Praise be to Allah, the Lord of all the worlds',
                'The Most Gracious, the Most Merciful',
                'Master of the Day of Judgment',
                'You alone we worship, and You alone we ask for help',
                'Guide us to the straight path',
                'The path of those upon whom You have bestowed favor, not of those who have evoked Your anger or of those who are astray'
              ];
              fallbackTranslation = alFatihahTranslations[index] || `Verse ${ayah.numberInSurah} translation`;
            } else {
              fallbackTranslation = `"And it is He who created the heavens and earth in truth. And the day He says, 'Be,' and it is, His word is the truth." - Example translation for ${surahNumber}:${ayah.numberInSurah}`;
            }
            
            return {
              id: `${surahNumber}:${ayah.numberInSurah}`,
              verseNumber: ayah.numberInSurah,
              text: ayah.text,
              translation: translationVerse?.text || fallbackTranslation,
              transliteration: '',
              page: ayah.page,
              juz: ayah.juz,
              hizb: ayah.hizbQuarter,
              rukuNumber: ayah.ruku,
              manzil: ayah.manzil,
              sajda: ayah.sajda,
              audioUrl: this.getAudioUrl(surahNumber, ayah.numberInSurah, 'mishary_rashid_alafasy'),
            };
          });

          const surahMeta = SURAH_METADATA[surahNumber - 1];
          surah = {
            ...surahMeta,
            verses,
          };
          apiSuccess = true;
        } else if (response && Array.isArray(response.data)) {
          // Al-Quran Cloud format (multiple editions)
          debugLog('✅ Parsing Al-Quran Cloud multiple editions format', { 
            surahNumber,
            editionsCount: response.data.length
          });

          let arabicData = null;
          let translationData = null;

          // Find Arabic and translation data
          response.data.forEach((edition: any) => {
            if (edition.identifier === 'quran-uthmani' || edition.identifier === 'ar.quran') {
              arabicData = edition;
            } else if (edition.identifier.includes('en.') || edition.identifier.includes('_sahih')) {
              translationData = edition;
            }
          });

          if (arabicData && arabicData.ayahs) {
            const verses: QuranVerse[] = arabicData.ayahs.map((ayah: any, index: number) => {
              const translationVerse = translationData?.ayahs?.[index];
              return {
                id: `${surahNumber}:${ayah.numberInSurah}`,
                verseNumber: ayah.numberInSurah,
                text: ayah.text,
                translation: translationVerse?.text || `Translation for verse ${ayah.numberInSurah}`,
                transliteration: '',
                page: ayah.page,
                juz: ayah.juz,
                hizb: ayah.hizbQuarter,
                rukuNumber: ayah.ruku,
                manzil: ayah.manzil,
                sajda: ayah.sajda,
                audioUrl: this.getAudioUrl(surahNumber, ayah.numberInSurah, 'mishary_rashid_alafasy'),
              };
            });

            const surahMeta = SURAH_METADATA[surahNumber - 1];
            surah = {
              ...surahMeta,
              verses,
            };
            apiSuccess = true;
          }
        } else if (response && response.verses) {
          // Quran.com format
          debugLog('✅ Parsing Quran.com format', { 
            surahNumber,
            versesCount: response.verses.length,
            firstVerseKeys: response.verses[0] ? Object.keys(response.verses[0]) : []
          });

          const verses: QuranVerse[] = response.verses.map((verse: any) => ({
            id: `${surahNumber}:${verse.verse_number}`,
            verseNumber: verse.verse_number,
            text: verse.text_uthmani || verse.text_indopak || verse.text_simple || '',
            translation: verse.translations?.[0]?.text || `Translation for verse ${verse.verse_number}`,
            transliteration: verse.transliteration?.text || '',
            page: verse.page_number || Math.ceil(verse.verse_number / 10),
            juz: verse.juz_number || Math.ceil(surahNumber / 4),
            hizb: verse.hizb_number || Math.ceil(verse.verse_number / 5),
            rukuNumber: verse.ruku_number || Math.ceil(verse.verse_number / 8),
            manzil: verse.manzil_number || Math.ceil(surahNumber / 16),
            sajda: verse.sajda_type === 'recommended',
            audioUrl: this.getAudioUrl(surahNumber, verse.verse_number, 'mishary_rashid_alafasy'),
          }));

          const surahMeta = SURAH_METADATA[surahNumber - 1];
          surah = {
            ...surahMeta,
            verses,
          };
          apiSuccess = true;
        } else {
          debugLog('❌ Unexpected API response format', { 
            surahNumber,
            responseKeys: response ? Object.keys(response) : [],
            hasData: !!response?.data,
            hasVerses: !!response?.verses,
            hasCode: !!response?.code,
            hasStatus: !!response?.status,
            responseStructure: JSON.stringify(response).substring(0, 200) + '...'
          });
        }

        if (apiSuccess && surah) {
          debugLog(`Successfully parsed surah ${surahNumber} from API`, { 
            verses: surah.verses.length,
            source: 'API',
            surahName: surah.englishName
          });
        }
      } catch (apiError: unknown) {
        debugLog(`All API endpoints failed for surah ${surahNumber}`, { 
          error: apiError instanceof Error ? apiError.message : String(apiError),
          surahNumber,
          translationId
        });
      }

      // If API calls failed, fall back to mock data
      if (!apiSuccess || !surah) {
        debugLog(`🚨 USING MOCK DATA for surah ${surahNumber}`, { 
          reason: apiSuccess ? 'API success but no surah' : 'API failed',
          surahNumber,
          message: 'Real API data not available, using sample content'
        });

        const surahMeta = SURAH_METADATA[surahNumber - 1];
        if (!surahMeta) {
          const error = new Error(`Surah metadata not found for surah ${surahNumber}`);
          debugError('Surah metadata missing', { surahNumber });
          throw error;
        }

        const mockVerses: QuranVerse[] = [];
        
        // Generate mock verses based on the actual verse count
        for (let i = 1; i <= surahMeta.totalVerses; i++) {
          mockVerses.push({
            id: `${surahNumber}:${i}`,
            verseNumber: i,
            text: surahNumber === 1 && i === 1 
              ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' 
              : `[MOCK DATA] هَٰذَا نَصٌّ عَرَبِيٌّ تَجْرِيبِيٌّ لِلْآيَةِ ${i}`,
            translation: surahNumber === 1 && i === 1 
              ? 'In the name of Allah, the Most Gracious, the Most Merciful'
              : `[SAMPLE] This is sample translation for verse ${i} of ${surahMeta.englishName} - Real API data not available`,
            transliteration: surahNumber === 1 && i === 1 
              ? 'Bismillahir Rahmanir Raheem'
              : `Hatha nassun arabyun tajribiyyun lil ayati ${i}`,
            page: Math.ceil(i / 10),
            juz: Math.ceil(surahNumber / 4),
            hizb: Math.ceil(i / 5),
            rukuNumber: Math.ceil(i / 8),
            manzil: Math.ceil(surahNumber / 16),
            sajda: false,
            audioUrl: this.getAudioUrl(surahNumber, i, 'mishary_rashid_alafasy'),
          });
        }

        surah = {
          ...surahMeta,
          verses: mockVerses,
        };

        debugLog(`Generated mock surah ${surahNumber}`, { 
          verses: mockVerses.length,
          surahName: surahMeta.englishName,
          totalVerses: surahMeta.totalVerses
        });
      }

      await this.setCache(cacheKey, surah);
      debugLog(`Surah ${surahNumber} loaded and cached successfully`, { 
        verses: surah.verses.length,
        source: apiSuccess ? 'API' : 'mock',
        surahName: surah.englishName,
        cacheKey
      });
      return surah;
    } catch (error: unknown) {
      debugError(`Critical error in getSurah for surah ${surahNumber}`, { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        surahNumber,
        translationId
      });
      
      // Return basic fallback surah to prevent complete failure
      const surahMeta = SURAH_METADATA[surahNumber - 1];
      if (surahMeta) {
        debugLog(`Returning emergency fallback for surah ${surahNumber}`);
        return {
          ...surahMeta,
          verses: [{
            id: `${surahNumber}:1`,
            verseNumber: 1,
            text: 'Emergency fallback verse',
            translation: 'Unable to load verse content. Please try again.',
            transliteration: '',
            page: 1,
            juz: 1,
            hizb: 1,
            rukuNumber: 1,
            manzil: 1,
            sajda: false,
            audioUrl: '',
          }],
        };
      }
      
      throw error;
    }
  }

  // Get specific verse
  async getVerse(surahNumber: number, verseNumber: number, translationId: string = 'en_sahih'): Promise<QuranVerse> {
    const cacheKey = `verse_${surahNumber}_${verseNumber}_${translationId}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/ayah/${surahNumber}:${verseNumber}/${translationId}`,
        `${QURAN_API_CONFIG.QURAN_COM_API}/verses/by_chapter/${surahNumber}?verse_number=${verseNumber}&translation_id=${translationId}`,
      ];

      const response = await this.fetchWithFallback(endpoints);
      const verseData = response.data;

      const verse: QuranVerse = {
        id: verseData.number,
        verseNumber: verseData.numberInSurah,
        text: verseData.text,
        translation: verseData.translation || '',
        transliteration: verseData.transliteration || '',
        page: verseData.page || 1,
        juz: verseData.juz || 1,
        hizb: verseData.hizbQuarter || 1,
        rukuNumber: verseData.ruku || 1,
        manzil: verseData.manzil || 1,
        sajda: verseData.sajda || false,
        audioUrl: this.getAudioUrl(surahNumber, verseNumber, 'mishary_rashid_alafasy'),
      };

      await this.setCache(cacheKey, verse);
      return verse;
          } catch (error: unknown) {
        debugError(`Error fetching verse ${surahNumber}:${verseNumber}`, error instanceof Error ? error.message : String(error));
        throw error;
      }
    }

    // Get multiple translations for a verse
    async getVerseTranslations(surahNumber: number, verseNumber: number, translationIds: string[]): Promise<{ [key: string]: string }> {
      const cacheKey = `verse_translations_${surahNumber}_${verseNumber}_${translationIds.join('_')}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;

      try {
        const translations: { [key: string]: string } = {};
        
        for (const translationId of translationIds) {
          try {
            const verse = await this.getVerse(surahNumber, verseNumber, translationId);
            translations[translationId] = verse.translation;
          } catch (error: unknown) {
            debugLog(`Failed to get translation ${translationId}`, error instanceof Error ? error.message : String(error));
          }
        }

        await this.setCache(cacheKey, translations);
        return translations;
      } catch (error: unknown) {
        debugError('Error fetching verse translations', error instanceof Error ? error.message : String(error));
        return {};
      }
  }

  // Search in Quran
  async searchQuran(query: string, translationId: string = 'en_sahih', limit: number = 20): Promise<any[]> {
    const cacheKey = `search_${query}_${translationId}_${limit}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/search/${encodeURIComponent(query)}/${translationId}`,
        `${QURAN_API_CONFIG.QURAN_COM_API}/search?q=${encodeURIComponent(query)}&translation_id=${translationId}&size=${limit}`,
      ];

      const response = await this.fetchWithFallback(endpoints);
      const results = response.data.matches || response.data || [];

      await this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      debugError('Error searching Quran', error);
      return [];
    }
  }

  // Get audio URL for a verse
  getAudioUrl(surahNumber: number, verseNumber: number, reciterId: string): string {
    const reciter = AVAILABLE_RECITERS.find(r => r.id === reciterId);
    if (!reciter) return '';

    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedVerse = verseNumber.toString().padStart(3, '0');
    
    return `${reciter.baseUrl}/${paddedSurah}${paddedVerse}.mp3`;
  }

  // Get audio URL for entire surah
  getSurahAudioUrl(surahNumber: number, reciterId: string): string {
    const reciter = AVAILABLE_RECITERS.find(r => r.id === reciterId);
    if (!reciter) return '';

    const paddedSurah = surahNumber.toString().padStart(3, '0');
    return `${reciter.baseUrl.replace('data/', 'data/complete/')}/${paddedSurah}.mp3`;
  }

  // Get Juz (Para) information
  async getJuz(juzNumber: number, translationId: string = 'en_sahih'): Promise<any> {
    const cacheKey = `juz_${juzNumber}_${translationId}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/juz/${juzNumber}/${translationId}`,
        `${QURAN_API_CONFIG.QURAN_COM_API}/juzs/${juzNumber}/verses?translation_id=${translationId}`,
      ];

      const response = await this.fetchWithFallback(endpoints);
      const juzData = response.data;

      await this.setCache(cacheKey, juzData);
      return juzData;
    } catch (error) {
      debugError(`Error fetching juz ${juzNumber}`, error);
      throw error;
    }
  }

  // Get page information
  async getPage(pageNumber: number, translationId: string = 'en_sahih'): Promise<any> {
    const cacheKey = `page_${pageNumber}_${translationId}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/page/${pageNumber}/${translationId}`,
        `${QURAN_API_CONFIG.QURAN_COM_API}/pages/${pageNumber}/verses?translation_id=${translationId}`,
      ];

      const response = await this.fetchWithFallback(endpoints);
      const pageData = response.data;

      await this.setCache(cacheKey, pageData);
      return pageData;
    } catch (error) {
      debugError(`Error fetching page ${pageNumber}`, error);
      throw error;
    }
  }

  // Get available translations
  async getTranslations(): Promise<QuranTranslation[]> {
    const cacheKey = 'translations_list';
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Return static translations for demo
      await this.setCache(cacheKey, AVAILABLE_TRANSLATIONS);
      debugLog('Translations loaded successfully', { count: AVAILABLE_TRANSLATIONS.length });
      return AVAILABLE_TRANSLATIONS;
    } catch (error) {
      debugError('Error fetching translations', error);
      return AVAILABLE_TRANSLATIONS;
    }
  }

  // Get tafsir for a verse
  async getTafsir(surahNumber: number, verseNumber: number, tafsirId: string = 'en_jalalayn'): Promise<string> {
    const cacheKey = `tafsir_${surahNumber}_${verseNumber}_${tafsirId}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/ayah/${surahNumber}:${verseNumber}/${tafsirId}`,
        `${QURAN_API_CONFIG.QURAN_COM_API}/tafsirs/${tafsirId}/by_ayah/${surahNumber}:${verseNumber}`,
      ];

      const response = await this.fetchWithFallback(endpoints);
      const tafsir = response.data.text || response.data.tafsir || '';

      await this.setCache(cacheKey, tafsir);
      return tafsir;
    } catch (error) {
      debugError(`Error fetching tafsir for ${surahNumber}:${verseNumber}`, error);
      return '';
    }
  }

  // Get word-by-word analysis
  async getWordByWordAnalysis(surahNumber: number, verseNumber: number): Promise<any[]> {
    const cacheKey = `word_analysis_${surahNumber}_${verseNumber}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoints = [
        `${QURAN_API_CONFIG.QURAN_COM_API}/verses/by_chapter/${surahNumber}?verse_number=${verseNumber}&words=true&translations=true`,
      ];

      const response = await this.fetchWithFallback(endpoints);
      const words = response.data.verses[0]?.words || [];

      await this.setCache(cacheKey, words);
      return words;
    } catch (error) {
      debugError(`Error fetching word analysis for ${surahNumber}:${verseNumber}`, error);
      return [];
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const quranApi = QuranApiService.getInstance();

// Utility functions
export const getQuranMetadata = () => ({
  totalSurahs: 114,
  totalVerses: 6236,
  totalPages: 604,
  totalJuzs: 30,
  totalHizbs: 60,
  totalRukus: 558,
  totalManzils: 7,
});

export const getSurahType = (surahNumber: number): 'meccan' | 'medinan' => {
  const surah = SURAH_METADATA[surahNumber - 1];
  return surah?.revelationType || 'meccan';
};

export const getSurahName = (surahNumber: number, language: 'en' | 'ar' = 'en'): string => {
  const surah = SURAH_METADATA[surahNumber - 1];
  if (!surah) return '';
  return language === 'ar' ? surah.name : surah.englishName;
};

export const getVerseReference = (surahNumber: number, verseNumber: number): string => {
  const surahName = getSurahName(surahNumber, 'en');
  return `${surahName} ${surahNumber}:${verseNumber}`;
};

export const isValidSurahNumber = (surahNumber: number): boolean => {
  return surahNumber >= 1 && surahNumber <= 114;
};

export const isValidVerseNumber = (surahNumber: number, verseNumber: number): boolean => {
  if (!isValidSurahNumber(surahNumber)) return false;
  const surah = SURAH_METADATA[surahNumber - 1];
  return verseNumber >= 1 && verseNumber <= surah.totalVerses;
}; 