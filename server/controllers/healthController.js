export const getHealthStatus = (req, res) => {
  res.json({
    ok: true,
    service: 'scrollnom-api',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
};
