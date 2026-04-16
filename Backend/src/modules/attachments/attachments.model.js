const { query } = require('../../configs/postgres');

const findByCardId = async (cardId) => {
  const result = await query(
    `SELECT a.*, u.full_name AS uploader_name, u.avatar_url AS uploader_avatar
     FROM attachments a
     LEFT JOIN users u ON u.id = a.uploaded_by
     WHERE a.card_id = $1
     ORDER BY a.created_at DESC`,
    [cardId]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await query(`SELECT * FROM attachments WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const createAttachment = async ({ cardId, uploadedBy, fileName, fileUrl, objectName, fileType, fileSize }) => {
  const result = await query(
    `INSERT INTO attachments (card_id, uploaded_by, file_name, file_url, object_name, file_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [cardId, uploadedBy, fileName, fileUrl, objectName, fileType, fileSize]
  );
  return result.rows[0];
};

const deleteAttachment = async (id) => {
  await query(`DELETE FROM attachments WHERE id = $1`, [id]);
};

const setCover = async (cardId, attachmentId) => {
  await query(`UPDATE attachments SET is_cover = false WHERE card_id = $1`, [cardId]);
  const result = await query(
    `UPDATE attachments SET is_cover = true WHERE id = $1 RETURNING *`,
    [attachmentId]
  );
  return result.rows[0];
};

const unsetCover = async (cardId) => {
  await query(`UPDATE attachments SET is_cover = false WHERE card_id = $1`, [cardId]);
};

module.exports = { findByCardId, findById, createAttachment, deleteAttachment, setCover, unsetCover };
