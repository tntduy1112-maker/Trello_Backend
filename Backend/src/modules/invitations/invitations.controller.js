const service = require('./invitations.service');
const { success } = require('../../utils/response');

const previewInvitation = async (req, res, next) => {
  try {
    const invitation = await service.previewInvitation(req.params.token);
    return success(res, { invitation });
  } catch (err) {
    next(err);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const result = await service.acceptInvitation(req.user.userId, req.params.token);
    return success(res, result, 'Đã tham gia board thành công');
  } catch (err) {
    next(err);
  }
};

module.exports = { previewInvitation, acceptInvitation };
