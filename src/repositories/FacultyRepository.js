const BaseRepository = require('./BaseRepository');
const Faculty = require('../models/entities/facultyModel');

class FacultyRepository extends BaseRepository {
  constructor() {
    super(Faculty);
  }
}

module.exports = new FacultyRepository();
