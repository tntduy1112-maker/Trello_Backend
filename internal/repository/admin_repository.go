package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/codewebkhongkho/trello-agent/internal/domain"
	"github.com/codewebkhongkho/trello-agent/pkg/cuid"
)

// ---- Content ----

type ContentRepository interface {
	FindByTypeAndSlug(ctx context.Context, contentType, slug string) (*domain.ContentItem, error)
	ListByType(ctx context.Context, contentType string) ([]*domain.ContentItem, error)
	Upsert(ctx context.Context, item *domain.ContentItem) (*domain.ContentItem, error)
}

type contentRepository struct {
	db *pgxpool.Pool
}

func NewContentRepository(db *pgxpool.Pool) ContentRepository {
	return &contentRepository{db: db}
}

func (r *contentRepository) FindByTypeAndSlug(ctx context.Context, contentType, slug string) (*domain.ContentItem, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, type, slug, data, published, created_at, updated_at
		 FROM content_items WHERE type=$1 AND slug=$2 AND published=true`,
		contentType, slug,
	)
	return scanContentItem(row)
}

func (r *contentRepository) ListByType(ctx context.Context, contentType string) ([]*domain.ContentItem, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, type, slug, data, published, created_at, updated_at
		 FROM content_items WHERE type=$1 ORDER BY slug`,
		contentType,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*domain.ContentItem
	for rows.Next() {
		item, err := scanContentItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *contentRepository) Upsert(ctx context.Context, item *domain.ContentItem) (*domain.ContentItem, error) {
	if item.ID == "" {
		item.ID = cuid.New()
	}
	now := time.Now()
	item.UpdatedAt = now

	row := r.db.QueryRow(ctx,
		`INSERT INTO content_items (id, type, slug, data, published, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (type, slug) DO UPDATE
		   SET data=EXCLUDED.data, published=EXCLUDED.published, updated_at=EXCLUDED.updated_at
		 RETURNING id, type, slug, data, published, created_at, updated_at`,
		item.ID, item.Type, item.Slug, item.Data, item.Published, now, now,
	)
	return scanContentItem(row)
}

type contentRow interface {
	Scan(dest ...any) error
}

func scanContentItem(row contentRow) (*domain.ContentItem, error) {
	var item domain.ContentItem
	var rawData []byte
	err := row.Scan(
		&item.ID, &item.Type, &item.Slug, &rawData,
		&item.Published, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	item.Data = json.RawMessage(rawData)
	return &item, nil
}

// ---- Survey submissions ----

type SurveyRepository interface {
	Create(ctx context.Context, sub *domain.SurveySubmission) error
	List(ctx context.Context, limit, offset int) ([]*domain.SurveySubmission, int, error)
}

type surveyRepository struct {
	db *pgxpool.Pool
}

func NewSurveyRepository(db *pgxpool.Pool) SurveyRepository {
	return &surveyRepository{db: db}
}

func (r *surveyRepository) Create(ctx context.Context, sub *domain.SurveySubmission) error {
	if sub.ID == "" {
		sub.ID = cuid.New()
	}
	sub.CreatedAt = time.Now()
	_, err := r.db.Exec(ctx,
		`INSERT INTO survey_submissions (id, email, name, role, answers, ip_address, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		sub.ID, sub.Email, sub.Name, sub.Role, sub.Answers, sub.IPAddress, sub.CreatedAt,
	)
	return err
}

func (r *surveyRepository) List(ctx context.Context, limit, offset int) ([]*domain.SurveySubmission, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM survey_submissions`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(ctx,
		`SELECT id, email, name, role, answers, ip_address, created_at
		 FROM survey_submissions ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var subs []*domain.SurveySubmission
	for rows.Next() {
		var s domain.SurveySubmission
		var rawAnswers []byte
		if err := rows.Scan(&s.ID, &s.Email, &s.Name, &s.Role, &rawAnswers, &s.IPAddress, &s.CreatedAt); err != nil {
			return nil, 0, err
		}
		s.Answers = json.RawMessage(rawAnswers)
		subs = append(subs, &s)
	}
	return subs, total, rows.Err()
}

// ---- Admin read-only queries ----

type AdminRepository interface {
	ListUsers(ctx context.Context, search string, limit, offset int) ([]*AdminUserRow, int, error)
	ListWorkspaces(ctx context.Context, limit, offset int) ([]*AdminWorkspaceRow, int, error)
}

type AdminUserRow struct {
	ID         string     `json:"id"`
	Email      string     `json:"email"`
	FullName   string     `json:"full_name"`
	IsVerified bool       `json:"is_verified"`
	IsActive   bool       `json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
	BoardCount int        `json:"board_count"`
	OrgCount   int        `json:"org_count"`
}

type AdminWorkspaceRow struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	OwnerEmail  string    `json:"owner_email"`
	MemberCount int       `json:"member_count"`
	BoardCount  int       `json:"board_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type adminRepository struct {
	db *pgxpool.Pool
}

func NewAdminRepository(db *pgxpool.Pool) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) ListUsers(ctx context.Context, search string, limit, offset int) ([]*AdminUserRow, int, error) {
	countQuery := `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL`
	mainQuery := `
		SELECT u.id, u.email, u.full_name, u.is_verified, u.is_active, u.created_at, u.deleted_at,
		       COUNT(DISTINCT bm.board_id)  AS board_count,
		       COUNT(DISTINCT om.organization_id) AS org_count
		FROM users u
		LEFT JOIN board_members bm  ON bm.user_id = u.id
		LEFT JOIN organization_members om ON om.user_id = u.id
		WHERE u.deleted_at IS NULL`

	args := []any{}
	if search != "" {
		countQuery += ` AND (email ILIKE $1 OR full_name ILIKE $1)`
		mainQuery += ` AND (u.email ILIKE $1 OR u.full_name ILIKE $1)`
		args = append(args, "%"+search+"%")
	}

	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limitOffset := len(args) + 1
	mainQuery += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $` + itoa(limitOffset) + ` OFFSET $` + itoa(limitOffset+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, mainQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*AdminUserRow
	for rows.Next() {
		var u AdminUserRow
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.IsVerified, &u.IsActive, &u.CreatedAt, &u.DeletedAt, &u.BoardCount, &u.OrgCount); err != nil {
			return nil, 0, err
		}
		users = append(users, &u)
	}
	return users, total, rows.Err()
}

func (r *adminRepository) ListWorkspaces(ctx context.Context, limit, offset int) ([]*AdminWorkspaceRow, int, error) {
	var total int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT o.id, o.name, o.slug, u.email AS owner_email,
		       COUNT(DISTINCT om.user_id) AS member_count,
		       COUNT(DISTINCT b.id)       AS board_count,
		       o.created_at
		FROM organizations o
		JOIN users u ON u.id = o.owner_id
		LEFT JOIN organization_members om ON om.organization_id = o.id
		LEFT JOIN boards b ON b.organization_id = o.id AND b.deleted_at IS NULL
		WHERE o.deleted_at IS NULL
		GROUP BY o.id, u.email
		ORDER BY o.created_at DESC
		LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orgs []*AdminWorkspaceRow
	for rows.Next() {
		var w AdminWorkspaceRow
		if err := rows.Scan(&w.ID, &w.Name, &w.Slug, &w.OwnerEmail, &w.MemberCount, &w.BoardCount, &w.CreatedAt); err != nil {
			return nil, 0, err
		}
		orgs = append(orgs, &w)
	}
	return orgs, total, rows.Err()
}

func itoa(n int) string {
	const digits = "0123456789"
	if n < 10 {
		return string(digits[n])
	}
	return itoa(n/10) + string(digits[n%10])
}
