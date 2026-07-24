# test-highlight.py — 测试 Python 语法高亮和折叠
import json
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class User:
    """用户数据类 — 中文文档字符串测试"""
    name: str
    age: int
    email: Optional[str] = None


class DataProcessor:
    """数据处理类 — 中文注释测试"""

    def __init__(self, source_path: str):
        self.source_path = source_path
        self.users: List[User] = []
        self._cache = {}  # 私有缓存 — 中文注释

    def load_data(self) -> int:
        """加载并解析数据文件"""
        count = 0
        with open(self.source_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split(",")
                if len(parts) >= 2:
                    user = User(name=parts[0], age=int(parts[1]))
                    self.users.append(user)
                    count += 1
        return count

    def filter_adults(self) -> List[User]:
        """筛选成年用户 — 中文注释"""
        return [u for u in self.users if u.age >= 18]

    def to_json(self) -> str:
        """导出为 JSON"""
        result = []
        for user in self.users:
            result.append({
                "name": user.name,
                "age": user.age,
                "email": user.email,
            })
        return json.dumps(result, ensure_ascii=False, indent=2)


# 全局函数
def calculate_statistics(users: List[User]) -> dict:
    """计算用户统计信息 — 中文注释"""
    if not users:
        return {"count": 0, "avg_age": 0}

    total_age = sum(u.age for u in users)
    avg_age = total_age / len(users)

    return {
        "count": len(users),
        "avg_age": round(avg_age, 1),
        "min_age": min(u.age for u in users),
        "max_age": max(u.age for u in users),
    }


# 主程序入口 — 中文注释测试
if __name__ == "__main__":
    processor = DataProcessor("users.csv")
    loaded = processor.load_data()
    print(f"加载了 {loaded} 条用户数据 — 中文输出")

    stats = calculate_statistics(processor.users)
    print(json.dumps(stats, ensure_ascii=False, indent=2))
