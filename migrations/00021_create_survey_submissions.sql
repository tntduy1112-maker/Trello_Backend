-- +goose Up
CREATE TABLE survey_submissions (
    id          VARCHAR(30)  PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    name        VARCHAR(255),
    role        VARCHAR(100),
    answers     JSONB        NOT NULL DEFAULT '{}',
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_survey_submissions_email    ON survey_submissions (email);
CREATE INDEX idx_survey_submissions_created  ON survey_submissions (created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS survey_submissions;
