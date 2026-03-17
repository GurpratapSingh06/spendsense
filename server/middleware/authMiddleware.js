const supabase = require('../utils/supabaseClient');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid session. Please log in again.' });
  }
};

module.exports = authMiddleware;
