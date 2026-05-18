-- +goose Up
CREATE TABLE content_items (
    id          VARCHAR(30) PRIMARY KEY,
    type        VARCHAR(50)  NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    data        JSONB        NOT NULL DEFAULT '{}',
    published   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_type_slug UNIQUE (type, slug)
);

CREATE INDEX idx_content_items_type ON content_items (type);

-- Seed default hero content
INSERT INTO content_items (id, type, slug, data) VALUES (
    'content_hero_001',
    'hero',
    'main',
    '{
        "headline": "Build faster, ship together",
        "subheadline": "Productcon Lab is the all-in-one workspace for product teams — Kanban boards, AI tools, and real collaboration.",
        "cta_primary": {"label": "Get started free", "href": "/register"},
        "cta_secondary": {"label": "See how it works", "href": "#how-it-works"}
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS content_items;
