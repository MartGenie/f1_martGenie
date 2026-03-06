# homary_products 表字段说明（小白版）

这份文档用于说明：`homary_products` 这张表里到底存了什么、每个字段是什么意思、怎么查。

适用人群：第一次接触数据库/第一次接触本项目的人。

---

## 1. 这张表是干什么的？

`homary_products` 用来存 Homary 商品的“精简版数据”，来源是 `result/homary_spu.jsonl`。

它不是把原始 JSON 全塞进数据库，而是把常用字段拆开存，方便后续检索、筛选和展示。

---

## 2. 一条数据代表什么？

一条数据代表一个默认 SKU 商品记录。  
当前以 `sku_id_default` 作为唯一键（主键）。

简单理解：

- `spu_id`：款（大类/母商品）ID
- `sku_id_default`：默认规格（具体可售项）ID，当前唯一

---

## 3. 字段总览（按功能分组）

## A) 主键与身份信息

1. `sku_id_default`（TEXT，主键）
- 含义：默认 SKU ID，唯一标识一条商品记录。
- 说明：同一个 `sku_id_default` 重复导入时会更新，不会新增重复行。

2. `spu_id`（TEXT）
- 含义：SPU（款）ID。

3. `spu_code`（TEXT）
- 含义：SPU 业务编码。

4. `sku_code_default`（TEXT）
- 含义：默认 SKU 的业务编码。

---

## B) 标题与类目

5. `title`（TEXT，非空）
- 含义：商品标题。

6. `sub_title`（TEXT）
- 含义：副标题。

7. `category_name_1` ~ `category_name_4`（TEXT）
- 含义：1~4 级类目名称。

8. `category_id_1` ~ `category_id_4`（TEXT）
- 含义：1~4 级类目 ID。

---

## C) 评分评论

9. `rating_value`（NUMERIC(4,2)）
- 含义：评分值，例如 `4.90`。

10. `review_count`（INTEGER）
- 含义：评论数量。

---

## D) 图片与详情精简

11. `main_image_url`（TEXT）
- 含义：主图 URL。

12. `gallery_image_urls`（JSONB，非空，默认 `[]`）
- 含义：图集图片 URL 数组（最多保留一部分，避免太大）。
- 示例：`["https://...1.jpg","https://...2.jpg"]`

13. `gallery_image_count`（INTEGER，非空，默认 0）
- 含义：图集中图片总数（统计值）。

14. `gallery_video_count`（INTEGER，非空，默认 0）
- 含义：图集中视频总数（统计值）。

15. `description_text`（TEXT）
- 含义：商品详情文字（已去掉 HTML 标签）。

16. `specs`（JSONB，非空，默认 `{}`）
- 含义：规格参数摘要（键值对）。
- 示例：`{"Material":"Brass","Style":"Modern"}`

---

## E) 价格信息（数值优先）

17. `currency_symbol`（TEXT）
- 含义：货币符号（当前数据主要是 `$`）。

18. `sale_price`（NUMERIC(10,2)）
- 含义：当前销售价（来自 `p`）。

19. `original_price`（NUMERIC(10,2)）
- 含义：原价/对比价（来自 `np`）。

20. `tag_price`（NUMERIC(10,2)）
- 含义：标签价/活动口径价（来自 `tp`，部分商品为空）。

21. `compare_price`（NUMERIC(10,2)）
- 含义：另一价格口径（来自 `cp`）。

22. `final_price`（NUMERIC(10,2)）
- 含义：最终价口径（来自 `fp`）。

23. `price_kp_cents`（INTEGER）
- 含义：以“分”为单位的整数价（来自 `kp`）。
- 示例：`9999` 代表 `$99.99`。

24. `discount_text`（TEXT）
- 含义：折扣文本（如 `23%`）。

25. `discount_percent`（NUMERIC(5,2)）
- 含义：折扣数字（从 `discount_text` 解析出来），如 `23.00`。

---

## F) 库存状态与活动信息

26. `stock_status_code`（INTEGER）
- 含义：库存状态码（来自 `status_info_default.s`）。

27. `stock_status_text`（TEXT）
- 含义：库存状态文案（例如 `In stock`、`Sold Out`）。

28. `sale_region_status`（INTEGER）
- 含义：销售区域可售状态（来自 `sale_region_status`）。

29. `is_pre_sale`（INTEGER）
- 含义：是否预售（`0` 否，`1` 是）。

30. `activity_stock`（INTEGER）
- 含义：活动库存（`act_info_default.stock`）。

31. `activity_id`（TEXT）
- 含义：活动 ID。

32. `activity_type`（INTEGER）
- 含义：活动类型码（内部编码）。

33. `activity_price`（NUMERIC(10,2)）
- 含义：活动价。

34. `activity_start_ts`（BIGINT）
- 含义：活动开始时间戳（秒级）。

35. `activity_end_ts`（BIGINT）
- 含义：活动结束时间戳（秒级）。

36. `activity_tip_text`（TEXT）
- 含义：活动提示文案（例如“Only a few left！”）。

---

## G) 链接与时间

37. `product_url`（TEXT）
- 含义：商品页面 URL。

38. `canonical_url`（TEXT）
- 含义：规范化 URL（去重/SEO 常用）。

39. `created_at`（TIMESTAMPTZ）
- 含义：该行首次写入时间。

40. `updated_at`（TIMESTAMPTZ）
- 含义：该行最近一次更新的时间。

---

## 4. 常见问题（FAQ）

1. 为什么有些字段是 `NULL`？
- 原始数据里可能没有这个值（例如没有活动时 `act_info_default` 为 `null`），导入后就是 `NULL`。

2. 为什么不用带 `$` 的价格字符串？
- 数据库存的是数值字段，后续计算和排序更准确。展示时再拼接货币符号即可。

3. 为什么会“重复导入但行数不增加”？
- 因为主键是 `sku_id_default`，重复导入同一个 SKU 会触发更新（upsert），不是新增。

---

