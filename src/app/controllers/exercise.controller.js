import { Exercise } from '../models/index.js';

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
  }
};

export default exerciseController;