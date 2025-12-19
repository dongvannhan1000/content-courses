-- Recalculate course duration from sum of published lessons
-- Run this migration to fix existing course durations

UPDATE courses
SET duration = COALESCE((
    SELECT SUM(duration)
    FROM lessons
    WHERE lessons.course_id = courses.id
    AND lessons.is_published = true
), 0);

-- Verify the update
SELECT 
    c.id,
    c.title,
    c.duration as course_duration,
    COALESCE(SUM(l.duration), 0) as calculated_duration,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id AND l.is_published = true
GROUP BY c.id, c.title, c.duration
ORDER BY c.id;
