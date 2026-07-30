export function validateQuestion(q: any): boolean {
  if (!q || typeof q !== 'object') return false;
  if (!q.id || !q.type || !q.questionText) return false;

  // 1. Image questions validation
  if (q.type === 'picture_id' || q.type === 'road_signs') {
    if (!q.image || typeof q.image !== 'string') return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
  }

  // 2. Image selection validation (4 image choice cards)
  if (q.type === 'image_select') {
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (!q.options.every((o: any) => o && o.image && typeof o.image === 'string')) return false;
  }

  // 3. Fill in the blank & MCQ validation
  if (q.type === 'fill_blank' || q.type === 'read_sentence' || q.type === 'everyday_communication' || q.type === 'listening_mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
  }

  // 4. Matching validation
  if (q.type === 'matching') {
    if (!Array.isArray(q.matchingPairs) || q.matchingPairs.length === 0) return false;
  }

  // 5. Arrange letters validation
  if (q.type === 'arrange_letters') {
    if (!q.scrambledLetters || typeof q.scrambledLetters !== 'string' || q.scrambledLetters.length === 0) return false;
  }

  // 6. Arrange words validation
  if (q.type === 'arrange_words') {
    if (!Array.isArray(q.scrambledWords) || q.scrambledWords.length === 0) return false;
  }

  // 7. Correct answer presence
  if (q.correctAnswer === undefined || q.correctAnswer === null) return false;

  return true;
}
