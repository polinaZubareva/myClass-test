import lessonsService from '../services/lessons.service.js';

class lessonsController {
  async create(req, res) {
    const addedData = req.body;
    const result =
      await lessonsService.createLessons(
        addedData
      );
    console.log(result);
    res.send(result);
  }

  async read(req, res) {
    lessonsService.getLessons();
    return res.send('halo');
  }
}

export default new lessonsController();
