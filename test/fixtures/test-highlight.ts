// test-highlight.ts — 测试语法高亮、符号提取、代码折叠、中文注释
import { readFileSync } from "node:fs";

/**
 * 用户服务类 — 管理用户数据
 * 中文注释：测试非ASCII字符的字节偏移修正
 */
class UserService {
  private name: string;
  private age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 获取用户信息
  getUserInfo(): string {
    const info = `Name: ${this.name}, Age: ${this.age}`;
    return info; // 返回格式化字符串
  }

  // 检查是否成年 — 中文注释测试
  isAdult(): boolean {
    if (this.age >= 18) {
      return true;
    }
    return false;
  }
}

/**
 * 工具函数：计算两个数的和
 * @param a 第一个数字 — 中文测试
 * @param b 第二个数字
 */
function addNumbers(a: number, b: number): number {
  return a + b;
}

// 箭头函数 — 测试 lambda 识别
const multiply = (x: number, y: number): number => x * y;

// 接口定义
interface Config {
  debug: boolean;
  port: number;
  host: string; // 主机地址 — 中文测试
}

// 枚举
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING", // 等待中 — 中文测试
}

// 常量
const DEFAULT_CONFIG: Config = {
  debug: true,
  port: 8080,
  host: "localhost",
};

// 异步函数 — 测试 async/await
async function fetchData(url: string): Promise<string> {
  const response = await fetch(url);
  const text = await response.text();
  return text;
}

// 主函数 — 测试折叠：这个函数体较长，应该出现折叠按钮
function main(): void {
  const user = new UserService("张三", 25);
  const info = user.getUserInfo();
  console.log(info); // 打印用户信息 — 中文输出测试

  const sum = addNumbers(10, 20);
  console.log(multiply(sum, 2));

  if (user.isAdult()) {
    console.log("成年用户 — 中文字符串测试");
  } else {
    console.log("未成年用户");
  }
}

main();
