from .common import BASE_SYSTEM_INSTRUCTION, PromptSpec, material_block

TASK = 'flashcards'


def build(lesson_title: str, material: str, count: int, max_output_tokens: int) -> PromptSpec:
    prompt = f"""Write {count} flashcards covering the key ideas of the course material below.

Requirements:
- "front" is a short question or term; "back" is a concise answer taken from the material.
- Do not repeat the same idea on two cards.

JSON schema:
{{"title": string, "cards": [{{"front": string, "back": string}}]}}

{material_block(lesson_title, material)}"""
    return PromptSpec(TASK, BASE_SYSTEM_INSTRUCTION, prompt, max_output_tokens)
