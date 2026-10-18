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

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'lesson', 'title', 'description',
            'time_limit_seconds', 'pass_percentage', 'passing_score_percentage',
            'status', 'total_marks', 'total_questions', 'questions',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields


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
    total_attempts = serializers.IntegerField()
    best_score = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    highest_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    has_passed = serializers.BooleanField()
    attempts = QuizAttemptSerializer(many=True)


class QuestionOptionCreateSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    order = serializers.IntegerField(source='position', required=False)

    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'is_correct', 'position', 'order']


class QuestionCreateSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    text = serializers.CharField(source='prompt', required=False)
    order = serializers.IntegerField(source='position', required=False)
    options = QuestionOptionCreateSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'text', 'question_type', 'marks', 'explanation', 'position', 'order', 'options']

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for i, opt in enumerate(options_data):
            opt.setdefault('position', i + 1)
            QuestionOption.objects.create(question=question, **opt)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            for i, opt in enumerate(options_data):
                opt.setdefault('position', i + 1)
                QuestionOption.objects.create(question=instance, **opt)
        return instance


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
            'status', 'total_marks', 'total_questions', 'questions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_marks', 'total_questions', 'created_at', 'updated_at']

