import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

// Aquí colocaremos la ruta principal de Users, Sessions, Exercises.

router.get('/health', healthController.health);

export default router;

