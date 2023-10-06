import dbPool from '../database/index.js';

class lessonsService {
  constructor() {
    this.countLimit = 300;
  }

  async createLessons(data) {
    const { teacherIds, title, days, firstDate, lessonsCount, lastDate } = data;

    let createdIds, query, added;
    const first = new Date(firstDate);
    let last = new Date(lastDate);
    if (last.getDate() - first.getDate() > 0)
      last = new Date(first.setFullYear(first.getFullYear() + 1));
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
          (value) => (added = value.rows.map((el) => Number(Object.values(el))))
        )
        .catch((err) => {
          return {
            status: 400,
            error: err.message,
          };
        });
    } else {
      const interval = Math.ceil(lessonsCount / days.length);
      query = `WITH days AS (
          SELECT date, EXTRACT(DOW FROM date) day_of_week 
          FROM generate_series('${firstDate}'::DATE,'${firstDate}'::DATE+interval '${interval} weeks','1 day'::interval) date 
        ), dates as(
          SELECT date::DATE 
          FROM days 
          WHERE day_of_week IN (${days.toString()})
        ), res as (select * from dates WHERE date < ('${firstDate}'::DATE+'1 year'::interval) limit ${
          lessonsCount > 300 ? this.countLimit : lessonsCount
        })
        INSERT INTO lessons(date, title, status)
        SELECT *, '${title}', '0'
        FROM res
        RETURNING id;`;
      createdIds = await dbPool
        .query(query)
        .then(
          (value) => (added = value.rows.map((el) => Number(Object.values(el))))
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
        message: 'lessons added, but problems with foreign keys',
      };
    else {
      const addLessonTeachersIdsQuery = `WITH lessons_new AS(
        SELECT * FROM unnest($1::int[])
      ), teachers_new AS(
        SELECT * FROM unnest($2::int[])
      ), res as(
      SELECT * FROM lessons_new, teachers_new
      )
      INSERT INTO lesson_teachers(lesson_id, teacher_id) SELECT * FROM res 
      WHERE NOT EXISTS (
        SELECT null from lesson_teachers 
        WHERE (lesson_id, teacher_id) = SELECT * FROM res
       ));`;

      await dbPool
        .query(addLessonTeachersIdsQuery, [added, teacherIds])
        .then((value) => {
          console.log(` lessons teachers${value}`);
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

  async getLessons(data) {
    let {
      date,
      status,
      teacherIds,
      studentsCount,
      page = 1,
      lessonsPerPage = 5,
    } = data;
    date = date.split(',');
    teacherIds = teacherIds.split(',');
    //studentsCount = studentsCount.split(',');

    const getQuery = `with date_filter as(
      select id from lessons
      where date >= '${date[0]}' and date <= '${date[1]}'
    ), status_filter as(
      select id from lessons
      where status='${status}'
    ), teacher_lessons_filter as(
      with teachers_id as(
        select * from unnest($1::int[])
      )
      select lesson_id from lesson_teachers
      where teacher_id in (select * from teachers_id)
    ), students_count_filter as(
      with counted_lessons as (
      select lesson_id, count(*) 
      from lesson_students
      group by 1
      ) select lesson_id from counted_lessons where count in (${studentsCount})
    ), all_selected as(
      select * from date_filter
      union 
      select * from status_filter
      union
      select * from teacher_lessons_filter
      union 
      select * from students_count_filter
    ), visit_count as (
      select lesson_id, count(*) as vcount from lesson_students 
      where lesson_id in (select * from all_selected) 
      and visit=true 
      group by 1
    )
    select lessons.id, date, title, status, vcount 
    from lessons 
    left join visit_count on lessons.id=visit_count.lesson_id 
    where id in (select * from all_selected) 
    order by 1
    limit ${lessonsPerPage} offset (${page}-1)*${lessonsPerPage};`;
    const lessons = await dbPool.query(getQuery, [teacherIds]).catch((err) => {
      return { status: 400, error: err.message };
    });
    lessons.rows.forEach((value) => {
      value.students = [];
      value.teachers = [];
    });
    return lessons.rows;
  }
}

export default new lessonsService();
