import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js';

const BubbleChart = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [bubbles, setBubbles] = useState([
    {
      x: -10,
      y: 0,
      r: 30,
      backgroundColor: 'blue',
    },
    {
      x: 10,
      y: -10,
      r: 20,
      backgroundColor: 'red',
    },
    {
      x: 15,
      y: 10,
      r: 20,
      backgroundColor: 'red',
    },
    // ...
  ]);

  const initializeChart = () => {
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Bubbles',
            data: bubbles,
          },
        ],
      },
      options: {
        // ... Chart options ...
      },
    });
  };

  const addNewBubble = () => {
    const newBubble = {
      x: 10,                  // Adjust the x-coordinate for the new bubble
      y: 0,
      r: 20,                   // Adjust the radius for the new bubble
      backgroundColor: 'red', // Adjust the background color for the new bubble
    };

    setBubbles((prevBubbles) => [...prevBubbles, newBubble]);
  };

  const animateBubbles = () => {
    const datasets = chartInstance.current.data.datasets;

    if (datasets.length === 1) {
      const rightBubbles = datasets[0].data.slice(1);  // Retrieve the right-hand side bubbles

      if (rightBubbles.length >= 3) {
        const movedBubbles = rightBubbles.splice(0, 3);  // Remove three bubbles from the right-hand side

        // Move the bubbles to the left
        movedBubbles.forEach((bubble) => {
          bubble.x = -10;
        });

        // Increase the radius of the left-hand side bubble by 3
        datasets[0].data[0].r += 3;

        chartInstance.current.update();
      }
    }
  };

  useEffect(() => {
    initializeChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.data.datasets[0].data = bubbles;
      chartInstance.current.update();
    }
  }, [bubbles]);

  return (
    <div>
      <canvas ref={chartRef} />

      <button onClick={addNewBubble}>Add Bubble</button>
      <button onClick={animateBubbles}>Animate Bubbles</button>
    </div>
  );
};

export default BubbleChart;
