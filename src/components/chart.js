import React, { useEffect, useState} from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import './chart.css';

const BALLS_KEY = 'balls';
const NUMBERS_KEY = 'numbers';
const INTERVAL_YEAR = 'yearly';
const INTERVAL_MONTHLY = 'monthly';

//TODO mobile view?
function Chart(props) {
  const [numbersRange,setNumbersRange] = useState(null);
  const [chartData, setChartData] = useState({x:[],y:{}});
  const [dateRange, setDateRange] = useState(null);
  const [type, setType] = useState(1);

  useEffect(() => {
    if(!props.data) return;

    setNumbersRange({
      numbers : props.data.range.numbers,
      balls : props.data.range.balls
    });

    setType(props.data.type);

    if(props.data.dateRange) {
      setDateRange(props.data.dateRange);
    }
    else { //load defaults on first run
      loadDefaultNumbers();
    }
  },[props.data])

  useEffect(() => { //detect date change, flush chart
    if(!dateRange) return;
    setChartData({x:[],y:{},flush:true});
  },[dateRange])

  useEffect(() => { //detect date change, flush chart
    if(!chartData) return;
    if(Object.keys(chartData.y).length === 0 && chartData.flush) {
      loadDefaultNumbers();
    }
  },[chartData])

  const loadDefaultNumbers = () => {
    for (const defaultNumber of props.data.default) {
      fetchData(defaultNumber.isBall, defaultNumber.number);
    }
  };

  const setNumber = (number,isBall) => { //on click event
    const key = number + '_' + (isBall ? '1' : '0');
    const isActive = chartData.y[key];
    if(isActive) {
      let chartData_ = {...chartData};
      delete chartData_.y[key];
      setChartData(chartData_);
      return;
    }
    fetchData(isBall,number);
  };

  const fetchData = (isBall,number) => {
    const dateParam =
      (dateRange && dateRange.min ? '&fromDate=' + dateRange.min : '') +
      (dateRange && dateRange.max ? '&toDate=' + dateRange.max : '');
    let interval = INTERVAL_YEAR;
    if(dateRange) {
      const startYear = parseInt(dateRange.min.split('-')[0]);
      const endYear = parseInt(dateRange.max.split('-')[0]);
      if(endYear - startYear <= 1) {
        interval = INTERVAL_MONTHLY;
      }
    }

    fetch(window.BACKEND_HOST + 'number?typeId=' + type + '&isBall=' + isBall + '&number=' + number + dateParam)
      .then(async (response) => {
        const data = await response.json();

        let xLabels = chartData.x;
        let xLabelsMap = xLabels.reduce((obj,v) => {obj[v] = true; return obj;},{});
        let yData = [];
        for(const row of data) {
          let interval_;
          if(interval === INTERVAL_YEAR) {
            interval_ = row.draw_date.split('T')[0].split('-')[0]
          } else {
            const dateSplit = row.draw_date.split('T')[0];
            interval_ = dateSplit.split('-')[0] + '/' + dateSplit.split('-')[1]
          }
          if(xLabelsMap[interval_] === undefined) {
            xLabels.push(interval_);
          }
          xLabelsMap[interval_] === undefined ? xLabelsMap[interval_] = 1 : xLabelsMap[interval_]++;
        }

        for(const row of xLabels) {
          yData.push(xLabelsMap[row]);
        }
        let chartData_ = {...chartData};
        chartData_.x = xLabels;
        chartData_.y[number + '_' + (isBall ? '1' : '0')] = {data : yData, label : number.toString() + (isBall ? ' (GB)' : '')};
        setChartData(chartData_);
      });

  }

  const renderNumbersRange = (key) => {
    let rows = [];
    for(const number of numbersRange[key]) {
      const isActive = chartData.y[number + '_' + (key === BALLS_KEY ? '1' : '0')];
      rows.push(
        <div key={number}
             onClick={() => setNumber(number,key === BALLS_KEY)}
             className={'chart-balls chart-number-' + key + (isActive ? ' active': '')}>{number}</div>
      );
    }
    return rows;
  }

  const renderChart = (data) => {
    return(
      <LineChart
        height={300}
        series={
          Object.values(data.y)
        }
        xAxis={[
          { scaleType: 'point', data: data.x }
        ]}
      />
    );
  }

  return (
    <div className="chart">
      <div className="sub1 accent">Chart</div>
      { chartData.x && chartData.x.length > 0 &&
        renderChart(chartData)
      }
      <div className={'chart-balls-container'}>
        <div>
          {numbersRange &&
            renderNumbersRange(NUMBERS_KEY)
          }
        </div>
        <div>
          {numbersRange &&
            renderNumbersRange(BALLS_KEY)
          }
        </div>
      </div>
    </div>
  );
}

export default Chart;