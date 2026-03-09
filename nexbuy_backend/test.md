场景一：完美要素（Perfect Match）
测试目的： 验证 AI 能否在信息完全充足的情况下，直接输出 is_ready=True，并精准提取所有要素。
中文： 我有 5000 美金的预算，想买一套现代极简风的客厅家具，主要是买一个转角沙发和一个实木茶几。家里有一只金毛，面料需要耐抓。
英文： I have a budget of $5000 for modern minimalist living room furniture. I mainly need a sectional sofa and a solid wood coffee table. I have a Golden Retriever, so the fabric needs to be scratch-resistant.
🟡 场景二：缺失风格（Missing Style）
测试目的： 验证 AI 能否识别出缺少“风格”要素，判定 is_ready=False，并主动在回复中礼貌反问用户。
中文： 帮我配齐主卧的家具，主要是一张双人床和两个床头柜，总共准备了大概 3000 刀，要求用环保无毒材质，因为家里有孕妇。
英文： Help me furnish my master bedroom, mainly a double bed and two nightstands. I have about 3000 bucks in total. It must use eco-friendly and non-toxic materials because we have a pregnant woman at home.
🟡 场景三：缺失预算（Missing Budget）
测试目的： 验证 AI 是否会拦住没有预算的需求，要求用户提供预算。
中文： 我想要工业风的书房布置，需要一张大书桌和一把人体工学椅，尽快帮我搞定。
英文： I want an industrial style setup for my study room. I need a large desk and an ergonomic chair, get it done for me ASAP.
🔴 场景四：隐式拆解（Implicit Decomposition）
测试目的： 验证 AI 的“管家智商”。用户没有说具体买什么，看 AI 能不能自动拆解出“餐厅”和“客厅”的基础 SKU（如餐桌椅、沙发、电视柜等）。
中文： 我刚租了一个单身公寓，预算 8000 美元，喜欢日式原木风。帮我把整个餐厅和客厅配齐，空间比较小，家具尽量小巧一点。
英文： I just rented a studio apartment. My budget is $8000 and I like the Japanese wood style. Help me furnish the entire dining and living area. The space is quite small, so the furniture needs to be compact.
🟣 场景五：复杂硬性约束（Complex Constraints）
测试目的： 验证 AI 能否把复杂的自然语言转化为多条准确的 hard_constraints（如尺寸限制、材质、安全性）。
中文： 预算 2 万人民币，买一张意式轻奢风的餐桌，配 6 把椅子。要求餐桌长度绝对不能超过 2 米，最好是大理石桌面，边角必须圆润，因为家里有乱跑的小孩。
英文： Budget is 20,000 RMB. I want an Italian luxury style dining table with 6 chairs. The table length cannot exceed 2 meters, preferably a marble top, and the corners must be rounded because of toddlers running around.
🟠 场景六：口语化/俚语金额（Slang / Fuzzy Numbers）
测试目的： 验证大模型对人类口语化数字的提取能力（比如“两三千”、“grand/k”转化为具体的数字和货币）。
中文： 手头大概有两三千块钱吧，想搞个电竞房，买个升降桌和氛围灯，赛博朋克风的那种。
英文： I have about two or three grand on hand. I want to set up a gaming room, buy a standing desk and ambient lights, in a cyberpunk style.
🔵 场景七：跨房间/多品类（Cross-Room / Multi-Category）
测试目的： 验证 AI 在面对跨越多个房间的需求时，能否正确解析并分配到各个商品的 specific_features 中。
中文： 15000 美金，北欧风，需要买一套带收纳的次卧床，外加客厅的一个大地毯和一个电视柜。家里有猫也有狗，好清理最重要。
英文： $15,000, Scandinavian style. I need a guest bed with storage, plus a large rug and a TV stand for the living room. I have both cats and dogs, so being easy to clean is the most important thing.
⚪ 场景八：极度模糊/纯闲聊（Vague Intent / Chit-chat）
测试目的： 验证系统在面对无意义或过泛的话语时，能否温柔地引导用户进入填表流程，而不是胡乱生成。
中文： 我下周要搬新家了，想买点好看的家具，你们这有什么推荐的吗？
英文： I'm moving into a new house next week and want to buy some nice-looking furniture. What do you recommend?
🟤 场景九：微小预算/单品聚焦（Micro-Budget / Single Item）
测试目的： 验证单件小件物品的提取，确保大金额系统也能兼容小订单。
中文： 预算只有 500 刀，想买个复古风的单人沙发椅放在阳台看书，纯棉亚麻材质最好。
英文： Budget is only $500. I want to buy a vintage single sofa chair to put on the balcony for reading, preferably cotton and linen material.
🟨 场景十：矛盾/冲突需求（Conflicting Requirements）
测试目的： 极限测试。看看 AI 是如何处理非常反直觉或者预算极度不合理的请求（比如用极低的预算买极其复杂的定制品）。
中文： 我要买两张单人床给双胞胎儿子，现代风，总共预算 500 美元以内。必须是上下铺结构，而且楼梯里要带抽屉收纳。
英文： I need to buy two single beds for my twin boys, modern style, total budget under $500. It must be a bunk bed structure and the stairs must include drawer storage.