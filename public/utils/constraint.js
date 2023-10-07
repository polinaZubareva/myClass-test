import dbPool from '../database/index.js';

export async function createConstraintLessonTeacher() {
  await dbPool.query(
    'ALTER TABLE lesson_teachers ADD CONSTRAINT lessons_teachers UNIQUE(lesson_id,teacher_id);'
  );
}
