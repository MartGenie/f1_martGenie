import argparse
import asyncio
import statistics
import time
from dataclasses import dataclass

from src.model.query_data import query_products_from_analysis
from src.model.user_content_analysis import analyze_user_content


DEFAULT_QUERIES = [
    "I need an industrial desk and ergonomic chair for my study room under $1500.",
    "Find a wood-style sofa for my living room, pet friendly, budget is $1200.",
    "I want a minimalist dining table set for 4 people under $2000.",
    "Recommend a modern sectional couch for a home with two cats under $1800.",
    "I need a cozy bedroom setup with a storage bed and two nightstands.",
]


@dataclass
class PerfRow:
    query: str
    analysis_ms: float
    query_ms: float
    total_ms: float
    product_count: int


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    rank = max(0, min(len(values) - 1, int(round((p / 100.0) * (len(values) - 1)))))
    return sorted(values)[rank]


async def _run_once(user_text: str, limit: int) -> PerfRow:
    t0 = time.perf_counter()
    analysis = await analyze_user_content([{"role": "user", "content": user_text}])
    t1 = time.perf_counter()
    result = await query_products_from_analysis(analysis, limit=limit)
    t2 = time.perf_counter()
    return PerfRow(
        query=user_text,
        analysis_ms=(t1 - t0) * 1000.0,
        query_ms=(t2 - t1) * 1000.0,
        total_ms=(t2 - t0) * 1000.0,
        product_count=len(result.products),
    )


async def main() -> None:
    parser = argparse.ArgumentParser(description="Latency benchmark for analysis + query pipeline.")
    parser.add_argument("--rounds", type=int, default=2, help="How many times to run each query.")
    parser.add_argument("--limit", type=int, default=10, help="Final products limit per query.")
    parser.add_argument("--warmup", type=int, default=1, help="Warmup runs (not counted).")
    args = parser.parse_args()

    rounds = max(1, args.rounds)
    warmup = max(0, args.warmup)
    limit = max(1, args.limit)

    print(f"Warmup runs: {warmup}")
    for _ in range(warmup):
        for q in DEFAULT_QUERIES:
            await _run_once(q, limit)

    rows: list[PerfRow] = []
    print(f"Measured rounds: {rounds}, queries per round: {len(DEFAULT_QUERIES)}")
    for i in range(rounds):
        print(f"Running round {i + 1}/{rounds} ...")
        for q in DEFAULT_QUERIES:
            row = await _run_once(q, limit)
            rows.append(row)
            print(
                f"- total={row.total_ms:.1f}ms | analysis={row.analysis_ms:.1f}ms "
                f"| query={row.query_ms:.1f}ms | products={row.product_count}"
            )

    totals = [r.total_ms for r in rows]
    analysis_vals = [r.analysis_ms for r in rows]
    query_vals = [r.query_ms for r in rows]
    counts = [r.product_count for r in rows]

    print("\n=== Summary ===")
    print(f"sample_size: {len(rows)}")
    print(
        "total_ms: "
        f"avg={statistics.mean(totals):.1f}, p50={_percentile(totals, 50):.1f}, "
        f"p95={_percentile(totals, 95):.1f}, max={max(totals):.1f}"
    )
    print(
        "analysis_ms: "
        f"avg={statistics.mean(analysis_vals):.1f}, p50={_percentile(analysis_vals, 50):.1f}, "
        f"p95={_percentile(analysis_vals, 95):.1f}"
    )
    print(
        "query_ms: "
        f"avg={statistics.mean(query_vals):.1f}, p50={_percentile(query_vals, 50):.1f}, "
        f"p95={_percentile(query_vals, 95):.1f}"
    )
    print(
        "product_count: "
        f"avg={statistics.mean(counts):.1f}, min={min(counts)}, max={max(counts)}"
    )

    slowest = max(rows, key=lambda r: r.total_ms)
    print("\nslowest_case:")
    print(f"query: {slowest.query}")
    print(
        f"total={slowest.total_ms:.1f}ms, analysis={slowest.analysis_ms:.1f}ms, "
        f"query={slowest.query_ms:.1f}ms, products={slowest.product_count}"
    )


if __name__ == "__main__":
    asyncio.run(main())

