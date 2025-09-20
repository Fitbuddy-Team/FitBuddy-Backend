import { Routine, Exercise, ExerciseRoutine, Set } from '../models/index.js';

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

  async getAllRoutines(req, res) {
    try {
      const { userId } = req.query;

      let whereClause = {};
      if (userId) {
        whereClause.userId = userId;
      }

      const routines = await Routine.findAll({
        where: whereClause,
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
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: routines
      });

    } catch (error) {
      console.error('Error getting routines:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  async getRoutineById(req, res) {
    try {
      const { id } = req.params;

      const routine = await Routine.findByPk(id, {
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

      if (!routine) {
        return res.status(404).json({
          success: false,
          message: 'Rutina no encontrada'
        });
      }

      res.json({
        success: true,
        data: routine
      });

    } catch (error) {
      console.error('Error getting routine:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};
