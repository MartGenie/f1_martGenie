# AI Agent Optimized - 方法流程与分析

## 文件结构概览

```
ai_agent_optimized.py
├── 全局配置
│   ├── _session (HTTP Session with retry)
│   ├── _search_cache / _bundle_cache (全局缓存)
│   └── _optimized_agent (全局Agent实例)
│
├── 类定义
│   ├── SimpleCache (缓存类)
│   ├── WorkflowLog (工作流日志)
│   ├── Tool (工具基类)
│   ├── SearchTool (搜索工具)
│   ├── FilterTool (过滤工具)
│   ├── RecommendTool (推荐工具)
│   ├── BundleSearchTool (套装搜索工具)
│   └── OptimizedAIAgent (主AI Agent)
│
└── 函数
    └── get_optimized_ai_agent() (获取Agent实例)
```

---

## 1. SimpleCache 类

### 作用
带TTL（生存时间）的简单内存缓存，用于缓存搜索结果和套装搜索结果。

### 方法流程

#### `__init__(ttl_seconds: int = 300)`
```
初始化缓存
├── 创建空字典 _cache: Dict[str, tuple[Any, datetime]]
└── 设置TTL时间
```

#### `_make_key(*args, **kwargs) -> str`
```
生成缓存键
├── 将args和kwargs序列化为JSON
├── 按key排序确保一致性
└── MD5哈希生成固定长度键
```

#### `get(*args, **kwargs) -> Optional[Any]`
```mermaid
flowchart TD
    A[生成缓存键] --> B{键存在于缓存?}
    B -->|否| C[返回None]
    B -->|是| D[获取值和时间戳]
    D --> E{是否过期?}
    E -->|是| F[删除缓存项] --> C
    E -->|否| G[返回值]
```

#### `set(value: Any, *args, **kwargs)`
```
设置缓存值
├── 生成缓存键
└── 存储 (值, 当前时间) 元组
```

#### `clear()`
```
清空所有缓存
```

---

## 2. WorkflowLog 类

### 作用
表示单个工作流日志条目，用于追踪AI处理流程。

### 方法流程

#### `__init__(step, type, message, detail, status, metadata)`
```
初始化日志
├── 生成唯一ID: f"{timestamp}-{step}"
├── 保存步骤类型、消息、详情
├── 设置状态 (默认"active")
├── 保存元数据
└── 记录时间戳
```

#### `to_dict() -> Dict`
```
转换为字典格式
└── 返回包含所有字段的字典，timestamp转为ISO格式
```

---

## 3. Tool 基类

### 作用
所有工具的基类，定义工具的通用接口。

### 方法流程

#### `__init__(name, description, parameters)`
```
初始化工具
├── 工具名称
├── 工具描述
└── 参数定义 (JSON Schema格式)
```

#### `to_dict() -> Dict`
```
转换为OpenAI工具格式
└── 返回 {type: "function", function: {...}} 结构
```

---

## 4. SearchTool 类 (继承Tool)

### 作用
搜索家具产品，带缓存功能。

### 方法流程

#### `__init__()`
```
初始化
├── 调用父类初始化
│   ├── name: "search_products"
│   ├── description: 搜索家具产品
│   └── parameters: {query, category}
└── 初始化 FurnitureDatabase()
```

#### `execute(query, category) -> Dict`
```mermaid
flowchart TD
    A[开始搜索] --> B[生成缓存键]
    B --> C{缓存命中?}
    C -->|是| D[标记from_cache=True] --> E[返回缓存结果]
    C -->|否| F[调用db.hybrid_search]
    F --> G{有category?}
    G -->|是| H[按类别过滤]
    G -->|否| I[跳过过滤]
    H --> J[转换产品格式]
    I --> J
    J --> K[计算执行时间]
    K --> L[构建结果字典]
    L --> M[存入缓存]
    M --> N[返回结果]
```

**输出格式：**
```python
{
    "success": True,
    "count": int,
    "products": [...],  # 产品列表
    "metadata": {
        "query": str,
        "category": str,
        "execution_time_ms": float,
        "search_method": "semantic" | "fallback",
        "from_cache": bool
    }
}
```

---

## 5. FilterTool 类 (继承Tool)

### 作用
按价格范围过滤产品。

### 方法流程

#### `__init__()`
```
初始化
├── name: "filter_by_price"
├── description: 按价格过滤
└── parameters: {min_price, max_price}
```

#### `execute(products, min_price, max_price) -> Dict`
```mermaid
flowchart TD
    A[接收产品列表] --> B[按价格范围过滤]
    B --> C[按评分*评论数排序]
    C --> D[计算价格统计]
    D --> E[构建结果]
    E --> F[返回结果]
```

---

## 6. RecommendTool 类 (继承Tool)

### 作用
基于风格、房间、预算获取个性化推荐。

### 方法流程

#### `__init__()`
```
初始化
├── 调用父类初始化
└── 创建SearchTool实例
```

#### `execute(style, room, budget) -> Dict`
```mermaid
flowchart TD
    A[开始] --> B[构建查询]
    B --> C[有room?] -->|是| D[添加到查询]
    C -->|否| E[跳过]
    D --> F[有style?]
    E --> F
    F -->|是| G[添加到查询]
    F -->|否| H[跳过]
    G --> I[执行搜索]
    H --> I
    I --> J{有budget?}
    J -->|是| K[解析预算字符串]
    K --> L[应用价格过滤]
    J -->|否| M[跳过]
    L --> N[返回结果]
    M --> N
```

**预算解析规则：**
- "under $500" → max_price=500
- "around $1000" → price in [700, 1300]
- "over $2000" → min_price=2000

---

## 7. BundleSearchTool 类 (继承Tool)

### 作用
搜索多个相关产品作为套装。

### 方法流程

#### `__init__()`
```
初始化
├── name: "search_bundle"
├── description: 搜索套装
├── parameters: {items[], room, style, budget}
└── 创建SearchTool实例
```

#### `execute(items, room, style, budget) -> Dict`
```mermaid
flowchart TD
    A[开始] --> B{检查缓存}
    B -->|命中| C[返回缓存]
    B -->|未命中| D[遍历每个item]
    D --> E[构建查询: style + item]
    E --> F[调用search_tool.execute]
    F --> G[保存结果]
    G --> H{还有更多item?}
    H -->|是| D
    H -->|否| I{有budget?}

    I -->|是| J[计算目标单价: budget/数量]
    J --> K[对每个item的结果]
    K --> L[过滤价格区间: 0.3x ~ 1.5x目标价]
    L --> M[按接近目标价排序]
    M --> N[取前3个]

    I -->|否| O[取每个item的前3个]

    N --> P[计算最佳组合价格]
    O --> P
    P --> Q[构建bundle_items结构]
    Q --> R[存入缓存]
    R --> S[返回结果]
```

**输出格式：**
```python
{
    "success": True,
    "bundle_items": [
        {"item_type": "desk", "products": [...], "count": 3},
        {"item_type": "chair", "products": [...], "count": 3}
    ],
    "total_products": int,
    "metadata": {
        "items": [...],
        "room": str,
        "style": str,
        "budget": float,
        "suggested_combo_price": float
    }
}
```

---

## 8. OptimizedAIAgent 类 (核心类)

### 作用
主AI Agent，处理用户消息，协调工具调用。

### 属性
```python
self.tools = {
    "search_products": SearchTool(),
    "filter_by_price": FilterTool(),
    "get_recommendations": RecommendTool(),
    "search_bundle": BundleSearchTool()
}
self.conversation_history  # 对话历史
self.current_products      # 当前产品列表
self.workflow_logs         # 工作流日志
self._observers            # 观察者列表
self.current_bundle        # 当前套装
self.redis_store           # Redis存储
```

### 方法流程

#### `__init__(user_id)`
```mermaid
flowchart TD
    A[初始化] --> B[初始化所有工具]
    B --> C[设置user_id]
    C --> D[初始化空列表]
    D --> E{user_id存在?}
    E -->|是| F[从Redis加载对话历史]
    E -->|否| G[跳过]
```

#### `_load_conversation_history()`
```
从Redis加载历史
├── 检查user_id
├── 调用redis_store.get_messages(limit=50)
├── 设置到conversation_history
└── 异常时设置为空列表
```

#### `_save_message_to_redis(role, content)`
```
保存消息到Redis
├── 验证user_id有效
├── 构建消息字典(含时间戳)
├── 调用redis_store.save_message()
└── 打印日志
```

#### `set_user_id(user_id)`
```
设置用户ID
├── 更新user_id
└── 重新加载对话历史
```

#### `clear_conversation_history()`
```
清空对话历史
├── 清空内存中的历史
└── 清空Redis中的历史
```

#### `add_observer(callback)` / `_notify_observers(log)`
```
观察者模式
├── 添加回调函数到列表
└── 通知时遍历调用所有回调
```

#### `_add_log(step, type, message, detail, metadata)`
```
添加工作流日志
├── 创建WorkflowLog对象
├── 添加到workflow_logs列表
├── 通知所有观察者
└── 返回log对象
```

#### `get_tool_definitions() -> List[Dict]`
```
获取工具定义
└── 遍历self.tools，调用每个tool.to_dict()
```

#### `_get_system_prompt(current_products_count) -> str`
```
生成系统提示词
├── 基础角色定义
├── 关键规则 (CRITICAL RULES)
├── 可用工具列表
├── 工具选择规则
├── 套装预算规则
└── 当前产品数量
```

#### `_execute_tools_parallel(tool_calls) -> List[Dict]`
```mermaid
flowchart TD
    A[接收tool_calls列表] --> B[遍历每个tool_call]
    B --> C[提取function_name]
    C --> D[解析arguments JSON]
    D --> E[调用_execute_single_tool]
    E --> F[保存结果]
    F --> G{还有更多?}
    G -->|是| B
    G -->|否| H[返回所有结果]
```

#### `_execute_single_tool(tool_name, arguments) -> Dict`
```mermaid
flowchart TD
    A[接收工具名和参数] --> B{工具类型}

    B -->|search_products| C[记录understand日志]
    C --> D[执行搜索] --> E[记录search日志]
    E --> F[更新current_products] --> Z[返回]

    B -->|filter_by_price| G[记录filter日志]
    G --> H[执行过滤] --> I[记录rank日志]
    I --> J[更新current_products] --> Z

    B -->|get_recommendations| K[记录recommend日志]
    K --> L[执行推荐] --> M[更新current_products] --> Z

    B -->|search_bundle| N[记录bundle_start日志]
    N --> O[执行套装搜索] --> P[记录每个item的日志]
    P --> Q[合并所有产品]
    Q --> R[添加bundle_item_type标记]
    R --> S[更新current_products]
    S --> T[更新current_bundle] --> Z

    B -->|其他| U[返回错误]
```

#### `_calculate_match_accuracy(query, products) -> float`
```mermaid
flowchart TD
    A[接收查询和产品] --> B{产品为空?}
    B -->|是| C[返回0.0]
    B -->|否| D[提取查询关键词]
    D --> E[遍历产品]
    E --> F[基础分50]
    F --> G{关键词匹配?}
    G -->|是| H[加30分]
    G -->|否| I[跳过]
    H --> J[累加总分]
    I --> J
    J --> K{更多产品?}
    K -->|是| E
    K -->|否| L[计算平均分]
    L --> M[限制最大99.9]
    M --> N[返回结果]
```

#### `async process_message(message) -> Dict` (核心方法)

```mermaid
flowchart TD
    subgraph 初始化阶段
        A1[开始] --> A2[记录开始时间]
        A2 --> A3[清空workflow_logs]
        A3 --> A4[保存用户消息到Redis]
    end

    subgraph 第一次AI调用
        B1[构建消息列表] --> B2[添加系统提示词]
        B2 --> B3[添加最近4条历史]
        B3 --> B4[添加当前用户消息]
        B4 --> B5[构建API请求数据]
        B5 --> B6[调用LongCat API]
        B6 --> B7[解析响应]
    end

    subgraph 工具执行
        C1{有tool_calls?}
        C1 -->|是| C2[执行工具调用]
        C1 -->|否| C3[无工具分支]
        C2 --> C4[构建第二次消息]
        C4 --> C5[添加tool结果]
    end

    subgraph 第二次AI调用
        D1[构建最终请求] --> D2[调用API]
        D2 --> D3[获取最终回复]
    end

    subgraph 结果处理
        E1[记录complete日志] --> E2[更新对话历史]
        E2 --> E3[保存AI回复到Redis]
        E3 --> E4[提取bundle_info]
        E4 --> E5[计算响应时间]
        E5 --> E6[计算匹配准确度]
    end

    subgraph 返回结果
        F1[构建返回字典] --> F2[返回]
    end

    A4 --> B1
    B7 --> C1
    C5 --> D1
    D3 --> E1
    E6 --> F1
```

**详细步骤说明：**

```
1. 初始化阶段
   ├── 记录开始时间
   ├── 清空工作流日志
   └── 保存用户消息到Redis

2. 构建消息
   ├── System Prompt (动态生成，含当前产品数量)
   ├── Last 4 messages from conversation_history
   └── Current user message

3. 第一次API调用 (带tools)
   ├── Model: LongCat-Flash-Chat
   ├── tools: 4个工具定义
   ├── tool_choice: "auto"
   ├── temperature: 0.3
   └── max_tokens: 1500

4. 处理AI决策
   ├── Case 1: AI调用工具
   │   ├── 解析tool_calls
   │   ├── 执行工具 (并行)
   │   ├── 构建第二次消息 (含tool结果)
   │   └── 第二次API调用获取最终回复
   │
   └── Case 2: AI直接回复
       └── 无需搜索，直接返回回复

5. 结果处理
   ├── 记录完成日志
   ├── 更新对话历史 (保留最近8条)
   ├── 保存AI回复到Redis
   ├── 提取bundle_info (如果有)
   ├── 计算响应时间
   └── 计算匹配准确度

6. 返回格式
   {
       "reply": str,                    # AI回复文本
       "products": List[Dict],          # 产品列表(最多20个)
       "result_count": int,             # 产品总数
       "tools_used": List[str],         # 使用的工具
       "workflow_logs": List[Dict],     # 工作流日志
       "bundle_info": Optional[List],   # 套装信息
       "response_time": float,          # 响应时间(秒)
       "match_accuracy": float          # 匹配准确度(0-100)
   }

7. 错误处理
   ├── HTTP 429: 速率限制
   ├── HTTP Error: API错误
   └── Exception: 一般错误
```

---

## 9. 全局函数

#### `get_optimized_ai_agent() -> OptimizedAIAgent`
```mermaid
flowchart TD
    A[调用函数] --> B{_optimized_agent为None?}
    B -->|是| C[创建新实例]
    B -->|否| D[返回现有实例]
    C --> D
```

**单例模式**：确保整个应用只有一个Agent实例。

---

## 完整请求处理流程图

```mermaid
sequenceDiagram
    participant User as 用户
    participant API as FastAPI
    participant Agent as OptimizedAIAgent
    participant AI as LongCat AI
    participant Tools as 工具
    participant Redis as Redis
    participant DB as PostgreSQL

    User->>API: POST /chat/stream
    API->>Agent: process_message(message)

    Agent->>Redis: 保存用户消息
    Agent->>Agent: 构建System Prompt

    Agent->>AI: 第一次调用 (with tools)
    AI-->>Agent: 返回tool_calls

    Agent->>Tools: 执行工具调用

    alt SearchTool
        Tools->>DB: hybrid_search
        DB-->>Tools: 返回产品
        Tools->>Agent: 返回搜索结果
    end

    alt FilterTool
        Tools->>Agent: 返回过滤结果
    end

    alt RecommendTool
        Tools->>DB: 搜索
        DB-->>Tools: 返回产品
        Tools->>Agent: 返回推荐
    end

    alt BundleSearchTool
        Tools->>DB: 多次搜索
        DB-->>Tools: 返回多组产品
        Tools->>Agent: 返回套装组合
    end

    Agent->>AI: 第二次调用 (with tool results)
    AI-->>Agent: 返回最终回复

    Agent->>Redis: 保存AI回复
    Agent->>Agent: 计算准确度

    Agent-->>API: 返回完整结果
    API-->>User: 返回给前端
```

---

## 性能优化点

1. **缓存机制**
   - 搜索结果缓存 (5分钟TTL)
   - 套装搜索缓存 (5分钟TTL)

2. **连接池**
   - HTTP Session复用
   - 连接池大小: 20

3. **历史裁剪**
   - 只保留最近4条历史用于AI调用
   - 内存中保留最近8条

4. **超时设置**
   - API调用超时: 30秒
   - 重试次数: 2次

5. **Token限制**
   - 第一次调用: max_tokens=1500
   - 第二次调用: max_tokens=1000

---

## 错误处理策略

| 错误类型 | 处理方式 |
|---------|---------|
| 429 Rate Limit | 返回中文提示"请求过于频繁" |
| HTTP Error | 返回"API Error" |
| 通用 Exception | 返回"Error" |
| Redis连接失败 | 打印错误，继续运行 |
| 缓存失效 | 回退到数据库查询 |
