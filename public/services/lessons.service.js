import dbPool from '../database/index.js';

class lessonsService {
  constructor() {
    this.countLimit = 300;
    this.dateLimit = new Date(
      new Date().setFullYear(
        new Date().getFullYear() + 1
      )
    );
  }

  async createLessons(data) {
    const {
      teacherIds,
      title,
      days,
      firstDate,
      lessonsCount,
      lastDate,
    } = data;

    let createdIds, query, added;
    const first = new Date(firstDate);
    let last = new Date(lastDate);
    if (
      last.getDate() - first.getDate() >
      0
    )
      last = new Date(
        first.setFullYear(
          first.getFullYear() + 1
        )
      );
    if (isNaN(lessonsCount)) {
      query = `WITH days AS (
          SELECT date, EXTRACT(DOW FROM date) day_of_week 
          FROM generate_series('${firstDate}'::DATE,'${last}'::DATE,'1 day'::interval) date 
        ), dates as(
          SELECT date::DATE 
          FROM days 
          WHERE day_of_week IN (${days.toString()})
          LIMIT ${this.countLimit}
        )
        INSERT INTO lessons(date, title, status)
        SELECT date, '${title}', '0'
        FROM dates
        RETURNING id;`;
      createdIds = await dbPool
        .query(query)
        .then(
          (value) =>
            (added = value.rows.map(
              (el) =>
                Number(
                  Object.values(el)
                )
            ))
        )
        .catch((err) => {
          return {
            status: 400,
            error: err.message,
          };
        });
    } else {
      const interval = Math.ceil(
        lessonsCount / days.length
      );
      query = `WITH days AS (
          SELECT date, EXTRACT(DOW FROM date) day_of_week 
          FROM generate_series('${firstDate}'::DATE,'${firstDate}'::DATE+interval '${interval} weeks','1 day'::interval) date 
        ), dates as(
          SELECT date::DATE 
          FROM days 
          WHERE day_of_week IN (${days.toString()})
        ), res as (select * from dates WHERE date < ('${firstDate}'::DATE+'1 year'::interval) limit ${
          lessonsCount > 300
            ? 300
            : lessonsCount
        })
        INSERT INTO lessons(date, title, status)
        SELECT *, '${title}', '0'
        FROM res
        RETURNING id;`;
      createdIds = await dbPool
        .query(query)
        .then(
          (value) =>
            (added = value.rows.map(
              (el) =>
                Number(
                  Object.values(el)
                )
            ))
        )
        .catch((err) => {
          console.log(err.message);
          return {
            status: 400,
            error: err.message,
          };
        });
    }

    if (!added?.length)
      return {
        status: 400,
        message:
          'lessons added, but problems with foreign keys',
      };
    else {
      const addLessonTeachersIdsQuery = `WITH lessons_new AS(
        SELECT * FROM unnest($1::int[])
      ), teachers_new AS(
        SELECT * FROM unnest($2::int[])
      ), res as(
      SELECT * FROM lessons_new, teachers_new
      )
      INSERT INTO lesson_teachers(lesson_id, teacher_id) SELECT * FROM res;`;

      await dbPool
        .query(
          addLessonTeachersIdsQuery,
          [added, teacherIds]
        )
        .then((value) => {
          console.log(
            ` lessons teachers${value}`
          );
        })
        .catch((err) => {
          console.log(err.message);
          return {
            status: 400,
            error: err.message,
          };
        });
    }
    return { lessonsIds: createdIds };
  }

  async getLessons() {
    const got = await dbPool.query();
    if (!got);
  }
}

export default new lessonsService();
