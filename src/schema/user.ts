import Joi from 'joi'

export const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('ADMIN', 'VENDOR', 'CUSTOMER').required().messages({
    'any.only': 'Role must be either ADMIN, VENDOR, or CUSTOMER',
    'any.required': 'Role is required',
  }),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})
