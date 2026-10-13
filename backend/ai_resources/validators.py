from typing import Any, Dict
from .adapters.base import AIValidationError

def validate_summary_output(data: Any) -> Dict[str, Any]:
    """
    Validates that summary payload conforms to:
    {
        "summary": "...",
        "key_takeaways": ["...", ...]
    }
    """
    if not isinstance(data, dict):
        raise AIValidationError("Summary output must be a JSON object.")
    
    summary = data.get("summary")
    if not isinstance(summary, str) or len(summary.strip()) < 10:
        raise AIValidationError("Summary text must be a non-empty string.")

    takeaways = data.get("key_takeaways")
    if not isinstance(takeaways, list) or len(takeaways) == 0:
        raise AIValidationError("Key takeaways must be a non-empty list of points.")

    for item in takeaways:
        if not isinstance(item, str) or not item.strip():
            raise AIValidationError("Each takeaway point must be a non-empty string.")

    return {
        "summary": summary.strip(),
        "key_takeaways": [t.strip() for t in takeaways]
    }


def validate_flashcards_output(data: Any) -> Dict[str, Any]:
    """
    Validates that flashcards payload conforms to:
    {
        "flashcards": [
            {"front": "...", "back": "..."},
            ...
        ]
    }
    """
    if not isinstance(data, dict):
        raise AIValidationError("Flashcards output must be a JSON object.")

    cards = data.get("flashcards")
    if not isinstance(cards, list) or len(cards) == 0:
        raise AIValidationError("Flashcards must be a non-empty list.")

    validated_cards = []
    for card in cards:
        if not isinstance(card, dict):
            raise AIValidationError("Each flashcard must be an object.")
        front = card.get("front")
        back = card.get("back")
        if not isinstance(front, str) or not front.strip():
            raise AIValidationError("Flashcard front must be a non-empty string.")
        if not isinstance(back, str) or not back.strip():
            raise AIValidationError("Flashcard back must be a non-empty string.")
        validated_cards.append({
            "front": front.strip(),
            "back": back.strip()
        })

    return {"flashcards": validated_cards}


def validate_mcqs_output(data: Any) -> Dict[str, Any]:
    """
    Validates that MCQs payload conforms to:
    {
        "mcqs": [
            {
                "question": "...",
                "options": ["A", "B", "C", "D"],
                "correct_index": 0,
                "explanation": "..."
            },
            ...
        ]
    }
    """
    if not isinstance(data, dict):
        raise AIValidationError("MCQs output must be a JSON object.")

    mcqs = data.get("mcqs")
    if not isinstance(mcqs, list) or len(mcqs) == 0:
        raise AIValidationError("MCQs must be a non-empty list.")

    validated_mcqs = []
    for item in mcqs:
        if not isinstance(item, dict):
            raise AIValidationError("Each MCQ item must be an object.")
        
        question = item.get("question")
        if not isinstance(question, str) or not question.strip():
            raise AIValidationError("MCQ question must be a non-empty string.")

        options = item.get("options")
        if not isinstance(options, list) or len(options) < 2:
            raise AIValidationError("MCQ options must be a list of at least 2 choices.")

        for opt in options:
            if not isinstance(opt, str) or not opt.strip():
                raise AIValidationError("Each MCQ option must be a non-empty string.")

        correct_index = item.get("correct_index")
        if not isinstance(correct_index, int) or correct_index < 0 or correct_index >= len(options):
            raise AIValidationError(f"MCQ correct_index must be an integer between 0 and {len(options) - 1}.")

        explanation = item.get("explanation", "")
        if not isinstance(explanation, str):
            explanation = str(explanation)

        validated_mcqs.append({
            "question": question.strip(),
            "options": [opt.strip() for opt in options],
            "correct_index": correct_index,
            "explanation": explanation.strip()
        })

    return {"mcqs": validated_mcqs}
