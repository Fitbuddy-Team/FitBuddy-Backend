import { MuscleGroup } from '../models/index.js';

export const muscleGroupController = {
  getAllMuscleGroups: (req, res) => {
    MuscleGroup.findAll()
      .then(muscleGroups => res.json({ muscleGroups }))
      .catch(err => res.status(500).json({ error: err.message }));
  }
};

export default muscleGroupController;