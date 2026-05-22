function ok(res, data) {
  res.json({ code: 0, message: 'ok', data })
}

function fail(res, code, message, httpStatus = 400) {
  res.status(httpStatus).json({ code, message, data: null })
}

module.exports = { ok, fail }
