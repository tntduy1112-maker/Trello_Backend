package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/codewebkhongkho/trello-agent/internal/domain"
	"github.com/codewebkhongkho/trello-agent/internal/dto/response"
	"github.com/codewebkhongkho/trello-agent/internal/middleware"
	"github.com/codewebkhongkho/trello-agent/internal/repository"
	"github.com/codewebkhongkho/trello-agent/pkg/apperror"
)

type AdminHandler struct {
	adminRepo   repository.AdminRepository
	contentRepo repository.ContentRepository
	surveyRepo  repository.SurveyRepository
}

func NewAdminHandler(adminRepo repository.AdminRepository, contentRepo repository.ContentRepository, surveyRepo repository.SurveyRepository) *AdminHandler {
	return &AdminHandler{adminRepo: adminRepo, contentRepo: contentRepo, surveyRepo: surveyRepo}
}

// GET /api/v1/admin/users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	search := c.Query("search")
	limit, offset := paginate(c)

	users, total, err := h.adminRepo.ListUsers(c.Request.Context(), search, limit, offset)
	if err != nil {
		_ = c.Error(err)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	response.SuccessPaginated(c, http.StatusOK, users, page, limit, total)
}

// GET /api/v1/admin/workspaces
func (h *AdminHandler) ListWorkspaces(c *gin.Context) {
	limit, offset := paginate(c)

	orgs, total, err := h.adminRepo.ListWorkspaces(c.Request.Context(), limit, offset)
	if err != nil {
		_ = c.Error(err)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	response.SuccessPaginated(c, http.StatusOK, orgs, page, limit, total)
}

// GET /api/v1/admin/submissions
func (h *AdminHandler) ListSubmissions(c *gin.Context) {
	limit, offset := paginate(c)

	subs, total, err := h.surveyRepo.List(c.Request.Context(), limit, offset)
	if err != nil {
		_ = c.Error(err)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	response.SuccessPaginated(c, http.StatusOK, subs, page, limit, total)
}

// POST /api/v1/survey — public endpoint (no auth required)
func (h *AdminHandler) SubmitSurvey(c *gin.Context) {
	var body struct {
		Email   string          `json:"email" binding:"required,email"`
		Name    string          `json:"name"`
		Role    string          `json:"role"`
		Answers json.RawMessage `json:"answers"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		_ = c.Error(err)
		return
	}

	answers := body.Answers
	if len(answers) == 0 {
		answers = json.RawMessage(`{}`)
	}

	sub := &domain.SurveySubmission{
		Email:     body.Email,
		Name:      body.Name,
		Role:      body.Role,
		Answers:   answers,
		IPAddress: c.ClientIP(),
	}
	if err := h.surveyRepo.Create(c.Request.Context(), sub); err != nil {
		_ = c.Error(err)
		return
	}
	response.Success(c, http.StatusCreated, gin.H{"id": sub.ID})
}

// GET /api/v1/content/:type — public
func (h *AdminHandler) GetContent(c *gin.Context) {
	contentType := c.Param("type")
	slug := c.DefaultQuery("slug", "main")

	item, err := h.contentRepo.FindByTypeAndSlug(c.Request.Context(), contentType, slug)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.ErrorResponse(c, apperror.ErrNotFound)
			return
		}
		_ = c.Error(err)
		return
	}
	response.Success(c, http.StatusOK, item)
}

// GET /api/v1/content/:type/list — public
func (h *AdminHandler) ListContent(c *gin.Context) {
	contentType := c.Param("type")
	items, err := h.contentRepo.ListByType(c.Request.Context(), contentType)
	if err != nil {
		_ = c.Error(err)
		return
	}
	response.Success(c, http.StatusOK, items)
}

// PUT /api/v1/admin/content/:type — admin only
func (h *AdminHandler) UpsertContent(c *gin.Context) {
	contentType := c.Param("type")
	var body struct {
		Slug      string          `json:"slug" binding:"required"`
		Data      json.RawMessage `json:"data" binding:"required"`
		Published *bool           `json:"published"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		_ = c.Error(err)
		return
	}

	published := true
	if body.Published != nil {
		published = *body.Published
	}

	item := &domain.ContentItem{
		Type:      contentType,
		Slug:      body.Slug,
		Data:      body.Data,
		Published: published,
	}
	saved, err := h.contentRepo.Upsert(c.Request.Context(), item)
	if err != nil {
		_ = c.Error(err)
		return
	}
	response.Success(c, http.StatusOK, saved)
}

// GET /api/v1/admin/me — returns caller's admin status (used by frontend)
func (h *AdminHandler) Me(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"email":    middleware.GetUserEmail(c),
		"is_admin": true,
	})
}

func paginate(c *gin.Context) (limit, offset int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset = (page - 1) * limit
	return
}
