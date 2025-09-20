
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
const Exercise = ExerciseModel(sequelize, DataTypes);
const ExerciseCategory = ExerciseCategoryModel(sequelize, DataTypes);
const ExerciseMuscleGroup = ExerciseMuscleGroupModel(sequelize, DataTypes);
const MuscleGroup = MuscleGroupModel(sequelize, DataTypes);
const Routine = RoutineModel(sequelize, DataTypes);
const Session = SessionModel(sequelize, DataTypes);
const Set = SetModel(sequelize, DataTypes);
const User = UserModel(sequelize, DataTypes);
const ExerciseRoutine = ExerciseRoutineModel(sequelize, DataTypes);
const ExerciseSession = ExerciseSessionModel(sequelize, DataTypes);

// Asociaciones
Exercise.associate?.({ ExerciseCategory, User, MuscleGroup, Routine, ExerciseMuscleGroup, ExerciseRoutine });
ExerciseCategory.associate?.({ Exercise });
ExerciseMuscleGroup.associate?.({ Exercise, MuscleGroup });
MuscleGroup.associate?.({ Exercise, ExerciseMuscleGroup });
Routine.associate?.({ User, Exercise, ExerciseRoutine });
Session.associate?.({ User, Routine, Exercise, ExerciseSession });
Set.associate?.({ ExerciseRoutine, ExerciseSession });
User.associate?.({ Exercise });
ExerciseRoutine.associate?.({ Routine, Exercise, Set });
ExerciseSession.associate?.({ Session, Exercise, Set });

export {
  sequelize,
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
};

