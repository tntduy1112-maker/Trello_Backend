const service = require('./checklists.service');
const { success } = require('../../utils/response');

// ── Checklists ────────────────────────────────────────────────────────────────

const getChecklists = async (req, res, next) => {
  try {
    const checklists = await service.getChecklists(req.user.userId, req.params.cardId);
    return success(res, { checklists });
  } catch (err) { next(err); }
};

const createChecklist = async (req, res, next) => {
  try {
    const checklist = await service.createChecklist(req.user.userId, req.params.cardId, req.body);
    return success(res, { checklist }, 'Checklist created', 201);
  } catch (err) { next(err); }
};

const updateChecklist = async (req, res, next) => {
  try {
    const checklist = await service.updateChecklist(req.user.userId, req.params.checklistId, req.body);
    return success(res, { checklist }, 'Checklist updated');
  } catch (err) { next(err); }
};

const deleteChecklist = async (req, res, next) => {
  try {
    await service.deleteChecklist(req.user.userId, req.params.checklistId);
    return success(res, null, 'Checklist deleted');
  } catch (err) { next(err); }
};

// ── Checklist Items ───────────────────────────────────────────────────────────

const addItem = async (req, res, next) => {
  try {
    const item = await service.addItem(req.user.userId, req.params.checklistId, req.body);
    return success(res, { item }, 'Item added', 201);
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await service.updateItem(req.user.userId, req.params.itemId, req.body);
    return success(res, { item }, 'Item updated');
  } catch (err) { next(err); }
};

const deleteItem = async (req, res, next) => {
  try {
    await service.deleteItem(req.user.userId, req.params.itemId);
    return success(res, null, 'Item deleted');
  } catch (err) { next(err); }
};

module.exports = { getChecklists, createChecklist, updateChecklist, deleteChecklist, addItem, updateItem, deleteItem };
