const express = require('express');
const vaultController = require('../controllers/vaultController');
const { authenticateToken } = require('../middleware/auth');

const vaultRouter = express.Router();
vaultRouter.use(authenticateToken);

vaultRouter.post('/upload', vaultController.upload);
vaultRouter.get('/', vaultController.getAll);
vaultRouter.get('/:id', vaultController.getOne);
vaultRouter.put('/:id', vaultController.update);
vaultRouter.delete('/:id', vaultController.remove);

module.exports = vaultRouter;