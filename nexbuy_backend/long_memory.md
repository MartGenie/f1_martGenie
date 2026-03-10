第一部分：管家迎新对话设计 (5步核心问卷)
Q1: 居住状态与空间属性 (The Context)
管家发问（中文）： “很高兴为您服务！首先想了解一下，您目前是在布置新买的房子，还是在为租住的公寓添置好物呢？大概的空间有多大？”
管家发问（英文）： "It's a pleasure to serve you! To start, are you furnishing a newly bought home, or adding pieces to a rented apartment? And how large is the space roughly?"
给选项/标签： 🏠 自有房屋 (长久居住) / 🔑 租房 (看重搬家便携) / 📏 小户型 (需收纳) / 🏡 大平层/别墅
🤖 对 Agent 的作用：
选了“租房”，Agent 以后会自动增加权重推荐“易拆装、轻便、高性价比”的家具。
选了“小户型”，Agent 的硬约束里会自动加上“尺寸紧凑、带收纳功能、多功能家具”。
Q2: 关键同住成员（The Hard Constraints - 最重要！）
管家发问（中文）： “您的家里除了您，还有哪些可爱的成员同住呢？（比如小宝宝、喵星人或汪星人），这决定了我为您挑选材质时的安全标准。”
管家发问（英文）： "Who else shares this lovely space with you? (e.g., toddlers, cats, or dogs). This helps me set the safety and material standards for your furniture."
给选项/标签： 🐱 喵星人 / 🐶 汪星人 / 👶 婴幼儿 / 👴🏻 长辈 / 👤 独居自由
🤖 对 Agent 的作用：
选了“猫”，写入长期记忆。以后的所有布艺家具查询，SQL 自动加上 WHERE features LIKE '%防抓%'。
选了“婴幼儿”，以后的所有家具查询，优先推荐“圆角设计、无甲醛/环保材质、防倾倒”。
Q3: 视觉与风格偏好 (The Aesthetic)
管家发问（中文）：“您最偏爱哪种装修风格？”
管家发问（英文）："What interior design style do you prefer the most?"
给选项/标签： 🪵 原木风 (Japandi) / ⚪ 极简现代 (Modern Minimalist) / 🏭 工业复古 (Industrial) / ☁️ 奶油风 (Creamy/Soft)
🤖 对 Agent 的作用：
直接填入我们之前设计的 style_preference 默认值。用户以后只要说“帮我买个沙发”，大模型查记忆发现是“原木风”，就会自动按原木风去搜索，用户不用再重复。
Q4: 消费理念与预算偏好 (The Financial Baseline)
管家发问（中文）： “在挑选大件家具（如沙发、床）时，您的消费理念更倾向于哪一种？”
管家发问（英文）： "When picking large furniture pieces (like sofas or beds), which shopping philosophy matches you best?"
给选项/标签： 💰 极致性价比 (平价好物) / ⚖️ 注重质感与长期投资 (中高端) / ✨ 追求顶级奢华 (大牌设计师款)
🤖 对 Agent 的作用：
这会给你的 bottom_price 和 list_price 过滤设定一个默认区间。比如选了“性价比”，Agent 在砍价时会更加激进，并在查库时默认排除单价过高的轻奢SKU。
Q5: 绝对避雷/禁忌 (The Deal-breakers)
管家发问（中文）： “最后，为了避免踩雷，您有什么绝对不能接受的材质或设计吗？（比如讨厌玻璃桌面、对某种材质过敏等）”
管家发问（英文）： "Finally, to avoid any missteps, are there any materials or designs you absolutely cannot stand? (e.g., hate glass tops, allergic to certain materials)."
用户自由输入（自然语言）： 例如：“我极度讨厌真皮沙发，夏天粘腿” 或 “家里有人对金属过敏”。
🤖 对 Agent 的作用：
大模型将其提炼为 negative_constraints (负向约束)，在查数据库时，使用 NOT LIKE 或向量检索的负向过滤，确保精准避坑。