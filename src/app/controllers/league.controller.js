import { User, LeagueMember, League } from '../models/index.js';


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
    }
};
export default leagueController;
