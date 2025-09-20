import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import {exerciseController} from '../controllers/exercise.controller.js';

const router = Router();


router.get('/health', healthController.health);
router.get('/exercises', exerciseController.getAllExercises);
router.get('/exercises/category/:catId', exerciseController.getExercisesByCategory);

export default router;

