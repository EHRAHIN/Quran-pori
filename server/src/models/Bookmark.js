import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    surahId: {
      type: Number,
      required: true,
    },
    surahNameBangla: {
      type: String,
      required: true,
    },
    ayahNumber: {
      type: Number,
      required: true,
    },
    ayahTextArabic: {
      type: String,
    },
    translationBangla: {
      type: String,
    },
    note: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Favorite', 'Hifz', 'Daily Reading', 'Tafsir Note'],
      default: 'Favorite',
    },
  },
  {
    timestamps: true,
  }
);

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
