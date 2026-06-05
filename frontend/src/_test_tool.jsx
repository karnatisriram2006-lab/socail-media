import { useState } from 'react';
export default function TestTool() {
  const [x, setX] = useState(0);
  return <div>{x}</div>;
}