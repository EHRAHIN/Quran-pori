import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BookOpen,
  Sparkles,
  Brain,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Bookmark,
  BookmarkCheck,
  Search,
  Settings,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Repeat,
  Share2,
  Copy,
  Edit,
  Check,
  X,
  RotateCcw,
  BookMarked,
  Info,
  Layers,
  GraduationCap,
  MessageSquare,
  BookText,
  ChevronRight
} from 'lucide-react';

import { SURAHS } from './data/surahs.js';
import { QARIS } from './data/qaris.js';
import { TRANSLATION_EDITIONS } from './data/translations.js';
import { FALLBACK_SURAH_1 } from './data/fallbackAyahs.js';
import { getAyahLessons, getAyahReflectionPrompt, getAyahHadith } from './data/ayahInsights.js';

export default function App() {
  // Theme & Appearance
  const [theme, setTheme] = useState('dark');
  const [fontSizeScale, setFontSizeScale] = useState(4); // 1-8 scale matching screenshot
  const [mushafLines, setMushafLines] = useState('16'); // '16', '15', 'standard'

  // Surah & Navigation
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [surahData, setSurahData] = useState(FALLBACK_SURAH_1);
  const [loading, setLoading] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState('arabic'); // 'arabic' | 'translation' | 'wbw'
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [surahFilter, setSurahFilter] = useState('all');

  // Reading Mode: 'wbw' (পদ দ্বারা পদ) | 'reading' (পড়া) | 'hifz' (হিফজ)
  const [activeReadingMode, setActiveReadingMode] = useState('wbw');

  // Translation Display Preference: 'rahman_only' | 'usmani_only' | 'zakaria_only' | 'english_only' | 'all'
  const [translationPreference, setTranslationPreference] = useState('rahman_only');

  // Script: 'quran-uthmani' | 'quran-indopak' | 'tajweed'
  const [arabicScript, setArabicScript] = useState('quran-indopak');
  const [activeTabByAyah, setActiveTabByAyah] = useState({});
  const [hideTranslationInHifz, setHideTranslationInHifz] = useState(false);
  const [hifzRepeatTarget, setHifzRepeatTarget] = useState(1);
  const [hifzCurrentRepeatCount, setHifzCurrentRepeatCount] = useState(0);

  // Live Tafsir (Ibn Kathir 164 | Abu Bakr Zakaria 166)
  const [selectedTafsirId, setSelectedTafsirId] = useState(164);
  const [tafsirCache, setTafsirCache] = useState({});
  const [tafsirLoadingKey, setTafsirLoadingKey] = useState(null);

  // Personal Reflection Notes per Ayah (Saved in localStorage)
  const [reflectionNotes, setReflectionNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quran_ayah_reflections') || '{}');
    } catch {
      return {};
    }
  });
  const [tempNoteText, setTempNoteText] = useState({});

  // Hover Tooltip tracking
  const [hoveredWordKey, setHoveredWordKey] = useState(null); // 'ayahNum-wordIdx'
  const [showHoverTooltip, setShowHoverTooltip] = useState(true);
  const [showWordMeaningsInline, setShowWordMeaningsInline] = useState(false);

  // Word Inspector Modal / Pronunciation
  const [selectedWord, setSelectedWord] = useState(null);
  const wordAudioRef = useRef(new Audio());

  // Audio Player State
  const [selectedQari, setSelectedQari] = useState(QARIS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahPlaying, setCurrentAyahPlaying] = useState(null);
  const [playbackMode, setPlaybackMode] = useState('single_ayah'); // 'surah' | 'single_ayah'
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(new Audio());

  // Bookmarks
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute font size in px based on scale (1-8)
  const arabicFontSize = 22 + fontSizeScale * 2.5;

  // Fetch Bookmarks from API
  const fetchBookmarks = async () => {
    try {
      const res = await axios.get('/api/bookmarks');
      if (res.data.success) {
        setBookmarks(res.data.data);
      }
    } catch {
      const local = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
      setBookmarks(local);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Live Tafsir Fetcher (Ibn Kathir: 164 | Abu Bakr Zakaria: 166)
  const fetchAyahTafsir = async (ayahNumber, tafsirId = selectedTafsirId) => {
    const key = `${currentSurahId}:${ayahNumber}_${tafsirId}`;
    if (tafsirCache[key]) return tafsirCache[key];

    setTafsirLoadingKey(key);
    try {
      const res = await axios.get(
        `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${currentSurahId}:${ayahNumber}`
      );
      if (res.data?.tafsir?.text) {
        setTafsirCache((prev) => ({
          ...prev,
          [key]: res.data.tafsir,
        }));
        return res.data.tafsir;
      }
    } catch (err) {
      console.warn('Tafsir fetch error:', err);
    } finally {
      setTafsirLoadingKey(null);
    }
  };

  // Helper to strip footnote markers like [১], [২], [1] from translation strings
  const cleanTranslationText = (str) => {
    if (!str) return '';
    return str.replace(/\[\d+\]/g, '').replace(/\[[০-৯]+\]/g, '').replace(/\s+/g, ' ').trim();
  };

  // Fetch Surah Verses + Multi-Translation (Mujibur Rahman 163, Zakaria 213, Taisirul 161) + WBW payload
  const fetchSurah = async (surahNumber) => {
    setLoading(true);
    setCurrentAyahPlaying(null);
    setIsPlaying(false);
    audioRef.current.pause();

    try {
      const scriptEdition = arabicScript === 'tajweed' ? 'quran-tajweed' : arabicScript;
      
      const arabicUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/${scriptEdition}`;
      // Sheikh Mujibur Rahman (ID 163 - Darussalaam Publication)
      const mujiburUrl = `https://api.quran.com/api/v4/quran/translations/163?chapter_number=${surahNumber}`;
      // Dr. Abu Bakr Muhammad Zakaria (ID 213 - King Fahd Complex)
      const zakariaUrl = `https://api.quran.com/api/v4/quran/translations/213?chapter_number=${surahNumber}`;
      // Taisirul Quran (ID 161 - Tawheed Publication)
      const taisirulUrl = `https://api.quran.com/api/v4/quran/translations/161?chapter_number=${surahNumber}`;
      // English Sahih
      const englishUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`;
      // Word-by-Word Bengali meanings
      const wbwUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=bn&words=true&word_fields=text_uthmani,translation,transliteration&per_page=300`;

      const [arabicRes, mujiburRes, zakariaRes, taisirulRes, englishRes, wbwRes] = await Promise.allSettled([
        axios.get(arabicUrl, { timeout: 8000 }),
        axios.get(mujiburUrl, { timeout: 8000 }),
        axios.get(zakariaUrl, { timeout: 8000 }),
        axios.get(taisirulUrl, { timeout: 8000 }),
        axios.get(englishUrl, { timeout: 8000 }),
        axios.get(wbwUrl, { timeout: 8000 }),
      ]);

      if (arabicRes.status === 'fulfilled' && arabicRes.value.data?.data) {
        const arabicData = arabicRes.value.data.data;
        const currentMeta = SURAHS.find((s) => s.id === surahNumber);

        const mujiburList = mujiburRes.status === 'fulfilled' ? mujiburRes.value.data?.translations || [] : [];
        const zakariaList = zakariaRes.status === 'fulfilled' ? zakariaRes.value.data?.translations || [] : [];
        const taisirulList = taisirulRes.status === 'fulfilled' ? taisirulRes.value.data?.translations || [] : [];
        const englishAyahs = englishRes.status === 'fulfilled' ? englishRes.value.data?.data?.ayahs || [] : [];
        const wbwVerses = wbwRes.status === 'fulfilled' ? wbwRes.value.data?.verses || [] : [];

        const mergedVerses = arabicData.ayahs.map((ayah, index) => {
          const wbwItem = wbwVerses[index];
          const words = wbwItem?.words
            ?.filter((w) => w.char_type_name !== 'end')
            ?.map((w) => ({
              position: w.position,
              text: w.text_uthmani || w.text,
              translation: w.translation?.text || '',
              transliteration: w.transliteration?.text || '',
              audioUrl: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null,
            })) || [];

          const fallbackItem = surahNumber === 1 ? FALLBACK_SURAH_1.verses[index] : null;

          const mText = mujiburList[index]?.text ? cleanTranslationText(mujiburList[index].text) : (fallbackItem?.transBanglaRahman || '');
          const zText = zakariaList[index]?.text ? cleanTranslationText(zakariaList[index].text) : (fallbackItem?.transBanglaZakaria || '');
          const tText = taisirulList[index]?.text ? cleanTranslationText(taisirulList[index].text) : (fallbackItem?.transBanglaUsmani || '');
          const enText = englishAyahs[index]?.text || fallbackItem?.transEnglishSahih || '';

          return {
            numberInSurah: ayah.numberInSurah,
            numberInQuran: ayah.number,
            textUthmani: ayah.text,
            textIndoPak: ayah.text,
            transBanglaRahman: mText || zText || tText,
            transBanglaZakaria: zText || mText || tText,
            transBanglaUsmani: tText || mText || zText,
            transEnglishSahih: enText,
            transEnglishClear: enText,
            tafsirIbnKathir: fallbackItem?.tafsirIbnKathir || `তাফসীর ইবনে কাসীর: সূরা ${currentMeta?.nameBangla || ''} - আয়াত ${ayah.numberInSurah}`,
            words: words.length > 0 ? words : (fallbackItem?.words || []),
          };
        });

        setSurahData({
          surahNumber,
          nameArabic: currentMeta?.nameArabic || arabicData.name,
          nameBangla: currentMeta?.nameBangla || arabicData.englishName,
          nameEnglish: currentMeta?.nameEnglish || arabicData.englishName,
          verses: mergedVerses,
        });
      }
    } catch (err) {
      console.warn('Network fallback triggered:', err.message);
      if (surahNumber === 1) {
        setSurahData(FALLBACK_SURAH_1);
      } else {
        showToast('অনলাইন সংযোগে বিলম্ব হচ্ছে। সূরা আল-ফাতিহা দিয়ে পরীক্ষা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurah(currentSurahId);
  }, [currentSurahId, arabicScript]);

  // Audio Playback: Full Surah (continuous MP3 streaming without loading between ayahs!)
  const playFullSurahAudio = () => {
    setPlaybackMode('surah');
    setCurrentAyahPlaying(null);
    setIsPlaying(true);
    const fullAudioUrl = selectedQari.surahAudioUrl(currentSurahId);
    audioRef.current.src = fullAudioUrl;
    audioRef.current.play().catch((e) => console.log('Surah audio play error:', e));
    showToast(`সম্পূর্ণ সূরা ${currentSurahMeta?.nameBangla} একটানা বাজছে...`);
  };

  // Audio Playback: Specific Ayah ONLY (plays only that single ayah and then cleanly stops!)
  const playSingleAyahAudio = (ayahNum) => {
    const ayah = surahData.verses.find((v) => v.numberInSurah === ayahNum);
    if (!ayah) return;

    setPlaybackMode('single_ayah');
    setCurrentAyahPlaying(ayahNum);
    setIsPlaying(true);

    const audioUrl = `${selectedQari.ayahAudioBase}/${ayah.numberInQuran}.mp3`;
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch((e) => console.log('Audio play error:', e));
    showToast(`শুধুমাত্র আয়াত ${currentSurahId}:${ayahNum} তিলাওয়াত হচ্ছে`);

    // Auto scroll to active ayah
    const el = document.getElementById(`ayah-${ayahNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        playSingleAyahAudio(1);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const playNextAyah = () => {
    if (playbackMode === 'surah') {
      if (currentSurahId < 114) setCurrentSurahId((prev) => prev + 1);
      return;
    }
    if (!currentAyahPlaying) {
      playSingleAyahAudio(1);
      return;
    }
    if (currentAyahPlaying < surahData.verses.length) {
      playSingleAyahAudio(currentAyahPlaying + 1);
    }
  };

  const playPrevAyah = () => {
    if (currentAyahPlaying > 1) {
      playSingleAyahAudio(currentAyahPlaying - 1);
    }
  };

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setAudioProgress(audio.currentTime);
      setAudioDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      // Hifz Repeat Loop
      if (activeReadingMode === 'hifz' && hifzRepeatTarget > 1) {
        if (hifzCurrentRepeatCount < hifzRepeatTarget - 1) {
          setHifzCurrentRepeatCount((prev) => prev + 1);
          audio.currentTime = 0;
          audio.play();
          return;
        } else {
          setHifzCurrentRepeatCount(0);
        }
      }

      // Single Ayah mode stops cleanly
      if (playbackMode === 'single_ayah') {
        setIsPlaying(false);
        setCurrentAyahPlaying(null);
        showToast('আয়াত তিলাওয়াত সমাপ্ত');
        return;
      }

      setIsPlaying(false);
      setCurrentAyahPlaying(null);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAyahPlaying, surahData, activeReadingMode, hifzRepeatTarget, hifzCurrentRepeatCount, playbackMode]);

  // Copy Ayah text
  const handleCopyAyah = (verse) => {
    const trans =
      translationPreference === 'usmani_only'
        ? verse.transBanglaUsmani
        : translationPreference === 'english_only'
        ? verse.transEnglishSahih
        : verse.transBanglaRahman;

    const textToCopy = `${verse.textUthmani}\n\n${trans}\n[কুরআন বুঝি — সূরা ${currentSurahMeta?.nameBangla}: ${currentSurahId}:${verse.numberInSurah}]`;
    navigator.clipboard.writeText(textToCopy);
    showToast(`আয়াত ${currentSurahId}:${verse.numberInSurah} কপি করা হয়েছে`);
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (verse) => {
    const curSurah = SURAHS.find((s) => s.id === currentSurahId);
    const existing = bookmarks.find((b) => b.surahId === currentSurahId && b.ayahNumber === verse.numberInSurah);

    if (existing) {
      try {
        await axios.delete(`/api/bookmarks/${existing._id}`);
        setBookmarks((prev) => prev.filter((b) => b._id !== existing._id));
        showToast('আয়াত বুকমার্ক থেকে সরানো হয়েছে');
      } catch {
        const updated = bookmarks.filter((b) => !(b.surahId === currentSurahId && b.ayahNumber === verse.numberInSurah));
        setBookmarks(updated);
        localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
        showToast('আয়াত বুকমার্ক থেকে সরানো হয়েছে');
      }
    } else {
      const newB = {
        surahId: currentSurahId,
        surahNameBangla: curSurah?.nameBangla || 'সূরা',
        ayahNumber: verse.numberInSurah,
        ayahTextArabic: verse.textUthmani,
        translationBangla: verse.transBanglaRahman || verse.transBanglaUsmani,
        category: activeReadingMode === 'hifz' ? 'Hifz' : 'Favorite',
      };

      try {
        const res = await axios.post('/api/bookmarks', newB);
        if (res.data.success) {
          setBookmarks((prev) => [res.data.data, ...prev]);
        }
      } catch {
        const local = [{ ...newB, _id: Date.now().toString() }, ...bookmarks];
        setBookmarks(local);
        localStorage.setItem('quran_bookmarks', JSON.stringify(local));
      }
      showToast('আয়াত সফলভাবে বুকমার্কে যুক্ত হয়েছে!');
    }
  };

  const isAyahBookmarked = (ayahNum) => {
    return bookmarks.some((b) => b.surahId === currentSurahId && b.ayahNumber === ayahNum);
  };

  // Reset Settings to Default
  const handleResetSettings = () => {
    setArabicScript('quran-indopak');
    setFontSizeScale(4);
    setMushafLines('16');
    setTranslationPreference('rahman_only');
    setShowHoverTooltip(true);
    showToast('সেটিংস রিসেট করা হয়েছে');
  };

  // Filtered Surahs
  const filteredSurahs = SURAHS.filter((s) => {
    const matchesSearch =
      s.nameBangla.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.meaningBangla.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toString() === searchQuery.trim();

    if (surahFilter === 'all') return matchesSearch;
    return matchesSearch && s.revelationType === surahFilter;
  });

  const currentSurahMeta = SURAHS.find((s) => s.id === currentSurahId);

  return (
    <div>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--gold)',
            color: 'var(--gold-light)',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-bangla)',
            fontWeight: 600,
          }}
        >
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Combined Sticky Navigation Header (Both Topbar and Subnav stay pinned / still) */}
      <div className="sticky-header-container">
        {/* Primary Top Navbar with Brand Name "কুরআন বুঝি" */}
        <header className="quran-navbar">
          <div className="brand-section" onClick={() => setIsIndexOpen(true)}>
            <div className="brand-logo-emblem">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="brand-text-title">
                কুরআন বুঝি
                <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>۞</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--gold-light)' }}>Quran Bujhi</span>
              </h1>
            </div>
          </div>

          {/* Search Bar Input */}
          <div style={{ flex: 1, maxWidth: '380px', margin: '0 1rem' }}>
            <div
              onClick={() => setIsIndexOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              <Search size={16} />
              <span>সূরা বা আয়াত অনুসন্ধান করুন...</span>
            </div>
          </div>

          {/* Right Action Icons (Only Bookmarks and Theme Switcher) */}
          <div className="nav-actions">
            {/* Bookmarks Toggle */}
            <button
              className="icon-btn-gold"
              onClick={() => setIsBookmarkModalOpen(true)}
              title="সংরক্ষিত আয়াতসমূহ"
            >
              <BookMarked size={18} />
            </button>

            {/* Theme Switcher */}
            <button
              className="icon-btn-gold"
              onClick={() => {
                if (theme === 'dark') setTheme('emerald');
                else if (theme === 'emerald') setTheme('sepia');
                else setTheme('dark');
              }}
              title="থিম পরিবর্তন"
            >
              {theme === 'emerald' ? <Sparkles size={18} /> : theme === 'sepia' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Sub-Navbar (Pinned with Topbar) */}
        <nav className="quran-subnav">
          {/* Left: Active Surah Dropdown Tab */}
          <div className="subnav-left-tab" onClick={() => setIsIndexOpen(true)}>
            <span>{currentSurahMeta?.id}. {currentSurahMeta?.nameEnglish}</span>
            <ChevronDown size={16} />
          </div>

          {/* Center: Page & Juz Breadcrumb */}
          <div className="subnav-center-info">
            <span>🔖 পাতা ১</span>
            <span>|</span>
            <span>জুজ ১ / হিযব ১</span>
          </div>

          {/* Right: Reading Mode Tabs (পদ দ্বারা পদ / পড়া / হিফজ) & SINGLE Settings Icon */}
          <div className="subnav-right-modes">
            <div className="mode-pills">
              <button
                className={`mode-pill-btn ${activeReadingMode === 'wbw' ? 'active' : ''}`}
                onClick={() => setActiveReadingMode('wbw')}
              >
                <Layers size={14} />
                <span>পদ দ্বারা পদ</span>
              </button>
              <button
                className={`mode-pill-btn ${activeReadingMode === 'reading' ? 'active' : ''}`}
                onClick={() => setActiveReadingMode('reading')}
              >
                <BookOpen size={14} />
                <span>পড়া</span>
              </button>
              <button
                className={`mode-pill-btn ${activeReadingMode === 'hifz' ? 'active' : ''}`}
                onClick={() => setActiveReadingMode('hifz')}
              >
                <Brain size={14} />
                <span>হিফজ</span>
              </button>
            </div>

            {/* SINGLE clean settings button */}
            <button
              className="icon-btn-gold"
              style={{ width: '34px', height: '34px' }}
              onClick={() => setIsSettingsOpen(true)}
              title="সেটিংস (ডান পাশ থেকে খুলুন)"
            >
              <Settings size={16} />
            </button>
          </div>
        </nav>
      </div>

      {/* Main Quran Content View */}
      <main className="quran-container">
        {/* Two-Column Hero Banner */}
        <div className="qurancom-hero-banner">
          <div className="hero-left-details">
            <div className="hero-calligraphy-icon">
              {currentSurahMeta?.nameArabic}
            </div>
            <div className="hero-text-content">
              <div className="hero-title-row">
                <h1 className="hero-main-title">
                  {currentSurahMeta?.id}. সূরা {currentSurahMeta?.nameEnglish}
                </h1>
                <span className="hero-meaning-sub">
                  {currentSurahMeta?.nameBangla} ({currentSurahMeta?.meaningBangla})
                </span>
              </div>
              <p className="hero-synopsis-desc">
                সম্পূর্ণ সূরাটি পড়ুন ও শুনুন | {currentSurahMeta?.nameEnglish} (অধ্যায় {currentSurahMeta?.id}), যা নিয়ে গঠিত {currentSurahMeta?.versesCount} শ্লোকসমূহ। প্রকাশিত হয়েছে {currentSurahMeta?.revelationType} এতে স্বরচিহ্নসহ সম্পূর্ণ আরবি পাঠ, অনুবাদ, তাফসীর, শব্দে শব্দে অর্থ এবং অডিও অন্তর্ভুক্ত রয়েছে।
              </p>
            </div>
          </div>

          <div className="hero-right-actions">
            <div className="hero-btn-row">
              <button
                className="hero-action-btn play-primary"
                onClick={playFullSurahAudio}
                title="কোনো লোড ছাড়াই পুরো সূরা শুনুন"
              >
                <Play size={16} />
                <span>শুনুন</span>
              </button>
              <button
                className="hero-action-btn"
                onClick={() => setIsInfoModalOpen(true)}
                title="সূরা পরিচিতি ও তথ্য"
              >
                <Info size={16} />
                <span>তথ্য</span>
              </button>
            </div>

            {/* Quick Translation Dropdown */}
            <select
              className="hero-trans-selector"
              value={translationPreference}
              onChange={(e) => {
                setTranslationPreference(e.target.value);
                showToast('অনুবাদ পরিবর্তিত হয়েছে');
              }}
            >
              <option value="rahman_only">অনুবাদ: ড. মজিবুর রহমান</option>
              <option value="usmani_only">অনুবাদ: মুফতি তাকী উসমানী</option>
              <option value="zakaria_only">অনুবাদ: ড. আবু বকর জাকারিয়া</option>
              <option value="english_only">Translation: Saheeh International</option>
              <option value="all">অনুবাদ: সব অনুবাদ একসাথে</option>
            </select>
          </div>
        </div>

        {/* Hifz Mode Tools Bar */}
        {activeReadingMode === 'hifz' && (
          <div className="controls-bar" style={{ marginBottom: '1.5rem' }}>
            <div className="control-row">
              <div className="control-group">
                <span className="control-label">হিফজ টুলস:</span>
                <button
                  className={`pill-toggle ${hideTranslationInHifz ? 'active' : ''}`}
                  onClick={() => setHideTranslationInHifz((prev) => !prev)}
                >
                  {hideTranslationInHifz ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{hideTranslationInHifz ? 'অনুবাদ লুকানো আছে' : 'অনুবাদ দেখুন'}</span>
                </button>
              </div>

              <div className="control-group">
                <span className="control-label">আয়াত রিপিট (Repeat):</span>
                {[1, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    className={`pill-toggle ${hifzRepeatTarget === count ? 'active' : ''}`}
                    onClick={() => {
                      setHifzRepeatTarget(count);
                      setHifzCurrentRepeatCount(0);
                      showToast(`প্রতিটি আয়াত ${count} বার পুনরাবৃত্তি হবে`);
                    }}
                  >
                    {count}x বার
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. READING MODE: পড়া (পবিত্র কুরআন পাঠের আসল রূপ / Pure Mushaf Reading Mode) */}
        {activeReadingMode === 'reading' && (
          <div className="mushaf-reading-container">
            {/* Mushaf Decorative Surah Header Frame */}
            <div className="mushaf-surah-frame-header">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {currentSurahMeta?.revelationType} • {currentSurahMeta?.versesCount} আয়াত
              </span>
              <div className="mushaf-surah-frame-title">
                سُورَةُ {currentSurahMeta?.nameArabic}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                সূরা {currentSurahMeta?.nameBangla}
              </span>
            </div>

            {/* Bismillah (except Surah At-Tawbah) */}
            {currentSurahId !== 9 && (
              <div className="mushaf-bismillah-center">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}

            {/* Continuous Holy Quran Flowing Text */}
            <div
              className={`mushaf-text-flow ${arabicScript === 'quran-uthmani' ? 'font-uthmani' : 'font-indopak'}`}
              style={{ fontSize: `${arabicFontSize + 4}px` }}
            >
              {surahData.verses.map((ayah) => {
                const isPlayingThis = currentAyahPlaying === ayah.numberInSurah;

                return (
                  <span
                    key={ayah.numberInSurah}
                    id={`ayah-${ayah.numberInSurah}`}
                    className={`mushaf-ayah-item ${isPlayingThis ? 'active-ayah' : ''}`}
                    onClick={() => playSingleAyahAudio(ayah.numberInSurah)}
                    title={`আয়াত ${ayah.numberInSurah} (তিলাওয়াত শুনতে ক্লিক করুন)`}
                  >
                    {ayah.words && ayah.words.length > 0 ? (
                      ayah.words.map((w, wIdx) => {
                        const wordKey = `${ayah.numberInSurah}-${wIdx}`;
                        const isHovered = hoveredWordKey === wordKey;

                        return (
                          <span
                            key={wIdx}
                            className="quran-word-wrapper"
                            onMouseEnter={() => setHoveredWordKey(wordKey)}
                            onMouseLeave={() => setHoveredWordKey(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWord({ ...w, ayahNumber: ayah.numberInSurah });
                            }}
                          >
                            {isHovered && showHoverTooltip && w.translation && (
                              <span className="word-bubble-tooltip">
                                <span>{w.translation}</span>
                                <ChevronRight size={14} style={{ opacity: 0.8 }} />
                              </span>
                            )}
                            <span className={`quran-word-span ${isHovered ? 'is-hovered' : ''}`}>
                              {w.text}{' '}
                            </span>
                          </span>
                        );
                      })
                    ) : (
                      <span>{ayah.textUthmani} </span>
                    )}

                    <span className="mushaf-end-circle">
                      ۝{ayah.numberInSurah}
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Mushaf Page Footer */}
            <div className="mushaf-page-footer">
              <span>পবিত্র কুরআন — সূরা {currentSurahMeta?.nameBangla}</span>
              <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>صفحة ١ • جزء ١</span>
              <span>পৃষ্ঠা ১ • পারা ১</span>
            </div>
          </div>
        )}

        {/* 2. LINE-BY-LINE MODE: পদ দ্বারা পদ ও হিফজ মোড */}
        {activeReadingMode !== 'reading' && (
          <div className="ayahs-stream">
            {surahData.verses.map((ayah) => {
              const isPlayingThis = currentAyahPlaying === ayah.numberInSurah;
              const isBookmarked = isAyahBookmarked(ayah.numberInSurah);
              const activeTab = activeTabByAyah[ayah.numberInSurah];

              return (
                <div
                  key={ayah.numberInSurah}
                  id={`ayah-${ayah.numberInSurah}`}
                  className={`qurancom-ayah-card ${isPlayingThis ? 'active-playing' : ''}`}
                >
                  {/* Ayah Top Meta Header Row */}
                  <div className="ayah-top-meta-row">
                    {/* Left: Ayah Key, Play button, Bookmark */}
                    <div className="ayah-key-left">
                      <span className="ayah-key-number">
                        {currentSurahId}:{ayah.numberInSurah}
                      </span>
                      <button
                        className={`ayah-top-btn ${isPlayingThis ? 'playing' : ''}`}
                        onClick={() => playSingleAyahAudio(ayah.numberInSurah)}
                        title="শুধুমাত্র এই আয়াত শুনুন"
                      >
                        {isPlayingThis && isPlaying ? (
                          <div className="audio-wave-anim">
                            <span className="audio-bar" />
                            <span className="audio-bar" />
                            <span className="audio-bar" />
                          </div>
                        ) : (
                          <Play size={17} />
                        )}
                      </button>
                      <button
                        className="ayah-top-btn"
                        onClick={() => handleToggleBookmark(ayah)}
                        title={isBookmarked ? 'বুকমার্ক সরানো' : 'বুকমার্কে রাখুন'}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck size={17} color="var(--gold-light)" />
                        ) : (
                          <Bookmark size={17} />
                        )}
                      </button>
                    </div>

                    {/* Right: Copy, Share, Reflection */}
                    <div className="ayah-utility-right">
                      <button
                        className="ayah-top-btn"
                        onClick={() => handleCopyAyah(ayah)}
                        title="আয়াত ও অনুবাদ কপি করুন"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="ayah-top-btn"
                        onClick={() => {
                          handleCopyAyah(ayah);
                          showToast('শেয়ার লিংক প্রস্তুত করা হয়েছে');
                        }}
                        title="শেয়ার করুন"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        className="ayah-top-btn"
                        onClick={() =>
                          setActiveTabByAyah((prev) => ({
                            ...prev,
                            [ayah.numberInSurah]: prev[ayah.numberInSurah] === 'reflection' ? null : 'reflection',
                          }))
                        }
                        title="প্রতিফলন ও নোট"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Line of Arabic Text with Speech-Bubble on Hover (No permanent subtitle clutter!) */}
                  <div className="arabic-ayah-box">
                    {ayah.words && ayah.words.length > 0 ? (
                      ayah.words.map((w, wIdx) => {
                        const wordKey = `${ayah.numberInSurah}-${wIdx}`;
                        const isHovered = hoveredWordKey === wordKey;

                        return (
                          <div
                            key={wIdx}
                            className="quran-word-wrapper"
                            onMouseEnter={() => setHoveredWordKey(wordKey)}
                            onMouseLeave={() => setHoveredWordKey(null)}
                          >
                            {/* Floating Speech-Bubble Tooltip on Hover */}
                            {isHovered && showHoverTooltip && w.translation && (
                              <div className="word-bubble-tooltip">
                                <span>{w.translation}</span>
                                <ChevronRight size={14} style={{ opacity: 0.8 }} />
                              </div>
                            )}

                            <span
                              className={`quran-word-span ${isHovered ? 'is-hovered' : ''} ${
                                arabicScript === 'quran-uthmani' ? 'font-uthmani' : 'font-indopak'
                              }`}
                              style={{ fontSize: `${arabicFontSize}px` }}
                              onClick={() => setSelectedWord({ ...w, ayahNumber: ayah.numberInSurah })}
                            >
                              {w.text}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span
                        className={arabicScript === 'quran-uthmani' ? 'font-uthmani' : 'font-indopak'}
                        style={{ fontSize: `${arabicFontSize}px` }}
                      >
                        {ayah.textUthmani}
                      </span>
                    )}
                  </div>

                  {/* Clean Line Translation Directly Below the Arabic Line */}
                  {(!hideTranslationInHifz || activeReadingMode !== 'hifz') && (
                    <div className="translations-wrapper" style={{ marginTop: '0.75rem' }}>
                      {(translationPreference === 'rahman_only' || translationPreference === 'all') && (
                        <div style={{ marginBottom: translationPreference === 'all' ? '0.5rem' : '0' }}>
                          {translationPreference === 'all' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                              ড. মজিবুর রহমান:
                            </span>
                          )}
                          <p className="trans-text" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {ayah.transBanglaRahman || ayah.transBanglaZakaria || ayah.transBanglaUsmani}
                          </p>
                        </div>
                      )}

                      {(translationPreference === 'zakaria_only' || translationPreference === 'all') && (
                        <div style={{ marginBottom: translationPreference === 'all' ? '0.5rem' : '0' }}>
                          {translationPreference === 'all' && (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                              ড. আবু বকর মুহাম্মাদ যাকারিয়া:
                            </span>
                          )}
                          <p className="trans-text" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {ayah.transBanglaZakaria || ayah.transBanglaRahman || ayah.transBanglaUsmani}
                          </p>
                        </div>
                      )}

                      {translationPreference === 'usmani_only' && (
                        <p className="trans-text" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {ayah.transBanglaUsmani || ayah.transBanglaRahman}
                        </p>
                      )}

                      {(translationPreference === 'english_only' || translationPreference === 'all') && ayah.transEnglishSahih && (
                        <div style={{ marginTop: translationPreference === 'all' ? '0.35rem' : '0' }}>
                          {translationPreference === 'all' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                              Saheeh International:
                            </span>
                          )}
                          <p className="trans-text" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                            {ayah.transEnglishSahih}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Action Tabs (Exact Match to User's Uploaded Image) */}
                  <div className="ayah-bottom-action-tabs">
                    <button
                      className={`ayah-action-tab-item ${activeTab === 'tafsir' ? 'active' : ''}`}
                      onClick={() => {
                        const isClosing = activeTab === 'tafsir';
                        setActiveTabByAyah((prev) => ({
                          ...prev,
                          [ayah.numberInSurah]: isClosing ? null : 'tafsir',
                        }));
                        if (!isClosing) {
                          fetchAyahTafsir(ayah.numberInSurah, selectedTafsirId);
                        }
                      }}
                    >
                      <BookOpen size={14} />
                      <span>তাফসির</span>
                    </button>

                    <button
                      className={`ayah-action-tab-item ${activeTab === 'lessons' ? 'active' : ''}`}
                      onClick={() =>
                        setActiveTabByAyah((prev) => ({
                          ...prev,
                          [ayah.numberInSurah]: prev[ayah.numberInSurah] === 'lessons' ? null : 'lessons',
                        }))
                      }
                    >
                      <GraduationCap size={14} />
                      <span>পাঠ</span>
                    </button>

                    <button
                      className={`ayah-action-tab-item ${activeTab === 'reflection' ? 'active' : ''}`}
                      onClick={() =>
                        setActiveTabByAyah((prev) => ({
                          ...prev,
                          [ayah.numberInSurah]: prev[ayah.numberInSurah] === 'reflection' ? null : 'reflection',
                        }))
                      }
                    >
                      <MessageSquare size={14} />
                      <span>প্রতিফলন</span>
                    </button>

                    <button
                      className={`ayah-action-tab-item ${activeTab === 'hadith' ? 'active' : ''}`}
                      onClick={() =>
                        setActiveTabByAyah((prev) => ({
                          ...prev,
                          [ayah.numberInSurah]: prev[ayah.numberInSurah] === 'hadith' ? null : 'hadith',
                        }))
                      }
                    >
                      <BookText size={14} />
                      <span>হাদিস</span>
                    </button>
                  </div>

                  {/* Expanded Insights Box (Verse-by-Verse Comprehensive Tafsir & Explanations) */}
                  {activeTab && (
                    <div className="ayah-insights-container">
                      {/* TAB 1: তাফসীর (Live from Quran.com API with Ibn Kathir & Abu Bakr Zakaria) */}
                      {activeTab === 'tafsir' && (
                        <div>
                          <div className="tafsir-header-controls">
                            <div className="tafsir-title-text">
                              <BookOpen size={17} />
                              <span>
                                তাফসীর ও ব্যাখ্যা (সূরা {currentSurahMeta?.nameBangla} • আয়াত {ayah.numberInSurah})
                              </span>
                            </div>
                            <div className="tafsir-source-pills">
                              <button
                                className={`tafsir-pill ${selectedTafsirId === 164 ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedTafsirId(164);
                                  fetchAyahTafsir(ayah.numberInSurah, 164);
                                }}
                              >
                                তাফসীর ইবনে কাসীর
                              </button>
                              <button
                                className={`tafsir-pill ${selectedTafsirId === 166 ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedTafsirId(166);
                                  fetchAyahTafsir(ayah.numberInSurah, 166);
                                }}
                              >
                                তাফসীর আবু বকর যাকারিয়া
                              </button>
                            </div>
                          </div>

                          {tafsirLoadingKey === `${currentSurahId}:${ayah.numberInSurah}_${selectedTafsirId}` ? (
                            <div className="tafsir-loading-state">
                              <div className="tafsir-spinner" />
                              <span>তাফসীর সংগৃহীত হচ্ছে...</span>
                            </div>
                          ) : tafsirCache[`${currentSurahId}:${ayah.numberInSurah}_${selectedTafsirId}`]?.text ? (
                            <div
                              className="tafsir-rich-content"
                              dangerouslySetInnerHTML={{
                                __html: tafsirCache[`${currentSurahId}:${ayah.numberInSurah}_${selectedTafsirId}`].text,
                              }}
                            />
                          ) : (
                            <div className="tafsir-rich-content">
                              <p>{ayah.tafsirIbnKathir || 'এই আয়াতের বিস্তারিত তাফসীর প্রস্তুত করা হচ্ছে...'}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 2: পাঠ (কোরআনিক শিক্ষা ও তাৎপর্য) */}
                      {activeTab === 'lessons' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, color: '#10b981' }}>
                            <GraduationCap size={18} />
                            <span>আয়াত থেকে প্রধান শিক্ষা ও বিধান (Lessons & Guidance)</span>
                          </div>
                          <div className="lessons-content-list">
                            {getAyahLessons(currentSurahId, ayah.numberInSurah).map((lesson, lIdx) => (
                              <div key={lIdx} className="lesson-item-row">
                                <span className="lesson-badge">{lIdx + 1}</span>
                                <p className="lesson-text">{lesson}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: প্রতিফলন (তাদাব্বুর ও ব্যক্তিগত নোট) */}
                      {activeTab === 'reflection' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, color: '#38bdf8' }}>
                            <MessageSquare size={18} />
                            <span>তাদাব্বুর (গভীর অনুধাবন) ও চিন্তাভাবনা</span>
                          </div>
                          <div className="reflection-prompts-card">
                            <p style={{ fontStyle: 'italic', margin: 0 }}>
                              "{getAyahReflectionPrompt(currentSurahId, ayah.numberInSurah)}"
                            </p>
                          </div>

                          {/* Personal Note Pad */}
                          <div style={{ marginTop: '0.75rem' }}>
                            <label style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                              📝 এই আয়াত সম্পর্কে আপনার নিজস্ব উপলব্ধি বা আমলের সংকল্প:
                            </label>
                            <textarea
                              className="reflection-textarea"
                              rows={3}
                              placeholder="এই আয়াত পড়ার পর আপনার মনের অনুভূতি বা সংকল্প লিখুন..."
                              value={
                                tempNoteText[`${currentSurahId}:${ayah.numberInSurah}`] !== undefined
                                  ? tempNoteText[`${currentSurahId}:${ayah.numberInSurah}`]
                                  : (reflectionNotes[`${currentSurahId}:${ayah.numberInSurah}`] || '')
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setTempNoteText((prev) => ({
                                  ...prev,
                                  [`${currentSurahId}:${ayah.numberInSurah}`]: val,
                                }));
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                              <button
                                className="btn-save-note"
                                onClick={() => {
                                  const text = tempNoteText[`${currentSurahId}:${ayah.numberInSurah}`] || '';
                                  const updated = {
                                    ...reflectionNotes,
                                    [`${currentSurahId}:${ayah.numberInSurah}`]: text,
                                  };
                                  setReflectionNotes(updated);
                                  localStorage.setItem('quran_ayah_reflections', JSON.stringify(updated));
                                  showToast('প্রতিফলন নোট সফলভাবে সংরক্ষিত হয়েছে!');
                                }}
                              >
                                সংরক্ষণ করুন
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: হাদিস (প্রাসঙ্গিক বিশুদ্ধ হাদিস ও ফযীলত) */}
                      {activeTab === 'hadith' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, color: 'var(--gold)' }}>
                            <BookText size={18} />
                            <span>সম্পর্কিত বিশুদ্ধ হাদিস ও ফযীলত</span>
                          </div>
                          <div className="hadith-card">
                            <p className="hadith-narrative-text">
                              {getAyahHadith(currentSurahId, ayah.numberInSurah).text}
                            </p>
                            <div className="hadith-citation-footer">
                              <span className="hadith-source-tag">
                                📖 সূত্র: {getAyahHadith(currentSurahId, ayah.numberInSurah).source}
                              </span>
                              <span className="hadith-grade-badge">
                                {getAyahHadith(currentSurahId, ayah.numberInSurah).grade}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Word Inspector Card on click */}
      {selectedWord && (
        <div className="word-inspector-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              শব্দার্থ • আয়াত {selectedWord.ayahNumber}
            </span>
            <button
              onClick={() => setSelectedWord(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="word-inspector-arabic">{selectedWord.text}</div>
          <div className="word-inspector-meaning">{selectedWord.translation || 'অর্থ লোড হচ্ছে...'}</div>
          {selectedWord.transliteration && (
            <div className="word-inspector-translit">{selectedWord.transliteration}</div>
          )}

          <div className="word-inspector-actions">
            {selectedWord.audioUrl && (
              <button
                className="btn-ayah-action"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                onClick={() => {
                  wordAudioRef.current.src = selectedWord.audioUrl;
                  wordAudioRef.current.play().catch(() => {});
                }}
              >
                <Volume2 size={14} /> উচ্চারণ শুনুন
              </button>
            )}
            <button
              className="btn-ayah-action"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
              onClick={() => setSelectedWord(null)}
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Audio Player */}
      <footer className="sticky-audio-bar">
        {/* Reciter Info */}
        <div className="player-info-section">
          <div className="player-avatar">
            <Volume2 size={20} />
          </div>
          <div>
            <div className="player-title-surah">
              সূরা {currentSurahMeta?.nameBangla}{' '}
              {playbackMode === 'single_ayah' && currentAyahPlaying
                ? `(আয়াত ${currentSurahId}:${currentAyahPlaying})`
                : '(সম্পূর্ণ সূরা একটানা)'}
            </div>
            <div className="player-qari-name">{selectedQari.nameBangla}</div>
          </div>
        </div>

        {/* Player Controls Center */}
        <div className="player-controls-center">
          <div className="player-buttons-row">
            <button className="btn-player-step" onClick={playPrevAyah} title="পূর্ববর্তী আয়াত">
              <SkipBack size={16} />
            </button>

            <button className="btn-player-play" onClick={togglePlayPause}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>

            <button className="btn-player-step" onClick={playNextAyah} title="পরবর্তী আয়াত">
              <SkipForward size={16} />
            </button>
          </div>

          {/* Timeline Range Bar */}
          <div className="player-slider-wrap">
            <span>
              {Math.floor(audioProgress / 60)}:
              {String(Math.floor(audioProgress % 60)).padStart(2, '0')}
            </span>
            <input
              type="range"
              className="player-range"
              min="0"
              max={audioDuration || 100}
              value={audioProgress || 0}
              onChange={(e) => {
                audioRef.current.currentTime = Number(e.target.value);
                setAudioProgress(Number(e.target.value));
              }}
            />
            <span>
              {Math.floor(audioDuration / 60)}:
              {String(Math.floor(audioDuration % 60)).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Extra Options & Qari Selector */}
        <div className="player-extra-options">
          <button
            className={`pill-toggle ${playbackMode === 'surah' ? 'active' : ''}`}
            onClick={playFullSurahAudio}
            title="সম্পূর্ণ সূরা একটানা শুনুন"
          >
            সম্পূর্ণ সূরা
          </button>

          <select
            className="select-qari"
            value={selectedQari.id}
            onChange={(e) => {
              const found = QARIS.find((q) => q.id === e.target.value);
              if (found) {
                setSelectedQari(found);
                showToast(`ক্বারী নির্বাচন: ${found.nameBangla}`);
              }
            }}
          >
            {QARIS.map((qari) => (
              <option key={qari.id} value={qari.id}>
                🎙️ {qari.nameBangla}
              </option>
            ))}
          </select>
        </div>
      </footer>

      {/* Settings Modal (EXACT MATCH TO SCREENSHOT 2/3 - RIGHT SIDE SLIDE-OVER DRAWER) */}
      {isSettingsOpen && (
        <div className="settings-drawer-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-pic2-modal" onClick={(e) => e.stopPropagation()}>
            {/* Top 3 Tabs matching Screenshot 2: আরবি | অনুবাদ | শব্দ দ্বারা শব্দ */}
            <div className="settings-pic2-tabs">
              <button
                className={`settings-pic2-tab ${settingsActiveTab === 'arabic' ? 'active' : ''}`}
                onClick={() => setSettingsActiveTab('arabic')}
              >
                আরবি
              </button>
              <button
                className={`settings-pic2-tab ${settingsActiveTab === 'translation' ? 'active' : ''}`}
                onClick={() => setSettingsActiveTab('translation')}
              >
                অনুবাদ
              </button>
              <button
                className={`settings-pic2-tab ${settingsActiveTab === 'wbw' ? 'active' : ''}`}
                onClick={() => setSettingsActiveTab('wbw')}
              >
                শব্দ দ্বারা শব্দ
              </button>
            </div>

            {/* Modal Body */}
            <div className="settings-pic2-body">
              {/* TAB 1: আরবি (Matching Screenshot 2) */}
              {settingsActiveTab === 'arabic' && (
                <>
                  <div>
                    <div className="settings-preview-label">পূর্বরূপ:</div>
                    <div className="settings-preview-box">
                      <div className="settings-preview-arabic">
                        <span>بِسْمِ اللَّهِ </span>
                        {/* Word with Speech-Bubble Tooltip in Preview */}
                        <div className="quran-word-wrapper">
                          <div className="word-bubble-tooltip">
                            <span>the Most Gracious</span>
                          </div>
                          <span style={{ color: '#fbbf24' }}>الرَّحْمَٰنِ </span>
                        </div>
                        <span>الرَّحِيمِ ۝</span>
                      </div>
                      <div className="settings-preview-trans">
                        In the Name of Allah—the Most Compassionate, Most Merciful.
                      </div>
                    </div>
                  </div>

                  {/* Script Segmented: উসমানী | ইন্দোপাক | তাজবীদ */}
                  <div className="settings-script-segmented">
                    <button
                      className={`settings-script-btn ${arabicScript === 'quran-uthmani' ? 'active' : ''}`}
                      onClick={() => setArabicScript('quran-uthmani')}
                    >
                      উসমানী
                    </button>
                    <button
                      className={`settings-script-btn ${arabicScript === 'quran-indopak' ? 'active' : ''}`}
                      onClick={() => setArabicScript('quran-indopak')}
                    >
                      ইন্দোপাক
                    </button>
                    <button
                      className={`settings-script-btn ${arabicScript === 'tajweed' ? 'active' : ''}`}
                      onClick={() => setArabicScript('tajweed')}
                    >
                      তাজবীদ
                    </button>
                  </div>

                  {/* Line Setting (লাইন: 16 লাইন ⌵) */}
                  <div className="settings-row-item">
                    <span className="settings-row-label">লাইন</span>
                    <select
                      className="settings-row-select"
                      value={mushafLines}
                      onChange={(e) => {
                        setMushafLines(e.target.value);
                        showToast(`লাইন ফরম্যাট: ${e.target.value} লাইন`);
                      }}
                    >
                      <option value="16">16 লাইন</option>
                      <option value="15">15 লাইন</option>
                      <option value="standard">স্বাভাবিক</option>
                    </select>
                  </div>

                  {/* Font Size Counter (অক্ষরের আকার: —  ৪  +) */}
                  <div className="settings-row-item">
                    <span className="settings-row-label">অক্ষরের আকার</span>
                    <div className="settings-stepper">
                      <button
                        className="settings-stepper-btn"
                        onClick={() => setFontSizeScale((prev) => Math.max(1, prev - 1))}
                      >
                        —
                      </button>
                      <span className="settings-stepper-value">{fontSizeScale}</span>
                      <button
                        className="settings-stepper-btn"
                        onClick={() => setFontSizeScale((prev) => Math.min(8, prev + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Reciter Dropdown (নির্বাচিত আবৃত্তিকার ⌵) */}
                  <div style={{ marginTop: '0.25rem' }}>
                    <select
                      className="settings-row-select"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                      value={selectedQari.id}
                      onChange={(e) => {
                        const found = QARIS.find((q) => q.id === e.target.value);
                        if (found) {
                          setSelectedQari(found);
                          showToast(`ক্বারী নির্বাচন: ${found.nameBangla}`);
                        }
                      }}
                    >
                      {QARIS.map((qari) => (
                        <option key={qari.id} value={qari.id}>
                          {qari.nameBangla} ({qari.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* TAB 2: অনুবাদ */}
              {settingsActiveTab === 'translation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    আপনি যে অনুবাদটি দেখতে চান সেটি নির্বাচন করুন:
                  </p>

                  <label
                    className={`setting-option-radio ${translationPreference === 'rahman_only' ? 'selected' : ''}`}
                    onClick={() => {
                      setTranslationPreference('rahman_only');
                      showToast('ড. মজিবুর রহমানের অনুবাদ সক্রিয়');
                    }}
                  >
                    <input type="radio" checked={translationPreference === 'rahman_only'} onChange={() => {}} />
                    <div>
                      <div style={{ fontWeight: 700 }}>ড. মজিবুর রহমান (Mujibur Rahman)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>সবচেয়ে বিশুদ্ধ ও বহুল পঠিত বাংলা অনুবাদ</div>
                    </div>
                  </label>

                  <label
                    className={`setting-option-radio ${translationPreference === 'usmani_only' ? 'selected' : ''}`}
                    onClick={() => {
                      setTranslationPreference('usmani_only');
                      showToast('মুফতি তাকী উসমানীর অনুবাদ সক্রিয়');
                    }}
                  >
                    <input type="radio" checked={translationPreference === 'usmani_only'} onChange={() => {}} />
                    <div>
                      <div style={{ fontWeight: 700 }}>মুফতি তাকী উসমানী / মাও. মুহিউদ্দীন খান</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>সহজ-সরল প্রাঞ্জল বাংলা অনুবাদ</div>
                    </div>
                  </label>

                  <label
                    className={`setting-option-radio ${translationPreference === 'zakaria_only' ? 'selected' : ''}`}
                    onClick={() => {
                      setTranslationPreference('zakaria_only');
                      showToast('ড. আবু বকর জাকারিয়ার অনুবাদ সক্রিয়');
                    }}
                  >
                    <input type="radio" checked={translationPreference === 'zakaria_only'} onChange={() => {}} />
                    <div>
                      <div style={{ fontWeight: 700 }}>ড. আবু বকর মুহাম্মাদ যাকারিয়া</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মদীনা প্রকাশনা অনুবাদ</div>
                    </div>
                  </label>

                  <label
                    className={`setting-option-radio ${translationPreference === 'english_only' ? 'selected' : ''}`}
                    onClick={() => {
                      setTranslationPreference('english_only');
                      showToast('Saheeh International Active');
                    }}
                  >
                    <input type="radio" checked={translationPreference === 'english_only'} onChange={() => {}} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Saheeh International (English)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>আন্তর্জাতিক ইংরেজি অনুবাদ</div>
                    </div>
                  </label>

                  <label
                    className={`setting-option-radio ${translationPreference === 'all' ? 'selected' : ''}`}
                    onClick={() => {
                      setTranslationPreference('all');
                      showToast('সব অনুবাদ একসাথে সক্রিয়');
                    }}
                  >
                    <input type="radio" checked={translationPreference === 'all'} onChange={() => {}} />
                    <div>
                      <div style={{ fontWeight: 700 }}>সবগুলো অনুবাদ একসাথে</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>সকল অনুবাদ একসাথে প্রদর্শন করুন</div>
                    </div>
                  </label>
                </div>
              )}

              {/* TAB 3: শব্দ দ্বারা শব্দ */}
              {settingsActiveTab === 'wbw' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="settings-row-item">
                    <div>
                      <div className="settings-row-label">শব্দের ওপর মাউস নিলে অর্থ প্রদর্শন</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মাউস হোভার করলে স্পিচ-বাবলে বাংলা অর্থ ভেসে উঠবে</div>
                    </div>
                    <button
                      className={`pill-toggle ${showHoverTooltip ? 'active' : ''}`}
                      onClick={() => setShowHoverTooltip((prev) => !prev)}
                    >
                      {showHoverTooltip ? 'অন' : 'অফ'}
                    </button>
                  </div>

                  <div className="settings-row-item">
                    <div>
                      <div className="settings-row-label">শব্দের নিচে সরাসরি অর্থ প্রদর্শন</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>প্রতিটি আরবি শব্দের নিচেই ছোট করে অর্থ থাকবে</div>
                    </div>
                    <button
                      className={`pill-toggle ${showWordMeaningsInline ? 'active' : ''}`}
                      onClick={() => setShowWordMeaningsInline((prev) => !prev)}
                    >
                      {showWordMeaningsInline ? 'অন' : 'অফ'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer matching Screenshot 2: রিসেট করুন | সম্পন্ন */}
            <div className="settings-pic2-footer">
              <button className="btn-settings-reset" onClick={handleResetSettings}>
                রিসেট করুন
              </button>
              <button className="btn-settings-done" onClick={() => setIsSettingsOpen(false)}>
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Surah Info Modal (তথ্য) */}
      {isInfoModalOpen && (
        <div className="drawer-backdrop" onClick={() => setIsInfoModalOpen(false)}>
          <div className="drawer-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} color="var(--gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  সূরা {currentSurahMeta?.nameBangla} সম্পর্কিত তথ্য
                </h3>
              </div>
              <button className="icon-btn-gold" onClick={() => setIsInfoModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.75rem', overflowY: 'auto', maxHeight: '65vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>নামকরণ ও গুরুত্ব</div>
                <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  এই সূরাটির নাম "{currentSurahMeta?.nameBangla}" যার অর্থ "{currentSurahMeta?.meaningBangla}"। এটি কুরআনের {currentSurahMeta?.revelationType} সূরা এবং এতে মোট {currentSurahMeta?.versesCount} টি আয়াত রয়েছে।
                </p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>ফযিলত ও মর্যাদা</div>
                <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  সূরা আল-ফাতিহা হলো কুরআনের সর্বশ্রেষ্ঠ সূরা এবং সকল রোগের শেফা। প্রতিটি সালাতের প্রতিটি রাকাতে এটি তিলাওয়াত করা ওয়াজিব।
                </p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>প্রধান শিক্ষণীয় বিষয়সমূহ</div>
                <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  ১. আল্লাহর একত্ববাদ ও তাঁর গুণাবলীর স্বীকৃতি।<br />
                  ২. কেবলমাত্র তাঁরই ইবাদত ও সাহায্য প্রার্থনা।<br />
                  ৩. সরল-সঠিক পথ (সিরাতুল মুস্তাকীম) অনুসরণের আকুল মোনাজাত।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Surah Index Drawer Modal (সূচিপত্র) */}
      {isIndexOpen && (
        <div className="drawer-backdrop" onClick={() => setIsIndexOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <input
                type="text"
                className="drawer-search-input"
                placeholder="সূরা খুঁজুন (যেমন: ফাতিহা, বাকারাহ, ইখলাস, অথবা নম্বর 112)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`pill-toggle ${surahFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSurahFilter('all')}
                >
                  সব (১১৪)
                </button>
                <button
                  className={`pill-toggle ${surahFilter === 'মাক্কী' ? 'active' : ''}`}
                  onClick={() => setSurahFilter('মাক্কী')}
                >
                  মাক্কী
                </button>
                <button
                  className={`pill-toggle ${surahFilter === 'মাদানী' ? 'active' : ''}`}
                  onClick={() => setSurahFilter('মাদানী')}
                >
                  মাদানী
                </button>
              </div>

              <button className="icon-btn-gold" onClick={() => setIsIndexOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="surahs-grid-list">
              {filteredSurahs.map((surah) => (
                <div
                  key={surah.id}
                  className={`surah-card-item ${currentSurahId === surah.id ? 'selected' : ''}`}
                  onClick={() => {
                    setCurrentSurahId(surah.id);
                    setIsIndexOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="surah-num-box">{surah.id}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        সূরা {surah.nameBangla}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {surah.meaningBangla} • {surah.versesCount} আয়াত
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-arabic-uthmani)',
                        fontSize: '1.4rem',
                        color: 'var(--gold-light)',
                      }}
                    >
                      {surah.nameArabic}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {surah.revelationType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Modal */}
      {isBookmarkModalOpen && (
        <div className="drawer-backdrop" onClick={() => setIsBookmarkModalOpen(false)}>
          <div className="drawer-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookMarked size={20} color="var(--gold)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>সংরক্ষিত আয়াত ও বুকমার্ক</h3>
              </div>
              <button className="icon-btn-gold" onClick={() => setIsBookmarkModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '65vh' }}>
              {bookmarks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bookmarks.map((b) => (
                    <div
                      key={b._id}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                          সূরা {b.surahNameBangla} — আয়াত {b.ayahNumber}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-ayah-action"
                            onClick={() => {
                              setCurrentSurahId(b.surahId);
                              setIsBookmarkModalOpen(false);
                              setTimeout(() => playSingleAyahAudio(b.ayahNumber), 400);
                            }}
                          >
                            <Play size={12} /> শুনুন
                          </button>
                          <button
                            className="btn-ayah-action"
                            onClick={async () => {
                              try {
                                await axios.delete(`/api/bookmarks/${b._id}`);
                                setBookmarks((prev) => prev.filter((item) => item._id !== b._id));
                              } catch {
                                const updated = bookmarks.filter((item) => item._id !== b._id);
                                setBookmarks(updated);
                                localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
                              }
                              showToast('বুকমার্ক মুছে ফেলা হয়েছে');
                            }}
                          >
                            মুছুন
                          </button>
                        </div>
                      </div>

                      {b.ayahTextArabic && (
                        <p
                          style={{
                            fontFamily: 'var(--font-arabic-uthmani)',
                            fontSize: '1.3rem',
                            textAlign: 'right',
                            direction: 'rtl',
                            color: 'var(--text-arabic)',
                          }}
                        >
                          {b.ayahTextArabic}
                        </p>
                      )}

                      {b.translationBangla && (
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          {b.translationBangla}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Bookmark size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p>এখনো কোনো আয়াত বুকমার্কে সংরক্ষণ করা হয়নি।</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    পড়ার সময় যেকোনো আয়াতের পাশে বুকমার্ক আইকনে ক্লিক করুন।
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
