import lessonsService from '../services/lessons.service.js';

class lessonsController {
  async create(req, res) {
    const addedData = req.body;
    const result = await lessonsService.createLessons(addedData);
    if (result?.responseStatus == 400) {
      res.status(400).send(result);
    } else res.send(result);
  }

  async read(req, res) {
    const lessons = await lessonsService.getLessons(req.query);
    if (lessons?.responseStatus == 400) {
      res.status(400).send(lessons);
    } else res.send(lessons);
  }
}

export default new lessonsController();
