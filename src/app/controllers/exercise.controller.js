import { Exercise } from '../models/index.js';
import { MuscleGroup } from '../models/index.js';

export const exerciseController = {
  getAllExercises: (req, res) => {
    Exercise.findAll()
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
  }
};

export default exerciseController;