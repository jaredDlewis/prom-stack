import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { getSketchFunc } from './Sketch';
import './App.css';
import { useMetrics } from './useMetrics';

function App() {
  const { metrics } = useMetrics();

  const stateRef = useRef({ metrics });

  // Keep the stateRef synchronized with metrics
  useEffect(() => {
    stateRef.current = { metrics };
  }, [metrics]);

  const containerRef = useRef(null);

  // Create p5Instance connected to stateRef and attach container ref
  useEffect(() => {
    const p5Instance = new p5(getSketchFunc(stateRef), containerRef.current);
    return () => p5Instance.remove();
  }, []);

  return (
    <div className='page'>
      <section className='header'>
        <h1>The Metrics Stack</h1>
      </section>
      <section className='content' ref={containerRef}></section>
    </div>
  );
}

export default App;
