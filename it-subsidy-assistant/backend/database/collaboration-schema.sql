-- Collaboration History Table
CREATE TABLE IF NOT EXISTS collaboration_history (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    subsidy_id INTEGER REFERENCES subsidies(id),
    changes JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_id (room_id),
    INDEX idx_subsidy_id (subsidy_id)
);

-- Collaboration Activities Table
CREATE TABLE IF NOT EXISTS collaboration_activities (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_activities (room_id, created_at DESC),
    INDEX idx_user_activities (user_id, created_at DESC)
);

-- Whiteboard Data Table
CREATE TABLE IF NOT EXISTS whiteboard_data (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    subsidy_id INTEGER REFERENCES subsidies(id),
    data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_room_whiteboard (room_id)
);

-- Annotations Table
CREATE TABLE IF NOT EXISTS annotations (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    subsidy_id INTEGER REFERENCES subsidies(id),
    user_id VARCHAR(255) NOT NULL,
    element_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    position JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_annotations (room_id),
    INDEX idx_element_annotations (element_id)
);

-- Collaboration Sessions Table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    subsidy_id INTEGER REFERENCES subsidies(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    participants JSONB NOT NULL DEFAULT '[]',
    INDEX idx_active_sessions (room_id, ended_at)
);