import { Routine, Exercise, ExerciseRoutine, Set, Session, ExerciseSession, sequelize } from '../models/index.js';

export const routineController = {
  async createRoutine(req, res) {
    const { userId, name, description, exercises } = req.body;

    try {
      // Validaciones básicas
      if (!userId || !name || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren userId, name y un array de exercises no vacío'
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

      // Validar orden de ExerciseRoutines
      const exerciseOrders = exercises.map(ex => ex.order).filter(order => order !== undefined);
      if (exerciseOrders.length > 0) {
        const uniqueOrders = [...new Set(exerciseOrders)];
        if (exerciseOrders.length !== uniqueOrders.length) {
          return res.status(400).json({
            success: false,
            message: 'Los ejercicios no pueden tener valores de orden duplicados'
          });
        }
        
        // Verificar que no haya saltos en el orden
        const sortedOrders = exerciseOrders.sort((a, b) => a - b);
        for (let i = 0; i < sortedOrders.length; i++) {
          if (sortedOrders[i] !== i + 1) {
            return res.status(400).json({
              success: false,
              message: 'El orden de los ejercicios debe ser secuencial sin saltos (1, 2, 3...)'
            });
          }
        }
      }

      // Validar orden de Sets para cada ejercicio
      for (const exerciseData of exercises) {
        if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
          const setOrders = exerciseData.sets.map(set => set.order).filter(order => order !== undefined);
          if (setOrders.length > 0) {
            const uniqueSetOrders = [...new Set(setOrders)];
            if (setOrders.length !== uniqueSetOrders.length) {
              return res.status(400).json({
                success: false,
                message: `Los sets del ejercicio ${exerciseData.exerciseId} no pueden tener valores de orden duplicados`
              });
            }
            
            // Verificar que no haya saltos en el orden de los sets
            const sortedSetOrders = setOrders.sort((a, b) => a - b);
            for (let i = 0; i < sortedSetOrders.length; i++) {
              if (sortedSetOrders[i] !== i + 1) {
                return res.status(400).json({
                  success: false,
                  message: `El orden de los sets del ejercicio ${exerciseData.exerciseId} debe ser secuencial sin saltos (1, 2, 3...)`
                });
              }
            }
          }
        }
      }

      // Crear la rutina
      const routine = await Routine.create({
        userId,
        name,
        description: description || null
      });

      // Crear los ExerciseRoutine y sus Sets
      for (let i = 0; i < exercises.length; i++) {
        const exerciseData = exercises[i];
        
        // Crear ExerciseRoutine
        const exerciseRoutine = await ExerciseRoutine.create({
          routineId: routine.id,
          exerciseId: exerciseData.exerciseId,
          order: exerciseData.order || (i + 1), // Usar el order proporcionado o asignar secuencial
          status: exerciseData.status || 'active'
        });

        // Crear los Sets para este ExerciseRoutine
        if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
          for (let j = 0; j < exerciseData.sets.length; j++) {
            const setData = exerciseData.sets[j];
            await Set.create({
              exerciseRoutineId: exerciseRoutine.id,
              order: setData.order || (j + 1), // Usar el order proporcionado o asignar secuencial
              status: setData.status || 'pending',
              reps: setData.reps || null,
              weight: setData.weight || null,
              restTime: setData.restTime || null
            });
          }
        }
      }

      // Obtener la rutina completa con sus ejercicios y sets
      const completeRoutine = await Routine.findByPk(routine.id, {
        include: [
          {
            model: Exercise,
            as: 'exercises',
            through: {
              model: ExerciseRoutine,
              as: 'exerciseRoutine',
              include: [
                {
                  model: Set,
                  as: 'sets'
                }
              ]
            }
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Rutina creada exitosamente',
        data: completeRoutine
      });

    } catch (error) {
      console.error('Error creating routine:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },


  async getRoutineById(req, res) {
    try {
      const { routineId } = req.params;

      const routine = await Routine.findByPk(routineId, {
        include: [
          {
            model: Exercise,
            as: 'exercises',
            through: {
              model: ExerciseRoutine,
              as: 'exerciseRoutine',
              include: [
                {
                  model: Set,
                  as: 'sets',
                  order: [['order', 'ASC']]
                }
              ],
              order: [['order', 'ASC']]
            }
          }
        ],
        order: [
          [{ model: Exercise, as: 'exercises' }, { model: ExerciseRoutine, as: 'exerciseRoutine' }, 'order', 'ASC'],
          [{ model: Exercise, as: 'exercises' }, { model: ExerciseRoutine, as: 'exerciseRoutine' }, { model: Set, as: 'sets' }, 'order', 'ASC']
        ]
      });

      if (!routine) {
        return res.status(404).json({
          success: false,
          message: 'Rutina no encontrada'
        });
      }

      // Obtener datos "previous" para cada ejercicio
      const exerciseIds = routine.exercises.map(ex => ex.id);
      const previousData = await Promise.all(
        exerciseIds.map(async (exerciseId) => {
          // Buscar la última ExerciseSession para este ejercicio
          const lastExerciseSession = await ExerciseSession.findOne({
            where: { exerciseId },
            include: [
              {
                model: Session,
                as: 'session',
                order: [['date', 'DESC']]
              }
            ],
            order: [
              [{ model: Session, as: 'session' }, 'date', 'DESC']
            ]
          });

          if (!lastExerciseSession) {
            return { exerciseId, previous: [] };
          }

          // Obtener los sets de la última ExerciseSession
          const previousSets = await Set.findAll({
            where: { exerciseSessionId: lastExerciseSession.id },
            order: [['order', 'ASC']]
          });

          return {
            exerciseId,
            previous: previousSets.map(set => ({
              weight: set.weight,
              reps: set.reps,
              restTime: set.restTime
            }))
          };
        })
      );

      // Crear un mapa para acceso rápido a los datos previous
      const previousMap = {};
      previousData.forEach(data => {
        previousMap[data.exerciseId] = data.previous;
      });

      // Ordenar manualmente los ejercicios y sets por order
      const sortedExercises = routine.exercises
        .map(exercise => {
          const exerciseRoutine = exercise.exerciseRoutine;
          const sortedSets = exerciseRoutine.sets
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          return {
            id: exercise.id,
            name: exercise.name,
            userMade: exercise.userMade,
            categoryId: exercise.categoryId,
            userId: exercise.userId,
            createdAt: exercise.createdAt,
            updatedAt: exercise.updatedAt,
            previous: previousMap[exercise.id] || [],
            exerciseRoutine: {
              id: exerciseRoutine.id,
              routineId: exerciseRoutine.routineId,
              exerciseId: exerciseRoutine.exerciseId,
              order: exerciseRoutine.order,
              status: exerciseRoutine.status,
              createdAt: exerciseRoutine.createdAt,
              updatedAt: exerciseRoutine.updatedAt,
              sets: sortedSets.map(set => ({
                id: set.id,
                exerciseRoutineId: set.exerciseRoutineId,
                exerciseSessionId: set.exerciseSessionId,
                order: set.order,
                status: set.status,
                reps: set.reps,
                weight: set.weight,
                restTime: set.restTime,
                createdAt: set.createdAt,
                updatedAt: set.updatedAt
              }))
            }
          };
        })
        .sort((a, b) => (a.exerciseRoutine.order || 0) - (b.exerciseRoutine.order || 0));

      const responseData = {
        id: routine.id,
        userId: routine.userId,
        name: routine.name,
        description: routine.description,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
        exercises: sortedExercises
      };

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error getting routine:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  async getAllRoutines(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId como parámetro'
        });
      }

      const whereClause = { userId };

      // Obtener todas las rutinas
      const routines = await Routine.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      // Para cada rutina, buscar la última sesión que la usó
      const routinesWithLastTrained = await Promise.all(
        routines.map(async (routine) => {
          // Buscar la última sesión que usó esta rutina
          const lastSession = await Session.findOne({
            where: { 
              routineId: routine.id 
            },
            order: [['date', 'DESC']],
            attributes: ['date']
          });

          return {
            id: routine.id,
            name: routine.name,
            description: routine.description,
            lastTimeTrained: lastSession ? lastSession.date : null,
            createdAt: routine.createdAt,
            updatedAt: routine.updatedAt
          };
        })
      );

      res.json({
        success: true,
        data: routinesWithLastTrained
      });

    } catch (error) {
      console.error('Error getting routines with last trained:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  async deleteRoutine(req, res) {
    try {
      const { routineId } = req.params;

      // Verificar que la rutina existe
      const routine = await Routine.findByPk(routineId);
      if (!routine) {
        return res.status(404).json({
          success: false,
          message: 'Rutina no encontrada'
        });
      }

      // Eliminar la rutina (la base de datos maneja la eliminación en cascada)
      // Esto eliminará automáticamente:
      // - Todos los ExerciseRoutines asociados
      // - Todos los Sets asociados a esos ExerciseRoutines
      await Routine.destroy({
        where: { id: routineId }
      });

      res.json({
        success: true,
        message: 'Rutina eliminada exitosamente',
        data: {
          id: routine.id,
          name: routine.name,
          description: routine.description
        }
      });

    } catch (error) {
      console.error('Error deleting routine:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  async updateRoutine(req, res) {
    try {
      const { routineId } = req.params;
      const { name, description, exercises } = req.body;

      // Verificar que la rutina existe
      const existingRoutine = await Routine.findByPk(routineId);
      if (!existingRoutine) {
        return res.status(404).json({
          success: false,
          message: 'Rutina no encontrada'
        });
      }

      // Validaciones básicas
      if (!name || !exercises || !Array.isArray(exercises)) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren name y un array de exercises'
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

      // Validar orden de ExerciseRoutines
      const exerciseOrders = exercises.map(ex => ex.order).filter(order => order !== undefined);
      if (exerciseOrders.length > 0) {
        const uniqueOrders = [...new Set(exerciseOrders)];
        if (exerciseOrders.length !== uniqueOrders.length) {
          return res.status(400).json({
            success: false,
            message: 'Los ejercicios no pueden tener valores de orden duplicados'
          });
        }
        
        // Verificar que no haya saltos en el orden
        const sortedOrders = exerciseOrders.sort((a, b) => a - b);
        for (let i = 0; i < sortedOrders.length; i++) {
          if (sortedOrders[i] !== i + 1) {
            return res.status(400).json({
              success: false,
              message: 'El orden de los ejercicios debe ser secuencial sin saltos (1, 2, 3...)'
            });
          }
        }
      }

      // Validar orden de Sets para cada ejercicio
      for (const exerciseData of exercises) {
        if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
          const setOrders = exerciseData.sets.map(set => set.order).filter(order => order !== undefined);
          if (setOrders.length > 0) {
            const uniqueSetOrders = [...new Set(setOrders)];
            if (setOrders.length !== uniqueSetOrders.length) {
              return res.status(400).json({
                success: false,
                message: `Los sets del ejercicio ${exerciseData.exerciseId} no pueden tener valores de orden duplicados`
              });
            }
            
            // Verificar que no haya saltos en el orden de los sets
            const sortedSetOrders = setOrders.sort((a, b) => a - b);
            for (let i = 0; i < sortedSetOrders.length; i++) {
              if (sortedSetOrders[i] !== i + 1) {
                return res.status(400).json({
                  success: false,
                  message: `El orden de los sets del ejercicio ${exerciseData.exerciseId} debe ser secuencial sin saltos (1, 2, 3...)`
                });
              }
            }
          }
        }
      }

      // Iniciar transacción para asegurar consistencia
      const transaction = await sequelize.transaction();

      try {
        // Actualizar información básica de la rutina
        await Routine.update(
          {
            name,
            description: description || null
          },
          {
            where: { id: routineId },
            transaction
          }
        );

        // Eliminar todos los ExerciseRoutines existentes (esto eliminará automáticamente los Sets)
        await ExerciseRoutine.destroy({
          where: { routineId: routineId },
          transaction
        });

        // Crear los nuevos ExerciseRoutine y sus Sets
        for (let i = 0; i < exercises.length; i++) {
          const exerciseData = exercises[i];
          
          // Crear ExerciseRoutine
          const exerciseRoutine = await ExerciseRoutine.create({
            routineId: routineId,
            exerciseId: exerciseData.exerciseId,
            order: exerciseData.order || (i + 1), // Usar el order proporcionado o asignar secuencial
            status: exerciseData.status || 'active'
          }, { transaction });

          // Crear los Sets para este ExerciseRoutine
          if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
            for (let j = 0; j < exerciseData.sets.length; j++) {
              const setData = exerciseData.sets[j];
              await Set.create({
                exerciseRoutineId: exerciseRoutine.id,
                order: setData.order || (j + 1), // Usar el order proporcionado o asignar secuencial
                status: setData.status || 'pending',
                reps: setData.reps || null,
                weight: setData.weight || null,
                restTime: setData.restTime || null
              }, { transaction });
            }
          }
        }

        // Confirmar transacción
        await transaction.commit();

        // Obtener la rutina actualizada con sus ejercicios y sets
        const updatedRoutine = await Routine.findByPk(routineId, {
          include: [
            {
              model: Exercise,
              as: 'exercises',
              through: {
                model: ExerciseRoutine,
                as: 'exerciseRoutine',
                include: [
                  {
                    model: Set,
                    as: 'sets'
                  }
                ]
              }
            }
          ],
          order: [
            [{ model: Exercise, as: 'exercises' }, { model: ExerciseRoutine, as: 'exerciseRoutine' }, 'order', 'ASC'],
            [{ model: Exercise, as: 'exercises' }, { model: ExerciseRoutine, as: 'exerciseRoutine' }, { model: Set, as: 'sets' }, 'order', 'ASC']
          ]
        });

        // Ordenar manualmente los ejercicios y sets por order
        const sortedExercises = updatedRoutine.exercises
          .map(exercise => {
            const exerciseRoutine = exercise.exerciseRoutine;
            const sortedSets = exerciseRoutine.sets
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            return {
              id: exercise.id,
              name: exercise.name,
              userMade: exercise.userMade,
              categoryId: exercise.categoryId,
              userId: exercise.userId,
              createdAt: exercise.createdAt,
              updatedAt: exercise.updatedAt,
              exerciseRoutine: {
                id: exerciseRoutine.id,
                routineId: exerciseRoutine.routineId,
                exerciseId: exerciseRoutine.exerciseId,
                order: exerciseRoutine.order,
                status: exerciseRoutine.status,
                createdAt: exerciseRoutine.createdAt,
                updatedAt: exerciseRoutine.updatedAt,
                sets: sortedSets.map(set => ({
                  id: set.id,
                  exerciseRoutineId: set.exerciseRoutineId,
                  exerciseSessionId: set.exerciseSessionId,
                  order: set.order,
                  status: set.status,
                  reps: set.reps,
                  weight: set.weight,
                  restTime: set.restTime,
                  createdAt: set.createdAt,
                  updatedAt: set.updatedAt
                }))
              }
            };
          })
          .sort((a, b) => (a.exerciseRoutine.order || 0) - (b.exerciseRoutine.order || 0));

        const responseData = {
          id: updatedRoutine.id,
          userId: updatedRoutine.userId,
          name: updatedRoutine.name,
          description: updatedRoutine.description,
          createdAt: updatedRoutine.createdAt,
          updatedAt: updatedRoutine.updatedAt,
          exercises: sortedExercises
        };

        res.json({
          success: true,
          message: 'Rutina actualizada exitosamente',
          data: responseData
        });

      } catch (error) {
        // Revertir transacción en caso de error
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error updating routine:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};
