import express from 'express';
import cookieParser from 'cookie-parser';
import indexRouter from './routes/index.js';
import * as path from 'path';
import { execute } from '@getvim/execute';

const app = express();
const __dirname = path.resolve();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.listen(5000, () => {
  console.log(`Server listening on PORT=5000`);
});
