from decimal import Decimal
from django.db.models import Avg, Count, Max, Min, F, Window
from django.db.models.functions import DenseRank

from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from progress.models import LessonProgress
from assessments.models import Quiz, Question, QuizAttempt


def get_student_analytics(user):
    """
    Computes student progress, completion rates, and average assessment scores
    from persisted PostgreSQL records.
    """
    enrollments = Enrollment.objects.filter(student=user).select_related('course', 'course__instructor')
    total_enrolled_courses = enrollments.count()
    active_courses = enrollments.filter(status='ACTIVE').count()
    completed_courses = enrollments.filter(status='COMPLETED').count()

    enrolled_course_ids = list(enrollments.values_list('course_id', flat=True))
    total_lessons_count = Lesson.objects.filter(module__course_id__in=enrolled_course_ids).count()

    lesson_progresses = LessonProgress.objects.filter(enrollment__in=enrollments)
    total_lessons_completed = lesson_progresses.filter(completed=True).count()

    overall_completion_rate = (
        round((total_lessons_completed / total_lessons_count * 100), 2)
        if total_lessons_count > 0 else 0.0
    )
    course_completion_rate = (
        round((completed_courses / total_enrolled_courses * 100), 2)
        if total_enrolled_courses > 0 else 0.0
    )

    submitted_attempts = QuizAttempt.objects.filter(student=user, status='SUBMITTED')
    total_quiz_attempts = submitted_attempts.count()
    total_quizzes_taken = submitted_attempts.values('quiz_id').distinct().count()
    quizzes_passed = submitted_attempts.filter(passed=True).values('quiz_id').distinct().count()

    avg_data = submitted_attempts.aggregate(
        avg_pct=Avg('percentage'),
        max_pct=Max('percentage'),
        avg_score=Avg('score')
    )
    average_assessment_score = (
        round(float(avg_data['avg_pct']), 2)
        if avg_data['avg_pct'] is not None else 0.0
    )
    highest_quiz_score = (
        round(float(avg_data['max_pct']), 2)
        if avg_data['max_pct'] is not None else 0.0
    )

    # Per-course breakdown
    courses_breakdown = []
    for enrollment in enrollments:
        c = enrollment.course
        c_lessons_count = Lesson.objects.filter(module__course=c).count()
        c_completed = lesson_progresses.filter(enrollment=enrollment, completed=True).count()
        c_prog_pct = (
            round((c_completed / c_lessons_count * 100), 2)
            if c_lessons_count > 0 else 0.0
        )
        c_quizzes = Quiz.objects.filter(course=c, status='PUBLISHED')
        c_attempts = submitted_attempts.filter(quiz__course=c)
        c_passed_count = c_attempts.filter(passed=True).values('quiz_id').distinct().count()
        c_avg = c_attempts.aggregate(avg=Avg('percentage'))['avg']
        c_avg_score = round(float(c_avg), 2) if c_avg is not None else 0.0

        is_completed = (
            enrollment.status == 'COMPLETED' or
            (c_lessons_count > 0 and c_completed >= c_lessons_count)
        )

        instructor = c.instructor
        instructor_name = (
            f"{instructor.first_name} {instructor.last_name}".strip()
            if instructor else ""
        ) or (instructor.email if instructor else "")

        courses_breakdown.append({
            'course_id': c.id,
            'course_title': c.title,
            'instructor_name': instructor_name,
            'enrolled_at': enrollment.enrolled_at,
            'status': enrollment.status,
            'total_lessons': c_lessons_count,
            'completed_lessons': c_completed,
            'progress_percentage': c_prog_pct,
            'is_completed': is_completed,
            'total_quizzes': c_quizzes.count(),
            'quizzes_passed': c_passed_count,
            'average_quiz_score': c_avg_score,
        })

    # Recent activity: latest 10 lesson progress records
    recent_progress = (
        lesson_progresses.select_related('lesson', 'enrollment__course')
        .order_by('-updated_at')[:10]
    )
    recent_activity = [
        {
            'lesson_id': p.lesson_id,
            'lesson_title': p.lesson.title,
            'course_id': p.enrollment.course_id,
            'course_title': p.enrollment.course.title,
            'last_position_seconds': p.last_position_seconds,
            'completed': p.completed,
            'updated_at': p.updated_at,
        }
        for p in recent_progress
    ]

    # Recent quiz attempts: latest 10 submitted attempts
    recent_attempts_qs = (
        submitted_attempts.select_related('quiz__course')
        .order_by('-submitted_at')[:10]
    )
    recent_quiz_attempts = [
        {
            'attempt_id': a.id,
            'quiz_id': a.quiz_id,
            'quiz_title': a.quiz.title,
            'course_title': a.quiz.course.title,
            'score': float(a.score) if a.score is not None else 0.0,
            'marks_obtained': float(a.marks_obtained),
            'total_marks_possible': a.total_marks_possible,
            'percentage': float(a.percentage) if a.percentage is not None else 0.0,
            'passed': bool(a.passed),
            'submitted_at': a.submitted_at,
        }
        for a in recent_attempts_qs
    ]

    return {
        'total_enrolled_courses': total_enrolled_courses,
        'active_courses': active_courses,
        'completed_courses': completed_courses,
        'in_progress_courses': total_enrolled_courses - completed_courses,
        'total_lessons_completed': total_lessons_completed,
        'total_lessons_count': total_lessons_count,
        'overall_completion_rate': overall_completion_rate,
        'course_completion_rate': course_completion_rate,
        'completion_rate': overall_completion_rate,
        'total_quizzes_taken': total_quizzes_taken,
        'total_quiz_attempts': total_quiz_attempts,
        'quizzes_passed': quizzes_passed,
        'average_assessment_score': average_assessment_score,
        'average_quiz_score': average_assessment_score,
        'highest_quiz_score': highest_quiz_score,
        'courses': courses_breakdown,
        'courses_progress': courses_breakdown,
        'recent_activity': recent_activity,
        'recent_quiz_attempts': recent_quiz_attempts,
    }


def get_course_analytics(course):
    """
    Computes course-level and student-level statistics for an instructor's course
    from persisted PostgreSQL records.
    """
    enrollments = Enrollment.objects.filter(course=course).select_related('student')
    total_enrollments = enrollments.count()
    active_enrollments = enrollments.filter(status='ACTIVE').count()
    completed_enrollments = enrollments.filter(status='COMPLETED').count()
    dropped_enrollments = enrollments.filter(status='DROPPED').count()
    completion_rate = (
        round((completed_enrollments / total_enrollments * 100), 2)
        if total_enrollments > 0 else 0.0
    )

    modules_count = Module.objects.filter(course=course).count()
    lessons = Lesson.objects.filter(module__course=course).select_related('module')
    total_lessons = lessons.count()

    progress_records = LessonProgress.objects.filter(enrollment__course=course)
    total_completions = progress_records.filter(completed=True).count()
    expected_completions = total_enrollments * total_lessons
    average_course_progress = (
        round((total_completions / expected_completions * 100), 2)
        if expected_completions > 0 else 0.0
    )

    quizzes = Quiz.objects.filter(course=course)
    total_quizzes = quizzes.count()

    course_attempts = QuizAttempt.objects.filter(quiz__course=course, status='SUBMITTED')
    total_quiz_attempts = course_attempts.count()

    avg_data = course_attempts.aggregate(avg=Avg('percentage'))['avg']
    average_quiz_score = round(float(avg_data), 2) if avg_data is not None else 0.0

    passed_attempts = course_attempts.filter(passed=True).count()
    quiz_pass_rate = (
        round((passed_attempts / total_quiz_attempts * 100), 2)
        if total_quiz_attempts > 0 else 0.0
    )

    # Lessons breakdown
    lessons_breakdown = []
    for l in lessons:
        l_completions = progress_records.filter(lesson=l, completed=True).count()
        l_comp_rate = (
            round((l_completions / total_enrollments * 100), 2)
            if total_enrollments > 0 else 0.0
        )
        lessons_breakdown.append({
            'lesson_id': l.id,
            'title': l.title,
            'module_id': l.module_id,
            'module_title': l.module.title,
            'order': l.order,
            'completed_count': l_completions,
            'completion_rate': l_comp_rate,
        })

    # Quizzes breakdown
    quizzes_breakdown = []
    for q in quizzes:
        q_attempts = course_attempts.filter(quiz=q)
        q_count = q_attempts.count()
        q_unique = q_attempts.values('student_id').distinct().count()
        q_avg = q_attempts.aggregate(avg=Avg('percentage'))['avg']
        q_passed = q_attempts.filter(passed=True).count()
        q_max = q_attempts.aggregate(m=Max('score'))['m']

        quizzes_breakdown.append({
            'quiz_id': q.id,
            'title': q.title,
            'status': q.status,
            'pass_percentage': q.pass_percentage,
            'total_attempts': q_count,
            'unique_students_attempted': q_unique,
            'average_score': round(float(q_avg), 2) if q_avg is not None else 0.0,
            'pass_rate': round((q_passed / q_count * 100), 2) if q_count > 0 else 0.0,
            'highest_score': round(float(q_max), 2) if q_max is not None else 0.0,
        })

    # Student-level statistics
    students_stats = []
    for enrollment in enrollments:
        st = enrollment.student
        st_name = f"{st.first_name} {st.last_name}".strip() or st.email
        st_completed = progress_records.filter(enrollment=enrollment, completed=True).count()
        st_prog_pct = (
            round((st_completed / total_lessons * 100), 2)
            if total_lessons > 0 else 0.0
        )
        st_is_completed = (
            enrollment.status == 'COMPLETED' or
            (total_lessons > 0 and st_completed >= total_lessons)
        )

        st_attempts = course_attempts.filter(student=st)
        st_attempts_count = st_attempts.count()
        st_avg = st_attempts.aggregate(avg=Avg('percentage'))['avg']
        st_avg_score = round(float(st_avg), 2) if st_avg is not None else 0.0
        st_passed_count = st_attempts.filter(passed=True).values('quiz_id').distinct().count()

        latest_p = progress_records.filter(enrollment=enrollment).order_by('-updated_at').first()
        latest_a = st_attempts.order_by('-submitted_at').first()
        last_active = None
        if latest_p and latest_a:
            last_active = max(latest_p.updated_at, latest_a.submitted_at)
        elif latest_p:
            last_active = latest_p.updated_at
        elif latest_a:
            last_active = latest_a.submitted_at

        students_stats.append({
            'student_id': st.id,
            'student_name': st_name,
            'student_email': st.email,
            'enrolled_at': enrollment.enrolled_at,
            'status': enrollment.status,
            'completed_lessons_count': st_completed,
            'total_lessons_count': total_lessons,
            'progress_percentage': st_prog_pct,
            'is_completed': st_is_completed,
            'quiz_attempts_count': st_attempts_count,
            'average_quiz_score': st_avg_score,
            'quizzes_passed_count': st_passed_count,
            'last_active': last_active,
        })

    instructor = course.instructor
    instructor_name = (
        f"{instructor.first_name} {instructor.last_name}".strip()
        if instructor else ""
    ) or (instructor.email if instructor else "")

    return {
        'course_id': course.id,
        'course_title': course.title,
        'category': course.category,
        'difficulty': course.difficulty,
        'status': course.status,
        'is_published': course.is_published,
        'instructor_id': course.instructor_id,
        'instructor_name': instructor_name,
        'total_enrollments': total_enrollments,
        'active_enrollments': active_enrollments,
        'completed_enrollments': completed_enrollments,
        'dropped_enrollments': dropped_enrollments,
        'completion_rate': completion_rate,
        'average_course_progress': average_course_progress,
        'total_modules': modules_count,
        'total_lessons': total_lessons,
        'total_quizzes': total_quizzes,
        'total_quiz_attempts': total_quiz_attempts,
        'average_quiz_score': average_quiz_score,
        'quiz_pass_rate': quiz_pass_rate,
        'lessons_breakdown': lessons_breakdown,
        'quizzes_breakdown': quizzes_breakdown,
        'students': students_stats,
        'enrolled_students': students_stats,
    }


def get_admin_analytics():
    """
    Computes platform-wide statistics from persisted PostgreSQL records
    for administrative monitoring.
    """
    total_users = User.objects.count()
    total_students = User.objects.filter(role='STUDENT').count()
    total_instructors = User.objects.filter(role='INSTRUCTOR').count()
    total_admins = User.objects.filter(role='ADMIN').count()
    active_users = User.objects.filter(is_active=True).count()

    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(status='PUBLISHED').count()
    draft_courses = Course.objects.filter(status='DRAFT').count()
    archived_courses = Course.objects.filter(status='ARCHIVED').count()
    total_modules = Module.objects.count()
    total_lessons = Lesson.objects.count()

    total_enrollments = Enrollment.objects.count()
    active_enrollments = Enrollment.objects.filter(status='ACTIVE').count()
    completed_enrollments = Enrollment.objects.filter(status='COMPLETED').count()
    dropped_enrollments = Enrollment.objects.filter(status='DROPPED').count()
    enrollment_completion_rate = (
        round((completed_enrollments / total_enrollments * 100), 2)
        if total_enrollments > 0 else 0.0
    )

    total_progress_records = LessonProgress.objects.count()
    total_completed_lessons = LessonProgress.objects.filter(completed=True).count()

    total_quizzes = Quiz.objects.count()
    published_quizzes = Quiz.objects.filter(status='PUBLISHED').count()
    total_questions = Question.objects.count()
    total_quiz_attempts = QuizAttempt.objects.count()
    submitted_quiz_attempts = QuizAttempt.objects.filter(status='SUBMITTED').count()
    in_progress_quiz_attempts = QuizAttempt.objects.filter(status='IN_PROGRESS').count()
    expired_quiz_attempts = QuizAttempt.objects.filter(status='EXPIRED').count()
    passed_quiz_attempts = QuizAttempt.objects.filter(status='SUBMITTED', passed=True).count()

    avg_pct = QuizAttempt.objects.filter(status='SUBMITTED').aggregate(a=Avg('percentage'))['a']
    average_quiz_score = round(float(avg_pct), 2) if avg_pct is not None else 0.0
    overall_quiz_pass_rate = (
        round((passed_quiz_attempts / submitted_quiz_attempts * 100), 2)
        if submitted_quiz_attempts > 0 else 0.0
    )

    return {
        'total_users': total_users,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'total_quizzes': total_quizzes,
        'total_quiz_attempts': total_quiz_attempts,
        'average_quiz_score': average_quiz_score,
        'users': {
            'total_users': total_users,
            'total_students': total_students,
            'total_instructors': total_instructors,
            'total_admins': total_admins,
            'active_users': active_users,
        },
        'courses': {
            'total_courses': total_courses,
            'published_courses': published_courses,
            'draft_courses': draft_courses,
            'archived_courses': archived_courses,
            'total_modules': total_modules,
            'total_lessons': total_lessons,
        },
        'enrollments': {
            'total_enrollments': total_enrollments,
            'active_enrollments': active_enrollments,
            'completed_enrollments': completed_enrollments,
            'dropped_enrollments': dropped_enrollments,
            'completion_rate': enrollment_completion_rate,
        },
        'progress': {
            'total_progress_records': total_progress_records,
            'total_completed_lessons': total_completed_lessons,
        },
        'assessments': {
            'total_quizzes': total_quizzes,
            'published_quizzes': published_quizzes,
            'total_questions': total_questions,
            'total_quiz_attempts': total_quiz_attempts,
            'submitted_quiz_attempts': submitted_quiz_attempts,
            'in_progress_quiz_attempts': in_progress_quiz_attempts,
            'expired_quiz_attempts': expired_quiz_attempts,
            'passed_quiz_attempts': passed_quiz_attempts,
            'average_quiz_score': average_quiz_score,
            'overall_quiz_pass_rate': overall_quiz_pass_rate,
        },
    }


def get_quiz_leaderboard(quiz, requesting_user=None, limit=None, include_emails=False):
    """
    Computes a quiz leaderboard using PostgreSQL aggregation and ranking window queries.
    Identifies best score per student and ranks participants.
    Emails are only included for course managers; students see names only.
    """
    leaderboard_qs = (
        QuizAttempt.objects.filter(quiz=quiz, status='SUBMITTED')
        .values(
            'student_id',
            'student__email',
            'student__first_name',
            'student__last_name',
        )
        .annotate(
            best_score=Max('score'),
            highest_percentage=Max('percentage'),
            total_attempts=Count('id'),
            latest_submitted_at=Max('submitted_at'),
        )
        .annotate(
            rank=Window(
                expression=DenseRank(),
                order_by=[F('best_score').desc(), F('latest_submitted_at').asc()],
            )
        )
        .order_by('rank', 'latest_submitted_at')
    )

    results = []
    my_entry = None
    for row in leaderboard_qs:
        first_name = row['student__first_name'] or ''
        last_name = row['student__last_name'] or ''
        name = f"{first_name} {last_name}".strip() or (row['student__email'] if include_emails else 'Learner')
        highest_pct = float(row['highest_percentage']) if row['highest_percentage'] is not None else 0.0
        best_score = float(row['best_score']) if row['best_score'] is not None else 0.0
        passed = highest_pct >= quiz.pass_percentage

        entry = {
            'rank': row['rank'],
            'student_id': row['student_id'],
            'student_name': name,
            'student_email': row['student__email'] if include_emails else None,
            'best_score': best_score,
            'score': best_score,
            'highest_percentage': round(highest_pct, 2),
            'percentage': round(highest_pct, 2),
            'total_attempts': row['total_attempts'],
            'passed': passed,
            'submitted_at': row['latest_submitted_at'],
        }
        results.append(entry)

        if requesting_user and str(row['student_id']) == str(requesting_user.id):
            my_entry = entry

    data_slice = results[:limit] if (limit and limit > 0) else results

    return {
        'quiz_id': quiz.id,
        'quiz_title': quiz.title,
        'course_id': quiz.course_id,
        'course_title': quiz.course.title if quiz.course else '',
        'pass_percentage': quiz.pass_percentage,
        'total_participants': len(results),
        'leaderboard': data_slice,
        'results': data_slice,
        'my_entry': my_entry,
    }
