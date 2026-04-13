"""
预约考试系统 API 路由
- 模板管理（家长/管理员）
- 题目管理（家长/管理员）
- 预约管理（家长/孩子）
- 考试会话（孩子答题）
- 考试报告
"""
import uuid
import random
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import (
    CurrentChild,
    CurrentParentOrAdmin,
    CurrentUser,
    SessionDep,
)
from app.models import (
    BookingStatus,
    CoinLog,
    ExamAnswer,
    ExamAnswerCreate,
    ExamAnswerPublic,
    ExamBooking,
    ExamBookingCreate,
    ExamBookingPublic,
    ExamBookingsPublic,
    ExamReport,
    ExamSession,
    ExamSessionPublic,
    ExamSessionsPublic,
    ExamTemplate,
    ExamTemplateCreate,
    ExamTemplatePublic,
    ExamTemplatesPublic,
    ExamTemplateUpdate,
    Message,
    Question,
    QuestionCreate,
    QuestionPublic,
    QuestionsPublic,
    QuestionUpdate,
    SessionStatus,
    TransactionType,
    User,
    UserRole,
)

router = APIRouter(prefix="/exams", tags=["exams"])


# ─── 辅助函数 ──────────────────────────────────────────────────────

def _check_template_access(template: ExamTemplate | None, user: User) -> ExamTemplate:
    """校验模板存在且用户有权限"""
    if not template:
        raise HTTPException(status_code=404, detail="考试模板不存在")
    if user.is_superuser or user.role == UserRole.admin:
        return template
    # 公开试卷所有人可访问
    if template.is_public:
        return template
    if template.created_by == user.id:
        return template
    # child 可以访问 parent 创建的模板
    if user.role == UserRole.child and template.created_by == user.parent_id:
        return template
    raise HTTPException(status_code=403, detail="权限不足")


def _calc_coins(score: int, total: int, rules: dict[str, Any]) -> int:
    """根据得分率和奖励规则计算学习币"""
    if total == 0:
        return 0
    rate = score * 100 / total
    # rules: {"90": 20, "70": 10, "0": -5} — 按阈值从高到低匹配
    sorted_thresholds = sorted(
        ((int(k), v) for k, v in rules.items()), key=lambda x: x[0], reverse=True
    )
    for threshold, coins in sorted_thresholds:
        if rate >= threshold:
            return coins
    return 0


# ═══════════════════════════════════════════════════════════════════
# 模板管理
# ═══════════════════════════════════════════════════════════════════

@router.post("/templates", response_model=ExamTemplatePublic)
def create_template(
    *, session: SessionDep, current_user: CurrentParentOrAdmin,
    body: ExamTemplateCreate,
) -> Any:
    """创建考试模板（家长/管理员）"""
    tpl = ExamTemplate.model_validate(body, update={
        "created_by": current_user.id,
    })
    session.add(tpl)
    session.commit()
    session.refresh(tpl)
    return tpl


@router.get("/templates", response_model=ExamTemplatesPublic)
def list_templates(
    session: SessionDep, current_user: CurrentUser,
    skip: int = 0, limit: int = 100,
) -> Any:
    """获取考试模板列表"""
    from sqlalchemy import or_

    if current_user.is_superuser or current_user.role == UserRole.admin:
        where = []
    elif current_user.role == UserRole.child:
        # 孩子可见：家长创建的 + 公开的
        parent_filter = (ExamTemplate.created_by == current_user.parent_id) if current_user.parent_id else (ExamTemplate.id == None)  # noqa: E711
        where = [or_(parent_filter, ExamTemplate.is_public == True)]  # noqa: E712
    else:
        # 家长可见：自己创建的 + 公开的
        where = [or_(ExamTemplate.created_by == current_user.id, ExamTemplate.is_public == True)]  # noqa: E712

    count = session.exec(
        select(func.count()).select_from(ExamTemplate).where(*where)
    ).one()
    rows = session.exec(
        select(ExamTemplate).where(*where).offset(skip).limit(limit)
    ).all()
    return ExamTemplatesPublic(data=rows, count=count)


@router.get("/templates/{template_id}", response_model=ExamTemplatePublic)
def get_template(
    session: SessionDep, current_user: CurrentUser, template_id: uuid.UUID,
) -> Any:
    tpl = session.get(ExamTemplate, template_id)
    return _check_template_access(tpl, current_user)


@router.put("/templates/{template_id}", response_model=ExamTemplatePublic)
def update_template(
    *, session: SessionDep, current_user: CurrentParentOrAdmin,
    template_id: uuid.UUID, body: ExamTemplateUpdate,
) -> Any:
    tpl = session.get(ExamTemplate, template_id)
    _check_template_access(tpl, current_user)
    update_data = body.model_dump(exclude_unset=True)
    tpl.sqlmodel_update(update_data)  # type: ignore
    tpl.updated_at = datetime.utcnow()  # type: ignore
    session.add(tpl)
    session.commit()
    session.refresh(tpl)
    return tpl


@router.delete("/templates/{template_id}")
def delete_template(
    session: SessionDep, current_user: CurrentParentOrAdmin,
    template_id: uuid.UUID,
) -> Message:
    tpl = session.get(ExamTemplate, template_id)
    _check_template_access(tpl, current_user)
    session.delete(tpl)
    session.commit()
    return Message(message="考试模板已删除")


# ═══════════════════════════════════════════════════════════════════
# 题目管理
# ═══════════════════════════════════════════════════════════════════

@router.post("/templates/{template_id}/questions", response_model=QuestionPublic)
def add_question(
    *, session: SessionDep, current_user: CurrentParentOrAdmin,
    template_id: uuid.UUID, body: QuestionCreate,
) -> Any:
    """手动添加题目"""
    tpl = session.get(ExamTemplate, template_id)
    _check_template_access(tpl, current_user)
    q = Question.model_validate(body, update={"template_id": template_id})
    session.add(q)
    session.commit()
    session.refresh(q)
    return q


@router.post("/templates/{template_id}/questions/batch", response_model=QuestionsPublic)
def add_questions_batch(
    *, session: SessionDep, current_user: CurrentParentOrAdmin,
    template_id: uuid.UUID, body: list[QuestionCreate],
) -> Any:
    """批量添加题目"""
    tpl = session.get(ExamTemplate, template_id)
    _check_template_access(tpl, current_user)
    questions = []
    for item in body:
        q = Question.model_validate(item, update={"template_id": template_id})
        session.add(q)
        questions.append(q)
    session.commit()
    for q in questions:
        session.refresh(q)
    return QuestionsPublic(data=questions, count=len(questions))


@router.get("/templates/{template_id}/questions", response_model=QuestionsPublic)
def list_questions(
    session: SessionDep, current_user: CurrentUser, template_id: uuid.UUID,
) -> Any:
    """获取模板下的题目列表"""
    tpl = session.get(ExamTemplate, template_id)
    _check_template_access(tpl, current_user)
    rows = session.exec(
        select(Question).where(Question.template_id == template_id)
    ).all()
    return QuestionsPublic(data=rows, count=len(rows))


@router.put("/questions/{question_id}", response_model=QuestionPublic)
def update_question(
    *, session: SessionDep, current_user: CurrentParentOrAdmin,
    question_id: uuid.UUID, body: QuestionUpdate,
) -> Any:
    q = session.get(Question, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")
    tpl = session.get(ExamTemplate, q.template_id)
    _check_template_access(tpl, current_user)
    q.sqlmodel_update(body.model_dump(exclude_unset=True))
    session.add(q)
    session.commit()
    session.refresh(q)
    return q


@router.delete("/questions/{question_id}")
def delete_question(
    session: SessionDep, current_user: CurrentParentOrAdmin,
    question_id: uuid.UUID,
) -> Message:
    q = session.get(Question, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")
    tpl = session.get(ExamTemplate, q.template_id)
    _check_template_access(tpl, current_user)
    session.delete(q)
    session.commit()
    return Message(message="题目已删除")


# ═══════════════════════════════════════════════════════════════════
# 预约管理
# ═══════════════════════════════════════════════════════════════════

@router.post("/bookings", response_model=ExamBookingPublic)
def create_booking(
    *, session: SessionDep, current_user: CurrentUser,
    body: ExamBookingCreate,
) -> Any:
    """预约考试：家长可为孩子预约，孩子可自己预约"""
    tpl = session.get(ExamTemplate, body.template_id)
    if not tpl or not tpl.is_active:
        raise HTTPException(status_code=404, detail="考试模板不存在或已停用")

    # 确定考试的孩子
    if current_user.role == UserRole.child:
        child_id = current_user.id
    elif body.child_id:
        # 家长为孩子预约，校验是自己的孩子
        child = session.get(User, body.child_id)
        if not child or child.parent_id != current_user.id:
            raise HTTPException(status_code=403, detail="只能为自己的宝贝预约")
        child_id = body.child_id
    else:
        raise HTTPException(status_code=400, detail="请指定宝贝 child_id")

    if body.scheduled_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="预约时间不能是过去")

    booking = ExamBooking(
        template_id=body.template_id,
        child_id=child_id,
        scheduled_at=body.scheduled_at,
        booking_type=body.booking_type,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking


@router.get("/bookings", response_model=ExamBookingsPublic)
def list_bookings(
    session: SessionDep, current_user: CurrentUser,
    status: BookingStatus | None = None,
    skip: int = 0, limit: int = 50,
) -> Any:
    """获取预约列表"""
    if current_user.role == UserRole.child:
        where = [ExamBooking.child_id == current_user.id]
    elif current_user.is_superuser or current_user.role == UserRole.admin:
        where = []
    else:
        # 家长看自己孩子的预约
        child_ids_stmt = select(User.id).where(User.parent_id == current_user.id)
        child_ids = session.exec(child_ids_stmt).all()
        where = [col(ExamBooking.child_id).in_(child_ids)] if child_ids else [ExamBooking.id == None]  # noqa: E711

    if status:
        where.append(ExamBooking.status == status)

    count = session.exec(
        select(func.count()).select_from(ExamBooking).where(*where)
    ).one()
    rows = session.exec(
        select(ExamBooking).where(*where)
        .order_by(col(ExamBooking.scheduled_at).desc())
        .offset(skip).limit(limit)
    ).all()
    return ExamBookingsPublic(data=rows, count=count)


@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    session: SessionDep, current_user: CurrentUser, booking_id: uuid.UUID,
) -> Message:
    booking = session.get(ExamBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="预约不存在")
    if booking.status != BookingStatus.booked:
        raise HTTPException(status_code=400, detail="只能取消待考状态的预约")
    # 权限：本人或家长
    if current_user.role == UserRole.child and booking.child_id != current_user.id:
        raise HTTPException(status_code=403, detail="权限不足")
    if current_user.role == UserRole.parent:
        child = session.get(User, booking.child_id)
        if not child or child.parent_id != current_user.id:
            raise HTTPException(status_code=403, detail="权限不足")
    booking.status = BookingStatus.cancelled
    session.add(booking)
    session.commit()
    return Message(message="预约已取消")


# ═══════════════════════════════════════════════════════════════════
# 考试会话（答题）
# ═══════════════════════════════════════════════════════════════════

@router.post("/bookings/{booking_id}/start", response_model=ExamSessionPublic)
def start_exam(
    session: SessionDep, current_user: CurrentUser, booking_id: uuid.UUID,
) -> Any:
    """开始考试 → 创建 ExamSession"""
    booking = session.get(ExamBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="预约不存在")
    if booking.status != BookingStatus.booked:
        raise HTTPException(status_code=400, detail="该预约不可开始考试")
    if booking.child_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="只有预约的宝贝可以开始考试")

    # 检查题目数量
    q_count = session.exec(
        select(func.count()).select_from(Question)
        .where(Question.template_id == booking.template_id)
    ).one()
    if q_count == 0:
        raise HTTPException(status_code=400, detail="该模板还没有题目，无法开始考试")

    tpl = session.get(ExamTemplate, booking.template_id)
    total_points = session.exec(
        select(func.sum(Question.points))
        .where(Question.template_id == booking.template_id)
    ).one() or 0

    exam_session = ExamSession(
        booking_id=booking.id,
        child_id=current_user.id,
        template_id=booking.template_id,
        total_points=total_points,
    )
    booking.status = BookingStatus.started
    session.add(exam_session)
    session.add(booking)
    session.commit()
    session.refresh(exam_session)
    return exam_session


@router.get("/sessions/{session_id}/questions")
def get_session_questions(
    session: SessionDep, current_user: CurrentUser, session_id: uuid.UUID,
) -> Any:
    """获取考试题目（不含答案，给孩子答题用）"""
    exam_sess = session.get(ExamSession, session_id)
    if not exam_sess:
        raise HTTPException(status_code=404, detail="考试会话不存在")
    if exam_sess.child_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")

    questions = session.exec(
        select(Question).where(Question.template_id == exam_sess.template_id)
    ).all()

    tpl = session.get(ExamTemplate, exam_sess.template_id)
    # 闯关/极速模式随机打乱题目顺序
    q_list = list(questions)
    if tpl and tpl.game_mode in ("challenge", "speed_run"):
        random.shuffle(q_list)

    # 已答题目 ID
    answered_ids = set(session.exec(
        select(ExamAnswer.question_id).where(ExamAnswer.session_id == session_id)
    ).all())

    return {
        "game_mode": tpl.game_mode if tpl else "classic",
        "time_limit_seconds": tpl.time_limit_seconds if tpl else None,
        "questions": [
            {
                "id": str(q.id),
                "question_type": q.question_type,
                "content": q.content,
                "difficulty": q.difficulty,
                "points": q.points,
                "answered": q.id in answered_ids,
            }
            for q in q_list
        ],
    }


@router.post("/sessions/{session_id}/answer", response_model=ExamAnswerPublic)
def submit_answer(
    *, session: SessionDep, current_user: CurrentUser,
    session_id: uuid.UUID, body: ExamAnswerCreate,
) -> Any:
    """提交单题答案（实时反馈）"""
    exam_sess = session.get(ExamSession, session_id)
    if not exam_sess:
        raise HTTPException(status_code=404, detail="考试会话不存在")
    if exam_sess.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="考试已结束")
    if exam_sess.child_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")

    # 检查是否已答过
    existing = session.exec(
        select(ExamAnswer).where(
            ExamAnswer.session_id == session_id,
            ExamAnswer.question_id == body.question_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该题已作答")

    question = session.get(Question, body.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")

    # 判断正误（忽略大小写和首尾空格）
    is_correct = body.child_answer.strip().lower() == question.answer.strip().lower()

    # 计算连击
    recent_answers = session.exec(
        select(ExamAnswer)
        .where(ExamAnswer.session_id == session_id)
        .order_by(col(ExamAnswer.answered_at).desc())
        .limit(1)
    ).first()
    if is_correct:
        combo = (recent_answers.combo_count + 1) if (recent_answers and recent_answers.is_correct) else 1
    else:
        combo = 0

    answer = ExamAnswer(
        session_id=session_id,
        question_id=body.question_id,
        child_answer=body.child_answer,
        is_correct=is_correct,
        time_spent_ms=body.time_spent_ms,
        combo_count=combo,
    )
    session.add(answer)

    # 更新 session combo_max
    if combo > exam_sess.combo_max:
        exam_sess.combo_max = combo
        session.add(exam_sess)

    # 闯关模式：答错 3 题自动结束
    tpl = session.get(ExamTemplate, exam_sess.template_id)
    if tpl and tpl.game_mode == "challenge" and not is_correct:
        wrong_count = session.exec(
            select(func.count()).select_from(ExamAnswer).where(
                ExamAnswer.session_id == session_id,
                ExamAnswer.is_correct == False,  # noqa: E712
            )
        ).one()
        if wrong_count + 1 >= 3:  # +1 因为当前答案还没 commit
            _finish_exam(session, exam_sess, tpl)

    session.commit()
    session.refresh(answer)
    return answer


def _finish_exam(db: Any, exam_sess: ExamSession, tpl: ExamTemplate) -> None:
    """结算考试"""
    answers = db.exec(
        select(ExamAnswer).where(ExamAnswer.session_id == exam_sess.id)
    ).all()

    correct_count = sum(1 for a in answers if a.is_correct)
    total_answered = len(answers)

    # 计算得分
    score = 0
    for a in answers:
        if a.is_correct:
            q = db.get(Question, a.question_id)
            if q:
                score += q.points

    exam_sess.score = score
    exam_sess.accuracy_rate = (correct_count / total_answered * 100) if total_answered > 0 else 0
    exam_sess.finished_at = datetime.utcnow()
    exam_sess.status = SessionStatus.completed

    # 计算学习币
    coins = _calc_coins(score, exam_sess.total_points, tpl.coins_reward_rules or {})
    exam_sess.coins_earned = coins

    # 更新用户余额 + 记录 coin log
    if coins != 0:
        user = db.get(User, exam_sess.child_id)
        if user:
            user.coins = (user.coins or 0) + coins
            db.add(user)
            log = CoinLog(
                user_id=user.id,
                amount=coins,
                balance_after=user.coins,
                transaction_type=TransactionType.task_completion,
                description=f"考试「{tpl.title}」{'奖励' if coins > 0 else '扣除'} {abs(coins)} 学习币",
                related_id=exam_sess.id,
            )
            db.add(log)

    # 更新 booking 状态
    if exam_sess.booking_id:
        booking = db.get(ExamBooking, exam_sess.booking_id)
        if booking:
            booking.status = BookingStatus.completed
            db.add(booking)

    db.add(exam_sess)


@router.post("/sessions/{session_id}/submit", response_model=ExamSessionPublic)
def submit_exam(
    session: SessionDep, current_user: CurrentUser, session_id: uuid.UUID,
) -> Any:
    """交卷"""
    exam_sess = session.get(ExamSession, session_id)
    if not exam_sess:
        raise HTTPException(status_code=404, detail="考试会话不存在")
    if exam_sess.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="考试已结束")
    if exam_sess.child_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")

    tpl = session.get(ExamTemplate, exam_sess.template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail="模板不存在")

    _finish_exam(session, exam_sess, tpl)
    session.commit()
    session.refresh(exam_sess)
    return exam_sess


# ═══════════════════════════════════════════════════════════════════
# 考试报告
# ═══════════════════════════════════════════════════════════════════

@router.get("/sessions/{session_id}/report", response_model=ExamReport)
def get_exam_report(
    session: SessionDep, current_user: CurrentUser, session_id: uuid.UUID,
) -> Any:
    """获取考试报告"""
    exam_sess = session.get(ExamSession, session_id)
    if not exam_sess:
        raise HTTPException(status_code=404, detail="考试会话不存在")
    if exam_sess.status == SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="考试尚未结束")

    # 权限：本人、家长、管理员
    if not current_user.is_superuser and current_user.role != UserRole.admin:
        if current_user.role == UserRole.child and exam_sess.child_id != current_user.id:
            raise HTTPException(status_code=403, detail="权限不足")
        if current_user.role == UserRole.parent:
            child = session.get(User, exam_sess.child_id)
            if not child or child.parent_id != current_user.id:
                raise HTTPException(status_code=403, detail="权限不足")

    tpl = session.get(ExamTemplate, exam_sess.template_id)
    answers = session.exec(
        select(ExamAnswer).where(ExamAnswer.session_id == session_id)
        .order_by(col(ExamAnswer.answered_at).asc())
    ).all()

    answer_details = []
    for a in answers:
        q = session.get(Question, a.question_id)
        answer_details.append({
            "question_id": str(a.question_id),
            "question_content": q.content if q else {},
            "correct_answer": q.answer if q else "",
            "child_answer": a.child_answer,
            "is_correct": a.is_correct,
            "time_spent_ms": a.time_spent_ms,
            "combo_count": a.combo_count,
            "points": q.points if q else 0,
        })

    time_spent = 0
    if exam_sess.finished_at and exam_sess.started_at:
        time_spent = int((exam_sess.finished_at - exam_sess.started_at).total_seconds())

    correct = sum(1 for a in answers if a.is_correct)
    total = len(answers)

    # 生成简单总结
    if exam_sess.accuracy_rate >= 90:
        summary = "🌟 太棒了！表现非常优秀！"
    elif exam_sess.accuracy_rate >= 70:
        summary = "👍 不错哦，继续加油！"
    elif exam_sess.accuracy_rate >= 50:
        summary = "💪 还需要多练习，你可以的！"
    else:
        summary = "📚 这次有点难，下次一定能进步！"

    if exam_sess.combo_max >= 5:
        summary += f" 连击 {exam_sess.combo_max} 次，手感火热🔥"

    return ExamReport(
        session_id=exam_sess.id,
        template_title=tpl.title if tpl else "",
        subject=tpl.subject if tpl else "",
        score=exam_sess.score,
        total_points=exam_sess.total_points,
        accuracy_rate=exam_sess.accuracy_rate,
        combo_max=exam_sess.combo_max,
        coins_earned=exam_sess.coins_earned,
        time_spent_seconds=time_spent,
        answers=answer_details,
        summary=summary,
    )


@router.get("/sessions", response_model=ExamSessionsPublic)
def list_sessions(
    session: SessionDep, current_user: CurrentUser,
    skip: int = 0, limit: int = 50,
) -> Any:
    """获取考试记录列表"""
    if current_user.role == UserRole.child:
        where = [ExamSession.child_id == current_user.id]
    elif current_user.is_superuser or current_user.role == UserRole.admin:
        where = []
    else:
        child_ids = session.exec(
            select(User.id).where(User.parent_id == current_user.id)
        ).all()
        where = [col(ExamSession.child_id).in_(child_ids)] if child_ids else [ExamSession.id == None]  # noqa: E711

    count = session.exec(
        select(func.count()).select_from(ExamSession).where(*where)
    ).one()
    rows = session.exec(
        select(ExamSession).where(*where)
        .order_by(col(ExamSession.started_at).desc())
        .offset(skip).limit(limit)
    ).all()
    return ExamSessionsPublic(data=rows, count=count)
