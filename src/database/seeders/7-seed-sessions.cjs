'use strict';

module.exports = {
  async up (queryInterface) {
    // Obtener usuarios existentes
    const users = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Users" ORDER BY id;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Obtener rutinas existentes
    const routines = await queryInterface.sequelize.query(
      'SELECT id, "userId", name FROM "Routines" ORDER BY id;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Obtener ejercicios existentes
    const exercises = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Exercises" ORDER BY id;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const exerciseMap = Object.fromEntries(exercises.map(e => [e.name, e.id]));

    // Crear sesiones para cada usuario
    const sessions = [];
    const exerciseSessions = [];
    const sets = [];

    // Obtener el siguiente ID disponible para cada tabla
    const lastSession = await queryInterface.sequelize.query(
      'SELECT MAX(id) as max_id FROM "Sessions";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const lastExerciseSession = await queryInterface.sequelize.query(
      'SELECT MAX(id) as max_id FROM "ExerciseSessions";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const lastSet = await queryInterface.sequelize.query(
      'SELECT MAX(id) as max_id FROM "Sets";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    let sessionId = (lastSession[0]?.max_id || 0) + 1;
    let exerciseSessionId = (lastExerciseSession[0]?.max_id || 0) + 1;
    let setId = (lastSet[0]?.max_id || 0) + 1;

    // Definir sesiones variadas para cada usuario
    const sessionTemplates = [
      // Sesión 1: Basada en rutina - Push Day modificado
      {
        type: 'routine_based',
        date: new Date('2024-01-15T10:00:00Z'),
        duration: 75, // minutos
        status: 'completed',
        exercises: [
          { name: 'Barbell Bench Press - Medium Grip', order: 1, sets: [
            { reps: 10, weight: 55, restTime: 180, status: 'completed' },
            { reps: 8, weight: 60, restTime: 180, status: 'completed' },
            { reps: 6, weight: 65, restTime: 180, status: 'completed' }
          ]},
          { name: 'Dumbbell Shoulder Press', order: 2, sets: [
            { reps: 12, weight: 18, restTime: 120, status: 'completed' },
            { reps: 10, weight: 20, restTime: 120, status: 'completed' },
            { reps: 8, weight: 22.5, restTime: 120, status: 'completed' }
          ]},
          { name: 'Incline Dumbbell Press', order: 3, sets: [
            { reps: 12, weight: 22.5, restTime: 120, status: 'completed' },
            { reps: 10, weight: 25, restTime: 120, status: 'completed' },
            { reps: 8, weight: 27.5, restTime: 120, status: 'completed' }
          ]},
          { name: 'Triceps Pushdown', order: 4, sets: [
            { reps: 15, weight: 25, restTime: 90, status: 'completed' },
            { reps: 12, weight: 30, restTime: 90, status: 'completed' },
            { reps: 10, weight: 35, restTime: 90, status: 'completed' }
          ]}
        ]
      },
      // Sesión 2: Basada en rutina - Leg Day modificado
      {
        type: 'routine_based',
        date: new Date('2024-01-17T14:00:00Z'),
        duration: 90,
        status: 'completed',
        exercises: [
          { name: 'Barbell Squat', order: 1, sets: [
            { reps: 12, weight: 65, restTime: 240, status: 'completed' },
            { reps: 10, weight: 70, restTime: 240, status: 'completed' },
            { reps: 8, weight: 75, restTime: 240, status: 'completed' },
            { reps: 6, weight: 80, restTime: 240, status: 'completed' }
          ]},
          { name: 'Romanian Deadlift', order: 2, sets: [
            { reps: 12, weight: 55, restTime: 180, status: 'completed' },
            { reps: 10, weight: 60, restTime: 180, status: 'completed' },
            { reps: 8, weight: 65, restTime: 180, status: 'completed' }
          ]},
          { name: 'Walking Lunges', order: 3, sets: [
            { reps: 15, weight: 18, restTime: 90, status: 'completed' },
            { reps: 12, weight: 20, restTime: 90, status: 'completed' },
            { reps: 10, weight: 22.5, restTime: 90, status: 'completed' }
          ]},
          { name: 'Calf Raises', order: 4, sets: [
            { reps: 25, weight: 35, restTime: 60, status: 'completed' },
            { reps: 20, weight: 40, restTime: 60, status: 'completed' },
            { reps: 18, weight: 45, restTime: 60, status: 'completed' }
          ]}
        ]
      },
      // Sesión 3: Libre - Cardio + Core
      {
        type: 'free',
        date: new Date('2024-01-19T08:00:00Z'),
        duration: 45,
        status: 'completed',
        exercises: [
          { name: 'Burpees', order: 1, sets: [
            { reps: 12, weight: 0, restTime: 90, status: 'completed' },
            { reps: 10, weight: 0, restTime: 90, status: 'completed' },
            { reps: 8, weight: 0, restTime: 90, status: 'completed' }
          ]},
          { name: 'Mountain Climbers', order: 2, sets: [
            { reps: 25, weight: 0, restTime: 60, status: 'completed' },
            { reps: 20, weight: 0, restTime: 60, status: 'completed' },
            { reps: 18, weight: 0, restTime: 60, status: 'completed' }
          ]},
          { name: 'Russian Twist', order: 3, sets: [
            { reps: 25, weight: 8, restTime: 60, status: 'completed' },
            { reps: 20, weight: 10, restTime: 60, status: 'completed' },
            { reps: 18, weight: 12.5, restTime: 60, status: 'completed' }
          ]},
          { name: 'Plank', order: 4, sets: [
            { reps: 45, weight: 0, restTime: 60, status: 'completed' },
            { reps: 45, weight: 0, restTime: 60, status: 'completed' },
            { reps: 60, weight: 0, restTime: 60, status: 'completed' }
          ]}
        ]
      }
    ];

    // Crear sesiones para cada usuario
    // A cada uno de los usuarios le asignamos 3 sesiones, una basada en rutina, una libre y una mixta
    // Todas las sesiones son las mismas para todos los usuarios por simplicidad
    users.forEach((user, userIndex) => {
      // Obtener rutinas del usuario
      const userRoutines = routines.filter(r => r.userId === user.id);
      
      sessionTemplates.forEach((template, templateIndex) => {
        let routineId = null;
        
        // Si es basada en rutina, asignar una rutina del usuario
        if (template.type === 'routine_based' && userRoutines.length > 0) {
          routineId = userRoutines[templateIndex % userRoutines.length].id;
        }

        // Crear sesión
        sessions.push({
          id: sessionId,
          userId: user.id,
          routineId: routineId,
          date: template.date,
          duration: template.duration,
          status: template.status,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Crear exercise sessions y sets
        template.exercises.forEach((exerciseTemplate, exerciseIndex) => {
          const exerciseId = exerciseMap[exerciseTemplate.name];
          if (exerciseId) {
            // Crear ExerciseSession
            exerciseSessions.push({
              id: exerciseSessionId,
              sessionId: sessionId,
              exerciseId: exerciseId,
              order: exerciseTemplate.order,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Crear Sets para este ejercicio
            exerciseTemplate.sets.forEach((setTemplate, setIndex) => {
              sets.push({
                id: setId,
                exerciseRoutineId: null,
                exerciseSessionId: exerciseSessionId,
                order: setIndex + 1,
                status: setTemplate.status,
                reps: setTemplate.reps,
                weight: setTemplate.weight,
                restTime: setTemplate.restTime,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              setId++;
            });

            exerciseSessionId++;
          }
        });

        sessionId++;
      });
    });

    // Insertar datos en la base de datos
    await queryInterface.bulkInsert('Sessions', sessions);
    await queryInterface.bulkInsert('ExerciseSessions', exerciseSessions);
    await queryInterface.bulkInsert('Sets', sets);
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('Sets', null, {});
    await queryInterface.bulkDelete('ExerciseSessions', null, {});
    await queryInterface.bulkDelete('Sessions', null, {});
  }
};
