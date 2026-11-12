const { body } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 80 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a hex value like #7C5CE0'),
  body('deadline').optional({ values: 'falsy' }).isISO8601().withMessage('Deadline must be a valid date'),
  body('members').optional().isArray({ max: 50 }).withMessage('Members must be a list of user ids'),
];

const update = [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty').isLength({ max: 80 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a hex value like #7C5CE0'),
  body('deadline').optional({ values: 'null' }).isISO8601().withMessage('Deadline must be a valid date'),
  body('members').optional().isArray({ max: 50 }),
];

module.exports = { create, update };
