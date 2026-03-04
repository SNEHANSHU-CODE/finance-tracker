const vaultService = require('../services/vaultService');

class VaultController {
  async upload(req, res) {
    try {
      const { name, originalName, mimeType, size, data, tags, description } = req.body;
      if (!data || !originalName) return res.status(400).json({ success: false, message: 'File data required' });

      const result = await vaultService.uploadDocument(req.userId, {
        name: name || originalName, originalName, mimeType, size, data, tags, description
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const result = await vaultService.getUserDocuments(req.userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getOne(req, res) {
    try {
      const result = await vaultService.getDocumentById(req.params.id, req.userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async remove(req, res) {
    try {
      const result = await vaultService.deleteDocument(req.params.id, req.userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      const result = await vaultService.updateDocument(req.params.id, req.userId, req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new VaultController();