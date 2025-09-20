import { Exercise } from '../models/index.js';
import { MuscleGroup } from '../models/index.js';
import { User } from '../models/index.js';

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

    getExercisesByUser: (req, res) => {
      const { userId } = req.params;
      User.findByPk(userId)
        .then(user => {
          if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
          }
          return Exercise.findAll({ where: { userId } });
        })
        .then(exercises => res.json({ exercises }))
        .catch(err => res.status(500).json({ error: err.message }));
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
        const { userId, muscleGroupIds = [], ...exerciseData } = req.body;

        // Validaciones
        if (!userId) {
          return res.status(400).json({ error: 'userId es requerido' });
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
    }
};

export default exerciseController;