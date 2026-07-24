// test-highlight.tsx — 测试 JSX 语法高亮
import React, { useState, useEffect } from "react";

interface CardProps {
  title: string;
  count: number;
  onPress?: () => void;
}

// 函数组件 — 中文注释测试
const Card: React.FC<CardProps> = ({ title, count, onPress }) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    console.log(`Card ${title} mounted — 中文输出`);
  }, [title]);

  return (
    <div className="card" onClick={() => setExpanded(!expanded)}>
      <h2>{title}</h2>
      <p>Count: {count}</p>
      {expanded && (
        <div className="details">
          <span>状态: 已展开 — 中文测试</span>
          <button onClick={onPress}>操作按钮</button>
        </div>
      )}
    </div>
  );
};

// 类组件
class App extends React.Component<{}, { items: string[] }> {
  constructor(props: {}) {
    super(props);
    this.state = { items: ["项目A", "项目B", "项目C"] };
  }

  renderItems(): JSX.Element[] {
    return this.state.items.map((item, i) => (
      <li key={i}>{item}</li>
    ));
  }

  render(): JSX.Element {
    return (
      <div className="app">
        <header>
          <h1>测试应用 — 中文标题</h1>
        </header>
        <main>
          <ul>{this.renderItems()}</ul>
          <Card title="卡片标题" count={42} />
        </main>
      </div>
    );
  }
}

export default App;
