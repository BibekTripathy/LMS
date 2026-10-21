from rest_framework import serializers
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


class QuestionOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for quiz-taking. Excludes is_correct to prevent answer leakage.
    """
    order = serializers.IntegerField(source='position', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'position', 'order']
        read_only_fields = ['id', 'text', 'position', 'order']


class QuestionOptionReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for post-submission review. Includes is_correct.
    """
    order = serializers.IntegerField(source='position', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'is_correct', 'position', 'order']
        read_only_fields = ['id', 'text', 'is_correct', 'position', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for quiz questions. Excludes correct answers and explanations before submission.
    """
    text = serializers.CharField(source='prompt', read_only=True)
    order = serializers.IntegerField(source='position', read_only=True)
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'text', 'question_type', 'marks', 'position', 'order', 'options']
        read_only_fields = ['id', 'prompt', 'text', 'question_type', 'marks', 'position', 'order', 'options']


class QuestionReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for reviewing questions after attempt submission.
    """
    text = serializers.CharField(source='prompt', read_only=True)
    order = serializers.IntegerField(source='position', read_only=True)
    options = QuestionOptionReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'text', 'question_type', 'marks', 'explanation', 'position', 'order', 'options']
        read_only_fields = ['id', 'prompt', 'text', 'question_type', 'marks', 'explanation', 'position', 'order', 'options']


class QuizDetailSerializer(serializers.ModelSerializer):
    passing_score_percentage = serializers.IntegerField(source='pass_percentage', read_only=True)
    total_marks = serializers.IntegerField(read_only=True)
    total_questions = serializers.IntegerField(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    attempts_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'lesson', 'title', 'description',
            'time_limit_seconds', 'pass_percentage', 'passing_score_percentage',
            'max_attempts', 'attempts_remaining', 'leaderboard_enabled',
            'status', 'total_marks', 'total_questions', 'questions',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_attempts_remaining(self, quiz):
        """Attempts the requesting student has left; null when unlimited or no user in context."""
        from .services import attempts_remaining

        user = self.context.get('user')
        return attempts_remaining(user, quiz) if user else None


class AnswerInputItemSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    selected_option_id = serializers.UUIDField(required=False, allow_null=True)
    option_id = serializers.UUIDField(required=False, allow_null=True)
    choice_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        option_val = attrs.get('selected_option_id') or attrs.get('option_id') or attrs.get('choice_id')
        attrs['selected_option_id'] = option_val
        return attrs


class AnswerItemReviewSerializer(serializers.ModelSerializer):
    choice_id = serializers.UUIDField(source='selected_option_id', read_only=True)
    selected_choice_id = serializers.UUIDField(source='selected_option_id', read_only=True)

    class Meta:
        model = Answer
        fields = [
            'id', 'question_id', 'selected_option_id', 'choice_id',
            'selected_choice_id', 'is_correct', 'marks_awarded'
        ]


class QuizAttemptSerializer(serializers.ModelSerializer):
    start_time = serializers.DateTimeField(source='started_at', read_only=True)
    completed_at = serializers.DateTimeField(source='submitted_at', read_only=True)
    pass_percentage = serializers.IntegerField(source='quiz.pass_percentage', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz_id', 'student_id', 'status',
            'started_at', 'start_time', 'deadline_at',
            'submitted_at', 'completed_at',
            'score', 'marks_obtained', 'total_marks_possible',
            'percentage', 'passed', 'pass_percentage'
        ]
        read_only_fields = fields


class AnswerItemDraftSerializer(serializers.ModelSerializer):
    """Saved-but-ungraded answer: no correctness or marks before submission."""
    choice_id = serializers.UUIDField(source='selected_option_id', read_only=True)
    selected_choice_id = serializers.UUIDField(source='selected_option_id', read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'question_id', 'selected_option_id', 'choice_id', 'selected_choice_id']


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    start_time = serializers.DateTimeField(source='started_at', read_only=True)
    completed_at = serializers.DateTimeField(source='submitted_at', read_only=True)
    pass_percentage = serializers.IntegerField(source='quiz.pass_percentage', read_only=True)
    answers = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz_id', 'student_id', 'status',
            'started_at', 'start_time', 'deadline_at',
            'submitted_at', 'completed_at',
            'score', 'marks_obtained', 'total_marks_possible',
            'percentage', 'passed', 'pass_percentage',
            'answers', 'questions'
        ]
        read_only_fields = fields

    def get_answers(self, obj):
        serializer = AnswerItemReviewSerializer if obj.status == 'SUBMITTED' else AnswerItemDraftSerializer
        return serializer(obj.answers.all(), many=True).data

    def get_questions(self, obj):
        # Reveal correct answers and explanations only after a graded submission.
        # EXPIRED attempts were never graded; revealing answers there would let a
        # student read them and score full marks on a retake.
        if obj.status == 'SUBMITTED':
            return QuestionReviewSerializer(obj.quiz.questions.all(), many=True).data
        return QuestionSerializer(obj.quiz.questions.all(), many=True).data


class QuizResultsMeSerializer(serializers.Serializer):
    quiz_id = serializers.UUIDField()
    quiz_title = serializers.CharField()
    pass_percentage = serializers.IntegerField()
    max_attempts = serializers.IntegerField(allow_null=True)
    attempts_remaining = serializers.IntegerField(allow_null=True)
    total_attempts = serializers.IntegerField()
    best_score = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    highest_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    has_passed = serializers.BooleanField()
    attempts = QuizAttemptSerializer(many=True)


class QuestionOptionCreateSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    order = serializers.IntegerField(source='position', required=False)
    text = serializers.CharField(max_length=500, allow_blank=False, trim_whitespace=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'is_correct', 'position', 'order']


MIN_OPTIONS = 2
MAX_OPTIONS = 6


class QuestionCreateSerializer(serializers.ModelSerializer):
    """
    Instructor question authoring.

    Options are validated (2-6, unique text, exactly one correct) and updated in
    place. Once students have answered a question its options are frozen, because
    Answer.selected_option would otherwise lose the recorded choice.
    """
    id = serializers.UUIDField(required=False)
    text = serializers.CharField(source='prompt', required=False)
    order = serializers.IntegerField(source='position', required=False)
    options = QuestionOptionCreateSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'text', 'question_type', 'marks', 'explanation', 'position', 'order', 'options']
        extra_kwargs = {'prompt': {'required': False}}

    def validate_options(self, options):
        if not MIN_OPTIONS <= len(options) <= MAX_OPTIONS:
            raise serializers.ValidationError(f'A question needs between {MIN_OPTIONS} and {MAX_OPTIONS} options.')
        texts = [o['text'].casefold() for o in options]
        if len(set(texts)) != len(texts):
            raise serializers.ValidationError('Option texts must be unique.')
        if sum(1 for o in options if o.get('is_correct')) != 1:
            raise serializers.ValidationError('Exactly one option must be marked correct.')
        return options

    def validate_position(self, position):
        quiz = self.context.get('quiz') or getattr(self.instance, 'quiz', None)
        if quiz is not None:
            clash = quiz.questions.filter(position=position)
            if self.instance is not None:
                clash = clash.exclude(pk=self.instance.pk)
            if clash.exists():
                raise serializers.ValidationError('Another question in this quiz already uses this position.')
        return position

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get('prompt'):
                raise serializers.ValidationError({'prompt': 'This field is required.'})
            if 'options' not in attrs:
                raise serializers.ValidationError({'options': 'This field is required.'})
        elif 'options' in attrs and self.instance.student_answers.exists():
            raise serializers.ValidationError(
                {'options': 'Students have already answered this question, so its options can no longer be changed.'}
            )
        return attrs

    def create(self, validated_data):
        options_data = validated_data.pop('options')
        question = Question.objects.create(**validated_data)
        self._write_options(question, options_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            self._write_options(instance, options_data)
        return instance

    def _write_options(self, question, options_data):
        existing = {o.id: o for o in question.options.all()}
        keep_ids = {o['id'] for o in options_data if o.get('id') in existing}
        # Remove dropped options, then park the kept ones at temporary positions so the
        # (question, position) unique constraint cannot collide while renumbering.
        question.options.exclude(id__in=keep_ids).delete()
        for offset, option_id in enumerate(keep_ids, start=1):
            QuestionOption.objects.filter(id=option_id).update(position=10_000 + offset)
        for position, data in enumerate(options_data, start=1):
            fields = {'text': data['text'], 'is_correct': bool(data.get('is_correct')), 'position': position}
            if data.get('id') in keep_ids:
                QuestionOption.objects.filter(id=data['id']).update(**fields)
            else:
                QuestionOption.objects.create(question=question, **fields)


class QuizCreateSerializer(serializers.ModelSerializer):
    passing_score_percentage = serializers.IntegerField(source='pass_percentage', required=False)
    total_marks = serializers.IntegerField(read_only=True)
    total_questions = serializers.IntegerField(read_only=True)
    questions = QuestionReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'lesson', 'title', 'description',
            'time_limit_seconds', 'pass_percentage', 'passing_score_percentage',
            'max_attempts', 'leaderboard_enabled',
            'status', 'total_marks', 'total_questions', 'questions',
            'created_at', 'updated_at'
        ]
        # course comes from the URL on create and can never be moved to another course.
        read_only_fields = ['id', 'course', 'total_marks', 'total_questions', 'created_at', 'updated_at']
        extra_kwargs = {'pass_percentage': {'max_value': 100}, 'max_attempts': {'min_value': 1}}

    def validate_lesson(self, lesson):
        course = self.context.get('course') or getattr(self.instance, 'course', None)
        if lesson and course and lesson.module.course_id != course.id:
            raise serializers.ValidationError('The lesson does not belong to this course.')
        return lesson
