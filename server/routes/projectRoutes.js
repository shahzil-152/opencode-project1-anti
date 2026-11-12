const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceAccess } = require('../middleware/workspace');
const { validate } = require('../middleware/validate');
const projectValidator = require('../validators/projectValidator');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.use(requireAuth);

// List is scoped by ?workspace=... (see requireWorkspaceAccess).
router.get('/', requireWorkspaceAccess('member'), projectController.list);
router.post('/', requireWorkspaceAccess('member'), validate(projectValidator.create), projectController.create);

router.get('/:id', projectController.get);
router.patch('/:id', validate(projectValidator.update), projectController.update);
router.delete('/:id', projectController.remove);

module.exports = router;
