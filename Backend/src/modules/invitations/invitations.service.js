const boardModel = require('../boards/boards.model');

const previewInvitation = async (token) => {
  const inv = await boardModel.findInvitationByToken(token);
  if (!inv) {
    const e = new Error('Lời mời không tồn tại hoặc đã hết hạn');
    e.statusCode = 404;
    throw e;
  }
  if (inv.accepted_at) {
    const e = new Error('Lời mời đã được chấp nhận');
    e.statusCode = 410;
    throw e;
  }
  if (new Date(inv.expires_at) < new Date()) {
    const e = new Error('Lời mời đã hết hạn');
    e.statusCode = 410;
    throw e;
  }

  return {
    boardId:     inv.board_id,
    boardName:   inv.board_name,
    inviterName: inv.inviter_name,
    role:        inv.role,
    email:       inv.email,
  };
};

const acceptInvitation = async (userId, token) => {
  const inv = await boardModel.findInvitationByToken(token);
  if (!inv) {
    const e = new Error('Lời mời không tồn tại');
    e.statusCode = 404;
    throw e;
  }
  if (inv.accepted_at) {
    const e = new Error('Lời mời đã được chấp nhận');
    e.statusCode = 410;
    throw e;
  }
  if (new Date(inv.expires_at) < new Date()) {
    const e = new Error('Lời mời đã hết hạn');
    e.statusCode = 410;
    throw e;
  }

  // Verify the logged-in user's email matches the invitation
  const user = await boardModel.findUserById(userId);
  if (!user || user.email.toLowerCase() !== inv.email.toLowerCase()) {
    const e = new Error('Email tài khoản không khớp với lời mời này');
    e.statusCode = 403;
    throw e;
  }

  // Add to board if not already a member
  const existing = await boardModel.getMember(inv.board_id, userId);
  if (!existing) {
    await boardModel.addMember(inv.board_id, userId, inv.role, inv.invited_by);
  }

  await boardModel.markInvitationAccepted(inv.id);

  return { boardId: inv.board_id, boardName: inv.board_name };
};

module.exports = { previewInvitation, acceptInvitation };
