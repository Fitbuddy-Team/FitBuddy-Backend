export const healthController = {
  health: (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  },
};

export default healthController;

