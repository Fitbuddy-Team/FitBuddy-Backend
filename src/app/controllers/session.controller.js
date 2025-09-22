import { Session, Routine, ExerciseSession, ExerciseRoutine, Set as SetModel, Exercise, User, sequelize } from '../models/index.js';

// Función auxiliar para manejar errores de secuencia
async function createWithSequenceFallback(Model, data, options = {}) {
  try {
    return await Model.create(data, options);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0]?.path === 'id') {
      const maxId = await Model.max('id');
      return await Model.create({
        ...data,
        id: maxId + 1
      }, options);
    }
    throw error;
  }
}

export const sessionController = {
  // Obtener todas las sesiones de un usuario
  getAllSessions: async (req, res) => {
    try {
      const { userId } = req.params;

      // Validar que userId sea un número
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      // Verificar que el usuario existe
      const user = await User.findByPk(parseInt(userId));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Buscar todas las sesiones del usuario con información de la rutina
      const sessions = await Session.findAll({
        where: {
          userId: parseInt(userId)
        },
        include: [
          {
            model: Routine,
            as: 'routine',
            attributes: ['id', 'name', 'description'], // Solo incluir los atributos necesarios
            required: false // LEFT JOIN para incluir sesiones sin rutina
          }
        ],
        attributes: ['id', 'userId', 'routineId', 'date', 'duration', 'status', 'createdAt', 'updatedAt'],
        order: [['date', 'DESC']] // Ordenar por fecha más reciente primero
      });

      // Verificar si hay sesiones para el usuario
      if (sessions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron sesiones para el usuario especificado'
        });
      }

      // Formatear la respuesta
      const formattedSessions = sessions.map(session => {
        const sessionData = {
          id: session.id,
          userId: session.userId,
          routineId: session.routineId,
          date: session.date,
          duration: session.duration,
          status: session.status,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        };

        // Si la sesión tiene una rutina asociada, incluir su información
        if (session.routine) {
          sessionData.routine = {
            id: session.routine.id,
            name: session.routine.name,
            description: session.routine.description
          };
        }

        return sessionData;
      });

      res.status(200).json({
        success: true,
        message: 'Sesiones obtenidas exitosamente',
        data: formattedSessions,
        count: formattedSessions.length
      });

    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Crear una nueva sesión de entrenamiento
  // changeRoutine por defecto es false, solo actualiza la rutina si se especifica explícitamente true
  createSession: async (req, res) => {
    try {
      const { 
        userId, 
        routineId, 
        duration, 
        status, 
        changeRoutine, 
        exercises 
      } = req.body;

      // Validaciones básicas
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'El userId es requerido'
        });
      }

      if (!exercises || !Array.isArray(exercises)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de exercises'
        });
      }

      // Verificar que el usuario existe
      const user = await User.findByPk(parseInt(userId));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Validar que todos los ejercicios existan
      const exerciseIds = exercises.map(ex => ex.exerciseId);
      const existingExercises = await Exercise.findAll({
        where: { id: exerciseIds }
      });

      if (existingExercises.length !== exerciseIds.length) {
        const foundIds = existingExercises.map(ex => ex.id);
        const missingIds = exerciseIds.filter(id => !foundIds.includes(id));
        return res.status(400).json({
          success: false,
          message: `Los siguientes ejercicios no existen: ${missingIds.join(', ')}`
        });
      }

      // Crear la sesión
      const session = await createWithSequenceFallback(Session, {
        userId: parseInt(userId),
        routineId: routineId ? parseInt(routineId) : null,
        date: new Date(),
        duration: duration || null,
        status: status || 'completed'
      });

      // Crear los ExerciseSession y sus SetModels
      for (let i = 0; i < exercises.length; i++) {
        const exerciseData = exercises[i];
        
        // Crear ExerciseSession
        const exerciseSession = await createWithSequenceFallback(ExerciseSession, {
          sessionId: session.id,
          exerciseId: exerciseData.exerciseId,
          order: exerciseData.order || (i + 1)
        });

        // Crear los SetModels para este ExerciseSession
        if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
          for (let j = 0; j < exerciseData.sets.length; j++) {
            const setData = exerciseData.sets[j];
            await createWithSequenceFallback(SetModel, {
              exerciseSessionId: exerciseSession.id,
              order: setData.order || (j + 1),
              status: setData.status || 'completed',
              reps: setData.reps || null,
              weight: setData.weight || null,
              restTime: setData.restTime || null
            });
          }
        }
      }

      // Si changeRoutine es true y hay una rutina asociada, actualizar la rutina
      // Por defecto changeRoutine es false, solo actualiza si se especifica explícitamente true
      if (changeRoutine === true) {
        if (!routineId) {
          return res.status(404).json({
            success: false,
            message: 'No se puede actualizar la rutina: no hay rutina asociada a esta sesión'
          });
        }

        // Verificar que la rutina existe
        const existingRoutine = await Routine.findByPk(routineId);
        if (!existingRoutine) {
          return res.status(404).json({
            success: false,
            message: 'La rutina especificada no existe'
          });
        }

        // Validar que todos los ejercicios tengan exerciseId
        for (const exerciseData of exercises) {
          if (!exerciseData.exerciseId) {
            return res.status(400).json({
              success: false,
              message: 'Todos los ejercicios deben tener un exerciseId válido para actualizar la rutina'
            });
          }
        }

        // Validar que todos los exerciseId existen
        const exerciseIds = exercises.map(ex => ex.exerciseId);
        const existingExercises = await Exercise.findAll({
          where: { id: exerciseIds }
        });

        if (existingExercises.length !== exerciseIds.length) {
          const foundIds = existingExercises.map(ex => ex.id);
          const missingIds = exerciseIds.filter(id => !foundIds.includes(id));
          return res.status(400).json({
            success: false,
            message: `Los siguientes ejercicios no existen: ${missingIds.join(', ')}`
          });
        }

        // Actualizar información básica de la rutina (manteniendo el mismo userId)
        await Routine.update(
          {
            name: existingRoutine.name, // Mantener el nombre original
            description: existingRoutine.description // Mantener la descripción original
          },
          {
            where: { id: routineId }
          }
        );

        // Eliminar todos los ExerciseRoutines existentes (esto eliminará automáticamente los Sets)
        await ExerciseRoutine.destroy({
          where: { routineId: routineId }
        });

        // Crear los nuevos ExerciseRoutine y sus Sets
        for (let i = 0; i < exercises.length; i++) {
          const exerciseData = exercises[i];
          
          // Crear ExerciseRoutine
          const exerciseRoutine = await createWithSequenceFallback(ExerciseRoutine, {
            routineId: routineId,
            exerciseId: exerciseData.exerciseId,
            order: exerciseData.order || (i + 1)
          });

          // Crear los Sets para este ExerciseRoutine
          if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
            for (let j = 0; j < exerciseData.sets.length; j++) {
              const setData = exerciseData.sets[j];
              await createWithSequenceFallback(SetModel, {
                exerciseRoutineId: exerciseRoutine.id,
                order: setData.order || (j + 1),
                status: setData.status || 'pending',
                reps: setData.reps || null,
                weight: setData.weight || null,
                restTime: setData.restTime || null
              });
            }
          }
        }
      }

        // Obtener la sesión creada con toda su información
        const createdSession = await Session.findByPk(session.id, {
          include: [
            {
              model: Routine,
              as: 'routine',
              attributes: ['id', 'name', 'description', 'userId'],
              required: false
            },
            {
              model: Exercise,
              as: 'exercises',
              through: {
                model: ExerciseSession,
                as: 'exerciseSession',
                attributes: ['id', 'sessionId', 'exerciseId', 'order', 'createdAt', 'updatedAt']
              },
              attributes: ['id', 'name', 'userMade', 'categoryId', 'userId']
            }
          ]
        });

        // Obtener los ExerciseSessions con sus SetModels por separado
        const exerciseSessions = await ExerciseSession.findAll({
          where: { sessionId: session.id },
          include: [
            {
              model: SetModel,
              as: 'sets',
              attributes: ['id', 'order', 'status', 'reps', 'weight', 'restTime']
            }
          ]
        });

        // Mapear los sets a los ejercicios
        if (createdSession && createdSession.exercises) {
          createdSession.exercises.forEach(exercise => {
            const exerciseSession = exerciseSessions.find(es => es.exerciseId === exercise.id);
            if (exerciseSession && exerciseSession.sets) {
              exercise.ExerciseSession = {
                ...exercise.ExerciseSession,
                sets: exerciseSession.sets
              };
            }
          });
        }

      res.status(201).json({
        success: true,
        message: 'Sesión creada exitosamente',
        data: createdSession
      });

    } catch (error) {
      console.error('Error al crear sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener una sesión específica por ID
  getSessionById: async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Validar que sessionId sea un número
      if (!sessionId || isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de sesión inválido'
        });
      }

      // Buscar la sesión con información básica
      const session = await Session.findByPk(parseInt(sessionId), {
        include: [
          {
            model: Routine,
            as: 'routine',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: Exercise,
            as: 'exercises',
            through: {
              model: ExerciseSession,
              as: 'exerciseSession',
              attributes: ['id', 'sessionId', 'exerciseId', 'order', 'createdAt', 'updatedAt']
            },
            attributes: ['id', 'name', 'userMade', 'categoryId', 'userId']
          }
        ],
        attributes: ['id', 'userId', 'routineId', 'date', 'duration', 'status', 'createdAt', 'updatedAt']
      });

      // Obtener los sets por separado para evitar problemas de asociación
      const exerciseSessions = await ExerciseSession.findAll({
        where: { sessionId: parseInt(sessionId) },
        include: [
          {
            model: SetModel,
            as: 'sets'
          }
        ]
      });

      // Verificar si la sesión existe
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Sesión no encontrada'
        });
      }

      // Crear un mapa de sets por exerciseSessionId para facilitar la búsqueda
      const setsByExerciseSessionId = {};
      exerciseSessions.forEach(es => {
        setsByExerciseSessionId[es.id] = es.sets || [];
      });

      // Formatear la respuesta
      const formattedSession = {
        id: session.id,
        userId: session.userId,
        routineId: session.routineId,
        date: session.date,
        duration: session.duration,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        routine: session.routine ? {
          id: session.routine.id,
          name: session.routine.name,
          description: session.routine.description
        } : null,
        exercises: session.exercises.map(exercise => {
          const exerciseSession = exercise.exerciseSession;
          if (!exerciseSession) {
            return null;
          }
          
          // Obtener los sets para este exerciseSession
          const sets = setsByExerciseSessionId[exerciseSession.id] || [];
          const sortedSets = sets.sort((a, b) => (a.order || 0) - (b.order || 0));

          return {
            id: exercise.id,
            name: exercise.name,
            userMade: exercise.userMade,
            categoryId: exercise.categoryId,
            userId: exercise.userId,
            order: exerciseSession.order,
            sets: sortedSets.map(set => ({
              id: set.id,
              order: set.order,
              status: set.status,
              reps: set.reps,
              weight: set.weight,
              restTime: set.restTime,
              createdAt: set.createdAt,
              updatedAt: set.updatedAt
            }))
          };
        }).filter(exercise => exercise !== null)
      };

      res.status(200).json({
        success: true,
        message: 'Sesión obtenida exitosamente',
        data: formattedSession
      });

    } catch (error) {
      console.error('Error al obtener sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Actualizar una sesión existente
  updateSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { 
        duration, 
        status, 
        exercises 
      } = req.body;

      // Validaciones básicas
      if (!sessionId || isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de sesión inválido'
        });
      }

      if (!exercises || !Array.isArray(exercises)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de exercises'
        });
      }

      // Verificar que la sesión existe
      const existingSession = await Session.findByPk(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: 'Sesión no encontrada'
        });
      }

      // Validar que todos los ejercicios existan
      const exerciseIds = exercises.map(ex => ex.exerciseId);
      const existingExercises = await Exercise.findAll({
        where: { id: exerciseIds }
      });

      if (existingExercises.length !== exerciseIds.length) {
        const foundIds = existingExercises.map(ex => ex.id);
        const missingIds = exerciseIds.filter(id => !foundIds.includes(id));
        return res.status(400).json({
          success: false,
          message: `Los siguientes ejercicios no existen: ${missingIds.join(', ')}`
        });
      }

      // Iniciar transacción para asegurar consistencia
      const transaction = await sequelize.transaction();

      try {
        // Actualizar información básica de la sesión (NO incluir routineId)
        await Session.update(
          {
            duration: duration || null,
            status: status || existingSession.status
          },
          {
            where: { id: sessionId },
            transaction
          }
        );

        // Eliminar todos los ExerciseSessions existentes (esto eliminará automáticamente los SetModels)
        await ExerciseSession.destroy({
          where: { sessionId: sessionId },
          transaction
        });

        // Crear los nuevos ExerciseSession y sus SetModels
        for (let i = 0; i < exercises.length; i++) {
          const exerciseData = exercises[i];
          
          // Crear ExerciseSession
          const exerciseSession = await ExerciseSession.create({
            sessionId: sessionId,
            exerciseId: exerciseData.exerciseId,
            order: exerciseData.order || (i + 1)
          }, { transaction });

          // Crear los SetModels para este ExerciseSession
          if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
            for (let j = 0; j < exerciseData.sets.length; j++) {
              const setData = exerciseData.sets[j];
              await createWithSequenceFallback(SetModel, {
                exerciseSessionId: exerciseSession.id,
                order: setData.order || (j + 1),
                status: setData.status || 'completed',
                reps: setData.reps || null,
                weight: setData.weight || null,
                restTime: setData.restTime || null
              }, { transaction });
            }
          }
        }

        // Confirmar transacción
        await transaction.commit();

        // Obtener la sesión actualizada con toda su información
        const updatedSession = await Session.findByPk(sessionId, {
          include: [
            {
              model: Routine,
              as: 'routine',
              attributes: ['id', 'name', 'description', 'userId'],
              required: false
            },
            {
              model: Exercise,
              as: 'exercises',
              through: {
                model: ExerciseSession,
                as: 'exerciseSession',
                include: [
                  {
                    model: SetModel,
                    as: 'sets',
                    attributes: ['id', 'order', 'status', 'reps', 'weight', 'restTime']
                  }
                ]
              },
              attributes: ['id', 'name', 'userMade', 'categoryId', 'userId']
            }
          ]
        });

        res.status(200).json({
          success: true,
          message: 'Sesión actualizada exitosamente',
          data: updatedSession
        });

      } catch (error) {
        // Si hay error, hacer rollback de la transacción
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error al actualizar sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Eliminar una sesión y todos sus registros relacionados
  deleteSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Validaciones básicas
      if (!sessionId || isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de sesión inválido'
        });
      }

      // Verificar que la sesión existe
      const existingSession = await Session.findByPk(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: 'Sesión no encontrada'
        });
      }

      // Iniciar transacción para asegurar consistencia
      const transaction = await sequelize.transaction();

      try {
        // Obtener todos los ExerciseSessions de esta sesión
        const exerciseSessions = await ExerciseSession.findAll({
          where: { sessionId: sessionId },
          transaction
        });

        // Para cada ExerciseSession, eliminar sus SetModels
        for (const exerciseSession of exerciseSessions) {
          await SetModel.destroy({
            where: { exerciseSessionId: exerciseSession.id },
            transaction
          });
        }

        // Eliminar todos los ExerciseSessions de la sesión
        await ExerciseSession.destroy({
          where: { sessionId: sessionId },
          transaction
        });

        // Finalmente, eliminar la sesión
        await Session.destroy({
          where: { id: sessionId },
          transaction
        });

        // Confirmar transacción
        await transaction.commit();

        res.status(200).json({
          success: true,
          message: 'Sesión eliminada exitosamente junto con todos sus ejercicios y sets'
        });

      } catch (error) {
        // Si hay error, hacer rollback de la transacción
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};
