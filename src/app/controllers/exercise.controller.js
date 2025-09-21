import { Exercise } from '../models/index.js';
import { MuscleGroup } from '../models/index.js';
import { User } from '../models/index.js';
import { ExerciseRoutine, Routine, ExerciseSession, Session } from '../models/index.js';

export const exerciseController = {
    getAllExercises: (req, res) => {
      Exercise.findAll()
        .then(exercises => res.json({ exercises }))
        .catch(err => res.status(500).json({ error: err.message }));
    },
    getExercise: (req, res) => {
      const { id } = req.params;
      Exercise.findByPk(id, {
        include: [{ model: MuscleGroup, as: 'muscles', through: { attributes: [] } }]
      })
        .then(exercise => {
          if (!exercise) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
          }
          res.json(exercise);
        })
        .catch(err => res.status(500).json({ error: err.message }));
    },

    getExercisesByUser: async (req, res) => {
        try {
          const { userId } = req.params;
        
          const user = await User.findByPk(userId);
          if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
          }
      
          const exercises = await Exercise.findAll({ where: { userId } });
          return res.json({ exercises });
        } catch (err) {
          return res.status(500).json({ error: err.message });
        }
    },


    getExercisesByCategory: (req, res) => {
      const { catId } = req.params;
      Exercise.findAll({ where: { categoryId: catId } })
        .then(exercises => res.json({ exercises }))
        .catch(err => res.status(500).json({ error: err.message }));
    },

    getExercisesByMuscleGroup: (req, res) => {
      const { groupId } = req.params;
      Exercise.findAll({
        include: [{
          model: MuscleGroup,
          as: 'muscles',
          where: { id: groupId },
          through: { attributes: [] },
          required: true 
        }
        ]
      })
        .then(exercises => res.json({ exercises }))
        .catch(err => res.status(500).json({ error: err.message }));
    },

    async createExercise(req, res) {
      try {
        const { userId } = req.params;
        const { muscleGroupIds = [], ...exerciseData } = req.body;

        // Validaciones
        if (!userId) {
          return res.status(400).json({ error: 'userId es requerido' });
        }
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({ error: 'El usuario no existe' });
        }
        if (!Array.isArray(muscleGroupIds) || muscleGroupIds.length === 0) {
          return res.status(400).json({ error: 'Debe vincularse al menos a un grupo muscular (muscleGroupIds)' });
        }
        
        const newExercise = await Exercise.create({
          ...exerciseData,
          userId,
          userMade: true
        });

        await newExercise.setMuscles(muscleGroupIds);

        const exerciseWithMuscles = await Exercise.findByPk(newExercise.id, {
          include: [{ model: MuscleGroup, as: 'muscles', through: { attributes: [] } }]
        });

        res.status(201).json(exerciseWithMuscles);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    async updateExercise(req, res) {
      try {
        const { id, userId } = req.params;
        const { muscleGroupIds, ...exerciseData } = req.body;
    
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
          return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }
        if (!exercise.userMade) {
          return res.status(403).json({ error: 'No se puede modificar un ejercicio predeterminado' });
        }
        if (exercise.userId !== Number(userId)) {
          return res.status(403).json({ error: 'No tienes permiso para modificar este ejercicio' });
        }
    
        await exercise.update(exerciseData);
    
        if (Array.isArray(muscleGroupIds)) {
          await exercise.setMuscles(muscleGroupIds);
        }
    
        const updatedExercise = await Exercise.findByPk(id, {
          include: [{ model: MuscleGroup, as: 'muscles', through: { attributes: [] } }]
        });
    
        res.json(updatedExercise);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async cautionOnDeleteExercise(req, res) {
      try {
        const { exerciseId } = req.params;
        // Rutinas asociadas
        const exerciseRoutines = await ExerciseRoutine.findAll({
          where: { exerciseId: exerciseId },
          include: [{ model: Routine, as: 'routine' }]
        });
        const routines = exerciseRoutines.map(er => er.routine);
        const routinesCount = routines.length;

        // Sesiones asociadas
        const exerciseSessions = await ExerciseSession.findAll({
          where: { exerciseId: exerciseId },
          include: [{ model: Session, as: 'session' }]
        });
        const sessions = exerciseSessions.map(es => es.session);
        const sessionsCount = sessions.length;

        res.json({
          routinesCount,
          sessionsCount,
          routines,
          sessions
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async deleteExercise(req, res) {
      try {
        const { exerciseId, userId } = req.params;
        // Buscar el ejercicio
        const exercise = await Exercise.findByPk(exerciseId);
        if (!exercise) {
          return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }
        if (!exercise.userMade) {
          return res.status(403).json({ error: 'No se puede eliminar un ejercicio predeterminado' });
        }
        if (exercise.userId !== Number(userId)) {
          return res.status(403).json({ error: 'No tienes permiso para eliminar este ejercicio' });
        }

        // Eliminar ExerciseSession y sus Session asociadas
        const exerciseSessions = await ExerciseSession.findAll({ where: { exerciseId: exerciseId } });
        for (const exSession of exerciseSessions) {
          // Eliminar la sesión asociada
          await Session.destroy({ where: { id: exSession.sessionId } });
        }
        await ExerciseSession.destroy({ where: { exerciseId: exerciseId } });

        // Eliminar ExerciseRoutine y sus Routine asociadas
        const exerciseRoutines = await ExerciseRoutine.findAll({ where: { exerciseId: exerciseId } });
        for (const exRoutine of exerciseRoutines) {
          // Eliminar la rutina asociada
          await Routine.destroy({ where: { id: exRoutine.routineId } });
        }
        await ExerciseRoutine.destroy({ where: { exerciseId: exerciseId } });

        // Eliminar el ejercicio
        await exercise.destroy();
        res.json({ message: 'Ejercicio, rutinas, sesiones y asociaciones eliminados correctamente' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
};

export default exerciseController;