
import { Sequelize, DataTypes } from 'sequelize';
import config from '../../config/env.js';

import ExerciseModel from './exercise.js';
import ExerciseCategoryModel from './exercisecategory.js';
import ExerciseMuscleGroupModel from './exercisemusclegroups.js';
import MuscleGroupModel from './musclegroup.js';
import RoutineModel from './routine.js';
import SessionModel from './session.js';
import SetModel from './set.js';
import UserModel from './user.js';
import ExerciseRoutineModel from './exerciseroutine.js';
import ExerciseSessionModel from './exercisesession.js';

const dbConfig = config.database;

const sequelize = new Sequelize(
  dbConfig.database || 'database',
  dbConfig.username || 'username',
  dbConfig.password || 'password',
  {
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    host: dbConfig.host,
    port: dbConfig.port,
    logging: dbConfig.logging,
  }
);

// Inicializar modelos
const models = {
  Exercise: ExerciseModel(sequelize, DataTypes),
  ExerciseCategory: ExerciseCategoryModel(sequelize, DataTypes),
  ExerciseMuscleGroup: ExerciseMuscleGroupModel(sequelize, DataTypes),
  MuscleGroup: MuscleGroupModel(sequelize, DataTypes),
  Routine: RoutineModel(sequelize, DataTypes),
  Session: SessionModel(sequelize, DataTypes),
  Set: SetModel(sequelize, DataTypes),
  User: UserModel(sequelize, DataTypes),
  ExerciseRoutine: ExerciseRoutineModel(sequelize, DataTypes),
  ExerciseSession: ExerciseSessionModel(sequelize, DataTypes),
};

// Asociaciones
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export const {
  Exercise,
  ExerciseCategory,
  ExerciseMuscleGroup,
  MuscleGroup,
  Routine,
  Session,
  Set,
  User,
  ExerciseRoutine,
  ExerciseSession
} = models;

export { sequelize };
