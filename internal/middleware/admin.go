package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/codewebkhongkho/trello-agent/internal/dto/response"
	"github.com/codewebkhongkho/trello-agent/pkg/apperror"
)

func AdminOnly() gin.HandlerFunc {
	rawEmails := os.Getenv("ADMIN_EMAILS")
	if rawEmails == "" {
		rawEmails = "tntduy1112@gmail.com,test@trello-dev.local"
	}
	adminSet := map[string]struct{}{}
	for _, e := range strings.Split(rawEmails, ",") {
		adminSet[strings.TrimSpace(strings.ToLower(e))] = struct{}{}
	}

	return func(c *gin.Context) {
		email := strings.ToLower(GetUserEmail(c))
		if email == "" {
			response.ErrorResponse(c, apperror.ErrUnauthorized)
			c.Abort()
			return
		}
		if _, ok := adminSet[email]; !ok {
			response.ErrorResponse(c, apperror.ErrForbidden)
			c.Abort()
			return
		}
		c.Next()
	}
}
