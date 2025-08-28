import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});


const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid
        .render(`mermaid-${Date.now()}`, chart)
        .then((result) => {
          if (ref.current) {
            ref.current.innerHTML = result.svg;
          }
        })
        .catch((error) => {
          console.error('Mermaid rendering error:', error);
          if (ref.current) {
            ref.current.innerHTML = `<pre><code>${chart}</code></pre>`;
          }
        });
    }
  }, [chart]);

  return <div ref={ref} className="mermaid-diagram my-4" />;
};

export default MermaidDiagram;