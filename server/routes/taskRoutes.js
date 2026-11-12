const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceAccess } = require('../middleware/workspace');
const { validate } = require('../middleware/validate');
const taskValidator = require('../validators/taskValidator');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.use(requireAuth);

// Keep sub-routes that could collide with /:id in front of it.
router.get('/', requireWorkspaceAccess('member'), taskController.list);
router.put('/reorder', requireWorkspaceAccess('member'), validate(taskValidator.reorder), taskController.reorder);
router.post('/', requireWorkspaceAccess('member'), validate(taskValidator.create), taskController.create);

router.get('/:id', taskController.get);

router.patch('/:id', validate(taskValidator.update), taskController.update);
router.delete('/:id', taskController.remove);

router.post('/:id/comments', validate(taskValidator.comment), taskController.addComment);
router.post('/:id/subtasks', validate(taskValidator.subtask), taskController.addSubtask);
router.patch('/:id/subtasks/:subtaskId', validate(taskValidator.subtaskUpdate), taskController.updateSubtask);
router.delete('/:id/subtasks/:subtaskId', taskController.removeSubtask);

module.exports = router;
