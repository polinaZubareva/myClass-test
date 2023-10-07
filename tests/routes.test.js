import request from 'supertest';
import app from '../app.js';

const postData = [
  {
    teacherIds: [3, 4],
    title: 'New',
    days: [0, 3],
    firstDate: '2022-01-02',
    lessonsCount: 3,
  },
  {
    teacherIds: [2],
    title: 'New',
    days: [1, 3, 6],
    firstDate: '2022-01-26',
    lastDate: '2022-02-03',
  },
  {
    title: 'New',
    days: [2, 4],
    firstDate: '2022-01-25',
    lastDate: '2022-02-01',
  },
];
const getData = [
  {
    date: '2019-09-01,2019-10-01',
    status: '1',
    teacherIds: '2,3',
    studentsCount: '4,5,6',
    page: '1',
    lessonsPerPage: '5',
  },
  {
    date: '2019-09-01,2019-10-01',
    status: '1',
    teacherIds: '2,3',
    studentsCount: '4,5,6',
  },
  {},
];

describe('POST /lessons', () => {
  it('should create a new lessons with count', async () => {
    const res = await request(app).post('/lessons').send(postData[0]);
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
    expect(res.body).toEqual(expect.any(Object));
    expect(res.body).toHaveProperty('lessonsIds');
  });

  it('should create a new lessons with lastDate', async () => {
    const res = await request(app).post('/lessons').send(postData[1]);
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
    expect(res.body).toEqual(expect.any(Object));
    expect(res.body).toHaveProperty('[lessonsIds]');
  });

  it('should return  error object with 400 status', async () => {
    const res = await request(app).post('/lessons').send(postData[2]);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('[error]');
  });
});

describe('GET /', () => {
  it('should return info about lessons by parameters (first/last dates)', async () => {
    const res = await request(app).get('/').send(getData[0]);
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
    expect(res.type).toEqual('application/json');
    expect(res.body).toEqual(expect.any(Object));
  });

  it('should return info about lessons by parameters without limits', async () => {
    const res = await request(app).get('/').send(getData[1]);
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
    expect(res.type).toEqual('application/json');
    expect(res.body).toEqual(expect.any(Object));
  });

  it('should return 200 and empty array', async () => {
    const res = await request(app).get('/').send(getData[2]);
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
    expect(res.type).toEqual('application/json');
    expect(res.body).toEqual(expect.any(Array));
  });
});
