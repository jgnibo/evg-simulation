import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';


import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';
import Button from '@mui/material/Button';



import './App.css';

const Input = styled(MuiInput)`
  width: 58px;
`;

const CustomSlider = styled(Slider)(({ theme }) => ({
  color: '#00693e', //color of the slider between thumbs
  "& .MuiSlider-thumb": {
    backgroundColor: '#00693e' //color of thumbs
  },
  "& .MuiSlider-rail": {
    color: '#00693e' ////color of the slider outside  teh area between thumbs
  }
}));

export default function App() {
  const [timestep, setTimestep] = useState(0);
  const [chartData, setChartData] = useState(
    {
      labels: ['Holder 1', 'Holder 2', 'Holder 3', 'Holder 4', 'Holder 5'],
      datasets: [
        {
          label: 'Head Count',
          data: ['Holder 1', 'Holder 2', 'Holder 3', 'Holder 4', 'Holder 5'].map(() => 1),
          backgroundColor: ['#00693e', '#00693e', '#e82300', '#00693e', '#00693e'],
        },
        /* {
          label: 'Dataset 2',
          data: labels.map(() => 75),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }, */
      ],
    }
  );

  const [lineHistory, setLineHistory] = useState(
    {
      labels: ['0'],
      datasets: [
        {
          label: 'Cooperation Strategy Percentage',
          data: [0],
          borderColor: '#00693e',
          backgroundColor: '#00693e',
        }
      ]
    }
  );




  // initialization parameters
  const [numHolders, setNumHolders] = useState(50);
  const [numDefectors, setNumDefectors] = useState(20);
  const [numSeekers, setNumSeekers] = useState(200);
  const [initCooperatingHolders, setInitCooperatingHolders] = useState(1);
  const [begun, setBegun] = useState(false);

  const [benefit, setBenefit] = useState(20);
  const [socialConstant, setSocialConstant] = useState(0.05);
  const [couponConstant, setCouponConstant] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [chartHistory, setChartHistory] = useState([]);
  const [totalSeekers, setTotalSeekers] = useState(0);
  const [seekersAwaiting, setSeekersAwaiting] = useState(0);

  const [frequency, setFrequency] = useState(1);

  const [barHistory, setBarHistory] = useState([]);

  const generateInitialHolderLabels = () => {
    const labels = [];
    for (let i = 0; i < numHolders; i++) {
      labels.push(`Holder ${i + 1}`);
    }

    return labels;
  }

  const generateInitialDefectorArray = () => {
    const colors = new Array(numHolders);

    let numDef = 0;

    if (numHolders < numDefectors) {
      numDef = numHolders;
    } else {
      numDef = numDefectors;
    }

    while (numDef > 0) {
      const index = Math.floor(Math.random() * numHolders);
      if (colors[index] !== '#e82300') {
        colors[index] = '#e82300';
        numDef -= 1;
      }
    }

    for (let i = 0; i < numHolders; i++) {
      if (colors[i] !== '#e82300') {
        colors[i] = '#00693e';
      }
    }
    return colors;
  }

  const generatePlayingDefectorArray = () => {

    const colors = chartData.datasets[0].backgroundColor;
    let defectorCount = 0;
    colors.forEach((color) => {
      if (color === '#e82300') {
        defectorCount += 1;
      }
    })

    console.log('old defector count', defectorCount);
    console.log('new defector count', numDefectors);

    const delta = defectorCount - numDefectors;
    console.log('delta adjusted', delta);

    if (delta === 0) {
      return chartData.datasets[0].backgroundColor
    }

    if (delta > 0) {
      if (delta > defectorCount) {
        for (let i = 0; i < colors.length; i++) {
          colors[i] = '#00693e';
        }
        return colors;
      } else {
        let remainingSwitches = delta;
        while (remainingSwitches > 0) {
          const index = Math.floor(Math.random() * numHolders);
          if (colors[index] === '#e82300') {
            colors[index] = '#00693e';
            remainingSwitches -= 1;
          }
        }
        return colors;
      }
    } else {
      if (delta * -1 > numHolders - defectorCount) {
        for (let i = 0; i < colors.length; i++) {
          colors[i] = '#e82300';
        }
        return colors;
      } else {
        console.log('hello bob', delta);
        let remainingSwitches = -1 * delta;
        console.log('remainingSwitches', remainingSwitches);
        while (remainingSwitches > 0) {
          const index = Math.floor(Math.random() * numHolders);
          if (colors[index] === '#00693e') {
            colors[index] = '#e82300';
            remainingSwitches -= 1;
          }
        }
        return colors;
      }
    }
  }

  const fitnessCoop = (propCoop, numSeek) => {
    //const amountAccepted = propCoop * numSeek; // CHECK THIS LINE HERE WHICH ONE IS IT?

    // before, this was simply num seek (not divided by equally across rooms)
    const amountAccepted = numSeek; // / (propCoop * numHolders);
    const ratio = numSeek / (propCoop * numHolders);
    let additional = 0;
    if (ratio > 5) {
      additional = ratio * couponConstant * 10;
    }
    return propCoop * (benefit - Math.sqrt(amountAccepted) + (numSeek/*  / (propCoop * numHolders) */) * couponConstant);
    //return propCoop * (benefit - Math.sqrt(amountAccepted) + (additional * couponConstant));
  }

  const fitnessDefect = (numSeek, propCoop) => {
    return (1 - propCoop) * (benefit - numSeek * socialConstant);
  }

  const averageFitness = (propCoop, numSeek) => {
    return propCoop * fitnessCoop(propCoop, numSeek) + (1 - propCoop) * fitnessDefect(numSeek, propCoop);
  }

  const handleSetLineHistory = (dCoop) => {
    const labels = new Array(timestep + 1);
    const data = lineHistory.datasets[0].data;

    console.log('last point', data.slice(-1)[0]);
    const newNumCoop = data.slice(-1)[0] * numHolders + dCoop;
    const newPoint = newNumCoop / numHolders;

    console.log(newPoint)

    data.push(newPoint);

    for (let i = 0; i < timestep + 1; i++) {
      labels[i] = i.toString();
    }

    const newHistory = {
      labels,
      datasets: [
        {
          label: 'Cooperation Strategy',
          data,
          borderColor: '#00693e',
          backgroundColor: '#00693e',
        }
      ]
    }

    setLineHistory(newHistory);
  }



  useEffect(() => {
    // this will calculate the new state at the new timestep (that is, what the data should be at timestep passed)
    if (timestep === 0) {
      const propCoop = (numHolders - numDefectors) / numHolders;
      //setLineHistory((prevArray) => [...prevArray, propCoop])

      setLineHistory(
        {
          labels: ['0'],
          datasets: [
            {
              label: 'Cooperation Strategy',
              data: [propCoop],
              borderColor: '#00693e',
              backgroundColor: '#00693e',
            }
          ]
        }
      )
    } else if (timestep > 0) {
      const propCoop = (numHolders - numDefectors) / numHolders;
      const dCoop = propCoop * (fitnessCoop(propCoop, numSeekers) - averageFitness(propCoop, numSeekers));



      console.log('timestep: ', timestep);
      console.log('DCOOP', dCoop);
      /* console.log('line history', lineHistory); */
      const deltaRounded = Math.round(dCoop);

      // Setting line history with new proportion of coop/defect
      /* setLineHistory((prevArray) => [...prevArray, newPropCoop]) */

      // Actually setting new number of defectors in state

      const historyData = lineHistory.datasets[0].data;
      const newNumCoop = historyData.slice(-1)[0] * numHolders + dCoop;

      if (newNumCoop > numHolders || newNumCoop < 0) {
        setPlaying(false);
      } else {
        handleSetLineHistory(dCoop);
        const newNumDefect = Math.round(numHolders - newNumCoop)
        setNumDefectors(newNumDefect);
      }
      //setNumDefectors((prevValue) => prevValue -= deltaRounded);
      //updateValue();
    }
  }, [timestep])

  useEffect(() => {
    let intervalId;

    if (playing) {
      intervalId = setInterval(() => {
        setTimestep((prevTime) => prevTime += 1);
      }, 1000 / frequency);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [playing])

  useEffect(() => {

    const labels = generateInitialHolderLabels();
    let backgroundColor = [];

    if (playing) {
      backgroundColor = generatePlayingDefectorArray();
    } else {
      backgroundColor = generateInitialDefectorArray();
    }

    console.log(backgroundColor);

    //console.log(labels, )

    const data = {
      labels,
      datasets: [
        {
          label: 'Occupants',
          data: labels.map(() => 1),
          backgroundColor
        }
      ]
    }

    setChartData(data);

    if (timestep === 0) {
      const propCoop = (numHolders - numDefectors) / numHolders;
      //setLineHistory((prevArray) => [...prevArray, propCoop])

      setLineHistory(
        {
          labels: ['0'],
          datasets: [
            {
              label: 'Cooperation Strategy',
              data: [propCoop],
              borderColor: '#00693e',
              backgroundColor: '#00693e',
            }
          ]
        }
      )
    }
  }, [numHolders, numDefectors]);

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        /* position: 'top', */
      },
      title: {
        display: false,
        /* text: 'Chart.js Bar Chart', */
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cooperators over Time',
      },
    },
  };

  const updateValue = () => {
    const newData = { ...chartData };
    const randomIndex = Math.floor(Math.random() * 5);
    if (newData.datasets[0].backgroundColor[randomIndex] === '#00693e') {
      newData.datasets[0].data[randomIndex] += Math.floor(Math.random() * 6) + 5;
    }
    setChartData(newData);
  }

  const stepForward = () => {
    setTimestep((prevTime) => prevTime += 1)
  }

  const handleStart = () => {
    setBegun(true);
  }

  const handleStep = () => {
    setTimestep((prevTime) => prevTime += 1);
  }

  const handleSliderChange = (event, newValue) => {
    setNumHolders(newValue);
    if (newValue < numDefectors) {
      setNumDefectors(newValue);
    }
  }

  const handleInputChange = (event) => {
    setNumHolders(event.target.value === '' ? '' : Number(event.target.value));
    if (Number(event.target.value) < numDefectors) {
      setNumDefectors(Number(event.target.value));
    }
  }

  const handleDefectorSliderChange = (event, newValue) => {
    if (newValue > numHolders) {
      setNumDefectors(numHolders);
    } else {
      setNumDefectors(newValue);
    }
  }

  const handleDefectorInputChange = (event) => {
    if (Number(event.target.value) > numHolders) {
      setNumDefectors(numHolders);
    } else {
      setNumDefectors(event.target.value === '' ? '' : Number(event.target.value));
    }
  }

  // BENEFIT
  const handleBenefitSliderChange = (event, newValue) => {
    setBenefit(newValue);
  }

  const handleBenefitInputChange = (event) => {
    setBenefit(event.target.value === '' ? '' : Number(event.target.value));
  }

  // SOCIAL COST
  const handleSocialSliderChange = (event, newValue) => {
    setSocialConstant(newValue);
  }

  const handleSocialInputChange = (event) => {
    setSocialConstant(event.target.value === '' ? '' : Number(event.target.value));
  }

  // COUPON
  const handleCouponSliderChange = (event, newValue) => {
    setCouponConstant(newValue);
  }

  const handleCouponInputChange = (event) => {
    setCouponConstant(event.target.value === '' ? '' : Number(event.target.value));
  }

  // SEEKER
  const handleSeekerSliderChange = (event, newValue) => {
    setNumSeekers(newValue);
  }

  const handleSeekerInputChange = (event) => {
    setNumSeekers(event.target.value === '' ? '' : Number(event.target.value));
  }

  // FREQUENCY 

  const handleFrequencySliderChange = (event, newValue) => {
    setFrequency(newValue);
  }

  const handleFrequencyInputChange = (event) => {
    setFrequency(event.target.value === '' ? '' : Number(event.target.value));
  }



  const toggleSimulation = () => {
    setPlaying(!playing);
  }

  const renderControls = () => {
    if (begun) {
      return (
        <div id="controls-container">
          <h3>Time Controls</h3>
          <div id="controls-parameters-wrapper">
            <h4>Time Step: {timestep}</h4>
            <div className="slider-box last">
              <p>Timestep Frequency (iterations/second)</p>
              <div>
                <CustomSlider
                  value={typeof frequency === 'number' ? frequency : 1}
                  onChange={handleFrequencySliderChange}
                  min={0.5}
                  max={100}
                  aria-labelledby="input-slider"
                />
                <Input
                  value={frequency}
                  size="small"
                  onChange={handleFrequencyInputChange}
                  inputProps={{
                    step: 0.5,
                    min: 0.5,
                    max: 100,
                    type: 'number',
                  }}
                />
              </div>
            </div>
            <div id="time-button-container">
              {playing
                ? <Button
                  variant="contained"
                  onClick={toggleSimulation}
                  style={{
                    backgroundColor: "#00693e",
                  }}
                >Pause</Button>
                : <Button
                  variant="contained"
                  onClick={toggleSimulation}
                  style={{
                    backgroundColor: "#00693e",
                  }}
                >{timestep > 0 ? 'Resume' : 'Begin'}</Button>
              }
              {playing
                ? <Button
                  variant="contained"
                  disabled
                  style={{
                    backgroundColor: "#00693e",
                  }}
                >Step Forward</Button>
                : <Button
                  variant="contained"
                  onClick={stepForward}
                  style={{
                    backgroundColor: "#00693e",
                  }}
                >Step Forward</Button>
              }
            </div>
            <div id="parameters-display-container">
              <h4>Parameters:</h4>
              <p>Initial Benefit: {benefit}</p>
              <p>Social Cost Constant: {socialConstant}</p>
              <p>Coupon Constant: {couponConstant}</p>
              <p>Seeker Count: {numSeekers}</p>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div id="controls-container">
          <h3>Simulation Parameters</h3>
          <div className="slider-box">
            <p>Number of Holders</p>
            <div>
              <CustomSlider
                value={typeof numHolders === 'number' ? numHolders : 1}
                onChange={handleSliderChange}
                min={5}
                max={100}
                aria-labelledby="input-slider"
              />
              <Input
                value={numHolders}
                size="small"
                onChange={handleInputChange}
                inputProps={{
                  step: 1,
                  min: 5,
                  max: 100,
                  type: 'number',
                }}
              />
            </div>
          </div>
          <div className="slider-box">
            <p>Initial Number of Defectors</p>
            <div>
              <CustomSlider
                value={typeof numDefectors === 'number' ? numDefectors : 1}
                onChange={handleDefectorSliderChange}
                aria-labelledby="input-slider"
              />

              <Input
                value={numDefectors}
                size="small"
                onChange={handleDefectorInputChange}
                inputProps={{
                  step: 1,
                  min: 1,
                  max: numHolders,
                  type: 'number',
                }}
              />
            </div>
          </div>

          <div className="slider-box">
            <p>Initial Benefit</p>
            <div>
              <CustomSlider
                value={typeof benefit === 'number' ? benefit : 1}
                onChange={handleBenefitSliderChange}
                marks
                step={10}
              />
              <Input
                value={benefit}
                size="small"
                onChange={handleBenefitInputChange}
                inputProps={{
                  step: 1,
                  min: 5,
                  max: 100,
                  type: 'number',
                }}
              />
            </div>
          </div>

          <div className="slider-box">
            <p>Social Cost Constant</p>
            <div>
              <CustomSlider
                value={typeof socialConstant === 'number' ? socialConstant : 1}
                onChange={handleSocialSliderChange}
                marks
                min={0}
                max={0.5}
                step={0.05}
              />
              <Input
                value={socialConstant}
                size="small"
                onChange={handleSocialInputChange}
                inputProps={{
                  step: 0.5,
                  min: 0,
                  max: 0.5,
                  type: 'number',
                }}
              />
            </div>
          </div>

          <div className="slider-box">
            <p>Coupon Multiplier</p>
            <div>
              <CustomSlider
                value={typeof couponConstant === 'number' ? couponConstant : 1}
                onChange={handleCouponSliderChange}
                marks
                min={0}
                max={1}
                step={0.05}
              />
              <Input
                value={couponConstant}
                size="small"
                onChange={handleCouponInputChange}
                inputProps={{
                  step: 0.05,
                  min: 0,
                  max: 1,
                  type: 'number',
                }}
              />
            </div>
          </div>

          <div className="slider-box last">
            <p>Seeker Count</p>
            <div>
              <CustomSlider
                value={typeof numSeekers === 'number' ? numSeekers : 1}
                onChange={handleSeekerSliderChange}
                min={50}
                max={500}
              />
              <Input
                value={numSeekers}
                size="small"
                onChange={handleSeekerInputChange}
                inputProps={{
                  step: 1,
                  min: 50,
                  max: 500,
                  type: 'number',
                }}
              />
            </div>
          </div>

          <Button
            onClick={handleStart}
            style={{
              backgroundColor: "#00693e",
            }}
            variant="contained"
          >Begin Simulation</Button>
        </div>
      )
    }
  }

  return (
    <div className="app">
      <h1>Dartmouth Shared Spaces Management Simulator</h1>
      <div id="sim-container">
        <div id="bar-container">
          <Bar options={options} data={chartData} />
        </div>
        {renderControls()}
      </div>
      <div id="results-container">
        <Line
          options={lineOptions}
          data={lineHistory}
          width={100}
          height={50}
        />
      </div>
    </div>
  );
}
