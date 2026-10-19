import express from 'express';
import { getBookmarks, createBookmark, deleteBookmark } from '../controllers/bookmarkController.js';

const router = express.Router();

router.route('/')
  .get(getBookmarks)
  .post(createBookmark);

router.route('/:id')
  .delete(deleteBookmark);

export default router;
