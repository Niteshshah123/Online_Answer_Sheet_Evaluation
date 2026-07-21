class DocumentFactory {
  create(type, payload) {
    switch (type) {
      case 'EXAM':
        return { type: 'EXAM', payload };
      case 'ANSWER_SHEET':
        return { type: 'ANSWER_SHEET', payload };
      case 'ANSWER_KEY':
        return { type: 'ANSWER_KEY', payload };
      default:
        return { type: 'UNKNOWN', payload };
    }
  }
}

module.exports = new DocumentFactory();
