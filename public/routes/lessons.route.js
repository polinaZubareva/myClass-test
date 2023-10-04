import express from 'express';
import lessonsController from '../controllers/lessons.controller.js';
const lessonsRouter = express.Router();

lessonsRouter.get('/', lessonsController.read);
lessonsRouter.post('/lessons', lessonsController.create);

export default lessonsRouter;
