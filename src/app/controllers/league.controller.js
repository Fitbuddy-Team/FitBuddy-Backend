import { User, LeagueMember, League, Session } from '../models/index.js';


export const leagueController = {
    
    getUserLeague: async (req, res) => {
        try {
          const { userId } = req.params;

          const user = await User.findByPk(userId, {
            include: {
              model: LeagueMember,
              as: 'leagueMember',
              include: {
                model: League,
                as: 'league',
              },
            },
          });

          if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
          }

          // Si el usuario no tiene liga
          if (!user.leagueMember || !user.leagueMember.league) {
            return res.status(404).json({ message: 'El usuario no pertenece a ninguna liga' });
          }

          // Retornar la liga
          return res.json(user.leagueMember.league);

        } catch (error) {
          console.error('Error al obtener la liga del usuario:', error);
          res.status(500).json({ message: 'Error interno del servidor' });
        }
    },

    getTopPlayersSessions: async (req, res) => {
        try {
          const { N, numSessions, userId } = req.params;

          // Validar parámetros
          if (!N || isNaN(N) || parseInt(N) <= 0) {
            return res.status(400).json({ 
              success: false,
              message: 'N debe ser un número válido mayor a 0' 
            });
          }

          if (!numSessions || isNaN(numSessions) || parseInt(numSessions) <= 0) {
            return res.status(400).json({ 
              success: false,
              message: 'numSessions debe ser un número válido mayor a 0' 
            });
          }

          if (!userId || isNaN(userId)) {
            return res.status(400).json({ 
              success: false,
              message: 'userId inválido' 
            });
          }

          // Buscar la liga del usuario
          const user = await User.findByPk(parseInt(userId), {
            include: {
              model: LeagueMember,
              as: 'leagueMember',
              include: {
                model: League,
                as: 'league',
              },
            },
          });

          if (!user) {
            return res.status(404).json({ 
              success: false,
              message: 'Usuario no encontrado' 
            });
          }

          // Si el usuario no tiene liga
          if (!user.leagueMember || !user.leagueMember.league) {
            return res.status(404).json({ 
              success: false,
              message: 'El usuario no pertenece a ninguna liga' 
            });
          }

          const userLeague = user.leagueMember.league;

          // Obtener los N mejores jugadores de la liga (ordenados por puntos descendente)
          const topPlayers = await LeagueMember.findAll({
            where: { leagueId: userLeague.id },
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }],
            order: [['points', 'DESC']],
            limit: parseInt(N)
          });

          if (topPlayers.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'No se encontraron jugadores en la liga' 
            });
          }

          // Para cada jugador, obtener sus numSessions últimas sesiones
          const playersWithSessions = await Promise.all(
            topPlayers.map(async (player) => {
              const sessions = await Session.findAll({
                where: { userId: player.userId },
                attributes: ['id', 'date', 'duration', 'status', 'points'],
                order: [['date', 'DESC']],
                limit: parseInt(numSessions)
              });

              return {
                userId: player.userId,
                userName: player.user.name,
                userEmail: player.user.email,
                points: player.points,
                league: {
                  id: userLeague.id,
                  name: userLeague.name,
                  minimumPoints: userLeague.minimumPoints,
                  maximumPoints: userLeague.maximumPoints
                },
                sessions: sessions.map(session => ({
                  id: session.id,
                  date: session.date,
                  duration: session.duration,
                  status: session.status,
                  points: session.points
                }))
              };
            })
          );

          res.status(200).json({
            success: true,
            message: `Top ${N} jugadores de la liga ${userLeague.name} con sus ${numSessions} últimas sesiones`,
            data: {
              league: {
                id: userLeague.id,
                name: userLeague.name,
                minimumPoints: userLeague.minimumPoints,
                maximumPoints: userLeague.maximumPoints
              },
              players: playersWithSessions
            }
          });

        } catch (error) {
          console.error('Error al obtener top jugadores:', error);
          res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor',
            error: error.message 
          });
        }
    }
};
export default leagueController;
