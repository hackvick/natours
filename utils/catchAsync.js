module.exports = fn => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };

// This is only for async function