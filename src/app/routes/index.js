import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { userController } from '../controllers/user.controller.js';
import { exerciseController } from '../controllers/exercise.controller.js';
import { muscleGroupController } from '../controllers/musclegroups.controller.js';
import { exercisecategoryController } from '../controllers/exercisecategory.controller.js';
import { routineController } from '../controllers/routine.controller.js';
import { sessionController } from '../controllers/session.controller.js';
const router = Router();


router.get('/health', healthController.health);

// Users
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.get('/users/all', userController.getAllUsers);
router.get('/users/:userId', userController.getUser);
router.patch('/users/:userId', userController.updateUser);
router.delete('/users/:userId', userController.deleteUser);

// Exercises
router.get('/exercises', exerciseController.getAllExercises);
router.get('/exercises/search', exerciseController.getExercisesFilteredByName);
router.get('/exercises/:id', exerciseController.getExercise);
router.get('/exercises/category/:catId', exerciseController.getExercisesByCategory);
router.get('/exercises/musclegroup/:groupId', exerciseController.getExercisesByMuscleGroup);
router.get('/exercises/user/:userId', exerciseController.getExercisesByUser);
router.post('/exercises/user/:userId', exerciseController.createExercise);
router.patch('/exercises/:id/user/:userId', exerciseController.updateExercise);
router.get('/exercises/warning/:exerciseId', exerciseController.cautionOnDeleteExercise);
router.delete('/exercises/:exerciseId/user/:userId', exerciseController.deleteExercise);

//Muscle Groups
router.get('/musclegroups', muscleGroupController.getAllMuscleGroups);

// Categories
router.get('/categories-exercises', exercisecategoryController.getAllCategories);

// Routines
router.post('/routines', routineController.createRoutine);
router.get('/routines/all/:userId', routineController.getAllRoutines);
router.get('/routines/:routineId', routineController.getRoutineById);
router.put('/routines/:routineId', routineController.updateRoutine);
router.delete('/routines/:routineId', routineController.deleteRoutine);

// Sessions
router.post('/sessions', sessionController.createSession);
router.put('/sessions/:sessionId', sessionController.updateSession);
router.delete('/sessions/:sessionId', sessionController.deleteSession);
router.get('/sessions/all/:userId', sessionController.getAllSessions);
router.get('/sessions/:sessionId', sessionController.getSessionById);

export default router;

