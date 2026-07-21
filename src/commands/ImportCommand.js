class ImportCommand {
  constructor(importService) {
    this.importService = importService;
  }

  async execute(fileBuffer) {
    return this.importService.importFromExcel(fileBuffer);
  }
}

module.exports = ImportCommand;
