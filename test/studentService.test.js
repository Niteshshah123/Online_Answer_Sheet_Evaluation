const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReportSummary } = require('../src/services/StudentService');

test('buildReportSummary totals marks and keeps question review details', () => {
  const evaluations = [
    { questionNumber: 1, marksObtained: 5, review: 'Good', facultyName: 'Dr. Rao', status: 'LOCKED' },
    { questionNumber: 2, marksObtained: 3, review: 'Needs more detail', facultyName: 'Prof. Nair', status: 'SUBMITTED' }
  ];

  const summary = buildReportSummary(evaluations, [8, 7]);

  assert.equal(summary.fullMarks, 15);
  assert.equal(summary.marksObtained, 8);
  assert.equal(summary.evaluations.length, 2);
  assert.equal(summary.evaluations[0].facultyName, 'Dr. Rao');
  assert.equal(summary.evaluations[1].review, 'Needs more detail');
});
