import { Router as createRouter } from 'express';
import { getDbName } from '../controllers/database/validate.js';
import { getOldDb, getOldTables  } from '../controllers/database/get.js';

const router = createRouter();
console.log('database router');
router.post('/', getDbName);
router.get('/', getOldDb);
router.get('/table', getOldTables);

export default router;