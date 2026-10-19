import { Bookmark } from '../models/Bookmark.js';
import mongoose from 'mongoose';

let inMemoryBookmarks = [
  {
    _id: 'b1',
    surahId: 1,
    surahNameBangla: 'আল-ফাতিহা',
    ayahNumber: 1,
    ayahTextArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translationBangla: 'পরম করুণাময় অসীম দয়ালু আল্লাহর নামে (শুরু করছি)।',
    category: 'Daily Reading',
    note: 'প্রতিদিন নামাযে ও কাজের শুরুতে তিলাওয়াত।',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b2',
    surahId: 2,
    surahNameBangla: 'আল-বাকারা',
    ayahNumber: 255,
    ayahTextArabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    translationBangla: 'আল্লাহ ছাড়া অন্য কোনো সত্য উপাস্য নেই, তিনি চিরঞ্জীব, সর্বসত্তার ধারক...',
    category: 'Favorite',
    note: 'আয়াতুল কুরসী — মহামহিম আয়াত।',
    createdAt: new Date().toISOString(),
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

export const getBookmarks = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const bookmarks = await Bookmark.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: bookmarks.length, data: bookmarks });
    }
    return res.json({ success: true, count: inMemoryBookmarks.length, data: inMemoryBookmarks });
  } catch (error) {
    next(error);
  }
};

export const createBookmark = async (req, res, next) => {
  try {
    const { surahId, surahNameBangla, ayahNumber, ayahTextArabic, translationBangla, note, category } = req.body;

    if (!surahId || !ayahNumber) {
      return res.status(400).json({ success: false, message: 'Surah and Ayah numbers are required' });
    }

    if (isDbConnected()) {
      const bookmark = await Bookmark.create({
        surahId,
        surahNameBangla,
        ayahNumber,
        ayahTextArabic,
        translationBangla,
        note: note || '',
        category: category || 'Favorite',
      });
      return res.status(201).json({ success: true, data: bookmark });
    }

    const newBookmark = {
      _id: Date.now().toString(),
      surahId,
      surahNameBangla,
      ayahNumber,
      ayahTextArabic,
      translationBangla,
      note: note || '',
      category: category || 'Favorite',
      createdAt: new Date().toISOString(),
    };
    inMemoryBookmarks.unshift(newBookmark);
    return res.status(201).json({ success: true, data: newBookmark });
  } catch (error) {
    next(error);
  }
};

export const deleteBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      await Bookmark.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Bookmark removed' });
    }

    inMemoryBookmarks = inMemoryBookmarks.filter((b) => b._id !== id);
    return res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
};
