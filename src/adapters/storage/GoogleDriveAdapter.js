const StorageAdapter = require('./StorageAdapter');

class GoogleDriveAdapter extends StorageAdapter {
  async upload(fileBuffer, filename) {
    // Placeholder implementation for Google Drive upload.
    // In production, replace this with actual Google Drive API integration.
    return `https://drive.example.com/${filename}`;
  }
}

module.exports = GoogleDriveAdapter;
