"""
Personalised revision prompt.

The learner data contains only aggregated quiz performance computed on the
server (topic names, accuracy, missed question prompts and their correct
answers from *submitted* attempts). No names, e-mails, or account IDs.
"""
from .common import BASE_SYSTEM_INSTRUCTION, MATERIAL_END, MATERIAL_START, PromptSpec, data_block

TASK = 'revision'


def build(course_title: str, performance: dict, material: str, max_output_tokens: int) -> PromptSpec:
    prompt = f"""Write a personalised revision plan for one learner, based only on the learner data and course material below.

Requirements:
- Create one "focus_areas" entry per topic listed in "weak_topics", using the exact topic name. Do not invent other topics.
- "reason" explains, using the accuracy figures and missed questions, why the topic needs work.
- "actions" are concrete revision steps grounded in the course material.
- If "weak_topics" is empty, return an empty "focus_areas" list and use "next_steps" to suggest how to consolidate.

JSON schema:
{{"title": string, "overview": string, "focus_areas": [{{"topic": string, "reason": string, "actions": [string]}}], "next_steps": [string]}}

{data_block(performance)}

{MATERIAL_START}
Course title: {course_title}

{material}
{MATERIAL_END}"""
    return PromptSpec(TASK, BASE_SYSTEM_INSTRUCTION, prompt, max_output_tokens)
