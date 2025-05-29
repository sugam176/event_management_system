function ensureLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.send('You must be logged in to register. <a href="/users/login">Login here</a>');
  }
}
module.exports = ensureLoggedIn;