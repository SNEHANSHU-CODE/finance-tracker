const vaultService = require('../services/vaultService');

class VaultController {
  async upload(req, res) {
    try {
      const { name, originalName, mimeType, size, data, tags, description } = req.body;
      if (!data || !originalName) return res.status(400).json({ success: false, message: 'File data required' });

      const ALLOWED_TYPES = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({ success: false, message: 'Only PDF, CSV, and Excel files are supported' });
      }

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

  // Called after user successfully opens a password-protected PDF in the viewer.
  // Stores the password so the RAG cron can decrypt and embed the document.
  async unlockDocument(req, res) {
    try {
      const { password } = req.body;
      if (!password || typeof password !== 'string' || !password.trim()) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }
      const result = await vaultService.saveDocumentPassword(req.params.id, req.userId, password.trim());
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new VaultController();