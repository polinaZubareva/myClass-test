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

    if (isNaN(lessonsCount)) {
      query = `WITH days AS (
          SELECT date, EXTRACT(DOW FROM date) day_of_week 
          FROM generate_series('${firstDate}'::DATE,'${lastDate}'::DATE,'1 day'::interval) date 
        ), dates as(
          SELECT date::DATE 
          FROM days 
          WHERE day_of_week IN (${days.toString()})
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
          console.log(err.message);
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
        ), res as (select * from dates limit ${lessonsCount})
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
        });
    }

    if (!added.length)
      return {
        message: 'lessons not added',
      };
    else {
      const addLessonTeachersIdsQuery = `WITH lessons AS(
          Select * from unnest(ARRAY${createdIds})
        ), teachers AS(
          Select * from unnest(ARRAY${teacherIds})
        ), res as(
        Select * from lessons, teachers
        )
        insert into lesson_teachers(lesson_id, teacher_id) select * from res;`;
      await dbPool
        .query(
          addLessonTeachersIdsQuery
        )
        .then((value) => {
          console.log(
            ` lessons teachers${value}`
          );
        })
        .catch((err) => {
          console.log(err.massage);
        });
    }
    return createdIds;
  }

  async getLessons() {
    const got = await dbPool.query();
    if (!got);
  }
}

export default new lessonsService();
