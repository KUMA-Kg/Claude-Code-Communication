-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
    id VARCHAR(255) PRIMARY KEY,
    subsidy_id INTEGER REFERENCES subsidies(id),
    version INTEGER NOT NULL,
    content JSONB NOT NULL,
    changes JSONB NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subsidy_versions (subsidy_id, version DESC),
    UNIQUE KEY unique_subsidy_version (subsidy_id, version)
);

-- Document Conflicts Table
CREATE TABLE IF NOT EXISTS document_conflicts (
    id VARCHAR(255) PRIMARY KEY,
    subsidy_id INTEGER REFERENCES subsidies(id),
    base_version INTEGER NOT NULL,
    conflicting_changes JSONB NOT NULL,
    resolution JSONB,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subsidy_conflicts (subsidy_id, created_at DESC),
    INDEX idx_unresolved_conflicts (subsidy_id, resolved_at)
);

-- Version Diffs Table (for efficient storage)
CREATE TABLE IF NOT EXISTS version_diffs (
    id SERIAL PRIMARY KEY,
    subsidy_id INTEGER REFERENCES subsidies(id),
    from_version INTEGER NOT NULL,
    to_version INTEGER NOT NULL,
    diff JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_version_diffs (subsidy_id, from_version, to_version)
);

-- Merge History Table
CREATE TABLE IF NOT EXISTS merge_history (
    id VARCHAR(255) PRIMARY KEY,
    subsidy_id INTEGER REFERENCES subsidies(id),
    base_version INTEGER NOT NULL,
    source_versions INTEGER[] NOT NULL,
    merged_version INTEGER NOT NULL,
    merge_strategy VARCHAR(50) NOT NULL,
    merged_by VARCHAR(255) NOT NULL,
    merge_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_merge_history (subsidy_id, created_at DESC)
);