from typing import Literal

RED_FLAG_QUESTIONS: list[dict] = [
    {
        "id": "bowel_bladder",
        "text": "Have you noticed any loss of control of your bladder or bowels recently?",
        "severity": "block",
    },
    {
        "id": "saddle_numbness",
        "text": "Do you have numbness or tingling in your groin or inner thighs (saddle area)?",
        "severity": "block",
    },
    {
        "id": "progressive_weakness",
        "text": "Have you noticed progressive weakness in one or both legs in the last few days?",
        "severity": "block",
    },
    {
        "id": "unexplained_weight_loss",
        "text": "Have you had unexplained weight loss of more than 5 kg in the past 3 months?",
        "severity": "warn",
    },
    {
        "id": "night_pain",
        "text": "Is your back pain worse at night and does it wake you from sleep?",
        "severity": "warn",
    },
    {
        "id": "fever",
        "text": "Have you had a fever, chills, or felt generally unwell along with your back pain?",
        "severity": "warn",
    },
]


def evaluate_red_flags(
    answers: dict[str, bool],
) -> Literal["safe", "warn", "block"]:
    """
    Given a dict of {question_id: bool}, return safety classification.

    'block' -- one or more block-severity questions answered True.
               User must not proceed; show emergency referral message.
    'warn'  -- one or more warn-severity questions answered True.
               Proceed but flag for clinical review.
    'safe'  -- all answers False.
    """
    question_map = {q["id"]: q for q in RED_FLAG_QUESTIONS}
    result: Literal["safe", "warn", "block"] = "safe"

    for question_id, answered_yes in answers.items():
        if not answered_yes:
            continue
        question = question_map.get(question_id)
        if question is None:
            continue
        if question["severity"] == "block":
            return "block"  # any block answer is immediately block
        if question["severity"] == "warn":
            result = "warn"

    return result