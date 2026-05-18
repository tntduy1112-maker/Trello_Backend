package domain

import (
	"encoding/json"
	"time"
)

type ContentItem struct {
	ID        string          `json:"id"`
	Type      string          `json:"type"`
	Slug      string          `json:"slug"`
	Data      json.RawMessage `json:"data"`
	Published bool            `json:"published"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

type SurveySubmission struct {
	ID        string          `json:"id"`
	Email     string          `json:"email"`
	Name      string          `json:"name"`
	Role      string          `json:"role"`
	Answers   json.RawMessage `json:"answers"`
	IPAddress string          `json:"ip_address"`
	CreatedAt time.Time       `json:"created_at"`
}
