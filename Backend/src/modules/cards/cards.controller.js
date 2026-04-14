const service = require('./cards.service');
const { success } = require('../../utils/response');

const getCards = async (req, res, next) => {
  try {
    const cards = await service.getCards(req.user.userId, req.params.listId);
    return success(res, { cards });
  } catch (err) { next(err); }
};

const getCard = async (req, res, next) => {
  try {
    const card = await service.getCard(req.user.userId, req.params.cardId);
    return success(res, { card });
  } catch (err) { next(err); }
};

const createCard = async (req, res, next) => {
  try {
    const card = await service.createCard(req.user.userId, req.params.listId, req.body);
    return success(res, { card }, 'Card created', 201);
  } catch (err) { next(err); }
};

const updateCard = async (req, res, next) => {
  try {
    const card = await service.updateCard(req.user.userId, req.params.cardId, req.body);
    return success(res, { card }, 'Card updated');
  } catch (err) { next(err); }
};

const deleteCard = async (req, res, next) => {
  try {
    await service.deleteCard(req.user.userId, req.params.cardId);
    return success(res, null, 'Card deleted');
  } catch (err) { next(err); }
};

module.exports = { getCards, getCard, createCard, updateCard, deleteCard };
