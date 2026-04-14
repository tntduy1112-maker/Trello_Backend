const service = require('./lists.service');
const { success } = require('../../utils/response');

const getLists = async (req, res, next) => {
  try {
    const lists = await service.getLists(req.user.userId, req.params.boardId);
    return success(res, { lists });
  } catch (err) { next(err); }
};

const createList = async (req, res, next) => {
  try {
    const list = await service.createList(req.user.userId, req.params.boardId, req.body);
    return success(res, { list }, 'List created', 201);
  } catch (err) { next(err); }
};

const updateList = async (req, res, next) => {
  try {
    const list = await service.updateList(req.user.userId, req.params.listId, req.body);
    return success(res, { list }, 'List updated');
  } catch (err) { next(err); }
};

const deleteList = async (req, res, next) => {
  try {
    await service.deleteList(req.user.userId, req.params.listId);
    return success(res, null, 'List deleted');
  } catch (err) { next(err); }
};

module.exports = { getLists, createList, updateList, deleteList };
