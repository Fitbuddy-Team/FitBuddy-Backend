'use strict';

module.exports = {
  async up (queryInterface) {
    // Obtener usuarios existentes
    const users = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Users" ORDER BY id;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Obtener ejercicios existentes
    const exercises = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Exercises" ORDER BY id;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const exerciseMap = Object.fromEntries(exercises.map(e => [e.name, e.id]));

    // Crear rutinas para cada usuario
    const routines = [];
    const exerciseRoutines = [];
    const sets = [];

    // Definir rutinas variadas para cada usuario
    const routineTemplates = [
      // Rutina 1: Push Day (Pecho, Hombros, Tríceps)
      {
        name: 'Push Day - Fuerza',
        description: 'Rutina enfocada en ejercicios de empuje para pecho, hombros y tríceps',
        exercises: [
          { name: 'Barbell Bench Press - Medium Grip', order: 1, sets: [
            { reps: 8, weight: 60, restTime: 180 },
            { reps: 8, weight: 60, restTime: 180 },
            { reps: 6, weight: 65, restTime: 180 }
          ]},
          { name: 'Dumbbell Shoulder Press', order: 2, sets: [
            { reps: 10, weight: 20, restTime: 120 },
            { reps: 10, weight: 20, restTime: 120 },
            { reps: 8, weight: 22.5, restTime: 120 }
          ]},
          { name: 'Incline Dumbbell Press', order: 3, sets: [
            { reps: 10, weight: 25, restTime: 120 },
            { reps: 10, weight: 25, restTime: 120 },
            { reps: 8, weight: 27.5, restTime: 120 }
          ]},
          { name: 'Triceps Pushdown', order: 4, sets: [
            { reps: 12, weight: 30, restTime: 90 },
            { reps: 12, weight: 30, restTime: 90 },
            { reps: 10, weight: 35, restTime: 90 }
          ]},
          { name: 'Lateral Raise', order: 5, sets: [
            { reps: 15, weight: 8, restTime: 60 },
            { reps: 15, weight: 8, restTime: 60 },
            { reps: 12, weight: 10, restTime: 60 }
          ]}
        ]
      },
      // Rutina 2: Pull Day (Espalda, Bíceps)
      {
        name: 'Pull Day - Hipertrofia',
        description: 'Rutina enfocada en ejercicios de tracción para espalda y bíceps',
        exercises: [
          { name: 'Pullups', order: 1, sets: [
            { reps: 8, weight: 0, restTime: 180 },
            { reps: 6, weight: 0, restTime: 180 },
            { reps: 5, weight: 0, restTime: 180 }
          ]},
          { name: 'Bent Over Barbell Row', order: 2, sets: [
            { reps: 10, weight: 50, restTime: 120 },
            { reps: 10, weight: 50, restTime: 120 },
            { reps: 8, weight: 55, restTime: 120 }
          ]},
          { name: 'Lat Pulldown', order: 3, sets: [
            { reps: 12, weight: 45, restTime: 90 },
            { reps: 12, weight: 45, restTime: 90 },
            { reps: 10, weight: 50, restTime: 90 }
          ]},
          { name: 'Barbell Curl', order: 4, sets: [
            { reps: 12, weight: 25, restTime: 90 },
            { reps: 12, weight: 25, restTime: 90 },
            { reps: 10, weight: 30, restTime: 90 }
          ]},
          { name: 'Hammer Curls', order: 5, sets: [
            { reps: 15, weight: 15, restTime: 60 },
            { reps: 15, weight: 15, restTime: 60 },
            { reps: 12, weight: 17.5, restTime: 60 }
          ]}
        ]
      },
      // Rutina 3: Leg Day (Piernas)
      {
        name: 'Leg Day - Potencia',
        description: 'Rutina intensa para el desarrollo de piernas y glúteos',
        exercises: [
          { name: 'Barbell Squat', order: 1, sets: [
            { reps: 8, weight: 70, restTime: 240 },
            { reps: 8, weight: 70, restTime: 240 },
            { reps: 6, weight: 75, restTime: 240 }
          ]},
          { name: 'Romanian Deadlift', order: 2, sets: [
            { reps: 10, weight: 60, restTime: 180 },
            { reps: 10, weight: 60, restTime: 180 },
            { reps: 8, weight: 65, restTime: 180 }
          ]},
          { name: 'Leg Press', order: 3, sets: [
            { reps: 15, weight: 100, restTime: 120 },
            { reps: 15, weight: 100, restTime: 120 },
            { reps: 12, weight: 110, restTime: 120 }
          ]},
          { name: 'Walking Lunges', order: 4, sets: [
            { reps: 12, weight: 20, restTime: 90 },
            { reps: 12, weight: 20, restTime: 90 },
            { reps: 10, weight: 22.5, restTime: 90 }
          ]},
          { name: 'Calf Raises', order: 5, sets: [
            { reps: 20, weight: 40, restTime: 60 },
            { reps: 20, weight: 40, restTime: 60 },
            { reps: 18, weight: 45, restTime: 60 }
          ]}
        ]
      },
      // Rutina 4: Full Body
      {
        name: 'Full Body - Funcional',
        description: 'Rutina completa que trabaja todo el cuerpo de manera funcional',
        exercises: [
          { name: 'Deadlift', order: 1, sets: [
            { reps: 6, weight: 80, restTime: 240 },
            { reps: 6, weight: 80, restTime: 240 },
            { reps: 5, weight: 85, restTime: 240 }
          ]},
          { name: 'Overhead Press', order: 2, sets: [
            { reps: 8, weight: 35, restTime: 180 },
            { reps: 8, weight: 35, restTime: 180 },
            { reps: 6, weight: 40, restTime: 180 }
          ]},
          { name: 'Pull-Ups', order: 3, sets: [
            { reps: 6, weight: 0, restTime: 180 },
            { reps: 5, weight: 0, restTime: 180 },
            { reps: 4, weight: 0, restTime: 180 }
          ]},
          { name: 'Dips', order: 4, sets: [
            { reps: 10, weight: 0, restTime: 120 },
            { reps: 8, weight: 0, restTime: 120 },
            { reps: 6, weight: 0, restTime: 120 }
          ]},
          { name: 'Plank', order: 5, sets: [
            { reps: 45, weight: 0, restTime: 60 },
            { reps: 45, weight: 0, restTime: 60 },
            { reps: 60, weight: 0, restTime: 60 }
          ]}
        ]
      },
      // Rutina 5: Upper Body
      {
        name: 'Upper Body - Volumen',
        description: 'Rutina de alto volumen para tren superior',
        exercises: [
          { name: 'Incline Barbell Bench Press', order: 1, sets: [
            { reps: 10, weight: 55, restTime: 180 },
            { reps: 10, weight: 55, restTime: 180 },
            { reps: 8, weight: 60, restTime: 180 }
          ]},
          { name: 'Seated Cable Rows', order: 2, sets: [
            { reps: 12, weight: 40, restTime: 120 },
            { reps: 12, weight: 40, restTime: 120 },
            { reps: 10, weight: 45, restTime: 120 }
          ]},
          { name: 'Dumbbell Flyes', order: 3, sets: [
            { reps: 15, weight: 20, restTime: 90 },
            { reps: 15, weight: 20, restTime: 90 },
            { reps: 12, weight: 22.5, restTime: 90 }
          ]},
          { name: 'Bicep Curls', order: 4, sets: [
            { reps: 15, weight: 12.5, restTime: 90 },
            { reps: 15, weight: 12.5, restTime: 90 },
            { reps: 12, weight: 15, restTime: 90 }
          ]},
          { name: 'Tricep Extensions', order: 5, sets: [
            { reps: 15, weight: 15, restTime: 60 },
            { reps: 15, weight: 15, restTime: 60 },
            { reps: 12, weight: 17.5, restTime: 60 }
          ]}
        ]
      },
      // Rutina 6: Cardio + Core
      {
        name: 'Cardio Core - Resistencia',
        description: 'Rutina enfocada en resistencia cardiovascular y core',
        exercises: [
          { name: 'Burpees', order: 1, sets: [
            { reps: 15, weight: 0, restTime: 90 },
            { reps: 15, weight: 0, restTime: 90 },
            { reps: 12, weight: 0, restTime: 90 }
          ]},
          { name: 'Mountain Climbers', order: 2, sets: [
            { reps: 30, weight: 0, restTime: 60 },
            { reps: 30, weight: 0, restTime: 60 },
            { reps: 25, weight: 0, restTime: 60 }
          ]},
          { name: 'Russian Twist', order: 3, sets: [
            { reps: 20, weight: 10, restTime: 60 },
            { reps: 20, weight: 10, restTime: 60 },
            { reps: 18, weight: 12.5, restTime: 60 }
          ]},
          { name: 'Jump Squats', order: 4, sets: [
            { reps: 15, weight: 0, restTime: 90 },
            { reps: 15, weight: 0, restTime: 90 },
            { reps: 12, weight: 0, restTime: 90 }
          ]},
          { name: 'Plank', order: 5, sets: [
            { reps: 60, weight: 0, restTime: 60 },
            { reps: 60, weight: 0, restTime: 60 },
            { reps: 45, weight: 0, restTime: 60 }
          ]}
        ]
      },
      // Rutina 7: Strength Focus
      {
        name: 'Strength Focus - Powerlifting',
        description: 'Rutina enfocada en el desarrollo de fuerza máxima',
        exercises: [
          { name: 'Squat', order: 1, sets: [
            { reps: 5, weight: 85, restTime: 300 },
            { reps: 5, weight: 85, restTime: 300 },
            { reps: 3, weight: 90, restTime: 300 }
          ]},
          { name: 'Bench Press', order: 2, sets: [
            { reps: 5, weight: 70, restTime: 300 },
            { reps: 5, weight: 70, restTime: 300 },
            { reps: 3, weight: 75, restTime: 300 }
          ]},
          { name: 'Deadlift', order: 3, sets: [
            { reps: 5, weight: 100, restTime: 300 },
            { reps: 5, weight: 100, restTime: 300 },
            { reps: 3, weight: 105, restTime: 300 }
          ]},
          { name: 'Overhead Press', order: 4, sets: [
            { reps: 8, weight: 40, restTime: 180 },
            { reps: 8, weight: 40, restTime: 180 },
            { reps: 6, weight: 45, restTime: 180 }
          ]}
        ]
      },
      // Rutina 8: Beginner
      {
        name: 'Beginner - Fundamentos',
        description: 'Rutina básica para principiantes con ejercicios fundamentales',
        exercises: [
          { name: 'Bodyweight Squat', order: 1, sets: [
            { reps: 12, weight: 0, restTime: 90 },
            { reps: 12, weight: 0, restTime: 90 },
            { reps: 10, weight: 0, restTime: 90 }
          ]},
          { name: 'Push-Ups', order: 2, sets: [
            { reps: 10, weight: 0, restTime: 90 },
            { reps: 8, weight: 0, restTime: 90 },
            { reps: 6, weight: 0, restTime: 90 }
          ]},
          { name: 'Lunges', order: 3, sets: [
            { reps: 10, weight: 0, restTime: 60 },
            { reps: 10, weight: 0, restTime: 60 },
            { reps: 8, weight: 0, restTime: 60 }
          ]},
          { name: 'Plank', order: 4, sets: [
            { reps: 30, weight: 0, restTime: 60 },
            { reps: 30, weight: 0, restTime: 60 },
            { reps: 20, weight: 0, restTime: 60 }
          ]}
        ]
      }
    ];

    let routineId = 1;
    let exerciseRoutineId = 1;
    let setId = 1;

    // Crear 2 rutinas para cada usuario
    users.forEach((user, userIndex) => {
      // Seleccionar 2 rutinas diferentes para cada usuario
      const selectedRoutines = [
        routineTemplates[userIndex * 2 % routineTemplates.length],
        routineTemplates[(userIndex * 2 + 1) % routineTemplates.length]
      ];

      selectedRoutines.forEach((template, templateIndex) => {
        // Crear rutina
        routines.push({
          id: routineId,
          userId: user.id,
          name: `${template.name}`,
          description: template.description,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Crear exercise routines y sets
        template.exercises.forEach((exerciseTemplate, exerciseIndex) => {
          const exerciseId = exerciseMap[exerciseTemplate.name];
          if (exerciseId) {
            // Crear ExerciseRoutine
            exerciseRoutines.push({
              id: exerciseRoutineId,
              routineId: routineId,
              exerciseId: exerciseId,
              order: exerciseTemplate.order,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Crear Sets para este ejercicio
            exerciseTemplate.sets.forEach((setTemplate, setIndex) => {
              sets.push({
                id: setId,
                exerciseRoutineId: exerciseRoutineId,
                exerciseSessionId: null,
                order: setIndex + 1,
                status: 'planned',
                reps: setTemplate.reps,
                weight: setTemplate.weight,
                restTime: setTemplate.restTime,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              setId++;
            });

            exerciseRoutineId++;
          }
        });

        routineId++;
      });
    });

    // Insertar datos en la base de datos
    await queryInterface.bulkInsert('Routines', routines);
    await queryInterface.bulkInsert('ExerciseRoutines', exerciseRoutines);
    await queryInterface.bulkInsert('Sets', sets);
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('Sets', null, {});
    await queryInterface.bulkDelete('ExerciseRoutines', null, {});
    await queryInterface.bulkDelete('Routines', null, {});
  }
};
