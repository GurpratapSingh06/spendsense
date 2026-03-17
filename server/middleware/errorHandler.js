const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong. Please try again.';
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join('. ') });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'This record already exists.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid data format provided.' });
  }

  res.status(statusCode).json({ error: message });
};

module.exports = { errorHandler };
