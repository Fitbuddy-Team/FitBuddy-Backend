import { ExerciseCategory } from '../models/index.js';

export const exercisecategoryController = {
  getAllCategories: (req, res) => {
    ExerciseCategory.findAll()
      .then(categories => res.json({ categories }))
      .catch(err => res.status(500).json({ error: err.message }));
  }
};

export default exercisecategoryController;