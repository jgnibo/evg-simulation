import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js';

const BubbleChart = () => {
  const chartRef = useRef(null);
  let chartInstance = null;

  const createChart = (leftBubbles, rightBubbles) => {
    const ctx = chartRef.current.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Left Bubbles',
            data: leftBubbles.map((bubble) => ({
              x: bubble.x,
              y: bubble.y,
              r: bubble.r,
              count: bubble.count,
            })),
            backgroundColor: 'blue',
            borderColor: 'blue',
          },
          {
            label: 'Right Bubbles',
            data: rightBubbles,
            backgroundColor: 'red',
            borderColor: 'red',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: false,
            grid: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
          y: {
            display: false,
            grid: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
        },
        plugins: {
          animation: {
            duration: 1000,
            onProgress: ({ animationObject }) => {
              const chartInstance = animationObject.chart;
              const { leftBubbles, rightBubbles } = animationObject.currentStep.options;

              chartInstance.data.datasets[0].data = leftBubbles.map((bubble) => ({
                x: bubble.x,
                y: bubble.y,
                r: bubble.r,
                count: bubble.count,
              }));
              chartInstance.data.datasets[1].data = rightBubbles;
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const data = context.dataset.data[context.dataIndex];
                return `Count: ${data.count}`;
              },
            },
          },
        },
      },
    });
  };

  const addRightBubbles = () => {
    const rightBubblesCount = Math.floor(Math.random() * 6) + 10; // Random number between 10 and 15
    const rightBubbles = [];

    for (let i = 0; i < rightBubblesCount; i++) {
      rightBubbles.push({
        x: 100, // Adjust the x-coordinate for the right bubbles
        y: Math.random() * 200, // Random y-coordinate within the chart height
        r: 5,
      });
    }

    chartInstance.options.animation.onProgress.currentStep.options.rightBubbles = rightBubbles;
    chartInstance.update();
  };

  const moveBubblesToLeft = () => {
    const { leftBubbles, rightBubbles } = chartInstance.options.animation.onProgress.currentStep.options;
    const movedBubbles = rightBubbles.splice(0, 5); // Move 5 bubbles from right to left

    movedBubbles.forEach((bubble) => {
      bubble.x = 0; // Move the bubble to the left side

      const leftBubbleIndex = leftBubbles.findIndex((leftBubble) => leftBubble.y === bubble.y);
      if (leftBubbleIndex !== -1) {
        leftBubbles[leftBubbleIndex].count += 1; // Increment the count for the corresponding left bubble
      } else {
        bubble.count = 1; // Initialize the count for the newly arrived bubble
        leftBubbles.push(bubble);
      }
    });

    chartInstance.options.animation.onProgress.currentStep.options.leftBubbles = leftBubbles;
    chartInstance.update();
  };
}  
