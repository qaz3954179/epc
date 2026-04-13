#!/usr/bin/env python3
"""
导入人教版PEP五年级下册 + 六年级下册英语单词和句型到考试系统
"""
import sys
import random
from pathlib import Path

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlmodel import Session, create_engine, select, func
from app.core.config import settings
from app.models import (
    ExamTemplate, Question, ExamSubject, ExamDifficulty,
    ExamSourceType, QuestionType, User,
)

# ═══════════════════════════════════════════════════════════════
# 五年级下册
# ═══════════════════════════════════════════════════════════════
GRADE5_VOL2 = [
    {
        "unit": 1,
        "title": "Unit 1: My day",
        "words": [
            ("eat breakfast", "吃早餐"),
            ("have...class", "上……课"),
            ("play sports", "做运动"),
            ("exercise", "活动；运动"),
            ("do morning exercises", "做早操"),
            ("eat dinner", "吃晚餐"),
            ("clean my room", "打扫我的房间"),
            ("go for a walk", "去散步"),
            ("go shopping", "去购物"),
            ("take", "上（课）"),
            ("dancing", "跳舞"),
            ("take a dancing class", "上舞蹈课"),
            ("when", "什么时候"),
            ("after", "在……之后"),
            ("start", "开始"),
            ("usually", "通常"),
            ("Spain", "西班牙"),
            ("late", "晚；迟"),
            ("a.m.", "上午"),
            ("p.m.", "下午"),
            ("why", "为什么"),
            ("shop", "购物"),
            ("work", "工作"),
            ("last", "最后的"),
            ("sound", "听起来"),
            ("also", "也"),
            ("busy", "忙的"),
            ("need", "需要"),
            ("play", "玩"),
        ],
        "sentences": [
            ("When do you finish class in the morning?", "你上午什么时候下课？"),
            ("We finish class at 1 o'clock.", "我们一点钟下课。"),
            ("What do you do on the weekend?", "你周末做什么？"),
            ("I often clean my room on Saturdays.", "我经常在周六打扫房间。"),
            ("When do you get up?", "你什么时候起床？"),
            ("I usually get up at 6:30.", "我通常六点半起床。"),
        ],
    },
    {
        "unit": 2,
        "title": "Unit 2: My favourite season",
        "words": [
            ("spring", "春天"),
            ("summer", "夏天"),
            ("autumn", "秋天"),
            ("winter", "冬天"),
            ("season", "季节"),
            ("picnic", "野餐"),
            ("go on a picnic", "去野餐"),
            ("pick", "摘；采集"),
            ("pick apples", "摘苹果"),
            ("snowman", "雪人"),
            ("make a snowman", "堆雪人"),
            ("go swimming", "去游泳"),
            ("which", "哪一个"),
            ("best", "最；最好的"),
            ("snow", "雪"),
            ("good", "好的"),
            ("weather", "天气"),
            ("fall", "秋天"),
            ("because", "因为"),
            ("vacation", "假期"),
            ("all", "全部的"),
            ("pink", "粉色的"),
            ("lovely", "可爱的"),
            ("leaf", "叶子"),
            ("leaves", "叶子（复数）"),
            ("paint", "画"),
        ],
        "sentences": [
            ("Which season do you like best?", "你最喜欢哪个季节？"),
            ("I like spring best.", "我最喜欢春天。"),
            ("Why?", "为什么？"),
            ("Because I can fly kites.", "因为我可以放风筝。"),
            ("What's the weather like in autumn?", "秋天天气怎么样？"),
            ("It's sunny and cool.", "阳光明媚，很凉爽。"),
        ],
    },
    {
        "unit": 3,
        "title": "Unit 3: My school calendar",
        "words": [
            ("January", "一月"),
            ("February", "二月"),
            ("March", "三月"),
            ("April", "四月"),
            ("May", "五月"),
            ("June", "六月"),
            ("July", "七月"),
            ("August", "八月"),
            ("September", "九月"),
            ("October", "十月"),
            ("November", "十一月"),
            ("December", "十二月"),
            ("few", "一些"),
            ("a few", "一些"),
            ("thing", "事情"),
            ("meet", "集会"),
            ("sports meet", "运动会"),
            ("Easter", "复活节"),
            ("trip", "旅行"),
            ("year", "年"),
            ("plant", "种植"),
            ("contest", "比赛"),
            ("the Great Wall", "长城"),
            ("national", "国家的"),
            ("National Day", "国庆节"),
            ("American", "美国的"),
            ("Thanksgiving", "感恩节"),
            ("Christmas", "圣诞节"),
            ("holiday", "假日"),
            ("game", "游戏"),
        ],
        "sentences": [
            ("When is the party?", "聚会什么时候？"),
            ("It's in April.", "在四月。"),
            ("When is the trip this year?", "今年的旅行是什么时候？"),
            ("It's in October. We'll go to the Great Wall.", "在十月。我们将去长城。"),
            ("We'll have a school trip.", "我们将有一次学校旅行。"),
        ],
    },
    {
        "unit": 4,
        "title": "Unit 4: When is Easter?",
        "words": [
            ("first", "第一"),
            ("second", "第二"),
            ("third", "第三"),
            ("fourth", "第四"),
            ("fifth", "第五"),
            ("eighth", "第八"),
            ("ninth", "第九"),
            ("twelfth", "第十二"),
            ("twentieth", "第二十"),
            ("twenty-first", "第二十一"),
            ("twenty-third", "第二十三"),
            ("thirtieth", "第三十"),
            ("special", "特别的"),
            ("fool", "蠢人"),
            ("kitten", "小猫"),
            ("diary", "日记"),
            ("still", "仍然"),
            ("noise", "声响"),
            ("fur", "皮毛"),
            ("open", "打开"),
            ("walk", "散步"),
        ],
        "sentences": [
            ("When is your birthday?", "你的生日是什么时候？"),
            ("My birthday is on April 4th.", "我的生日在四月四日。"),
            ("Is your birthday in February?", "你的生日在二月吗？"),
            ("What will you do for your mum?", "你将为妈妈做什么？"),
            ("I'll cook for her.", "我将为她做饭。"),
        ],
    },
    {
        "unit": 5,
        "title": "Unit 5: Whose dog is it?",
        "words": [
            ("mine", "我的"),
            ("yours", "你（们）的"),
            ("his", "他的"),
            ("hers", "她的"),
            ("theirs", "他们的"),
            ("ours", "我们的"),
            ("climbing", "正在攀爬"),
            ("eating", "正在吃"),
            ("playing", "正在玩"),
            ("jumping", "正在跳"),
            ("drinking", "正在喝"),
            ("sleeping", "正在睡觉"),
            ("each", "每一"),
            ("other", "其他"),
            ("each other", "互相"),
            ("excited", "兴奋的"),
        ],
        "sentences": [
            ("Whose dog is it?", "这是谁的狗？"),
            ("It's mine.", "它是我的。"),
            ("The yellow picture is mine.", "黄色的画是我的。"),
            ("Are these all ours?", "这些都是我们的吗？"),
            ("Is he drinking water?", "他在喝水吗？"),
            ("No, he isn't. He's eating.", "不，他没有。他在吃东西。"),
        ],
    },
    {
        "unit": 6,
        "title": "Unit 6: Work quietly!",
        "words": [
            ("doing morning exercises", "正在做早操"),
            ("having...class", "正在上……课"),
            ("eating lunch", "正在吃午餐"),
            ("reading a book", "正在看书"),
            ("listening to music", "正在听音乐"),
            ("keep", "保持"),
            ("keep to the right", "靠右"),
            ("keep your desk clean", "保持桌面整洁"),
            ("talk quietly", "小声说话"),
            ("turn", "轮流"),
            ("bamboo", "竹子"),
            ("its", "它的"),
            ("wall", "墙"),
            ("show", "展览"),
            ("anything", "任何事物"),
            ("else", "其他"),
        ],
        "sentences": [
            ("What are they doing?", "他们在做什么？"),
            ("They're eating lunch.", "他们在吃午餐。"),
            ("What's the little monkey doing?", "小猴子在做什么？"),
            ("It's playing with its mother.", "它在和妈妈玩。"),
            ("Shhh. Talk quietly.", "嘘。小声说话。"),
            ("Keep your desk clean.", "保持桌面整洁。"),
        ],
    },
]

# ═══════════════════════════════════════════════════════════════
# 六年级下册
# ═══════════════════════════════════════════════════════════════
GRADE6_VOL2 = [
    {
        "unit": 1,
        "title": "Unit 1: How tall are you?",
        "words": [
            ("younger", "更年轻的"),
            ("older", "更年长的"),
            ("taller", "更高的"),
            ("shorter", "更矮的"),
            ("longer", "更长的"),
            ("thinner", "更瘦的"),
            ("heavier", "更重的"),
            ("bigger", "更大的"),
            ("smaller", "更小的"),
            ("stronger", "更强壮的"),
            ("dinosaur", "恐龙"),
            ("hall", "大厅"),
            ("metre", "米"),
            ("than", "比"),
            ("both", "两个都"),
            ("kilogram", "千克"),
            ("countryside", "乡村"),
            ("lower", "更低的"),
            ("shadow", "影子"),
            ("smarter", "更聪明的"),
            ("become", "变成"),
        ],
        "sentences": [
            ("How tall are you?", "你多高？"),
            ("I'm 1.65 metres.", "我1.65米。"),
            ("I'm taller than you.", "我比你高。"),
            ("How heavy are you?", "你多重？"),
            ("I'm 48 kilograms.", "我48千克。"),
            ("Who is taller?", "谁更高？"),
            ("You're older than me.", "你比我大。"),
        ],
    },
    {
        "unit": 2,
        "title": "Unit 2: Last weekend",
        "words": [
            ("cleaned", "打扫（过去式）"),
            ("stayed", "停留（过去式）"),
            ("washed", "洗（过去式）"),
            ("watched", "看（过去式）"),
            ("had", "得（过去式）"),
            ("had a cold", "感冒了"),
            ("slept", "睡觉（过去式）"),
            ("read", "读（过去式）"),
            ("saw", "看见（过去式）"),
            ("last", "上一个"),
            ("yesterday", "昨天"),
            ("before", "在……之前"),
            ("drank", "喝（过去式）"),
            ("show", "表演"),
            ("magazine", "杂志"),
            ("better", "更好的"),
            ("faster", "更快的"),
            ("hotel", "旅馆"),
            ("fixed", "修理（过去式）"),
            ("broken", "坏掉的"),
            ("lamp", "台灯"),
            ("loud", "大声的"),
            ("enjoy", "享受"),
        ],
        "sentences": [
            ("How was your weekend?", "你周末过得怎么样？"),
            ("It was good, thank you.", "很好，谢谢。"),
            ("What did you do last weekend?", "你上周末做了什么？"),
            ("I stayed at home and watched TV.", "我待在家里看了电视。"),
            ("Did you do anything else?", "你还做了别的什么吗？"),
            ("I cleaned my room and washed my clothes.", "我打扫了房间，洗了衣服。"),
        ],
    },
    {
        "unit": 3,
        "title": "Unit 3: Where did you go?",
        "words": [
            ("went", "去（过去式）"),
            ("camp", "野营"),
            ("went camping", "去野营了"),
            ("fish", "钓鱼"),
            ("went fishing", "去钓鱼了"),
            ("rode", "骑（过去式）"),
            ("rode a horse", "骑马了"),
            ("hurt", "受伤（过去式）"),
            ("ate", "吃（过去式）"),
            ("took", "拍（过去式）"),
            ("took pictures", "拍照了"),
            ("bought", "买（过去式）"),
            ("gift", "礼物"),
            ("fell", "摔倒（过去式）"),
            ("fell off", "从……上摔下"),
            ("Labour Day", "劳动节"),
            ("mule", "骡子"),
            ("could", "能（过去式）"),
            ("till", "直到"),
            ("beach", "海滩"),
            ("basket", "篮子"),
            ("part", "角色"),
            ("licked", "舔（过去式）"),
            ("laughed", "笑（过去式）"),
        ],
        "sentences": [
            ("Where did you go over the winter holiday?", "寒假你去了哪里？"),
            ("I went to Sanya.", "我去了三亚。"),
            ("How did you go there?", "你怎么去的？"),
            ("I went by plane.", "我坐飞机去的。"),
            ("What did you do?", "你做了什么？"),
            ("I took pictures.", "我拍了照片。"),
            ("Did you go to Turpan?", "你去了吐鲁番吗？"),
            ("Yes, I did. / No, I didn't.", "是的。/ 不，没有。"),
        ],
    },
    {
        "unit": 4,
        "title": "Unit 4: Then and now",
        "words": [
            ("dining hall", "饭厅"),
            ("grass", "草坪"),
            ("gym", "体育馆"),
            ("ago", "以前"),
            ("cycling", "骑自行车"),
            ("go cycling", "去骑自行车"),
            ("ice-skate", "滑冰"),
            ("badminton", "羽毛球"),
            ("star", "星星"),
            ("easy", "容易的"),
            ("look up", "查阅"),
            ("Internet", "互联网"),
            ("different", "不同的"),
            ("active", "活跃的"),
            ("race", "赛跑"),
            ("nothing", "没有什么"),
            ("thought", "想（过去式）"),
            ("felt", "感到（过去式）"),
            ("cheetah", "猎豹"),
            ("trip", "旅行"),
            ("woke", "醒来（过去式）"),
            ("dream", "梦"),
        ],
        "sentences": [
            ("There was no gym in my school twenty years ago.", "二十年前我的学校没有体育馆。"),
            ("Now there's a new one.", "现在有一个新的了。"),
            ("Tell us about your school, please.", "请给我们讲讲你的学校。"),
            ("Before, I was quiet. Now, I'm very active.", "以前我很安静。现在我很活跃。"),
            ("How do you know that?", "你怎么知道的？"),
            ("There were no computers or Internet.", "以前没有电脑和互联网。"),
        ],
    },
]


def generate_word_distractors(correct: str, all_words: list[tuple[str, str]]) -> list[str]:
    candidates = [cn for _, cn in all_words if cn != correct]
    if len(candidates) < 3:
        candidates.extend(["学习", "工作", "玩耍", "休息", "吃饭", "睡觉", "跑步", "唱歌"])
    candidates = list(set(candidates))
    return random.sample(candidates, min(3, len(candidates)))


SENTENCE_DISTRACTORS = [
    "我不知道。", "这是什么？", "你好吗？", "再见。", "谢谢你。",
    "对不起。", "没关系。", "我明白了。", "你叫什么名字？", "今天星期几？",
    "现在几点了？", "你喜欢什么？", "我很高兴。", "天气很好。", "我们走吧。",
    "请坐下。", "打开书本。", "这是我的。", "他在哪里？", "她是老师。",
]


def generate_sentence_distractors(correct: str) -> list[str]:
    pool = [d for d in SENTENCE_DISTRACTORS if d != correct]
    return random.sample(pool, min(3, len(pool)))


def create_word_q(english, chinese, all_words):
    distractors = generate_word_distractors(chinese, all_words)
    options = [chinese] + distractors
    random.shuffle(options)
    idx = options.index(chinese)
    return {
        "question_type": QuestionType.choice,
        "content": {
            "question": f'单词 "{english}" 的中文意思是？',
            "options": {chr(65+i): options[i] for i in range(len(options))}
        },
        "answer": chr(65 + idx),
        "explanation": f"{english} 的意思是 {chinese}",
        "difficulty": ExamDifficulty.easy,
        "points": 5,
    }


def create_sentence_q(english, chinese):
    distractors = generate_sentence_distractors(chinese)
    options = [chinese] + distractors
    random.shuffle(options)
    idx = options.index(chinese)
    return {
        "question_type": QuestionType.choice,
        "content": {
            "question": f'句子 "{english}" 的中文意思是？',
            "options": {chr(65+i): options[i] for i in range(len(options))}
        },
        "answer": chr(65 + idx),
        "explanation": f"正确翻译：{chinese}",
        "difficulty": ExamDifficulty.medium,
        "points": 10,
    }


def import_grade(session, admin_id, grade_label, units_data):
    for unit_data in units_data:
        title = f"{grade_label} {unit_data['title']}"
        words = unit_data["words"]
        sentences = unit_data["sentences"]

        print(f"\n📝 创建试卷: {title}")

        template = ExamTemplate(
            title=title,
            subject=ExamSubject.english,
            source_type=ExamSourceType.manual,
            difficulty=ExamDifficulty.medium,
            question_count=len(words) + len(sentences),
            time_limit_seconds=1800,
            coins_reward_rules={"90": 50, "80": 30, "60": 10, "0": 0},
            is_active=True,
            created_by=admin_id,
        )
        session.add(template)
        session.commit()
        session.refresh(template)

        for en, cn in words:
            q = Question(template_id=template.id, **create_word_q(en, cn, words))
            session.add(q)

        for en, cn in sentences:
            q = Question(template_id=template.id, **create_sentence_q(en, cn))
            session.add(q)

        session.commit()
        print(f"  ✅ 完成！{len(words)} 单词题 + {len(sentences)} 句型题 = {len(words)+len(sentences)} 道")


def main():
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

    with Session(engine) as session:
        admin = session.exec(
            select(User).where(User.is_superuser == True).limit(1)
        ).first()
        if not admin:
            print("❌ 未找到管理员用户")
            return

        print(f"✅ 管理员: {admin.email}")

        print("\n" + "="*60)
        print("📘 导入五年级下册英语")
        print("="*60)
        import_grade(session, admin.id, "五年级下册英语", GRADE5_VOL2)

        print("\n" + "="*60)
        print("📗 导入六年级下册英语")
        print("="*60)
        import_grade(session, admin.id, "六年级下册英语", GRADE6_VOL2)

        # 统计
        all_tpl = session.exec(select(ExamTemplate).where(
            ExamTemplate.subject == ExamSubject.english
        )).all()
        total_q = session.exec(
            select(func.count()).select_from(Question)
        ).one()

        print("\n" + "="*60)
        print("🎉 全部导入完成！")
        print("="*60)
        for t in all_tpl:
            qc = session.exec(
                select(func.count()).select_from(Question).where(Question.template_id == t.id)
            ).one()
            print(f"  {t.title} — {qc} 题")
        print(f"\n📊 英语试卷总数: {len(all_tpl)} | 题目总数: {total_q}")


if __name__ == "__main__":
    main()
