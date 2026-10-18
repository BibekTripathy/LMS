from .common import BASE_SYSTEM_INSTRUCTION, PromptSpec, material_block

TASK = 'mcq'


def build(lesson_title: str, material: str, count: int, max_output_tokens: int) -> PromptSpec:
    prompt = f"""Write {count} multiple-choice questions that test understanding of the course material below.

Requirements:
- Each question has exactly 4 options, exactly one of which is correct.
- Options are short, distinct, and plausible; avoid "all of the above" and "none of the above".
- "correct_option_index" is the 0-based index of the correct option.
- "explanation" says in one or two sentences why the answer is correct, citing the material.

JSON schema:
{{"title": string, "questions": [{{"prompt": string, "options": [string, string, string, string], "correct_option_index": integer, "explanation": string}}]}}

{material_block(lesson_title, material)}"""
    return PromptSpec(TASK, BASE_SYSTEM_INSTRUCTION, prompt, max_output_tokens)
