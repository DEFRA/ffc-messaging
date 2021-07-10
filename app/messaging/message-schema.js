const Joi = require('joi')

module.exports = Joi.object({
  body: Joi.object().allow(null),
  subject: Joi.string().allow(''),
  type: Joi.string().required(),
  source: Joi.string().required(),
  correlationId: Joi.string().allow(''),
  sessionId: Joi.string().allow('')
})
