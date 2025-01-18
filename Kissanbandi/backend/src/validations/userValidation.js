const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(2)
    .max(50)
    .trim()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),

  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),

  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  alternatePhone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  gst: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid GST number'
    }),

  role: Joi.string()
    .valid('user', 'business')
    .default('user'),

  address: Joi.object({
    street: Joi.string().allow(''),
    locality: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid 6-digit pincode'
      })
  })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .trim()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    }),

  rememberMe: Joi.boolean()
});

const passwordResetSchema = Joi.object({
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Passwords do not match'
    })
});

const profileUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .messages({
        'string.pattern.base': 'Please provide a valid 6-digit pincode'
      })
  })
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  passwordResetSchema,
  profileUpdateSchema
}; 