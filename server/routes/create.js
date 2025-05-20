import { Router as createRouter } from 'express';
import { createDB, createTable } from '../controllers/create/createDB.js';

const router = createRouter();
console.log('create.js');
router.post('/', createDB);
router.post('/table', createTable);

export default router;