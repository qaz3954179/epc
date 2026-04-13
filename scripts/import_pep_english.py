#!/usr/bin/env python3
"""
导入人教版PEP六年级上册英语单词和句型到考试系统
每个单元创建一个试卷，每个单词/句型为一道选择题
"""
import sys
import os
import random
from pathlib import Path

# 添加 backend/app 到 Python 路径
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models import (
    ExamTemplate,
    Question,
    ExamSubject,
    ExamDifficulty,
    ExamSourceType,
    QuestionType,
    User,
    UserRole,
)

# 数据：人教版PEP六年级上册英语
UNITS_DATA = [
    {
        "unit": 1,
        "title": "Unit 1: How can I get there?",
        "words": [
            ("science", "科学"),
            ("museum", "博物馆"),
            ("post office", "邮局"),
            ("bookstore", "书店"),
            ("cinema", "电影院"),
            ("hospital", "医院"),
            ("crossing", "十字路口"),
            ("turn", "转弯"),
            ("left", "向左"),
            ("straight", "笔直地"),
            ("right", "向右"),
            ("ask", "问"),
            ("sir", "先生"),
            ("interesting", "有趣的"),
            ("Italian", "意大利的"),
            ("restaurant", "餐馆"),
            ("pizza", "比萨饼"),
            ("street", "街道"),
            ("get", "到达"),
            ("GPS", "全球定位系统"),
            ("feature", "特点"),
            ("follow", "跟着"),
            ("far", "远"),
            ("tell", "告诉"),
        ],
        "sentences": [
            ("Where is the museum shop?", "博物馆商店在哪里？"),
            ("It's near the door.", "它在门附近。"),
            ("How can I get there?", "我怎么到那里？"),
            ("Turn left at the bookstore.", "在书店左转。"),
            ("Is there a cinema near here?", "这附近有电影院吗？"),
        ],
    },
    {
        "unit": 2,
        "title": "Unit 2: Ways to go to school",
        "words": [
            ("on foot", "步行"),
            ("by", "乘"),
            ("bus", "公共汽车"),
            ("plane", "飞机"),
            ("taxi", "出租车"),
            ("ship", "轮船"),
            ("subway", "地铁"),
            ("train", "火车"),
            ("slow", "慢的"),
            ("slow down", "慢下来"),
            ("stop", "停下"),
            ("early", "早到的"),
            ("helmet", "头盔"),
            ("must", "必须"),
            ("wear", "戴；穿"),
            ("attention", "注意"),
            ("pay attention to", "注意"),
            ("traffic", "交通"),
            ("traffic lights", "交通信号灯"),
            ("fast", "快的"),
            ("ferry", "轮渡"),
        ],
        "sentences": [
            ("How do you come to school?", "你怎么来学校？"),
            ("I usually come on foot.", "我通常步行来。"),
            ("How does he go to school?", "他怎么去学校？"),
            ("He goes by bike.", "他骑自行车去。"),
            ("Don't go at the red light!", "红灯不要走！"),
            ("Slow down and stop at a yellow light.", "黄灯减速停下。"),
        ],
    },
    {
        "unit": 3,
        "title": "Unit 3: My weekend plan",
        "words": [
            ("visit", "拜访"),
            ("film", "电影"),
            ("see a film", "看电影"),
            ("trip", "旅行"),
            ("take a trip", "去旅行"),
            ("supermarket", "超市"),
            ("evening", "晚上"),
            ("tonight", "今晚"),
            ("tomorrow", "明天"),
            ("next week", "下周"),
            ("dictionary", "词典"),
            ("comic", "滑稽的"),
            ("comic book", "连环画册"),
            ("word", "单词"),
            ("word book", "单词本"),
            ("postcard", "明信片"),
            ("lesson", "课"),
            ("space", "太空"),
            ("travel", "旅行"),
            ("together", "一起"),
            ("mooncake", "月饼"),
            ("poem", "诗"),
            ("moon", "月亮"),
        ],
        "sentences": [
            ("What are you going to do tomorrow?", "你明天打算做什么？"),
            ("I'm going to have an art lesson.", "我打算上美术课。"),
            ("Where are you going?", "你要去哪里？"),
            ("I'm going to the bookstore.", "我要去书店。"),
            ("When are you going?", "你什么时候去？"),
        ],
    },
    {
        "unit": 4,
        "title": "Unit 4: I have a pen pal",
        "words": [
            ("pen pal", "笔友"),
            ("hobby", "爱好"),
            ("idea", "想法"),
            ("puzzle", "拼图"),
            ("hiking", "远足"),
            ("different", "不同的"),
            ("live", "住；居住"),
            ("teach", "教"),
            ("watch", "看"),
            ("go", "去"),
            ("read", "读"),
            ("country", "国家"),
            ("also", "也"),
            ("amazing", "令人惊奇的"),
        ],
        "sentences": [
            ("What are Peter's hobbies?", "彼得的爱好是什么？"),
            ("He likes reading stories.", "他喜欢读故事。"),
            ("Does he live in Sydney?", "他住在悉尼吗？"),
            ("No, he doesn't.", "不，他不住。"),
            ("Does he like doing word puzzles?", "他喜欢做字谜吗？"),
        ],
    },
    {
        "unit": 5,
        "title": "Unit 5: What does he do?",
        "words": [
            ("factory", "工厂"),
            ("worker", "工人"),
            ("postman", "邮递员"),
            ("businessman", "商人"),
            ("police officer", "警察"),
            ("fisherman", "渔民"),
            ("scientist", "科学家"),
            ("pilot", "飞行员"),
            ("coach", "教练"),
            ("head teacher", "校长"),
            ("sea", "大海"),
            ("stay", "保持"),
            ("university", "大学"),
            ("gym", "体育馆"),
            ("reporter", "记者"),
            ("secretary", "秘书"),
        ],
        "sentences": [
            ("What does he do?", "他是做什么的？"),
            ("He's a businessman.", "他是商人。"),
            ("Where does he work?", "他在哪里工作？"),
            ("He works at sea.", "他在海上工作。"),
            ("How does he go to work?", "他怎么去上班？"),
            ("He goes to work by bike.", "他骑自行车上班。"),
        ],
    },
    {
        "unit": 6,
        "title": "Unit 6: How do you feel?",
        "words": [
            ("angry", "生气的"),
            ("afraid", "害怕的"),
            ("sad", "难过的"),
            ("worried", "担心的"),
            ("happy", "高兴的"),
            ("see a doctor", "看病"),
            ("more", "更多的"),
            ("deep", "深的"),
            ("breath", "呼吸"),
            ("take a deep breath", "深呼吸"),
            ("count", "数数"),
            ("chase", "追赶"),
            ("mice", "老鼠（复数）"),
            ("bad", "坏的"),
            ("hurt", "受伤"),
            ("ill", "有病的"),
            ("wrong", "有毛病"),
            ("should", "应该"),
            ("feel", "感到"),
            ("well", "健康的"),
            ("sit", "坐"),
            ("grass", "草坪"),
            ("hear", "听见"),
            ("ant", "蚂蚁"),
            ("worry", "担心"),
            ("stuck", "陷住的"),
            ("mud", "泥"),
            ("pull", "拉"),
        ],
        "sentences": [
            ("How do you feel?", "你感觉怎么样？"),
            ("I feel happy.", "我感到高兴。"),
            ("How does Amy feel?", "艾米感觉怎么样？"),
            ("She's sad.", "她很难过。"),
            ("What's wrong?", "怎么了？"),
            ("He should see a doctor.", "他应该去看医生。"),
            ("You should take a deep breath.", "你应该深呼吸。"),
        ],
    },
]


def generate_word_distractors(correct_answer: str, all_words: list[tuple[str, str]]) -> list[str]:
    """为单词题生成3个干扰项"""
    # 排除正确答案
    candidates = [cn for en, cn in all_words if cn != correct_answer]
    if len(candidates) < 3:
        # 如果候选不够，添加通用干扰项
        candidates.extend(["学习", "工作", "玩耍", "休息", "吃饭", "睡觉"])
    
    # 随机选择3个
    distractors = random.sample(candidates, min(3, len(candidates)))
    return distractors


def generate_sentence_distractors(correct_answer: str) -> list[str]:
    """为句型题生成3个干扰项（通用错误翻译）"""
    # 简单策略：生成一些常见的错误翻译模式
    distractors = [
        "我不知道。",
        "这是什么？",
        "你好吗？",
        "再见。",
        "谢谢你。",
        "对不起。",
        "没关系。",
        "我明白了。",
    ]
    # 排除正确答案
    distractors = [d for d in distractors if d != correct_answer]
    return random.sample(distractors, min(3, len(distractors)))


def create_word_question(english: str, chinese: str, all_words: list[tuple[str, str]]) -> dict:
    """创建单词选择题"""
    distractors = generate_word_distractors(chinese, all_words)
    options = [chinese] + distractors
    random.shuffle(options)
    
    # 找到正确答案的选项标签
    correct_index = options.index(chinese)
    correct_label = chr(65 + correct_index)  # A, B, C, D
    
    return {
        "question_type": QuestionType.choice,
        "content": {
            "question": f"单词 \"{english}\" 的中文意思是？",
            "options": {
                "A": options[0],
                "B": options[1],
                "C": options[2],
                "D": options[3] if len(options) > 3 else options[0],
            }
        },
        "answer": correct_label,
        "explanation": f"{english} 的意思是 {chinese}",
        "difficulty": ExamDifficulty.easy,
        "points": 5,
    }


def create_sentence_question(english: str, chinese: str) -> dict:
    """创建句型选择题"""
    distractors = generate_sentence_distractors(chinese)
    options = [chinese] + distractors
    random.shuffle(options)
    
    correct_index = options.index(chinese)
    correct_label = chr(65 + correct_index)
    
    return {
        "question_type": QuestionType.choice,
        "content": {
            "question": f"句子 \"{english}\" 的中文意思是？",
            "options": {
                "A": options[0],
                "B": options[1],
                "C": options[2],
                "D": options[3] if len(options) > 3 else options[0],
            }
        },
        "answer": correct_label,
        "explanation": f"正确翻译：{chinese}",
        "difficulty": ExamDifficulty.medium,
        "points": 10,
    }


def main():
    # 连接数据库
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    with Session(engine) as session:
        # 获取第一个管理员用户作为创建者
        admin = session.exec(
            select(User).where(User.is_superuser == True).limit(1)
        ).first()
        
        if not admin:
            print("❌ 未找到管理员用户，请先创建管理员账户")
            return
        
        print(f"✅ 使用管理员账户: {admin.email}")
        
        # 为每个单元创建试卷
        for unit_data in UNITS_DATA:
            unit_num = unit_data["unit"]
            title = unit_data["title"]
            words = unit_data["words"]
            sentences = unit_data["sentences"]
            
            print(f"\n📝 创建试卷: {title}")
            
            # 创建 ExamTemplate
            template = ExamTemplate(
                title=f"六年级上册英语 {title}",
                subject=ExamSubject.english,
                source_type=ExamSourceType.manual,
                difficulty=ExamDifficulty.medium,
                question_count=len(words) + len(sentences),
                time_limit_seconds=1800,  # 30分钟
                coins_reward_rules={
                    "90": 50,
                    "80": 30,
                    "60": 10,
                    "0": 0,
                },
                is_active=True,
                created_by=admin.id,
            )
            session.add(template)
            session.commit()
            session.refresh(template)
            
            print(f"  ✓ 试卷已创建 (ID: {template.id})")
            
            # 创建单词题
            print(f"  📚 添加 {len(words)} 个单词题...")
            for english, chinese in words:
                q_data = create_word_question(english, chinese, words)
                question = Question(
                    template_id=template.id,
                    **q_data
                )
                session.add(question)
            
            # 创建句型题
            print(f"  💬 添加 {len(sentences)} 个句型题...")
            for english, chinese in sentences:
                q_data = create_sentence_question(english, chinese)
                question = Question(
                    template_id=template.id,
                    **q_data
                )
                session.add(question)
            
            session.commit()
            print(f"  ✅ Unit {unit_num} 完成！共 {len(words) + len(sentences)} 道题")
        
        print("\n" + "="*60)
        print("🎉 所有试卷创建完成！")
        print("="*60)
        
        # 统计
        total_templates = session.exec(
            select(ExamTemplate).where(ExamTemplate.subject == ExamSubject.english)
        ).all()
        total_questions = session.exec(
            select(Question)
        ).all()
        
        print(f"\n📊 统计信息：")
        print(f"  - 试卷总数: {len(total_templates)}")
        print(f"  - 题目总数: {len(total_questions)}")
        print(f"\n💡 提示：家长和孩子现在可以在系统中预约和参加这些考试了！")


if __name__ == "__main__":
    main()
