import { Router as createRouter } from 'express';
import { deleteDB, deleteTable } from '../controllers/delete/deleteDB.js';
import { deleteRow } from '../controllers/delete/deleteRow.js';

const router = createRouter();
console.log('delete.js');
router.delete('/', deleteDB);
router.delete('/table', deleteTable);
router.delete('/delete', deleteRow);

export default router;