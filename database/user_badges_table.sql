-- Create user_badges table for storing user badges awarded by admin
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    badge_color TEXT DEFAULT '#3B82F6',
    awarded_by TEXT NOT NULL, -- admin user id
    awarded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performance_reason TEXT, -- why this badge was awarded
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_awarded_date ON user_badges(awarded_date DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Admin can manage all badges
CREATE POLICY "Admin can manage all badges" ON user_badges
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin'
        OR current_setting('request.jwt.claims', true)::json->>'email' = 'admin@system'
    );

-- Insert default badge types
INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, badge_color, awarded_by, performance_reason) VALUES
('system', 'excellence', 'Excellence Award', 'Outstanding performance in learner engagement', '🌟', '#FFD700', 'system', 'System default badge type'),
('system', 'top_performer', 'Top Performer', 'Consistently high performance and dedication', '🏆', '#FF6B35', 'system', 'System default badge type'),
('system', 'mentor', 'Mentor Badge', 'Exceptional guidance and support to learners', '👨‍🏫', '#8B5CF6', 'system', 'System default badge type'),
('system', 'innovator', 'Innovator', 'Creative solutions and innovative approaches', '💡', '#10B981', 'system', 'System default badge type'),
('system', 'team_player', 'Team Player', 'Great collaboration and team spirit', '🤝', '#3B82F6', 'system', 'System default badge type'),
('system', 'dedication', 'Dedication Award', 'Unwavering commitment and hard work', '💪', '#EF4444', 'system', 'System default badge type'),
('system', 'rising_star', 'Rising Star', 'Showing great potential and improvement', '⭐', '#F59E0B', 'system', 'System default badge type'),
('system', 'communication', 'Communication Expert', 'Excellent communication with learners', '📢', '#06B6D4', 'system', 'System default badge type')
ON CONFLICT DO NOTHING;
