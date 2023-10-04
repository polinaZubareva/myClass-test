import express from 'express';
// import cookieParser from 'cookie-parser';
import * as path from 'path';
import { execute } from '@getvim/execute';
import * as cron from 'node-cron';
import { envDB } from './constants.js';
import router from './public/routes/index.js';

const app = express();
const __dirname = path.resolve();
const ENVCONST = envDB;

app.use(express.json());
app.use(
  express.urlencoded({ extended: true })
);
// app.use(cookieParser());
app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);

app.use('/', router);

// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error =
    req.app.get('env') === 'development'
      ? err
      : {};

  res.status(err.status || 400);
  res.render('error');
});

function restore() {
  execute(
    `PGPASSWORD=${ENVCONST.DBPASSWORD} psql -U postgres -d ${ENVCONST.DBNAME} < test-restore.psql`
  )
    .then(async () => {
      console.log('DB is ready');
    })
    .catch((err) => {
      console.log('error', err);
    });
}
restore();

function backup() {
  execute(
    `PGPASSWORD="${ENVCONST.DBPASSWORD}" pg_dump -U ${ENVCONST.DBUSER} -d ${ENVCONST.DBNAME} -f test-backup.psql`
  )
    .then(async () => {
      console.log('Backup is done');
    })
    .catch((err) => {
      console.log('error', err);
    });
}
cron.schedule('* * * * *', () => {
  console.log('Got backup');
  backup();
});

app.listen(5000, () => {
  console.log(
    `Server listening on PORT=5000`
  );
});
