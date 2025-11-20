import { Exercise, ExerciseCategory, MuscleGroup, ExerciseMuscleGroup } from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios';

/**
 * Esquema del plan abstracto que devuelve la IA
 * @typedef {Object} AbstractPlan
 * @property {string} goal - Objetivo: "hypertrophy", "strength", "fat_loss", etc.
 * @property {number} daysPerWeek - Días por semana
 * @property {Array<AbstractSession>} sessions - Sesiones de entrenamiento
 */

/**
 * @typedef {Object} AbstractSession
 * @property {string} name - Nombre de la sesión
 * @property {string} description - Descripción de la sesión
 * @property {Array<AbstractExercise>} exercises - Ejercicios abstractos
 */

/**
 * @typedef {Object} AbstractExercise
 * @property {string} slotName - Nombre del slot/ejercicio (ej: "Press banca con barra")
 * @property {string} muscleGroup - Grupo muscular: "chest", "legs", "back", etc.
 * @property {string} type - Tipo: "compound", "isolation"
 * @property {Array<AbstractSet>} sets - Sets del ejercicio
 */

/**
 * @typedef {Object} AbstractSet
 * @property {string} reps - Repeticiones (ej: "8-10", "6-8")
 * @property {string} intensity - Intensidad: "low", "medium", "high"
 */

/**
 * Llama a la IA para generar un plan abstracto de rutina
 * @param {string} userMessage - Mensaje del usuario
 * @param {Object} userData - Datos adicionales del usuario (opcional)
 * @returns {Promise<AbstractPlan>} Plan abstracto generado por la IA
 */
export async function callLLMForPlan(userMessage, userData = {}) {
  try {
    // Validación básica: detectar preguntas obviamente no relacionadas (capa de seguridad)
    const messageLower = userMessage.toLowerCase().trim();
    const obviouslyIrrelevant = [
      'cocinar', 'receta', 'comida', 'cocina', 'hornear', 'pan', 'postre',
      'programar', 'código', 'python', 'javascript', 'desarrollo',
      'historia', 'filosofía', 'matemáticas', 'ciencia',
      'música', 'arte', 'literatura', 'libro',
      'explica', 'qué es', 'cuál es', 'dime sobre', 'hablame de',
      'enséñame a', 'cómo hacer', 'cómo ser', 'razones para'
    ];
    
    // Si contiene palabras obviamente irrelevantes y NO contiene palabras de ejercicio
    const hasIrrelevant = obviouslyIrrelevant.some(word => messageLower.includes(word));
    const hasExerciseWords = ['rutina', 'ejercicio', 'entrenamiento', 'gym', 'gimnasio', 'fitness', 'plan de', 'programa de'].some(word => messageLower.includes(word));
    
    if (hasIrrelevant && !hasExerciseWords && messageLower.length > 10) {
      throw new Error('Lo que solicitas se escapa de mi alcance como recomendador de rutinas, prueba nuevamente');
    }
    
    // Obtener grupos musculares disponibles de la base de datos
    const muscleGroups = await MuscleGroup.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']]
    });
    const muscleGroupNames = muscleGroups.map(mg => mg.name).join(', ');
    
    // Mapeo de grupos musculares en español a los nombres en la BD
    const muscleGroupMapping = {
      'pecho': 'chest',
      'piernas': ['quadriceps', 'hamstrings', 'calves', 'glutes'],
      'pierna': ['quadriceps', 'hamstrings', 'calves', 'glutes'],
      'espalda': ['lats', 'middle back', 'lower back'],
      'hombros': 'shoulders',
      'hombro': 'shoulders',
      'brazos': ['biceps', 'triceps', 'forearms'],
      'brazo': ['biceps', 'triceps', 'forearms'],
      'core': ['abdominals'],
      'glúteos': 'glutes',
      'gluteos': 'glutes',
      'cuádriceps': 'quadriceps',
      'cuadriceps': 'quadriceps',
      'isquiotibiales': 'hamstrings',
      'pantorrillas': 'calves',
      'bíceps': 'biceps',
      'biceps': 'biceps',
      'tríceps': 'triceps',
      'triceps': 'triceps',
      'antebrazos': 'forearms',
      'trapecios': 'traps'
    };
    
    // Detectar qué grupo muscular solicita el usuario
    let requestedMuscleGroup = null;
    let requestedMuscleGroupName = null;
    for (const [key, value] of Object.entries(muscleGroupMapping)) {
      if (messageLower.includes(key)) {
        if (Array.isArray(value)) {
          requestedMuscleGroup = value; // Lista de grupos relacionados
          requestedMuscleGroupName = key;
        } else {
          requestedMuscleGroup = [value];
          requestedMuscleGroupName = key;
        }
        break;
      }
    }
    
    // Analizar el mensaje del usuario para determinar preferencia de cantidad de ejercicios
    let exerciseCountHint = '5-6'; // Por defecto, cantidad media
    
    if (messageLower.includes('pocos') || messageLower.includes('poco') || 
        messageLower.includes('mínimo') || messageLower.includes('corto') ||
        messageLower.includes('rápido') || messageLower.includes('breve')) {
      exerciseCountHint = '4-5'; // Menos ejercicios
    } else if (messageLower.includes('muchos') || messageLower.includes('completo') ||
               messageLower.includes('extenso') || messageLower.includes('intenso') ||
               messageLower.includes('variado')) {
      exerciseCountHint = '6-7'; // Más ejercicios
    }

    // Prompt del sistema - evalúa si la pregunta aplica
    const systemPrompt = `Eres un asistente ESPECIALIZADO EXCLUSIVAMENTE en generar planes de entrenamiento y rutinas de ejercicio.

TU FUNCIÓN ES SOLO CREAR RUTINAS DE EJERCICIO. NO PUEDES RESPONDER NADA MÁS.

INSTRUCCIONES CRÍTICAS:
1. SOLO genera una rutina si el usuario EXPLÍCITAMENTE pide crear una rutina de ejercicio, plan de entrenamiento, o programa de fitness.
2. Si la pregunta es sobre CUALQUIER OTRO TEMA (cocina, historia, explicaciones, consejos generales, etc.), DEBES devolver un JSON con "error".
3. NO intentes "adaptar" preguntas no relacionadas a rutinas de ejercicio. Si no es sobre ejercicio, devuelve error.

EJEMPLOS DE PREGUNTAS QUE DEBEN DEVOLVER ERROR:
- "enséñame a cocinar pan" → ERROR
- "dame razones para ser más inteligente" → ERROR
- "qué es la filosofía" → ERROR
- "cómo programar en Python" → ERROR
- "explica la historia de Roma" → ERROR

EJEMPLOS DE PREGUNTAS VÁLIDAS:
- "quiero una rutina para ganar músculo" → GENERAR RUTINA
- "crea un plan de entrenamiento para perder grasa" → GENERAR RUTINA
- "necesito una rutina de 3 días" → GENERAR RUTINA

Devuelve SOLO un JSON válido sin texto adicional.`;

    // Prompt del usuario - compacto pero más específico
    const userPrompt = `Pregunta del usuario: "${userMessage}"

EVALÚA CRÍTICAMENTE: ¿El usuario está pidiendo EXPLÍCITAMENTE crear una rutina de ejercicio o plan de entrenamiento?

SI LA RESPUESTA ES NO (pregunta sobre cocina, historia, explicaciones, consejos, etc.):
{
  "error": "No te puedo responder preguntas sobre [tema específico mencionado] porque se escapa de mi alcance como recomendador de rutinas. Solo puedo ayudarte a crear rutinas de ejercicio personalizadas."
}

SI LA RESPUESTA ES SÍ (pide crear rutina/plan de ejercicio):
{
  "goal": "hipertrofia|fuerza|pérdida de grasa|resistencia|fitness general",
  "daysPerWeek": número,
  "sessions": [...]
}

IMPORTANTE: Genera UNA SOLA RUTINA (1 sesión) en formato JSON válido. 
- CRÍTICO: Debes generar SOLO 1 sesión, NO múltiples sesiones.
- CRÍTICO: El TOTAL de ejercicios debe estar entre 4 y 7 ejercicios (MÍNIMO 4 ejercicios, idealmente ${exerciseCountHint} ejercicios según la preferencia del usuario).
- NO generes menos de 4 ejercicios. Si no puedes generar al menos 4 ejercicios, devuelve un error.
${requestedMuscleGroup ? `- CRÍTICO: El usuario solicitó una rutina para ${requestedMuscleGroupName}. TODOS los ejercicios DEBEN ser para este grupo muscular: ${requestedMuscleGroup.join(', ')}. NO incluyas ejercicios de otros grupos musculares.` : ''}
- GRUPOS MUSCULARES DISPONIBLES en la base de datos: ${muscleGroupNames}
- muscleGroup DEBE ser uno de estos grupos disponibles. Si el usuario solicita un grupo específico, usa SOLO ese grupo.
- Si el usuario no especifica un grupo, puedes usar diferentes grupos pero siempre de la lista disponible.

Estructura JSON requerida (todos los campos son obligatorios):
{
  "goal": "Hipertrofia|Fuerza|Pérdida de grasa|Resistencia|Fitness general",
  "daysPerWeek": 3,
  "sessions": [
    {
      "name": "Rutina de Piernas",
      "description": "Entrenamiento enfocado en piernas",
      "exercises": [
        {
          "slotName": "Sentadillas",
          "muscleGroup": "quadriceps",
          "type": "compound",
          "restTime": 3,
          "sets": [
            {"reps": "8-10", "intensity": "medium", "weight": 60, "restTime": 3},
            {"reps": "8-10", "intensity": "medium", "weight": 65, "restTime": 3},
            {"reps": "8-10", "intensity": "medium", "weight": 70, "restTime": 3}
          ]
        },
        {
          "slotName": "Peso muerto",
          "muscleGroup": "hamstrings",
          "type": "compound",
          "restTime": 3,
          "sets": [
            {"reps": "8-10", "intensity": "medium", "weight": 80, "restTime": 3},
            {"reps": "8-10", "intensity": "medium", "weight": 80, "restTime": 3}
          ]
        }
      ]
    }
  ]
}

IMPORTANTE: 
- Debes generar SOLO 1 sesión en el array "sessions", NO múltiples sesiones.
- MÍNIMO 4 ejercicios en la sesión. NO generes menos de 4 ejercicios.
${requestedMuscleGroup ? `- El usuario pidió rutina para ${requestedMuscleGroupName}. TODOS los ejercicios deben usar muscleGroup de: ${requestedMuscleGroup.join(' o ')}.` : ''}

REGLAS OBLIGATORIAS (CRÍTICO - NO IGNORES):
- Cada ejercicio DEBE tener: slotName (string), muscleGroup (string), type (string), restTime (number), sets (array)
- Cada set DEBE tener: reps (string), intensity (string), weight (number), restTime (number)
- weight: OBLIGATORIO. DEBE ser un número (puede ser 0 para ejercicios sin peso como flexiones, sentadillas con peso corporal, etc.). Ejemplos: 0 (sin peso), 10, 20, 50, 100. NUNCA uses null o undefined.
- restTime: OBLIGATORIO. DEBE ser un número entre 1 y 4 (en minutos). Especifica según grupo muscular:
  * Pecho/Piernas/Espalda (compound): 3-4 minutos
  * Hombros: 2-3 minutos
  * Brazos/Core (aislamiento): 1-2 minutos
- muscleGroup: abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, back, back, neck, quadriceps, shoulders, traps, triceps
- type: compound o isolation
- EJEMPLO CORRECTO: {"reps": "8-10", "intensity": "medium", "weight": 60, "restTime": 3}
- EJEMPLO INCORRECTO (NO HACER): {"reps": "8-10", "intensity": "medium", "weight": null, "restTime": 3}
- Devuelve SOLO el JSON, sin texto adicional ni markdown
- Los ejercicios que entregues idealmente que no sea lo mismo escrito de distinta manera
- QUe sean ejercicios reales de máquinas de gimnasio y no inventados
- QUe no se repitan ejercicios!`;



    // Llamada a Groq API (rápido y económico)
    // Modelos Groq disponibles:
    // - llama-3.1-8b-instant: Más rápido y barato, ideal para este caso
    // - llama-3.1-70b-versatile: Más potente, mejor para casos complejos
    // - mixtral-8x7b-32768: Buen balance entre velocidad y calidad
    const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.AI_MODEL || 'llama-3.1-8b-instant';

    if (!apiKey) {
      throw new Error('GROQ_API_KEY o AI_API_KEY no está configurada en las variables de entorno');
    }

    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500 // Limitar tokens para reducir costos
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extraer el JSON de la respuesta
    const content = response.data.choices[0].message.content;
    let plan;
    
    try {
      plan = JSON.parse(content);
    } catch (parseError) {
      // Intentar extraer JSON si viene envuelto en markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Respuesta de la IA (primeros 500 caracteres):', content.substring(0, 500));
        throw new Error('No se pudo parsear el JSON de la respuesta de la IA');
      }
    }

    // Log del plan recibido para debugging (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Plan recibido de la IA:', JSON.stringify(plan, null, 2));
    }
    
    // Verificar si la IA devolvió un error (pregunta no relacionada con rutinas)
    if (plan.error) {
      throw new Error(plan.error);
    }
    
    // Validar weight en todos los sets antes de continuar (permite 0 para ejercicios sin peso)
    plan.sessions?.forEach((session, sIdx) => {
      session.exercises?.forEach((exercise, eIdx) => {
        exercise.sets?.forEach((set, setIdx) => {
          if (set.weight === null || set.weight === undefined || isNaN(parseFloat(set.weight))) {
            console.error(`ERROR: Set ${setIdx + 1} del ejercicio ${eIdx + 1} de sesión ${sIdx + 1} tiene weight inválido:`, set.weight);
            throw new Error(`Set ${setIdx + 1} del ejercicio "${exercise.slotName || eIdx + 1}" tiene weight inválido (${set.weight}). Weight debe ser un número (puede ser 0 para ejercicios sin peso).`);
          }
        });
      });
    });

    // Validar que la respuesta sea realmente un plan de rutina
    if (!plan || typeof plan !== 'object') {
      throw new Error('Lo que solicitas se escapa de mi alcance como recomendador de rutinas, prueba nuevamente');
    }
    
    // Verificar que tenga la estructura básica de un plan de rutina
    if (!plan.sessions || !Array.isArray(plan.sessions) || plan.sessions.length === 0) {
      throw new Error('Lo que solicitas se escapa de mi alcance como recomendador de rutinas, prueba nuevamente');
    }
    
    // Validar que solo haya 1 sesión
    if (plan.sessions.length > 1) {
      console.warn(`La IA generó ${plan.sessions.length} sesiones, se usará solo la primera`);
      plan.sessions = [plan.sessions[0]]; // Usar solo la primera sesión
    }
    
    // Verificar que la sesión tenga ejercicios
    if (!plan.sessions[0].exercises || !Array.isArray(plan.sessions[0].exercises) || plan.sessions[0].exercises.length === 0) {
      throw new Error('Lo que solicitas se escapa de mi alcance como recomendador de rutinas, prueba nuevamente');
    }
    
    // Validar grupos musculares si se solicitó uno específico
    if (requestedMuscleGroup) {
      const invalidExercises = plan.sessions[0].exercises.filter(ex => 
        !requestedMuscleGroup.includes(ex.muscleGroup)
      );
      if (invalidExercises.length > 0) {
        console.warn(`Algunos ejercicios no corresponden al grupo muscular solicitado (${requestedMuscleGroupName}):`, 
          invalidExercises.map(ex => ex.slotName).join(', '));
        // Filtrar ejercicios que no corresponden
        plan.sessions[0].exercises = plan.sessions[0].exercises.filter(ex => 
          requestedMuscleGroup.includes(ex.muscleGroup)
        );
      }
    }

    // Validación básica del esquema
    validateAbstractPlan(plan);

    return plan;
  } catch (error) {
    console.error('Error al llamar a la IA:', error);
    
    // Si el error ya tiene el mensaje específico de "se escapa de mi alcance", propagarlo tal cual
    if (error.message && error.message.includes('se escapa de mi alcance')) {
      throw error;
    }
    
    // Para otros errores, envolver con el mensaje genérico
    throw new Error(`Error al generar plan con IA: ${error.message}`);
  }
}

/**
 * Valida que el plan abstracto cumpla con el esquema esperado
 * @param {Object} plan - Plan a validar
 * @throws {Error} Si el plan no es válido
 */
function validateAbstractPlan(plan) {
  if (!plan.goal || !plan.daysPerWeek || !Array.isArray(plan.sessions)) {
    throw new Error('Plan inválido: faltan campos requeridos');
  }

  if (plan.sessions.length !== 1) {
    throw new Error('Plan inválido: debe tener exactamente 1 sesión');
  }

  let totalExercises = 0;

  plan.sessions.forEach((session, sessionIdx) => {
    if (!session.name || !Array.isArray(session.exercises)) {
      throw new Error(`Sesión ${sessionIdx + 1} inválida: faltan campos requeridos`);
    }

    if (session.exercises.length === 0 || session.exercises.length > 7) {
      throw new Error(`Sesión ${sessionIdx + 1} inválida: debe tener entre 1 y 7 ejercicios`);
    }

    totalExercises += session.exercises.length;

    session.exercises.forEach((exercise, exIdx) => {
      const missingFields = [];
      if (!exercise.slotName) missingFields.push('slotName');
      if (!exercise.muscleGroup) missingFields.push('muscleGroup');
      if (!Array.isArray(exercise.sets)) missingFields.push('sets (debe ser un array)');
      
      if (missingFields.length > 0) {
        throw new Error(`Ejercicio ${exIdx + 1} de sesión ${sessionIdx + 1} inválido: faltan campos ${missingFields.join(', ')}`);
      }
      
      // Validar que los sets tengan la estructura correcta
      if (exercise.sets.length === 0) {
        throw new Error(`Ejercicio ${exIdx + 1} de sesión ${sessionIdx + 1} inválido: debe tener al menos un set`);
      }
      
      // Validar restTime a nivel de ejercicio
      if (exercise.restTime === undefined || exercise.restTime === null) {
        throw new Error(`Ejercicio ${exIdx + 1} de sesión ${sessionIdx + 1} inválido: falta campo obligatorio 'restTime'`);
      }

      exercise.sets.forEach((set, setIdx) => {
        const missingFields = [];
        if (!set.reps) missingFields.push('reps');
        if (set.weight === undefined || set.weight === null || isNaN(parseFloat(set.weight))) {
          missingFields.push('weight (debe ser un número, puede ser 0 para ejercicios sin peso)');
        }
        if (set.restTime === undefined || set.restTime === null) {
          missingFields.push('restTime (debe ser un número entre 1-4 minutos)');
        }
        
        if (missingFields.length > 0) {
          throw new Error(`Ejercicio ${exIdx + 1} de sesión ${sessionIdx + 1}, set ${setIdx + 1} inválido: faltan campos ${missingFields.join(', ')}`);
        }
      });
    });
  });

  // Validar solo el mínimo (4 ejercicios). El máximo se limita en buildFinalRoutine
  if (totalExercises < 4) {
    throw new Error(`Plan inválido: debe tener al menos 4 ejercicios (actualmente: ${totalExercises})`);
  }
  
  // Si hay más de 7 ejercicios, solo advertir (buildFinalRoutine los limitará automáticamente)
  if (totalExercises > 7) {
    console.warn(`Plan tiene ${totalExercises} ejercicios, se limitará a 7 en la construcción final`);
  }
}

/**
 * Mapea un slot abstracto a un ejercicio real de la base de datos
 * @param {AbstractExercise} abstractExercise - Ejercicio abstracto del plan
 * @param {Array<number>} excludedExerciseIds - IDs de ejercicios a excluir (para evitar duplicados)
 * @returns {Promise<Exercise|null>} Ejercicio encontrado o null
 */
export async function chooseExerciseFromSlot(abstractExercise, excludedExerciseIds = []) {
  const { slotName, muscleGroup, type } = abstractExercise;

  try {
    // Construir condición para excluir ejercicios ya usados
    const excludeCondition = excludedExerciseIds.length > 0 
      ? { id: { [Op.notIn]: excludedExerciseIds } }
      : {};

    // 1. Buscar por nombre exacto o similar (case insensitive)
    let exercise = await Exercise.findOne({
      where: {
        name: {
          [Op.iLike]: `%${slotName}%`
        },
        userMade: false, // Solo ejercicios del sistema
        ...excludeCondition
      },
      include: [{
        model: ExerciseCategory,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (exercise) {
      return exercise;
    }

    // 2. Buscar por palabras clave del slotName
    const keywords = slotName.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length < 3) continue; // Ignorar palabras muy cortas

      exercise = await Exercise.findOne({
        where: {
          name: {
            [Op.iLike]: `%${keyword}%`
          },
          userMade: false,
          ...excludeCondition
        },
        include: [{
          model: ExerciseCategory,
          as: 'category',
          attributes: ['id', 'name']
        }]
      });

      if (exercise) {
        return exercise;
      }
    }

    // 3. Buscar por grupo muscular y tipo
    exercise = await findExerciseByMuscleGroup(muscleGroup, type, excludedExerciseIds);

    if (exercise) {
      return exercise;
    }

    // 4. Fallback: buscar cualquier ejercicio de fuerza si no se encuentra nada
    exercise = await Exercise.findOne({
      where: {
        userMade: false,
        ...excludeCondition
      },
      include: [{
        model: ExerciseCategory,
        as: 'category',
        where: {
          name: {
            [Op.iLike]: '%strength%'
          }
        }
      }]
    });

    return exercise;
  } catch (error) {
    console.error('Error al buscar ejercicio:', error);
    return null;
  }
}

/**
 * Busca un ejercicio por grupo muscular
 * @param {string} muscleGroup - Grupo muscular (chest, legs, back, etc.)
 * @param {string} type - Tipo (compound, isolation)
 * @param {Array<number>} excludedExerciseIds - IDs de ejercicios a excluir
 * @returns {Promise<Exercise|null>}
 */
async function findExerciseByMuscleGroup(muscleGroup, type, excludedExerciseIds = []) {
  const excludeCondition = excludedExerciseIds.length > 0 
    ? { id: { [Op.notIn]: excludedExerciseIds } }
    : {};
  // Mapeo de grupos musculares a palabras clave
  const muscleGroupKeywords = {
    'chest': ['bench', 'press', 'chest', 'pectoral', 'push-up'],
    'legs': ['squat', 'leg', 'thigh', 'quad', 'hamstring', 'calf', 'lunge'],
    'back': ['row', 'pull', 'lat', 'back', 'deadlift', 'pull-up'],
    'shoulders': ['shoulder', 'press', 'lateral', 'deltoid', 'raise'],
    'arms': ['curl', 'tricep', 'bicep', 'arm', 'extension'],
    'core': ['crunch', 'plank', 'core', 'abdominal', 'sit-up', 'twist']
  };

  const keywords = muscleGroupKeywords[muscleGroup.toLowerCase()] || [];

  // Buscar por grupo muscular a través de ExerciseMuscleGroup
  if (keywords.length > 0) {
    const muscleGroupRecord = await MuscleGroup.findOne({
      where: {
        name: {
          [Op.iLike]: `%${muscleGroup}%`
        }
      }
    });

    if (muscleGroupRecord) {
      // Construir el include de category condicionalmente
      const categoryInclude = {
        model: ExerciseCategory,
        as: 'category',
        required: false
      };

      if (type === 'compound') {
        categoryInclude.where = { name: { [Op.iLike]: '%strength%' } };
        categoryInclude.required = true;
      }

      const exercise = await Exercise.findOne({
        include: [
          {
            model: MuscleGroup,
            as: 'muscles',
            where: { id: muscleGroupRecord.id },
            through: { attributes: [] },
            required: true
          },
          categoryInclude
        ],
        where: {
          userMade: false,
          ...excludeCondition
        }
      });

      if (exercise) {
        return exercise;
      }
    }
  }

  // Buscar por palabras clave en el nombre
  for (const keyword of keywords) {
    const exercise = await Exercise.findOne({
      where: {
        name: {
          [Op.iLike]: `%${keyword}%`
        },
        userMade: false,
        ...excludeCondition
      },
      include: [{
        model: ExerciseCategory,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (exercise) {
      return exercise;
    }
  }

  return null;
}

/**
 * Convierte repeticiones de string a número
 * @param {string} repsString - String de repeticiones (ej: "8-10", "12")
 * @returns {number} Número de repeticiones (toma el promedio si es rango)
 */
function parseReps(repsString) {
  if (!repsString) return 10; // Default

  const cleaned = repsString.toString().trim();
  
  // Si es un rango (ej: "8-10")
  if (cleaned.includes('-')) {
    const [min, max] = cleaned.split('-').map(n => parseInt(n.trim()));
    if (!isNaN(min) && !isNaN(max)) {
      return Math.round((min + max) / 2);
    }
    return min || 10;
  }

  // Si es un número simple
  const num = parseInt(cleaned);
  return isNaN(num) ? 10 : num;
}

/**
 * Calcula el tiempo de descanso según el grupo muscular
 * @param {string} muscleGroup - Grupo muscular
 * @returns {number} Tiempo de descanso en segundos
 */
function getRestTimeByMuscleGroup(muscleGroup) {
  const restTimes = {
    'chest': 180,      // 3 minutos
    'legs': 240,      // 4 minutos
    'back': 180,      // 3 minutos
    'shoulders': 120, // 2 minutos
    'arms': 90,       // 1.5 minutos
    'core': 60        // 1 minuto
  };

  return restTimes[muscleGroup.toLowerCase()] || 120; // Default 2 minutos
}

/**
 * Construye la rutina final a partir del plan abstracto
 * Usa directamente los ejercicios sugeridos por la IA sin buscar en la BD
 * @param {AbstractPlan} abstractPlan - Plan abstracto de la IA
 * @param {number} userId - ID del usuario
 * @param {string} routineName - Nombre de la rutina proporcionado por el usuario
 * @returns {Promise<Object>} JSON final con la estructura de rutina lista para crear
 */
export async function buildFinalRoutine(abstractPlan, userId, routineName) {
  const exercises = [];
  let exerciseOrder = 1;
  const MAX_EXERCISES = 7; // Límite máximo de ejercicios
  const MIN_EXERCISES = 4; // Límite mínimo de ejercicios

  // Procesar cada sesión del plan (solo debe haber 1)
  for (const session of abstractPlan.sessions) {
    // Si ya alcanzamos el máximo, detener el procesamiento
    if (exercises.length >= MAX_EXERCISES) {
      console.log(`Límite de ${MAX_EXERCISES} ejercicios alcanzado, deteniendo procesamiento`);
      break;
    }

    // Procesar cada ejercicio de la sesión
    for (const abstractExercise of session.exercises) {
      // Si ya alcanzamos el máximo, detener el procesamiento
      if (exercises.length >= MAX_EXERCISES) {
        break;
      }

      // Convertir restTime del ejercicio de minutos a segundos (la IA siempre lo proporciona)
      const exerciseRestTime = typeof abstractExercise.restTime === 'number' 
        ? abstractExercise.restTime * 60 
        : parseFloat(abstractExercise.restTime) * 60;

      // Convertir sets abstractos a sets reales
      const sets = abstractExercise.sets.map((abstractSet, setIndex) => {
        const reps = parseReps(abstractSet.reps);
        
        // Validar y usar weight del plan abstracto (la IA siempre lo proporciona, puede ser 0 para ejercicios sin peso)
        if (abstractSet.weight === undefined || abstractSet.weight === null) {
          throw new Error(`Ejercicio "${abstractExercise.slotName}", set ${setIndex + 1}: falta campo obligatorio 'weight'`);
        }
        
        const weight = parseFloat(abstractSet.weight);
        if (isNaN(weight) || weight < 0) {
          throw new Error(`Ejercicio "${abstractExercise.slotName}", set ${setIndex + 1}: 'weight' debe ser un número mayor o igual a 0 (recibido: ${abstractSet.weight})`);
        }
        
        // Usar restTime del set si está disponible, sino usar el del ejercicio (la IA siempre proporciona uno u otro)
        let restTime;
        if (abstractSet.restTime !== undefined && abstractSet.restTime !== null) {
          // Si viene en minutos, convertir a segundos
          restTime = typeof abstractSet.restTime === 'number' 
            ? abstractSet.restTime * 60 
            : parseFloat(abstractSet.restTime) * 60;
        } else {
          // Usar el restTime del ejercicio
          restTime = exerciseRestTime;
        }

        return {
          order: setIndex + 1,
          reps: reps,
          weight: weight,
          restTime: restTime
        };
      });

      // Agregar el ejercicio a la rutina con la información necesaria para crearlo si no existe
      exercises.push({
        name: abstractExercise.slotName, // Nombre del ejercicio sugerido por la IA
        muscleGroup: abstractExercise.muscleGroup, // Grupo muscular para crear el ejercicio
        order: exerciseOrder++,
        sets: sets
      });
    }
  }

  // Validar que tenemos al menos el mínimo de ejercicios
  if (exercises.length < MIN_EXERCISES) {
    console.warn(`Solo se encontraron ${exercises.length} ejercicios, mínimo requerido: ${MIN_EXERCISES}`);
  }

  // Construir el JSON final
  return {
    userId: userId,
    name: routineName || abstractPlan.sessions[0]?.name || 'Rutina Personalizada',
    description: abstractPlan.goal 
      ? `Rutina generada para objetivo: ${abstractPlan.goal}. ${abstractPlan.daysPerWeek} días por semana.`
      : 'Rutina generada según tus objetivos',
    exercises: exercises
  };
}

