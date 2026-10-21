"""
Management command to seed demo courses for NoteBox LMS.
Usage: python manage.py seed_courses --instructor-email instructor@demo.local
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson

User = get_user_model()

COURSES = [
    {
        "title": "Python for Data Analysis",
        "category": "Programming",
        "difficulty": "BEGINNER",
        "description": "Learn Python fundamentals and apply them to real-world data analysis with pandas, numpy, and matplotlib.",
        "modules": [
            {"title": "Python Basics", "lessons": ["Variables & Setup", "Control Flow", "Functions & Modules"]},
            {"title": "Data Manipulation", "lessons": ["Intro to Pandas", "DataFrames", "Data Cleaning"]},
            {"title": "Visualisation", "lessons": ["Matplotlib Basics", "Seaborn Charts", "Final Project"]},
        ],
    },
    {
        "title": "Web Design with HTML & CSS",
        "category": "Design",
        "difficulty": "BEGINNER",
        "description": "Build beautiful, responsive websites from scratch using modern HTML5 and CSS3 techniques.",
        "modules": [
            {"title": "HTML Foundations", "lessons": ["Document Structure", "Semantic HTML", "Forms & Inputs"]},
            {"title": "CSS Styling", "lessons": ["Selectors & Cascade", "Box Model", "Flexbox Layout"]},
            {"title": "Responsive Design", "lessons": ["Media Queries", "CSS Grid", "Mobile-First Design"]},
        ],
    },
    {
        "title": "JavaScript Fundamentals",
        "category": "Programming",
        "difficulty": "BEGINNER",
        "description": "Master the language of the web — from variables and functions to DOM manipulation and async programming.",
        "modules": [
            {"title": "Core Language", "lessons": ["Variables & Types", "Functions", "Arrays & Objects"]},
            {"title": "DOM & Events", "lessons": ["Selecting Elements", "Event Listeners", "Building a Todo App"]},
            {"title": "Async JavaScript", "lessons": ["Promises", "Async/Await", "Fetch API"]},
        ],
    },
    {
        "title": "Machine Learning Fundamentals",
        "category": "Data Science",
        "difficulty": "INTERMEDIATE",
        "description": "Understand core ML concepts — supervised learning, model evaluation, and scikit-learn — with hands-on projects.",
        "modules": [
            {"title": "ML Concepts", "lessons": ["What is ML?", "Supervised vs Unsupervised", "Bias-Variance Tradeoff"]},
            {"title": "Classification", "lessons": ["Logistic Regression", "Decision Trees", "Model Evaluation"]},
            {"title": "Regression & Clustering", "lessons": ["Linear Regression", "K-Means Clustering", "Capstone Project"]},
        ],
    },
    {
        "title": "React & TypeScript",
        "category": "Programming",
        "difficulty": "INTERMEDIATE",
        "description": "Build scalable front-end apps with React 18 and TypeScript. Covers hooks, context, React Query, and testing.",
        "modules": [
            {"title": "React Basics", "lessons": ["JSX & Components", "Props & State", "useEffect Hook"]},
            {"title": "TypeScript Integration", "lessons": ["Types & Interfaces", "Generics", "Typing React Components"]},
            {"title": "Advanced Patterns", "lessons": ["Context API", "React Query", "Testing with Vitest"]},
        ],
    },
    {
        "title": "Digital Photography Masterclass",
        "category": "Photography",
        "difficulty": "BEGINNER",
        "description": "Learn to shoot in manual mode, compose stunning photos, and edit with professional tools.",
        "modules": [
            {"title": "Camera Basics", "lessons": ["Exposure Triangle", "Aperture & Depth of Field", "Shutter Speed"]},
            {"title": "Composition", "lessons": ["Rule of Thirds", "Leading Lines", "Light & Shadow"]},
            {"title": "Post-Processing", "lessons": ["Lightroom Basics", "Colour Grading", "Export & Sharing"]},
        ],
    },
    {
        "title": "Introduction to UI/UX Design",
        "category": "Design",
        "difficulty": "BEGINNER",
        "description": "Learn user research, wireframing, prototyping, and usability testing to design great digital experiences.",
        "modules": [
            {"title": "Design Thinking", "lessons": ["Empathise & Define", "Ideate & Prototype", "Test & Iterate"]},
            {"title": "Wireframing", "lessons": ["Sketching Ideas", "Figma Basics", "Component Libraries"]},
            {"title": "Usability", "lessons": ["Heuristic Evaluation", "User Testing", "Accessibility Basics"]},
        ],
    },
    {
        "title": "Cloud Computing with AWS",
        "category": "DevOps",
        "difficulty": "INTERMEDIATE",
        "description": "Get hands-on with core AWS services — EC2, S3, Lambda, RDS — and deploy production-ready applications.",
        "modules": [
            {"title": "AWS Fundamentals", "lessons": ["Regions & AZs", "IAM & Security", "EC2 Instances"]},
            {"title": "Storage & Databases", "lessons": ["S3 Buckets", "RDS & Aurora", "DynamoDB Basics"]},
            {"title": "Serverless & Deploy", "lessons": ["Lambda Functions", "API Gateway", "CI/CD with CodePipeline"]},
        ],
    },
    {
        "title": "Creative Writing Workshop",
        "category": "Writing",
        "difficulty": "BEGINNER",
        "description": "Develop your voice, craft compelling characters, and write stories that readers can't put down.",
        "modules": [
            {"title": "Story Fundamentals", "lessons": ["Story Structure", "Point of View", "Show Don't Tell"]},
            {"title": "Character & Dialogue", "lessons": ["Creating Characters", "Writing Dialogue", "Backstory & Motivation"]},
            {"title": "Editing & Publishing", "lessons": ["Self-Editing Techniques", "Beta Readers", "Submission Process"]},
        ],
    },
    {
        "title": "Cybersecurity Essentials",
        "category": "Security",
        "difficulty": "INTERMEDIATE",
        "description": "Learn how attackers think, common vulnerabilities, and how to protect systems and networks.",
        "modules": [
            {"title": "Threats & Attacks", "lessons": ["Social Engineering", "Malware Types", "Network Attacks"]},
            {"title": "Defence", "lessons": ["Firewalls & VPNs", "Encryption Basics", "Secure Coding"]},
            {"title": "Ethical Hacking", "lessons": ["Penetration Testing Intro", "CTF Challenges", "Career Paths"]},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed NoteBox with demo courses"

    def add_arguments(self, parser):
        parser.add_argument(
            "--instructor-email",
            default="instructor@demo.local",
            help="Email of the instructor user to assign courses to",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-create courses even if they already exist",
        )

    def handle(self, *args, **options):
        email = options["instructor_email"]
        force = options["force"]

        try:
            instructor = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stderr.write(
                self.style.ERROR(f"Instructor '{email}' not found. Create this user first.")
            )
            return

        created_count = 0
        skipped_count = 0

        for course_data in COURSES:
            title = course_data["title"]
            exists = Course.objects.filter(title=title, instructor=instructor).exists()

            if exists and not force:
                self.stdout.write(f"  SKIP  {title}")
                skipped_count += 1
                continue

            if exists and force:
                Course.objects.filter(title=title, instructor=instructor).delete()

            course = Course.objects.create(
                title=title,
                description=course_data["description"],
                category=course_data["category"],
                difficulty=course_data["difficulty"],
                instructor=instructor,
                status="PUBLISHED",
                is_published=True,
            )

            for module_order, module_data in enumerate(course_data["modules"], start=1):
                module = Module.objects.create(
                    course=course,
                    title=module_data["title"],
                    order=module_order,
                )
                for lesson_order, lesson_title in enumerate(module_data["lessons"], start=1):
                    Lesson.objects.create(
                        module=module,
                        title=lesson_title,
                        order=lesson_order,
                        content=f"Lesson content for: {lesson_title}",
                        reading_content=f"Reading material for: {lesson_title}",
                    )

            self.stdout.write(self.style.SUCCESS(f"  OK    {title}"))
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Created: {created_count}  |  Skipped: {skipped_count}"
            )
        )
