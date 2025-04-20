import { FC, useEffect, useState } from 'react';

import { useHasMounted } from 'closer';

const getCode = () =>
  Math.abs(Math.round(Math.random() * 255 * 0.5 + 100)).toString(16);
const getColor = () => `#${getCode()}${getCode()}${getCode()}`;
const makePlayground = () => (
  <>
    <span style={{ color: getColor() }}>p</span>
    <span style={{ color: getColor() }}>l</span>
    <span style={{ color: getColor() }}>a</span>
    <span style={{ color: getColor() }}>y</span>
    <span style={{ color: getColor() }}>g</span>
    <span style={{ color: getColor() }}>r</span>
    <span style={{ color: getColor() }}>o</span>
    <span style={{ color: getColor() }}>u</span>
    <span style={{ color: getColor() }}>n</span>
    <span style={{ color: getColor() }}>d</span>
  </>
);

export const Playground: FC = () => {
  const hasMounted = useHasMounted();
  const [playground, setPlayground] = useState(makePlayground());

  useEffect(() => {
    const interval = setInterval(() => setPlayground(makePlayground()), 150);
    return () => clearInterval(interval);
  }, []);

  if (!hasMounted) return null;
  return <>{playground}</>;
};
