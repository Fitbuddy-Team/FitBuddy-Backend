import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { exerciseController } from '../controllers/exercise.controller.js';
import { muscleGroupController } from '../controllers/musclegroups.controller.js';
import { exercisecategoryController } from '../controllers/exercisecategory.controller.js';
const router = Router();


router.get('/health', healthController.health);

// Exercises
router.get('/exercises', exerciseController.getAllExercises);
router.get('/exercises/category/:catId', exerciseController.getExercisesByCategory);
router.get('/exercises/musclegroup/:groupId', exerciseController.getExercisesByMuscleGroup);

//Muscle Groups
router.get('/musclegroups', muscleGroupController.getAllMuscleGroups);

// Categories

router.get('/categories-exercises', exercisecategoryController.getAllCategories);

export default router;

