const service = require('./activityLogs.service');
const { success } = require('../../utils/response');

const getBoardActivity = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const logs = await service.getBoardActivity(req.user.userId, req.params.boardId, limit, offset);
    return success(res, { logs });
  } catch (err) { next(err); }
};

const getCardActivity = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const logs = await service.getCardActivity(req.user.userId, req.params.cardId, limit, offset);
    return success(res, { logs });
  } catch (err) { next(err); }
};

module.exports = { getBoardActivity, getCardActivity };
