import crypto from 'crypto';
import { Group, GroupMember, User, Session, ExerciseSession, Exercise, Set, sequelize } from '../models/index.js';

export const groupController = {
    createGroup: async (req, res) => {
      const { userId } = req.params;
      const { name, description, maxMembers } = req.body;

      if (!name || maxMembers === undefined) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: name y maxMembers.' });
      }

      const t = await sequelize.transaction();
      try {
        // Generar código único (hex de 6 chars)
        let code;
        let exists;
        do {
          code = crypto.randomBytes(3).toString('hex').toUpperCase();
          exists = await Group.findOne({ where: { code }, transaction: t });
        } while (exists);

        const group = await Group.create({
          name,
          description: description || null,
          code,
          maxMembers: Number(maxMembers)
        }, { transaction: t });

        await GroupMember.create({
          userId: Number(userId),
          groupId: group.id,
          points: 0
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: 'Grupo creado exitosamente', group });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    },

    joinGroup: async (req, res) => {
      const { userId } = req.params;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ message: 'Falta campo obligatorio: code.' });
      }

      const t = await sequelize.transaction();
      try {
        // Buscar grupo por código (normalizar a mayúsculas)
        const group = await Group.findOne({ where: { code: String(code).toUpperCase() }, transaction: t });
        if (!group) {
          await t.rollback();
          return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        // Verificar si ya es miembro
        const alreadyMember = await GroupMember.findOne({
          where: { userId: Number(userId), groupId: group.id },
          transaction: t
        });
        if (alreadyMember) {
          await t.rollback();
          return res.status(409).json({ message: 'El usuario ya es miembro del grupo.' });
        }

        // Verificar límite de miembros
        const memberCount = await GroupMember.count({ where: { groupId: group.id }, transaction: t });
        if (group.maxMembers && Number.isFinite(Number(group.maxMembers)) && memberCount >= Number(group.maxMembers)) {
          await t.rollback();
          return res.status(403).json({ message: 'El grupo está lleno.' });
        }

        const groupMember = await GroupMember.create({
          userId: Number(userId),
          groupId: group.id,
          points: 0
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: 'Te uniste al grupo correctamente', groupMember });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    },

    leaveGroup: async (req, res) => {
      const { groupId, userId } = req.params;

      const t = await sequelize.transaction();
      try {
        // Verificar que el grupo exista
        const group = await Group.findByPk(Number(groupId), { transaction: t });
        if (!group) {
          await t.rollback();
          return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        // Buscar la relación GroupMember
        const membership = await GroupMember.findOne({
          where: { groupId: Number(groupId), userId: Number(userId) },
          transaction: t
        });

        if (!membership) {
          await t.rollback();
          return res.status(404).json({ message: 'El usuario no es miembro del grupo.' });
        }

        // Eliminar membership
        await membership.destroy({ transaction: t });

        await t.commit();
        return res.status(200).json({ message: 'Abandonaste el grupo correctamente' });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    },

    getGroupRanking: async (req, res) => {
      const { groupId, userId } = req.params;

      const t = await sequelize.transaction();
      try {
        const group = await Group.findByPk(Number(groupId), { transaction: t });
        if (!group) {
          await t.rollback();
          return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        // Verificar que el usuario que consulta pertenece al grupo
        const requesterMembership = await GroupMember.findOne({
          where: { groupId: Number(groupId), userId: Number(userId) },
          transaction: t
        });
        if (!requesterMembership) {
          await t.rollback();
          return res.status(403).json({ message: 'El usuario no pertenece al grupo.' });
        }

        // Obtener todos los miembros del grupo con sus usuarios
        const members = await GroupMember.findAll({
          where: { groupId: Number(groupId) },
          transaction: t
        });

        const userIds = members.map(m => m.userId);
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'name'],
          transaction: t
        });
        const userMap = new Map(users.map(u => [u.id, u.name]));

        // Ordenar por puntos desc
        const sorted = members
          .map(m => ({ userId: m.userId, points: Number(m.points) || 0 }))
          .sort((a, b) => b.points - a.points);

        // Calcular posiciones (mismo puntaje -> misma posición; el siguiente salta)
        const ranking = [];
        let lastPoints = null;
        let lastPosition = 0;
        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          const idx = i + 1;
          if (lastPoints === null || item.points !== lastPoints) {
            lastPosition = idx;
            lastPoints = item.points;
          }
          ranking.push({
            userId: item.userId,
            name: userMap.get(item.userId) || null,
            points: item.points,
            position: lastPosition
          });
        }

        // Separar usuario actual y los demás (integrantes no incluyan al usuario actual)
        const currentUserEntry = ranking.find(r => r.userId === Number(userId)) || null;
        const membersWithoutCurrent = ranking.filter(r => r.userId !== Number(userId));

        // Totales
        const totalMembers = members.length;
        const maxMembers = group.maxMembers ? Number(group.maxMembers) : null;

        await t.commit();
        return res.status(200).json({
          members: membersWithoutCurrent,
          currentUser: currentUserEntry,
          totalMembers,
          maxMembers
        });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    },

    getGroupTopSession: async (req, res) => {
      const { groupId } = req.params;

      const t = await sequelize.transaction();
      try {
        const group = await Group.findByPk(Number(groupId), { transaction: t });
        if (!group) {
          await t.rollback();
          return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        // Obtener miembros del grupo
        const members = await GroupMember.findAll({
          where: { groupId: Number(groupId) },
          transaction: t
        });

        if (!members || members.length === 0) {
          await t.rollback();
          return res.status(404).json({ message: 'El grupo no tiene miembros.' });
        }

        // Elegir el miembro con más puntos (si hay empate devuelve el primero)
        let topMember = members[0];
        for (const m of members) {
          if ((Number(m.points) || 0) > (Number(topMember.points) || 0)) {
            topMember = m;
          }
        }

        const topUser = await User.findByPk(Number(topMember.userId), {
          attributes: ['id', 'name'],
          transaction: t
        });

        // Obtener la última session del miembro top (por fecha o createdAt)
        const sessionRows = await sequelize.query(
          `SELECT id, date, duration, points, "createdAt"
           FROM "Sessions"
           WHERE "userId" = :userId
           ORDER BY date DESC
           LIMIT 1`,
          { replacements: { userId: Number(topMember.userId) }, type: sequelize.QueryTypes.SELECT, transaction: t }
        );
        const sessionRow = sessionRows && sessionRows.length ? sessionRows[0] : null;
        const session = sessionRow
          ? {
              id: sessionRow.id,
              date: sessionRow.date || sessionRow.createdAt || null,
              duration: sessionRow.duration || null,
              points: Number(sessionRow.points) || 0
            }
          : null;

        // si no encontró por 'date', intentar por createdAt (por compatibilidad)
        if (!session) {
          session = await Session.findOne({
            where: { userId: Number(topMember.userId) },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'date', 'duration', 'points', 'createdAt'],
            transaction: t
          });
        }

        let exercises = [];
        if (session) {
          // Obtener ExerciseSessions de la session
          const exerciseSessions = await ExerciseSession.findAll({
            where: { sessionId: session.id },
            attributes: ['id', 'exerciseId'],
            transaction: t
          });

          const exerciseIds = exerciseSessions.map(es => es.exerciseId).filter(id => id != null);
          let exerciseMap = new Map();
          if (exerciseIds.length > 0) {
            const exercisesRows = await Exercise.findAll({
              where: { id: exerciseIds },
              attributes: ['id', 'name'],
              transaction: t
            });
            exerciseMap = new Map(exercisesRows.map(e => [e.id, e.name]));
          }

          // Contar Sets por ExerciseSession
          exercises = await Promise.all(exerciseSessions.map(async (es) => {
            const setsCount = await Set.count({
              where: { exerciseSessionId: es.id },
              transaction: t
            });

            return {
              exerciseSessionId: es.id,
              exerciseId: es.exerciseId || null,
              exerciseName: es.exerciseId ? (exerciseMap.get(es.exerciseId) || null) : null,
              setsCount
            };
          }));
        }

        await t.commit();
        return res.status(200).json({
          topMember: {
            userId: Number(topMember.userId),
            name: topUser ? topUser.name : null,
            points: Number(topMember.points) || 0
          },
          session: session
            ? {
                id: session.id,
                date: session.date || session.createdAt || null,
                duration: session.duration || null,
                points: session.points || 0
              }
            : null,
          exercises
        });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    },

    getGroupInfo: async (req, res) => {
      const { groupId } = req.params;
      const t = await sequelize.transaction();
      try {
        const group = await Group.findByPk(Number(groupId), { transaction: t });
        if (!group) {
          await t.rollback();
          return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        await t.commit();
        return res.status(200).json({
          id: group.id,
          name: group.name,
          code: group.code
        });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    },
    
    getUserGroups: async (req, res) => {
      try {
        const { userId } = req.params;
      
        // Verificar existencia del usuario
        const userExists = await User.findByPk(userId);
        if (!userExists) {
          return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
      
        // Buscar los grupos donde participa este usuario
        const memberships = await GroupMember.findAll({
          where: { userId },
          include: [{
            model: Group,
            as: 'group',
            attributes: ['id', 'name']
          }]
        });
      
        if (memberships.length === 0) {
          return res.status(200).json({
            userId,
            groups: [],
            message: 'El usuario no pertenece a ningún grupo.'
          });
        }
      
        // Obtener todos los grupos y sus miembros
        const groupIds = memberships.map(m => m.groupId);
      
        const groups = await Group.findAll({
          where: { id: groupIds },
          attributes: ['id', 'name', 'description'],
          include: [{
            model: GroupMember,
            as: 'members',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }]
          }]
        });
      
        // Formatear respuesta
        const formattedGroups = groups.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          members: g.members.map(m => ({
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            points: m.points
          }))
        }));
      
        return res.status(200).json({
          success: true,
          userId,
          totalGroups: formattedGroups.length,
          groups: formattedGroups
        });
      } catch (error) {
        console.error('Error al obtener los grupos del usuario:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: error.message
        });
      }
    },    
};    

export default groupController;