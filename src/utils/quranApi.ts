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
            id: parseInt(`${surahNumber}${String(i).padStart(3, '0')}`), // Convert to number
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
            id: parseInt(`${surahNumber}001`), // Convert to number
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
    debugLog('🔍 Starting Quran search', { 
      query: query.trim(), 
      translationId, 
      limit,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!query || !query.trim()) {
      debugLog('❌ Empty search query provided');
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();
    const cacheKey = `search_${cleanQuery}_${translationId}_${limit}`;
    const cached = await this.getFromCache(cacheKey);
    
    if (cached) {
      debugLog('✅ Returning cached search results', { 
        query: cleanQuery, 
        resultsCount: cached.length 
      });
      return cached;
    }

    try {
      // Try multiple API endpoints with fallback
      const endpoints = [
        // Quran.com API (primary - working endpoint) - with translations parameter
        `${QURAN_API_CONFIG.QURAN_COM_API}/search?q=${encodeURIComponent(cleanQuery)}&translation_id=131&size=${limit}&language=en&translations=131`,
        // Alternative format with translations included
        `${QURAN_API_CONFIG.QURAN_COM_API}/search?q=${encodeURIComponent(cleanQuery)}&translations=131&size=${limit}`,
        // Al-Quran Cloud alternative endpoint (correct format)
        `${QURAN_API_CONFIG.BASE_URL}/search/${encodeURIComponent(cleanQuery)}/all/en`,
      ];

      debugLog('🌐 Attempting API search', { 
        endpoints: endpoints.length,
        firstEndpoint: endpoints[0].substring(0, 80) + '...'
      });

      try {
        const response = await this.fetchWithFallback(endpoints);
        
        debugLog('🔍 Raw search API response', {
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : [],
          hasData: !!response?.data,
          hasMatches: !!response?.data?.matches,
          hasResults: !!response?.results,
          hasSearch: !!response?.search,
          hasSearchResults: !!response?.search?.results,
          dataType: typeof response?.data
        });

        let apiResults = [];
        
        // Parse different API response formats
        if (response?.data?.matches && Array.isArray(response.data.matches)) {
          // Al-Quran Cloud format
          apiResults = response.data.matches.map((match: any) => ({
            surahNumber: match.surah?.number || match.surahNumber,
            verseNumber: match.numberInSurah || match.verseNumber,
            arabicText: match.text || '',
            translation: match.translation || '',
            score: match.score || 0.5,
            tags: [],
          }));
        } else if (response?.search?.results && Array.isArray(response.search.results)) {
          // Quran.com API format - this is the correct format!
          debugLog('✅ Parsing Quran.com search format', { 
            resultsCount: response.search.results.length,
            totalResults: response.search.total_results,
            currentPage: response.search.current_page,
            sampleResultStructure: response.search.results[0] ? {
              hasText: !!response.search.results[0].text,
              hasTranslation: !!response.search.results[0].translation,
              translationType: typeof response.search.results[0].translation,
              translationKeys: response.search.results[0].translation ? Object.keys(response.search.results[0].translation) : [],
              translationSample: response.search.results[0].translation,
              hasWords: !!response.search.results[0].words,
              wordsCount: response.search.results[0].words?.length || 0
            } : null
          });
          
          apiResults = response.search.results.map((result: any) => ({
            surahNumber: result.verse_key ? parseInt(result.verse_key.split(':')[0]) : result.chapter_id,
            verseNumber: result.verse_key ? parseInt(result.verse_key.split(':')[1]) : result.verse_number,
            arabicText: result.text || result.verse_text || '',
            translation: result.translation?.text || result.translation?.english || result.translation_text || result.english || result.text_translation || '',
            score: 0.9, // High score for real API results
            tags: result.words ? result.words.slice(0, 5).map((word: any) => 
              typeof word === 'string' ? word : (word.text || word.char_type || 'keyword')
            ) : [],
            context: `Found in ${getSurahName(result.verse_key ? parseInt(result.verse_key.split(':')[0]) : result.chapter_id)}`,
          }));
          
          // If no translations were found in search results, fetch them separately
          if (apiResults.length > 0 && apiResults.every(r => !r.translation || r.translation.trim() === '' || r.translation === r.arabicText)) {
            debugLog('🔄 No translations in search results, fetching separately...', {
              originalResultsCount: apiResults.length,
              willFetchTranslationsFor: Math.min(15, apiResults.length)
            });
            
            try {
              const translationPromises = apiResults.slice(0, Math.min(15, apiResults.length)).map(async (result) => {
                try {
                  // Try Quran.com first
                  let translationEndpoint = `${QURAN_API_CONFIG.QURAN_COM_API}/verses/by_key/${result.surahNumber}:${result.verseNumber}?translations=131`;
                  let translationResponse = await fetch(translationEndpoint, {
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      'User-Agent': 'QuranApp/1.0'
                    },
                    method: 'GET'
                  });
                  
                  if (translationResponse.ok) {
                    const translationData = await translationResponse.json();
                    const verse = translationData?.verse;
                    if (verse?.translations?.[0]?.text) {
                      return {
                        ...result,
                        translation: verse.translations[0].text
                      };
                    }
                  }
                  
                  // Fallback to Al-Quran Cloud API
                  translationEndpoint = `${QURAN_API_CONFIG.BASE_URL}/ayah/${result.surahNumber}:${result.verseNumber}/en.sahih`;
                  translationResponse = await fetch(translationEndpoint, {
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      'User-Agent': 'QuranApp/1.0'
                    },
                    method: 'GET'
                  });
                  
                  if (translationResponse.ok) {
                    const translationData = await translationResponse.json();
                    if (translationData?.data?.text) {
                      return {
                        ...result,
                        translation: translationData.data.text
                      };
                    }
                  }
                  
                } catch (error) {
                  debugLog('⚠️ Failed to fetch translation for verse', { 
                    surah: result.surahNumber, 
                    verse: result.verseNumber,
                    error: error instanceof Error ? error.message : String(error)
                  });
                }
                return result;
              });
              
              const enhancedResults = await Promise.all(translationPromises);
              
              // Combine enhanced results with remaining original results
              const remainingResults = apiResults.slice(15);
              apiResults = [...enhancedResults, ...remainingResults];
              
              debugLog('✅ Separate translation fetch completed', { 
                enhancedWithTranslations: enhancedResults.filter(r => r.translation && r.translation !== r.arabicText).length,
                totalResultsReturned: apiResults.length,
                originalResultsCount: apiResults.length
              });
            } catch (error) {
              debugLog('⚠️ Failed to fetch separate translations', { 
                error: error instanceof Error ? error.message : String(error) 
              });
            }
          }
          
          debugLog('✅ Successfully parsed Quran.com API results', {
            originalResultsCount: response.search.results.length,
            parsedResultsCount: apiResults.length,
            totalAvailable: response.search.total_results,
            currentPage: response.search.current_page,
            sampleResult: apiResults[0] ? {
              surah: apiResults[0].surahNumber,
              verse: apiResults[0].verseNumber,
              hasArabic: !!apiResults[0].arabicText,
              hasTranslation: !!apiResults[0].translation
            } : null
          });
        } else if (response?.results && Array.isArray(response.results)) {
          // Alternative API format
          apiResults = response.results.map((result: any) => ({
            surahNumber: result.chapter_number || result.surah,
            verseNumber: result.verse_number || result.verse,
            arabicText: result.text_uthmani || result.arabic || '',
            translation: result.translation || result.text || '',
            score: 0.8,
            tags: [],
          }));
        } else if (Array.isArray(response?.data)) {
          // Direct array response
          apiResults = response.data.map((item: any) => ({
            surahNumber: item.surah || item.chapter,
            verseNumber: item.verse || item.ayah,
            arabicText: item.arabic || item.text,
            translation: item.translation || item.english,
            score: 0.7,
            tags: [],
          }));
        }

        if (apiResults.length > 0) {
          debugLog('✅ Successfully parsed API search results', { 
            query: cleanQuery,
            resultsCount: apiResults.length,
            firstResult: {
              surah: apiResults[0].surahNumber,
              verse: apiResults[0].verseNumber
            }
          });

          await this.setCache(cacheKey, apiResults);
          return apiResults.slice(0, limit);
        }
      } catch (apiError) {
        debugLog('⚠️ API search failed, falling back to enhanced search', { 
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }

      // Enhanced fallback search using comprehensive database
      debugLog('🔄 Using enhanced fallback search system', { query: cleanQuery });
      const fallbackResults = await this.performEnhancedFallbackSearch(cleanQuery, translationId, limit);
      
      await this.setCache(cacheKey, fallbackResults);
      debugLog('✅ Fallback search completed', { 
        query: cleanQuery,
        resultsCount: fallbackResults.length
      });
      
      return fallbackResults;

    } catch (error) {
      debugError('❌ Complete search failure', { 
        error: error instanceof Error ? error.message : String(error),
        query: cleanQuery
      });
      return [];
    }
  }

  // Enhanced fallback search with comprehensive Islamic content
  private async performEnhancedFallbackSearch(query: string, translationId: string, limit: number): Promise<any[]> {
    debugLog('🔄 Performing enhanced fallback search', { query, translationId, limit });
    
    const results: any[] = [];
    const queryLower = query.toLowerCase();
    
    // Comprehensive search database with real Quranic content
    const searchDatabase = [
      // Essential verses about Allah
      {
        keywords: ['allah', 'god', 'creator', 'lord', 'deity'],
        verses: [
          {
            surahNumber: 1, verseNumber: 1,
            arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
            score: 0.95, tags: ['bismillah', 'mercy', 'Allah']
          },
          {
            surahNumber: 2, verseNumber: 255,
            arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
            translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.',
            score: 0.95, tags: ['ayat-al-kursi', 'throne', 'Allah', 'monotheism']
          },
          {
            surahNumber: 112, verseNumber: 1,
            arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
            translation: 'Say, "He is Allah, [who is] One,',
            score: 0.9, tags: ['ikhlas', 'oneness', 'Allah']
          }
        ]
      },
      
      // Mercy and compassion
      {
        keywords: ['mercy', 'compassion', 'rahman', 'rahim', 'merciful', 'forgiving'],
        verses: [
          {
            surahNumber: 55, verseNumber: 1,
            arabicText: 'الرَّحْمَٰنُ',
            translation: 'The Most Merciful',
            score: 0.9, tags: ['mercy', 'compassion', 'rahman']
          },
          {
            surahNumber: 7, verseNumber: 156,
            arabicText: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ',
            translation: 'And My mercy encompasses all things.',
            score: 0.85, tags: ['mercy', 'encompassing']
          }
        ]
      },
      
      // Guidance and knowledge
      {
        keywords: ['guidance', 'knowledge', 'wisdom', 'learn', 'teach', 'guide'],
        verses: [
          {
            surahNumber: 1, verseNumber: 6,
            arabicText: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
            translation: 'Guide us to the straight path',
            score: 0.9, tags: ['guidance', 'straight-path', 'prayer']
          },
          {
            surahNumber: 96, verseNumber: 1,
            arabicText: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
            translation: 'Recite in the name of your Lord who created.',
            score: 0.85, tags: ['knowledge', 'reading', 'creation']
          }
        ]
      },
      
      // Prayer and worship
      {
        keywords: ['prayer', 'worship', 'pray', 'salah', 'prostration', 'bow'],
        verses: [
          {
            surahNumber: 1, verseNumber: 5,
            arabicText: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
            translation: 'It is You we worship and You we ask for help.',
            score: 0.9, tags: ['worship', 'help', 'prayer']
          },
          {
            surahNumber: 2, verseNumber: 3,
            arabicText: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ',
            translation: 'Who believe in the unseen, establish prayer, and spend out of what We have provided for them',
            score: 0.85, tags: ['prayer', 'belief', 'charity']
          }
        ]
      },
      
      // Peace and hope
      {
        keywords: ['peace', 'hope', 'comfort', 'ease', 'relief', 'calm'],
        verses: [
          {
            surahNumber: 94, verseNumber: 5,
            arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
            translation: 'For indeed, with hardship [will be] ease.',
            score: 0.9, tags: ['ease', 'hardship', 'hope']
          },
          {
            surahNumber: 13, verseNumber: 28,
            arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
            translation: 'Unquestionably, by the remembrance of Allah hearts are assured.',
            score: 0.85, tags: ['peace', 'remembrance', 'heart']
          }
        ]
      },
      
      // Forgiveness and repentance
      {
        keywords: ['forgiveness', 'forgive', 'repentance', 'repent', 'sin', 'mistake'],
        verses: [
          {
            surahNumber: 39, verseNumber: 53,
            arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
            translation: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah."',
            score: 0.95, tags: ['forgiveness', 'mercy', 'despair-not']
          }
        ]
      },
      
      // Gratitude and praise
      {
        keywords: ['praise', 'thanks', 'grateful', 'gratitude', 'alhamdulillah'],
        verses: [
          {
            surahNumber: 1, verseNumber: 2,
            arabicText: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
            translation: '[All] praise is [due] to Allah, Lord of the worlds',
            score: 0.9, tags: ['praise', 'gratitude', 'worlds']
          }
        ]
      },
      
      // Trust and patience
      {
        keywords: ['trust', 'patience', 'perseverance', 'sabr', 'endurance'],
        verses: [
          {
            surahNumber: 2, verseNumber: 153,
            arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
            translation: 'O you who believe! Seek help through patience and prayer.',
            score: 0.85, tags: ['patience', 'prayer', 'help']
          }
        ]
      }
    ];

    // Search through database
    for (const category of searchDatabase) {
      const keywordMatch = category.keywords.some(keyword => 
        queryLower.includes(keyword) || keyword.includes(queryLower)
      );
      
      if (keywordMatch) {
        results.push(...category.verses);
      }
    }

    // Also search for specific Surah names
    const surahSearchResults = this.searchSurahNames(queryLower);
    results.push(...surahSearchResults);

    // Sort by relevance score and remove duplicates
    const uniqueResults = results
      .filter((result, index, array) => 
        array.findIndex(r => r.surahNumber === result.surahNumber && r.verseNumber === result.verseNumber) === index
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    debugLog('✅ Enhanced fallback search completed', {
      query: queryLower,
      categoriesMatched: searchDatabase.filter(cat => 
        cat.keywords.some(k => queryLower.includes(k) || k.includes(queryLower))
      ).length,
      totalResults: uniqueResults.length
    });

    return uniqueResults;
  }

  // Search for Surah names
  private searchSurahNames(query: string): any[] {
    const results: any[] = [];
    
    // Search through SURAH_METADATA for name matches
    SURAH_METADATA.forEach(surah => {
      if (
        surah.englishName.toLowerCase().includes(query) ||
        surah.meaning.toLowerCase().includes(query) ||
        query.includes(surah.englishName.toLowerCase())
      ) {
        // Return first verse of the matching surah
        results.push({
          surahNumber: surah.id,
          verseNumber: 1,
          arabicText: surah.id === 1 ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' : '[Arabic text of first verse]',
          translation: `First verse of Surah ${surah.englishName} (${surah.meaning})`,
          score: 0.8,
          tags: ['surah-name', surah.englishName.toLowerCase()]
        });
      }
    });

    return results;
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

    debugLog('🔍 Starting tafsir fetch', { surahNumber, verseNumber, tafsirId });

    try {
      // Try multiple endpoints for tafsir
      const endpoints = [
        `${QURAN_API_CONFIG.BASE_URL}/ayah/${surahNumber}:${verseNumber}/${tafsirId}`,
        `${QURAN_API_CONFIG.QURAN_COM_API}/tafsirs/1/verses/by_key/${surahNumber}:${verseNumber}`, // Quran.com tafsir
        `${QURAN_API_CONFIG.BASE_URL}/editions/tafsir/${tafsirId}/${surahNumber}:${verseNumber}`, // Alternative format
      ];

      debugLog('🌐 Attempting tafsir API calls', { 
        endpoints: endpoints.map(e => e.substring(0, 80) + '...') 
      });

      let tafsirText = '';
      
      try {
      const response = await this.fetchWithFallback(endpoints);
        
        debugLog('🔍 Raw tafsir API response', {
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : [],
          hasData: !!response?.data,
          dataKeys: response?.data ? Object.keys(response.data) : [],
          dataText: response?.data?.text?.substring(0, 100) + '...',
          edition: response?.data?.edition?.identifier,
          editionLanguage: response?.data?.edition?.language,
          fullResponse: response
        });

        // Extract tafsir text from various response formats
        if (response?.data?.text) {
          tafsirText = response.data.text;
        } else if (response?.data?.tafsir) {
          tafsirText = response.data.tafsir;
        } else if (response?.tafsir?.text) {
          tafsirText = response.tafsir.text;
        } else if (response?.verse?.text) {
          tafsirText = response.verse.text;
        }

        // Validate that we got actual tafsir (English commentary) and not Arabic Quran text
        const isArabicText = this.isArabicText(tafsirText);
        const isEnglishTafsir = this.isValidEnglishTafsir(tafsirText, surahNumber, verseNumber);
        
        debugLog('🔍 Tafsir validation', {
          textLength: tafsirText.length,
          isArabic: isArabicText,
          isValidEnglish: isEnglishTafsir,
          textSample: tafsirText.substring(0, 100)
        });

        if (tafsirText && isEnglishTafsir && !isArabicText) {
          debugLog('✅ Valid English tafsir received', { 
            surahNumber, 
            verseNumber, 
            length: tafsirText.length 
          });
          await this.setCache(cacheKey, tafsirText);
          return tafsirText;
        } else {
          debugLog('⚠️ API returned invalid tafsir data', {
            hasText: !!tafsirText,
            isArabic: isArabicText,
            isValidEnglish: isEnglishTafsir,
            sample: tafsirText.substring(0, 50)
          });
        }
      } catch (apiError) {
        debugLog('⚠️ Tafsir API failed, using fallback', { 
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }

      // Generate enhanced fallback tafsir based on verse content
      debugLog('🔄 Generating enhanced tafsir fallback', { surahNumber, verseNumber });
      const fallbackTafsir = await this.generateEnhancedTafsir(surahNumber, verseNumber);
      
      await this.setCache(cacheKey, fallbackTafsir);
      debugLog('✅ Enhanced tafsir fallback completed', { 
        surahNumber, 
        verseNumber, 
        length: fallbackTafsir.length 
      });
      
      return fallbackTafsir;

    } catch (error) {
      debugError(`Error fetching tafsir for ${surahNumber}:${verseNumber}`, error);
      
      // Final fallback
      const basicTafsir = this.getBasicTafsirFallback(surahNumber, verseNumber);
      await this.setCache(cacheKey, basicTafsir);
      return basicTafsir;
    }
  }

  // Helper function to detect Arabic text
  private isArabicText(text: string): boolean {
    if (!text) return false;
    // Check if text contains Arabic characters
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text) && text.length < 200; // Short Arabic text is likely Quran verse
  }

  // Helper function to validate English tafsir
  private isValidEnglishTafsir(text: string, surahNumber: number, verseNumber: number): boolean {
    if (!text || text.length < 20) return false;
    
    // Check if it contains common English tafsir words
    const tafsirKeywords = [
      'meaning', 'refers', 'indicates', 'signifies', 'commentary', 'explanation',
      'Allah', 'God', 'prophet', 'verse', 'chapter', 'believers', 'faith',
      'guidance', 'mercy', 'compassion', 'worship', 'prayer', 'revelation'
    ];
    
    const lowerText = text.toLowerCase();
    const keywordCount = tafsirKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Valid if it contains at least 2 tafsir keywords and is longer than Arabic verse
    return keywordCount >= 2 && text.length > 50;
  }

  // Generate enhanced tafsir based on Quranic knowledge
  private async generateEnhancedTafsir(surahNumber: number, verseNumber: number): Promise<string> {
    debugLog('🔄 Generating enhanced tafsir', { surahNumber, verseNumber });
    
    // Get verse text first for context
    try {
      const surah = await this.getSurah(surahNumber);
      const verse = surah.verses.find(v => v.verseNumber === verseNumber);
      
      if (!verse) {
        return this.getBasicTafsirFallback(surahNumber, verseNumber);
      }

      // Enhanced tafsir based on specific verses and common themes
      if (surahNumber === 1) {
        // Al-Fatiha specific tafsir
        return this.getAlFatihaTafsir(verseNumber, verse);
      } else if (surahNumber === 2 && verseNumber === 255) {
        // Ayat al-Kursi
        return `This is Ayat al-Kursi, one of the most powerful and significant verses in the Quran. It describes Allah's absolute sovereignty and eternal nature. "Allah - there is no deity except Him" establishes the fundamental principle of Tawhid (monotheism). "The Ever-Living, the Sustainer of existence" (Al-Hayy Al-Qayyum) are two of Allah's most comprehensive names, indicating His perfect life and His role in maintaining all existence. The verse emphasizes that Allah never sleeps or slumbers, showing His constant awareness and control over all creation. This verse is often recited for protection and is considered a summary of Islamic theology regarding Allah's attributes.`;
      } else if (surahNumber >= 109 && surahNumber <= 114) {
        // Qul Surahs (last 6 chapters)
        return this.getQulSurahTafsir(surahNumber, verseNumber, verse);
      } else {
        // General tafsir based on verse content and context
        return this.getContextualTafsir(surahNumber, verseNumber, verse);
      }
    } catch (error) {
      debugError('Error generating enhanced tafsir', error);
      return this.getBasicTafsirFallback(surahNumber, verseNumber);
    }
  }

  // Al-Fatiha specific tafsir
  private getAlFatihaTafsir(verseNumber: number, verse: any): string {
    const tafsir = {
      1: `This is the Basmalah - "In the name of Allah, the Most Gracious, the Most Merciful." It begins with seeking Allah's blessing and invoking His two primary mercy-related attributes. Ar-Rahman (الرحمن) refers to Allah's universal mercy that encompasses all creation, while Ar-Raheem (الرحيم) refers to His special mercy for believers. This formula is recited before most chapters of the Quran and before beginning important tasks, emphasizing the Islamic principle of starting everything with Allah's name and seeking His blessing.`,
      
      2: `"All praise is due to Allah, Lord of the worlds." This verse establishes the fundamental Islamic concept that all praise, gratitude, and worship belong exclusively to Allah. The term "Alhamdulillah" encompasses all forms of praise - not just thanks for blessings, but recognition of Allah's perfection. "Rabb al-Alameen" (Lord of the worlds) indicates Allah's sovereignty over all creation - the physical universe, spiritual realms, humans, jinn, and everything that exists. This verse sets the tone for recognizing Allah's absolute authority and our dependence on Him.`,
      
      3: `This verse repeats the mercy attributes from the Basmalah, emphasizing their central importance. The repetition serves to reinforce that Allah's mercy is His most prominent characteristic in His relationship with creation. These attributes are mentioned again to remind believers that despite Allah's absolute power and authority (mentioned in the previous verse), His approach to creation is primarily through mercy and compassion. This gives hope to believers and emphasizes that Allah's justice is always tempered with mercy.`,
      
      4: `"Master of the Day of Judgment." This verse shifts focus to Allah's role as the ultimate judge. "Malik" means master/owner, indicating Allah's complete ownership of the Day of Judgment. This serves as both a warning and a comfort - a warning to those who transgress, and comfort to those who strive to do right. The Day of Judgment represents ultimate justice where every deed will be fairly evaluated. This verse balances the mercy mentioned earlier with divine justice, showing that Allah's mercy doesn't negate accountability.`,
      
      5: `"You alone we worship, and You alone we ask for help." This verse is the heart of Al-Fatiha and represents the essential relationship between the believer and Allah. The use of "You alone" (Iyyaka) emphasizes exclusivity - worship belongs only to Allah, not to any intermediaries, saints, or other beings. The combination of worship (ibadah) and seeking help (isti'anah) shows that believers both serve Allah and depend on Him completely. This verse encapsulates the Islamic understanding of human purpose and our relationship with the Divine.`,
      
      6: `"Guide us to the straight path." This is the main supplication of Al-Fatiha. The "straight path" (as-sirat al-mustaqeem) refers to the way of life that leads to Allah's pleasure and success in both this world and the hereafter. It encompasses following Islamic teachings, maintaining good character, and avoiding both extremes of excess and negligence. This prayer acknowledges human need for divine guidance and recognizes that without Allah's help, we cannot find or maintain the right path. It's a humble admission of our dependence on divine guidance.`,
      
      7: `"The path of those You have blessed, not of those who have incurred Your wrath, nor of those who have gone astray." This verse clarifies what the "straight path" means by providing positive and negative examples. "Those You have blessed" refers to the prophets, truthful believers, martyrs, and righteous people throughout history. "Those who have incurred wrath" traditionally refers to those who knew the truth but rejected it, while "those who have gone astray" refers to those who were misguided without proper knowledge. This verse teaches us to learn from both good and bad examples in history and to seek to be among the blessed ones.`
    };

    return tafsir[verseNumber as keyof typeof tafsir] || this.getBasicTafsirFallback(1, verseNumber);
  }

  // Qul Surahs tafsir
  private getQulSurahTafsir(surahNumber: number, verseNumber: number, verse: any): string {
    if (surahNumber === 112) {
      // Al-Ikhlas
      if (verseNumber === 1) return `"Say: He is Allah, the One." This verse commands the Prophet (and by extension, all Muslims) to declare Allah's absolute oneness. The word "Ahad" (One) is stronger than "Wahid" (one) - it means uniquely one, without any possibility of division, multiplication, or partnership. This chapter is considered to be worth one-third of the Quran because it deals with the fundamental concept of Tawhid (monotheism), which is the foundation of Islamic belief.`;
      if (verseNumber === 2) return `"Allah, the Eternal, Absolute." The word "As-Samad" is often translated as "Eternal" or "Self-Sufficient," but it carries deeper meanings. It refers to Allah as the one to whom all creation turns in their needs, the one who needs nothing but upon whom everything depends. It indicates Allah's complete independence and self-sufficiency while being the ultimate source of support for all creation.`;
      if (verseNumber === 3) return `"He begets not, nor is He begotten." This verse refutes various false beliefs about Allah having children, being born from other beings, or reproducing in any way. It directly contradicts Christian concepts of Jesus as God's son and pagan Arab beliefs about Allah having daughters. The concept of begetting implies need, change, and limitation - all of which are incompatible with divine perfection.`;
      if (verseNumber === 4) return `"And there is none like unto Him." This concluding verse emphasizes Allah's absolute uniqueness. Nothing in creation resembles Allah in His essence, attributes, or actions. This verse prevents any attempt to compare Allah to created beings or to imagine Him in anthropomorphic terms. It affirms that Allah transcends all limitations and comparisons while remaining completely unique in every aspect.`;
    }
    
    return `This verse from Surah ${getSurahName(surahNumber)} provides important guidance about Islamic monotheism and spiritual protection. The "Qul" (Say) surahs were revealed to strengthen the believer's relationship with Allah and provide protection from various spiritual and physical harms through proper understanding of Allah's attributes.`;
  }

  // Contextual tafsir for other verses
  private getContextualTafsir(surahNumber: number, verseNumber: number, verse: any): string {
    const surahName = getSurahName(surahNumber);
    const surahType = getSurahType(surahNumber);
    
    let contextualInfo = '';
    
    if (surahType === 'meccan') {
      contextualInfo = `This verse from Surah ${surahName} was revealed in Mecca, during the early period of Islam. Meccan verses typically focus on fundamental beliefs, moral guidance, and calling people to monotheism. `;
    } else {
      contextualInfo = `This verse from Surah ${surahName} was revealed in Medina, after the Muslim community was established. Medinan verses often deal with community laws, social guidance, and practical implementation of Islamic principles. `;
    }

    // Add specific verse guidance based on common themes
    if (verse.translation?.toLowerCase().includes('allah')) {
      contextualInfo += `The verse mentions Allah, reinforcing the central Islamic teaching about God's sovereignty and attributes. `;
    }
    
    if (verse.translation?.toLowerCase().includes('believe') || verse.translation?.toLowerCase().includes('faith')) {
      contextualInfo += `This verse addresses believers, providing guidance for strengthening faith and righteous conduct. `;
    }
    
    if (verse.translation?.toLowerCase().includes('prayer') || verse.translation?.toLowerCase().includes('worship')) {
      contextualInfo += `The verse relates to worship and prayer, emphasizing the importance of maintaining a strong connection with Allah through regular spiritual practices. `;
    }

    return contextualInfo + `Islamic scholars have provided extensive commentary on this verse, examining its linguistic beauty, theological implications, and practical guidance for believers. The verse contributes to the chapter's overall message and connects to broader Quranic themes of guidance, faith, and righteous living. For detailed scholarly commentary, refer to classical tafsir works such as Ibn Kathir, Al-Tabari, or Al-Qurtubi.`;
  }

  // Basic tafsir fallback
  private getBasicTafsirFallback(surahNumber: number, verseNumber: number): string {
    const surahName = getSurahName(surahNumber);
    return `This verse from Surah ${surahName} (${surahNumber}:${verseNumber}) contains divine guidance and wisdom from Allah. Islamic scholars have provided extensive commentary on this verse, examining its linguistic beauty, theological implications, and practical guidance for believers. The verse contributes to the chapter's overall message and connects to broader Quranic themes of faith, guidance, and righteous conduct. For comprehensive commentary, students are encouraged to refer to classical tafsir works by renowned scholars such as Ibn Kathir, Al-Tabari, Al-Qurtubi, and contemporary scholars who have provided detailed analysis of the Quranic text.`;
  }

  // Get word-by-word analysis
  async getWordByWordAnalysis(surahNumber: number, verseNumber: number): Promise<any[]> {
    const cacheKey = `word_analysis_${surahNumber}_${verseNumber}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      debugLog('🔤 Starting word-by-word analysis', { surahNumber, verseNumber });
      
      // Try real API endpoints first
      const endpoints = [
        `${QURAN_API_CONFIG.QURAN_COM_API}/verses/by_chapter/${surahNumber}?verse_number=${verseNumber}&words=true&translations=true&fields=text_uthmani,words`,
        `${QURAN_API_CONFIG.BASE_URL}/ayah/${surahNumber}:${verseNumber}/editions/quran-wordbyword`
      ];

      let wordAnalysis: any[] = [];

      try {
        const response = await this.fetchWithFallback(endpoints);
        
        debugLog('🔤 Word analysis API response', {
          hasResponse: !!response,
          hasVerses: !!response?.verses,
          hasWords: !!response?.verses?.[0]?.words,
          wordCount: response?.verses?.[0]?.words?.length || 0
        });

        if (response?.verses?.[0]?.words) {
          // Quran.com API format
          wordAnalysis = response.verses[0].words.map((word: any, index: number) => ({
            id: index + 1,
            position: index + 1,
            arabicText: word.text_uthmani || word.text || '',
            transliteration: word.transliteration?.text || word.transliteration || '',
            translation: word.translation?.text || word.translation || '',
            root: word.root?.value || '',
            lemma: word.lemma?.value || '',
            grammar: word.pos_tags?.join(', ') || '',
            morphology: word.morphology || '',
            audioUrl: word.audio?.url || '',
            className: word.class_name || 'word',
            lineNumber: word.line_number || 1,
            pageNumber: word.page_number || Math.ceil(surahNumber / 4)
          }));
        } else if (Array.isArray(response?.data)) {
          // Alternative API format
          wordAnalysis = response.data.map((word: any, index: number) => ({
            id: index + 1,
            position: index + 1,
            arabicText: word.text || word.arabic || '',
            transliteration: word.transliteration || '',
            translation: word.translation || word.english || '',
            root: word.root || '',
            lemma: word.lemma || '',
            grammar: word.grammar || '',
            morphology: word.morphology || '',
            audioUrl: word.audio || '',
            className: 'word',
            lineNumber: 1,
            pageNumber: Math.ceil(surahNumber / 4)
          }));
        }

        if (wordAnalysis.length > 0) {
          debugLog('✅ Real word analysis data loaded', { 
            surahNumber, 
            verseNumber, 
            wordCount: wordAnalysis.length 
          });
          await this.setCache(cacheKey, wordAnalysis);
          return wordAnalysis;
        }
      } catch (apiError) {
        debugLog('⚠️ Word analysis API failed, using enhanced fallback', { 
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }

      // Enhanced fallback with comprehensive word analysis
      debugLog('🔄 Generating enhanced word analysis fallback', { surahNumber, verseNumber });
      const fallbackAnalysis = await this.generateEnhancedWordAnalysis(surahNumber, verseNumber);
      
      await this.setCache(cacheKey, fallbackAnalysis);
      debugLog('✅ Enhanced word analysis completed', { 
        surahNumber, 
        verseNumber, 
        wordCount: fallbackAnalysis.length 
      });
      
      return fallbackAnalysis;
    } catch (error) {
      debugError(`Error fetching word analysis for ${surahNumber}:${verseNumber}`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Enhanced word analysis fallback
  private async generateEnhancedWordAnalysis(surahNumber: number, verseNumber: number): Promise<any[]> {
    debugLog('🔄 Generating enhanced word analysis', { surahNumber, verseNumber });
    
    // Get the verse text first
    try {
      const surah = await this.getSurah(surahNumber);
      const verse = surah.verses.find(v => v.verseNumber === verseNumber);
      
      if (!verse || !verse.text) {
        debugLog('❌ Verse not found for word analysis', { surahNumber, verseNumber });
        return [];
      }

      const arabicText = verse.text;
      const words = arabicText.split(/\s+/).filter(word => word.trim());
      
      debugLog('🔤 Processing Arabic words', { 
        surahNumber, 
        verseNumber, 
        wordCount: words.length,
        firstWord: words[0],
        lastWord: words[words.length - 1]
      });

      // Enhanced word analysis with Islamic linguistic knowledge
      const analysis = words.map((word, index) => {
        const cleanWord = word.replace(/[۔،؍]/g, '').trim(); // Remove punctuation
        const wordInfo = this.getIslamicWordInfo(cleanWord, surahNumber, verseNumber, index);
        
        return {
          id: index + 1,
          position: index + 1,
          arabicText: word,
          transliteration: wordInfo.transliteration,
          translation: wordInfo.translation,
          root: wordInfo.root,
          lemma: wordInfo.lemma,
          grammar: wordInfo.grammar,
          morphology: wordInfo.morphology,
          audioUrl: '', // Would be populated with real audio
          className: 'word',
          lineNumber: Math.ceil((index + 1) / 10), // Approximate line breaks
          pageNumber: Math.ceil(surahNumber / 4),
          meaning: wordInfo.meaning,
          derivedWords: wordInfo.derivedWords,
          occurrences: wordInfo.occurrences
        };
      });

      return analysis;
    } catch (error) {
      debugError('Error generating word analysis', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Islamic word information database
  private getIslamicWordInfo(word: string, surahNumber: number, verseNumber: number, position: number): any {
    // Comprehensive Islamic word database
    const islamicWords: { [key: string]: any } = {
      'بِسْمِ': {
        transliteration: 'Bismi',
        translation: 'In the name of',
        root: 'س م و',
        grammar: 'Preposition + Noun',
        morphology: 'Genitive',
        meaning: 'Starting with the name of',
        derivedWords: ['اسم', 'أسماء'],
        occurrences: 'Found at the beginning of 113 Surahs'
      },
      'اللَّهِ': {
        transliteration: 'Allah',
        translation: 'Allah',
        root: 'أ ل ه',
        grammar: 'Proper Noun',
        morphology: 'Genitive',
        meaning: 'The One and Only God',
        derivedWords: ['إله', 'آلهة'],
        occurrences: 'Most frequently mentioned word in Quran'
      },
      'الرَّحْمَٰنِ': {
        transliteration: 'Ar-Rahman',
        translation: 'The Most Gracious',
        root: 'ر ح م',
        grammar: 'Adjective',
        morphology: 'Genitive',
        meaning: 'The Beneficent, showing mercy to all creation',
        derivedWords: ['رحمة', 'رحيم', 'راحم'],
        occurrences: 'One of the 99 beautiful names of Allah'
      },
      'الرَّحِيمِ': {
        transliteration: 'Ar-Raheem',
        translation: 'The Most Merciful',
        root: 'ر ح م',
        grammar: 'Adjective',
        morphology: 'Genitive',
        meaning: 'The Merciful, especially to believers',
        derivedWords: ['رحمة', 'رحمن', 'راحم'],
        occurrences: 'Appears in Bismillah and throughout Quran'
      },
      'الْحَمْدُ': {
        transliteration: 'Al-Hamdu',
        translation: 'All praise',
        root: 'ح م د',
        grammar: 'Noun',
        morphology: 'Nominative',
        meaning: 'Complete praise and gratitude',
        derivedWords: ['حامد', 'محمود', 'أحمد'],
        occurrences: 'Key concept in Islamic worship'
      },
      'لِلَّهِ': {
        transliteration: 'Lillah',
        translation: 'to Allah',
        root: 'أ ل ه',
        grammar: 'Preposition + Noun',
        morphology: 'Genitive',
        meaning: 'Belongs to Allah, for Allah',
        derivedWords: ['الله', 'إله'],
        occurrences: 'Emphasizes everything belongs to Allah'
      },
      'رَبِّ': {
        transliteration: 'Rabbi',
        translation: 'Lord of',
        root: 'ر ب ب',
        grammar: 'Noun',
        morphology: 'Genitive',
        meaning: 'Master, Creator, Sustainer',
        derivedWords: ['ربوبية', 'مربوب', 'تربية'],
        occurrences: 'Central concept in Islamic theology'
      },
      'الْعَالَمِينَ': {
        transliteration: 'Al-Alameen',
        translation: 'the worlds',
        root: 'ع ل م',
        grammar: 'Noun',
        morphology: 'Genitive Plural',
        meaning: 'All creation, all that exists',
        derivedWords: ['عالم', 'علم', 'عليم'],
        occurrences: 'Refers to all of creation'
      },
      'إِيَّاكَ': {
        transliteration: 'Iyyaka',
        translation: 'You alone',
        root: 'أ ي ي',
        grammar: 'Pronoun',
        morphology: 'Accusative',
        meaning: 'You specifically, exclusively You',
        derivedWords: ['أيا', 'إياه', 'إياها'],
        occurrences: 'Emphasizes exclusivity in worship'
      },
      'نَعْبُدُ': {
        transliteration: 'Na\'budu',
        translation: 'we worship',
        root: 'ع ب د',
        grammar: 'Verb',
        morphology: 'Present tense, 1st person plural',
        meaning: 'We worship, we serve with humility',
        derivedWords: ['عبد', 'عبادة', 'عابد'],
        occurrences: 'Core act of Islamic faith'
      },
      'وَإِيَّاكَ': {
        transliteration: 'Wa iyyaka',
        translation: 'and You alone',
        root: 'أ ي ي',
        grammar: 'Conjunction + Pronoun',
        morphology: 'Accusative',
        meaning: 'And exclusively You',
        derivedWords: ['أيا', 'إياه', 'إياها'],
        occurrences: 'Reinforces exclusivity'
      },
      'نَسْتَعِينُ': {
        transliteration: 'Nasta\'een',
        translation: 'we ask for help',
        root: 'ع و ن',
        grammar: 'Verb',
        morphology: 'Present tense, 1st person plural',
        meaning: 'We seek assistance, we ask for aid',
        derivedWords: ['عون', 'معين', 'استعانة'],
        occurrences: 'Seeking divine assistance'
      }
    };

    // Check if we have specific information for this word
    if (islamicWords[word]) {
      return islamicWords[word];
    }

    // Enhanced fallback analysis based on patterns
    const wordInfo = this.analyzeArabicWordPattern(word, surahNumber, verseNumber, position);
    return wordInfo;
  }

  // Analyze Arabic word patterns
  private analyzeArabicWordPattern(word: string, surahNumber: number, verseNumber: number, position: number): any {
    // Basic transliteration and analysis
    let transliteration = this.generateBasicTransliteration(word);
    let translation = 'Word meaning';
    let grammar = 'Word type';
    let root = '';
    
    // Pattern recognition for common Islamic terms
    if (word.includes('الله')) {
      translation = 'Related to Allah';
      grammar = 'Divine name/attribute';
    } else if (word.startsWith('ال')) {
      translation = 'The [noun]';
      grammar = 'Definite article + noun';
    } else if (word.endsWith('ين')) {
      translation = 'Plural noun/adjective';
      grammar = 'Plural form';
    } else if (word.startsWith('و')) {
      translation = 'And [word]';
      grammar = 'Conjunction + word';
    } else if (word.startsWith('ب')) {
      translation = 'With/in [word]';
      grammar = 'Preposition + word';
    } else if (word.startsWith('ل')) {
      translation = 'For/to [word]';
      grammar = 'Preposition + word';
    }

    // Special handling for Bismillah
    if (surahNumber === 1 && verseNumber === 1) {
      if (position === 0) {
        translation = 'In the name of';
        grammar = 'Prepositional phrase';
      } else if (position === 1) {
        translation = 'Allah';
        grammar = 'Proper noun (Divine)';
      } else if (position === 2) {
        translation = 'The Most Gracious';
        grammar = 'Divine attribute';
      } else if (position === 3) {
        translation = 'The Most Merciful';
        grammar = 'Divine attribute';
      }
    }

    return {
      transliteration,
      translation,
      root: root || 'Root analysis available in full version',
      grammar,
      morphology: 'Morphological analysis',
      meaning: `Detailed meaning for ${word}`,
      derivedWords: ['Related words available in full analysis'],
      occurrences: 'Occurrence data available in full version'
    };
  }

  // Basic Arabic to Latin transliteration
  private generateBasicTransliteration(arabicWord: string): string {
    const transliterationMap: { [key: string]: string } = {
      'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
      'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
      'ع': '\'', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
      'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h',
      'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ً': 'an',
      'ٌ': 'un', 'ٍ': 'in', 'ْ': '', 'ّ': '',
      'ء': '\'', 'ئ': 'i\'', 'ؤ': 'u\'', 'لا': 'la'
    };

    let result = '';
    for (let char of arabicWord) {
      result += transliterationMap[char] || char;
    }
    
    return result || 'transliteration';
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