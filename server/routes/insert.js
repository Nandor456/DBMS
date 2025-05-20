import { Router as createRouter } from 'express';
import { insert } from '../controllers/insert/insert.js';
import { indexController } from '../controllers/insert/index.js';

const router = createRouter();
console.log('insert.js');
router.post('/', insert);
router.post('/create', indexController);

export default router;