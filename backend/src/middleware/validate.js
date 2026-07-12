function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: 'Validation failed',
        issues: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
