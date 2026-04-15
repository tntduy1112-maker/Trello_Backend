const service = require('./labels.service');
const { success } = require('../../utils/response');

const getBoardLabels = async (req, res, next) => {
  try {
    const labels = await service.getBoardLabels(req.user.userId, req.params.boardId);
    return success(res, { labels });
  } catch (err) { next(err); }
};

const createLabel = async (req, res, next) => {
  try {
    const label = await service.createLabel(req.user.userId, req.params.boardId, req.body);
    return success(res, { label }, 'Label created', 201);
  } catch (err) { next(err); }
};

const updateLabel = async (req, res, next) => {
  try {
    const label = await service.updateLabel(req.user.userId, req.params.labelId, req.body);
    return success(res, { label }, 'Label updated');
  } catch (err) { next(err); }
};

const deleteLabel = async (req, res, next) => {
  try {
    await service.deleteLabel(req.user.userId, req.params.labelId);
    return success(res, null, 'Label deleted');
  } catch (err) { next(err); }
};

const getCardLabels = async (req, res, next) => {
  try {
    const labels = await service.getCardLabels(req.user.userId, req.params.cardId);
    return success(res, { labels });
  } catch (err) { next(err); }
};

const addCardLabel = async (req, res, next) => {
  try {
    const labels = await service.addCardLabel(req.user.userId, req.params.cardId, req.params.labelId);
    return success(res, { labels }, 'Label added');
  } catch (err) { next(err); }
};

const removeCardLabel = async (req, res, next) => {
  try {
    const labels = await service.removeCardLabel(req.user.userId, req.params.cardId, req.params.labelId);
    return success(res, { labels }, 'Label removed');
  } catch (err) { next(err); }
};

module.exports = {
  getBoardLabels, createLabel, updateLabel, deleteLabel,
  getCardLabels, addCardLabel, removeCardLabel,
};
