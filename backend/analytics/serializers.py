from rest_framework import serializers


class StudentCourseProgressSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    instructor_name = serializers.CharField(allow_blank=True)
    enrolled_at = serializers.DateTimeField()
    status = serializers.CharField()
    total_lessons = serializers.IntegerField()
    completed_lessons = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    is_completed = serializers.BooleanField()
    total_quizzes = serializers.IntegerField()
    quizzes_passed = serializers.IntegerField()
    average_quiz_score = serializers.FloatField()


class RecentActivitySerializer(serializers.Serializer):
    lesson_id = serializers.UUIDField()
    lesson_title = serializers.CharField()
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    last_position_seconds = serializers.IntegerField()
    completed = serializers.BooleanField()
    updated_at = serializers.DateTimeField()


class RecentQuizAttemptSerializer(serializers.Serializer):
    attempt_id = serializers.UUIDField()
    quiz_id = serializers.UUIDField()
    quiz_title = serializers.CharField()
    course_title = serializers.CharField()
    score = serializers.FloatField()
    marks_obtained = serializers.FloatField()
    total_marks_possible = serializers.IntegerField()
    percentage = serializers.FloatField()
    passed = serializers.BooleanField()
    submitted_at = serializers.DateTimeField()


class StudentAnalyticsSerializer(serializers.Serializer):
    total_enrolled_courses = serializers.IntegerField()
    active_courses = serializers.IntegerField()
    completed_courses = serializers.IntegerField()
    in_progress_courses = serializers.IntegerField()
    total_lessons_completed = serializers.IntegerField()
    total_lessons_count = serializers.IntegerField()
    overall_completion_rate = serializers.FloatField()
    course_completion_rate = serializers.FloatField()
    completion_rate = serializers.FloatField()
    total_quizzes_taken = serializers.IntegerField()
    total_quiz_attempts = serializers.IntegerField()
    quizzes_passed = serializers.IntegerField()
    average_assessment_score = serializers.FloatField()
    average_quiz_score = serializers.FloatField()
    highest_quiz_score = serializers.FloatField()
    courses = StudentCourseProgressSerializer(many=True)
    courses_progress = StudentCourseProgressSerializer(many=True)
    recent_activity = RecentActivitySerializer(many=True)
    recent_quiz_attempts = RecentQuizAttemptSerializer(many=True)


class StudentCourseStatsSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    student_email = serializers.EmailField()
    enrolled_at = serializers.DateTimeField()
    status = serializers.CharField()
    completed_lessons_count = serializers.IntegerField()
    total_lessons_count = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    is_completed = serializers.BooleanField()
    quiz_attempts_count = serializers.IntegerField()
    average_quiz_score = serializers.FloatField()
    quizzes_passed_count = serializers.IntegerField()
    last_active = serializers.DateTimeField(allow_null=True)


class LessonAnalyticsSerializer(serializers.Serializer):
    lesson_id = serializers.UUIDField()
    title = serializers.CharField()
    module_id = serializers.UUIDField()
    module_title = serializers.CharField()
    order = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    completion_rate = serializers.FloatField()


class QuizAnalyticsSerializer(serializers.Serializer):
    quiz_id = serializers.UUIDField()
    title = serializers.CharField()
    status = serializers.CharField()
    pass_percentage = serializers.IntegerField()
    total_attempts = serializers.IntegerField()
    unique_students_attempted = serializers.IntegerField()
    average_score = serializers.FloatField()
    pass_rate = serializers.FloatField()
    highest_score = serializers.FloatField()


class CourseAnalyticsSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    category = serializers.CharField(allow_blank=True)
    difficulty = serializers.CharField()
    status = serializers.CharField()
    is_published = serializers.BooleanField()
    instructor_id = serializers.UUIDField()
    instructor_name = serializers.CharField(allow_blank=True)
    total_enrollments = serializers.IntegerField()
    active_enrollments = serializers.IntegerField()
    completed_enrollments = serializers.IntegerField()
    dropped_enrollments = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    average_course_progress = serializers.FloatField()
    total_modules = serializers.IntegerField()
    total_lessons = serializers.IntegerField()
    total_quizzes = serializers.IntegerField()
    total_quiz_attempts = serializers.IntegerField()
    average_quiz_score = serializers.FloatField()
    quiz_pass_rate = serializers.FloatField()
    lessons_breakdown = LessonAnalyticsSerializer(many=True)
    quizzes_breakdown = QuizAnalyticsSerializer(many=True)
    students = StudentCourseStatsSerializer(many=True)
    enrolled_students = StudentCourseStatsSerializer(many=True)


class AdminAnalyticsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    total_quizzes = serializers.IntegerField()
    total_quiz_attempts = serializers.IntegerField()
    average_quiz_score = serializers.FloatField()
    users = serializers.DictField()
    courses = serializers.DictField()
    enrollments = serializers.DictField()
    progress = serializers.DictField()
    assessments = serializers.DictField()


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    student_email = serializers.EmailField(allow_null=True)
    best_score = serializers.FloatField()
    score = serializers.FloatField()
    highest_percentage = serializers.FloatField()
    percentage = serializers.FloatField()
    total_attempts = serializers.IntegerField()
    passed = serializers.BooleanField()
    submitted_at = serializers.DateTimeField()


class QuizLeaderboardSerializer(serializers.Serializer):
    quiz_id = serializers.UUIDField()
    quiz_title = serializers.CharField()
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    pass_percentage = serializers.IntegerField()
    total_participants = serializers.IntegerField()
    leaderboard = LeaderboardEntrySerializer(many=True)
    results = LeaderboardEntrySerializer(many=True)
    my_entry = LeaderboardEntrySerializer(allow_null=True)
