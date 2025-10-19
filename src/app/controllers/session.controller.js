import { Session, Routine, ExerciseSession, ExerciseRoutine, Set as SetModel, Exercise, User, LeagueMember, GroupMember, League, sequelize } from '../models/index.js';

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

/**
 * Calcula los puntos de una sesión basándose en ejercicios, sets y duración
 * @param {Array} exercises - Array de ejercicios con sus sets
 * @param {Number} duration - Duración de la sesión en minutos
 * @returns {Number} - Puntos calculados (0-20 aproximadamente)
 */
function calculateSessionPoints(exercises, duration) {
  let points = 0;
  
  // 1. Puntos por ejercicios completados (1-2 puntos por ejercicio)
  const totalExercises = exercises.length;
  points += Math.min(totalExercises * 1.5, 8); // Máximo 8 puntos por ejercicios
  
  // 2. Puntos por sets completados con repeticiones
  let completedSets = 0;
  exercises.forEach(exercise => {
    if (exercise.sets && Array.isArray(exercise.sets)) {
      exercise.sets.forEach(set => {
        // Un set cuenta si tiene reps y está completado
        if (set.reps && set.reps > 0 && (!set.status || set.status === 'completed')) {
          completedSets++;
        }
      });
    }
  });
  
  // 0.8 puntos por set completado, máximo 10 puntos
  points += Math.min(completedSets * 0.8, 10);
  
  // 3. Puntos por duración (bonus/penalización)
  if (duration) {
    const durationPoints = calculateDurationPoints(duration);
    points += durationPoints;
  }
  
  // Asegurar que los puntos estén entre 0 y 20 y retornar como entero
  return Math.max(0, Math.min(Math.round(points), 20));
}

/**
 * Calcula puntos basándose en la duración de la sesión
 * @param {Number} duration - Duración en minutos
 * @returns {Number} - Puntos por duración (-3 a +3)
 */
function calculateDurationPoints(duration) {
  // Ideal: 45 minutos a 2 horas (120 minutos)
  const idealMin = 45;
  const idealMax = 120;
  
  if (duration >= idealMin && duration <= idealMax) {
    // Duración ideal: +3 puntos
    return 3;
  } else if (duration < 45) {
    // Muy corta: penalización proporcional
    // Menos de 20 min: -3 puntos
    // Entre 20-44 min: -1 a -2 puntos
    if (duration < 20) return -3;
    if (duration < 30) return -2;
    return -1;
  } else {
    // Muy larga: penalización proporcional
    // Más de 2.5 horas (150 min): -3 puntos
    // Entre 2-2.5 horas: -1 a -2 puntos
    if (duration > 150) return -3;
    if (duration > 135) return -2;
    return -1;
  }
}

/**
 * Actualiza los puntos de un usuario en todas sus ligas y maneja promoción/degradación
 * @param {Number} userId - ID del usuario
 * @param {Number} pointsToAdd - Puntos a sumar
 */
async function updateLeagueMemberPoints(userId, pointsToAdd) {
  try {
    // Obtener todas las ligas ordenadas por puntos mínimos
    const leagues = await League.findAll({
      order: [['minimumPoints', 'ASC']]
    });

    if (leagues.length === 0) {
      console.log('No hay ligas disponibles');
      return;
    }

    // Obtener todos los LeagueMembers del usuario
    const userLeagueMembers = await LeagueMember.findAll({
      where: { userId: parseInt(userId) },
      include: [{
        model: League,
        as: 'league'
      }]
    });

    if (userLeagueMembers.length === 0) {
      console.log(`Usuario ${userId} no está en ninguna liga`);
      return;
    }

    // Procesar cada LeagueMember del usuario
    for (const member of userLeagueMembers) {
      const currentLeague = member.league;
      let newPoints = member.points + pointsToAdd;
      
      // Determinar la liga correcta basándose en los nuevos puntos
      let targetLeague = null;
      
      // Buscar la liga apropiada para los nuevos puntos
      for (const league of leagues) {
        if (newPoints >= league.minimumPoints && newPoints <= league.maximumPoints) {
          targetLeague = league;
          break;
        }
      }

      // Si no se encuentra una liga, verificar si supera el máximo de la última liga
      if (!targetLeague) {
        const lastLeague = leagues[leagues.length - 1];
        const firstLeague = leagues[0];
        
        // Si supera el máximo de la última liga, puede seguir acumulando puntos
        if (newPoints > lastLeague.maximumPoints) {
          targetLeague = lastLeague;
          console.log(`Usuario ${userId} alcanzó el máximo de ${lastLeague.name} pero continúa acumulando puntos (${newPoints} puntos)`);
        } 
        // Si baja del mínimo de la primera liga, asignar el mínimo de la primera liga
        else if (newPoints < firstLeague.minimumPoints) {
          targetLeague = firstLeague;
          newPoints = firstLeague.minimumPoints; // Ajustar puntos al mínimo
          console.log(`Usuario ${userId} bajó del mínimo de ${firstLeague.name}, puntos ajustados a ${firstLeague.minimumPoints}`);
        }
      }

      // Actualizar el LeagueMember
      await member.update({
        points: newPoints,
        leagueId: targetLeague.id
      });

      // Log si cambió de liga
      if (currentLeague.id !== targetLeague.id) {
        const isPromotion = currentLeague.minimumPoints < targetLeague.minimumPoints;
        const action = isPromotion ? 'promovido' : 'degradado';
        console.log(`Usuario ${userId} ${action} de ${currentLeague.name} a ${targetLeague.name} (${member.points} -> ${newPoints} puntos)`);
      } else {
        console.log(`Puntos actualizados en LeagueMembers para usuario ${userId}: ${member.points} -> ${newPoints} (Liga: ${currentLeague.name})`);
      }
    }
  } catch (error) {
    console.error('Error al actualizar puntos en LeagueMembers:', error);
    // No lanzar error para no fallar la creación de sesión
  }
}

/**
 * Actualiza los puntos de un usuario en todos sus grupos
 * @param {Number} userId - ID del usuario
 * @param {Number} points - Puntos a sumar
 */
async function updateGroupMemberPoints(userId, points) {
  try {
    await GroupMember.increment('points', {
      by: points,
      where: { userId: parseInt(userId) }
    });
    console.log(`Puntos actualizados en GroupMembers para usuario ${userId}: +${points}`);
  } catch (error) {
    console.error('Error al actualizar puntos en GroupMembers:', error);
    // No lanzar error para no fallar la creación de sesión
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
        attributes: ['id', 'userId', 'routineId', 'date', 'duration', 'status', 'points', 'createdAt', 'updatedAt'],
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
          points: session.points,
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

  // Obtener historial detallado de sesiones de un usuario
  getSessionHistory: async (req, res) => {
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

      // Buscar todas las sesiones del usuario con información de la rutina y ejercicios
      const sessions = await Session.findAll({
        where: {
          userId: parseInt(userId)
        },
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
              attributes: ['id', 'sessionId', 'exerciseId', 'order']
            },
            attributes: ['id', 'name'],
            required: false
          }
        ],
        attributes: ['id', 'userId', 'routineId', 'date', 'duration', 'status', 'points', 'createdAt', 'updatedAt'],
        order: [['date', 'DESC']]
      });

      // Verificar si hay sesiones para el usuario
      if (sessions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron sesiones para el usuario especificado'
        });
      }

      // Obtener todos los ExerciseSessions con sus Sets
      const sessionIds = sessions.map(s => s.id);
      const exerciseSessions = await ExerciseSession.findAll({
        where: { sessionId: sessionIds },
        include: [
          {
            model: SetModel,
            as: 'sets',
            attributes: ['id', 'order', 'status', 'reps', 'weight', 'restTime']
          }
        ]
      });

      // Crear un mapa de sets por exerciseSessionId
      const setsByExerciseSessionId = {};
      exerciseSessions.forEach(es => {
        setsByExerciseSessionId[es.id] = es.sets || [];
      });

      // Formatear la respuesta
      const formattedSessions = sessions.map(session => {
        const sessionData = {
          id: session.id,
          routineName: session.routine ? session.routine.name : null,
          duration: session.duration,
          routineDescription: session.routine ? session.routine.description : null,
          points: session.points,
          date: session.date,
          status: session.status,
          exercises: []
        };

        // Procesar ejercicios de la sesión
        if (session.exercises && session.exercises.length > 0) {
          session.exercises.forEach(exercise => {
            const exerciseSession = exercise.ExerciseSession;
            if (!exerciseSession) return;

            // Obtener los sets para este exerciseSession
            const sets = setsByExerciseSessionId[exerciseSession.id] || [];
            
            // Calcular número de sets y repeticiones totales
            const numSets = sets.length;
            const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);

            sessionData.exercises.push({
              name: exercise.name,
              numSets: numSets,
              totalReps: totalReps
            });
          });
        }

        return sessionData;
      });

      res.status(200).json({
        success: true,
        message: 'Historial de sesiones obtenido exitosamente',
        data: formattedSessions,
        count: formattedSessions.length
      });

    } catch (error) {
      console.error('Error al obtener historial de sesiones:', error);
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

      // Si se proporciona routineId, validar que existe
      if (routineId) {
        const existingRoutine = await Routine.findByPk(routineId);
        if (!existingRoutine) {
          return res.status(404).json({
            success: false,
            message: 'La rutina especificada no existe'
          });
        }
      }

      // Si changeRoutine es true, validar que routineId existe
      if (changeRoutine === true) {
        if (!routineId) {
          return res.status(404).json({
            success: false,
            message: 'No se puede actualizar la rutina: no hay rutina asociada a esta sesión'
          });
        }
        // La validación de existencia ya se hizo arriba
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

      // Calcular puntos de la sesión
      const calculatedPoints = calculateSessionPoints(exercises, duration);
      
      // Crear la sesión
      const session = await createWithSequenceFallback(Session, {
        userId: parseInt(userId),
        routineId: routineId ? parseInt(routineId) : null,
        date: new Date(),
        duration: duration || null,
        status: status || 'completed',
        points: calculatedPoints
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

      // Actualizar puntos en LeagueMembers y GroupMembers
      await updateLeagueMemberPoints(userId, calculatedPoints);
      await updateGroupMemberPoints(userId, calculatedPoints);

      // Si changeRoutine es true, actualizar la rutina
      // Por defecto changeRoutine es false, solo actualiza si se especifica explícitamente true
      if (changeRoutine === true) {
        // La validación de routineId y existencia ya se hizo arriba
        // Obtener la rutina nuevamente para usar en la actualización
        const existingRoutine = await Routine.findByPk(routineId);

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
          ],
          attributes: ['id', 'userId', 'routineId', 'date', 'duration', 'status', 'points', 'createdAt', 'updatedAt']
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
        attributes: ['id', 'userId', 'routineId', 'date', 'duration', 'status', 'points', 'createdAt', 'updatedAt']
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
        points: session.points,
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
        changeRoutine = false, // Valor por defecto
        exercises 
      } = req.body;

      console.log('🔄 UPDATE SESSION: changeRoutine =', changeRoutine, 'tipo:', typeof changeRoutine);

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

      // Si changeRoutine es true, validar que routineId existe
      if (changeRoutine === true) {
        console.log('🚨 UPDATE SESSION: changeRoutine es true, validando routineId');
        if (!existingSession.routineId) {
          return res.status(404).json({
            success: false,
            message: 'No se puede actualizar la rutina: no hay rutina asociada a esta sesión'
          });
        }
        // Verificar que la rutina existe
        const existingRoutine = await Routine.findByPk(existingSession.routineId);
        if (!existingRoutine) {
          return res.status(404).json({
            success: false,
            message: 'La rutina asociada a esta sesión no existe'
          });
        }
      } else {
        console.log('✅ UPDATE SESSION: changeRoutine NO es true, no se actualizará la rutina');
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

      // Actualizar información básica de la sesión
      await Session.update(
        {
          duration: duration || existingSession.duration,
          status: status || existingSession.status
        },
        {
          where: { id: sessionId }
        }
      );

      // Eliminar todos los ExerciseSessions existentes (esto eliminará automáticamente los SetModels)
      await ExerciseSession.destroy({
        where: { sessionId: sessionId }
      });

      // Crear los nuevos ExerciseSession y sus SetModels
      for (let i = 0; i < exercises.length; i++) {
        const exerciseData = exercises[i];
        
        // Crear ExerciseSession
        const exerciseSession = await createWithSequenceFallback(ExerciseSession, {
          sessionId: sessionId,
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

      // Si changeRoutine es true, actualizar la rutina
      if (changeRoutine === true) {
        console.log('🚨 UPDATE SESSION: ACTUALIZANDO RUTINA porque changeRoutine es true');
        // La validación de routineId y existencia ya se hizo arriba
        const existingRoutine = await Routine.findByPk(existingSession.routineId);

        // Actualizar información básica de la rutina (manteniendo el mismo userId)
        await Routine.update(
          {
            name: existingRoutine.name, // Mantener el nombre original
            description: existingRoutine.description // Mantener la descripción original
          },
          {
            where: { id: existingSession.routineId }
          }
        );

        // Eliminar todos los ExerciseRoutines existentes (esto eliminará automáticamente los Sets)
        await ExerciseRoutine.destroy({
          where: { routineId: existingSession.routineId }
        });

        // Crear los nuevos ExerciseRoutine y sus Sets
        for (let i = 0; i < exercises.length; i++) {
          const exerciseData = exercises[i];
          
          // Crear ExerciseRoutine
          const exerciseRoutine = await createWithSequenceFallback(ExerciseRoutine, {
            routineId: existingSession.routineId,
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
      } else {
        console.log('✅ UPDATE SESSION: NO se actualizará la rutina porque changeRoutine no es true');
      }

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
              attributes: ['id', 'sessionId', 'exerciseId', 'order', 'createdAt', 'updatedAt']
            },
            attributes: ['id', 'name', 'userMade', 'categoryId', 'userId']
          }
        ]
      });

      // Obtener los ExerciseSessions con sus SetModels por separado
      const exerciseSessions = await ExerciseSession.findAll({
        where: { sessionId: sessionId },
        include: [
          {
            model: SetModel,
            as: 'sets',
            attributes: ['id', 'order', 'status', 'reps', 'weight', 'restTime']
          }
        ]
      });

      // Mapear los sets a los ejercicios
      if (updatedSession && updatedSession.exercises) {
        updatedSession.exercises.forEach(exercise => {
          const exerciseSession = exerciseSessions.find(es => es.exerciseId === exercise.id);
          if (exerciseSession && exerciseSession.sets) {
            exercise.ExerciseSession = {
              ...exercise.ExerciseSession,
              sets: exerciseSession.sets
            };
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Sesión actualizada exitosamente',
        data: updatedSession
      });

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
