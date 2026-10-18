from .common import BASE_SYSTEM_INSTRUCTION, PromptSpec, material_block

TASK = 'summary'


def build(lesson_title: str, material: str, max_output_tokens: int) -> PromptSpec:
    prompt = f"""Summarise the course material below for revision.

Requirements:
- "summary" is one or two short paragraphs.
- "key_points" lists the most important facts, one per item.
- "revision_topics" lists topics from the material a learner should review.

JSON schema:
{{"title": string, "summary": string, "key_points": [string], "revision_topics": [string]}}

{material_block(lesson_title, material)}"""
    return PromptSpec(TASK, BASE_SYSTEM_INSTRUCTION, prompt, max_output_tokens)
