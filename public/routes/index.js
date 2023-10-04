import express from 'express';
import lessonsRouter from './lessons.route.js';
const router = express.Router();

router.use('/', lessonsRouter);

export default router;
