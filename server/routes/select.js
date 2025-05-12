import express from 'express';
import { getSelect } from '../controllers/selectController.js';

const router = express.Router();
console.log("SelectRouter loaded");
router.post('/', getSelect);

export default router;