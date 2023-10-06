import lessonsService from '../services/lessons.service.js';

class lessonsController {
  async create(req, res) {
    const addedData = req.body;
    const result =
      await lessonsService.createLessons(
        addedData
      );
    res.send(result);
  }

  async read(req, res) {
    const lessons =
      await lessonsService.getLessons(
        req.body
      );
    res.send(lessons);
  }
}

export default new lessonsController();
