import dbPool from '../database/index.js';

class lessonsService {
  constructor() {
    this.countLimit = 300;
  }

  async createLessons(data) {
    const { teacherIds, title, days, firstDate, lessonsCount, lastDate } = data;

    if ([teacherIds, title, days, firstDate].some((item) => item === undefined))
      return { responseStatus: 400, error: 'some data is undefined' };

    let createdIds, query, added;
    const first = new Date(firstDate);
    let last = new Date(lastDate);
    const newLast = new Date(first.setFullYear(first.getFullYear() + 1));

    if (isNaN(lessonsCount)) {
      query = `WITH days AS (
          SELECT date, EXTRACT(DOW FROM date) day_of_week 
          FROM generate_series('${firstDate}'::DATE,'${
            last.getDate() - first.getDate() > 0
              ? newLast.getFullYear() +
                '-' +
                (newLast.getMonth() + 1) +
                '-' +
                newLast.getDate()
              : lastDate
          }'::DATE,'1 day'::interval) date 
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
    }
    createdIds = await dbPool
      .query(query)
      .then(
        (value) => (added = value.rows.map((el) => Number(Object.values(el))))
      )
      .catch((err) => {
        console.log(err.message);
        return {
          responseStatus: 400,
          error: err.message,
        };
      });

    if (!createdIds?.length)
      return {
        responseStatus: 400,
        message: 'lessons added, but problems with foreign keys',
      };
    else {
      const addLessonTeachersIdsQuery = `WITH lessons_new AS(
          SELECT * FROM unnest(array [${added}])
        ), teachers_new AS(
          SELECT * FROM unnest(array [${teacherIds}])
        ), res as(
        SELECT * FROM lessons_new, teachers_new
        )
        INSERT INTO lesson_teachers(lesson_id, teacher_id) SELECT * FROM res 
        ON CONFLICT ON CONSTRAINT lessons_teachers DO nothing;`;

      await dbPool
        .query(addLessonTeachersIdsQuery)
        .then((value) => {
          console.log(` lessons teachers${value}`);
        })
        .catch((err) => {
          console.log(err.message);
          return {
            responseStatus: 400,
            error: err.message,
          };
        });
    }
    return { lessonsIds: createdIds };
  }

  async getLessons(data) {
    let getQuery,
      gottenData = [];
    let {
      date = 'null,null',
      status = null,
      teacherIds = 'null',
      studentsCount = 'null',
      page = 1,
      lessonsPerPage = 5,
    } = data;
    date = date.split(',');
    teacherIds = teacherIds.split(',');

    if (date[1] === undefined || date[1] === 'null')
      getQuery = `with date_filter as(
      select id from lessons
      where date = $1
    ), status_filter as(
      select id from lessons
      where status=$2
    ), teacher_lessons_filter as(
      select lesson_id from lesson_teachers where teacher_id in (${teacherIds})
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
      select lesson_id, count(*) as visited_count from lesson_students 
      where lesson_id in (select * from all_selected) 
      and visit=true 
      group by 1
    )
    select lessons.id, date, title, status, visited_count 
    from lessons 
    left join visit_count on lessons.id=visit_count.lesson_id 
    where id in (select * from all_selected) 
    order by 1
    limit ${lessonsPerPage} offset (${page}-1)*${lessonsPerPage};`;
    else
      getQuery = `with date_filter as(
      select id from lessons
      where date >= $1 and date <= '${date[1]}'
    ), status_filter as(
      select id from lessons
      where status=$2
    ), teacher_lessons_filter as(
      select lesson_id from lesson_teachers where teacher_id in (${teacherIds})
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
      select lesson_id, count(*) as visited_count from lesson_students 
      where lesson_id in (select * from all_selected) 
      and visit=true 
      group by 1
    )
    select lessons.id, date, title, status, visited_count 
    from lessons 
    left join visit_count on lessons.id=visit_count.lesson_id 
    where id in (select * from all_selected) 
    order by 1
    limit ${lessonsPerPage} offset (${page}-1)*${lessonsPerPage};`;

    await dbPool
      .query(getQuery, [date[0] === 'null' ? null : date[0], status])
      .then((value) => {
        gottenData = value.rows;
      })
      .catch((err) => {
        return { responseStatus: 400, error: err.message };
      });

    const toReturn = await Promise.all(
      gottenData.map(async (value) => {
        const students = await this.getStudents(value.id);
        const teachers = await this.getTeachers(value.id);
        return { ...value, students, teachers };
      })
    );

    console.log(toReturn);
    return toReturn;
  }

  async getStudents(lessonId) {
    const students = (
      await dbPool.query(
        `with students_with_visit as(
              select student_id, visit from lesson_students where lesson_id=$1
            ) select id,name,visit from students 
            join students_with_visit on students.id=students_with_visit.student_id;`,
        [lessonId]
      )
    ).rows;
    return students;
  }

  async getTeachers(lessonId) {
    const teachers = (
      await dbPool.query(
        `with teachers_from as(
          select teacher_id from lesson_teachers where lesson_id=$1
        ) select id,name from teachers 
        join teachers_from on teachers.id=teachers_from.teacher_id;`,
        [lessonId]
      )
    ).rows;
    return teachers;
  }
}

export default new lessonsService();
