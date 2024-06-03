import React, { useEffect, useState } from 'react';
import './App.css';
import Table from './components/table';
import AutoPick from './components/auto-pick';
import Chart from './components/chart';
const PB_TYPE = 1;
const MM_TYPE = 2;

//dynamic backend host selector
if(window.location.hostname === 'localhost') {
  window.BACKEND_HOST = window.location.protocol + '//' + window.location.hostname + ':' + 6010 + '/';
}
else {
  window.BACKEND_HOST = '/api/';
}

//TODO need global cache module to support preloaded data and data subset
function App() {
  const [type, setType] = useState(1);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [chart, setChart] = useState(null);
  const [quickDate, setQuickDate] = useState(null);

  useEffect(() => {
    if(!dateRange) {
      updateMinMaxDateRange();
      return;
    }
    if(!dateRange.minmax) { // date changed by onChange event
      getNumbers(dateRange.min,dateRange.max);
    }
  },[dateRange]);

  useEffect(() => { //get numbers when type changes
    updateMinMaxDateRange();
    getNumbers();
  },[type]);

  const getNumbers = (fromDate, toDate) => {
    fetch(window.BACKEND_HOST + 'numbers?typeId=' + type + (fromDate ? '&fromDate=' + fromDate : '') + (toDate ? '&toDate=' + toDate : ''))
      .then(async (response) => {
        const data_ = await response.json();
       let numbers = {
          numbers : [],
          ball_numbers : [],
          numbers_range: {},
          ball_numbers_range: {}
        };

        const lastDrawnMap = new Map();
        data_['SQL_GET_NUMBER_LAST_DRAWN'].map((obj) => {
          lastDrawnMap.set(obj.number + '_' + obj.is_ball,obj.last_drawn);
        });
        const drawDates = data_['SQL_GET_DRAW_DATES'];
        for(const row of data_['SQL_GET_NUMBERS']) {
          const lastDrawn = lastDrawnMap.get(row.number + '_' + (row.is_ball ? '1' : '0')).split('T')[0];
          numbers[row.is_ball ? 'ball_numbers' : 'numbers'].push({
            number: { string : row.number, numeric : row.number },
            count: { string : row.count, numeric : row.count },
            last_drawn : {
              string : lastDrawn,
              numeric : lastDrawn.split('-').join('')
            }
          });
          numbers[(row.is_ball ? 'ball_numbers' : 'numbers') + '_range'][row.number] = true;
        }

        setData({
          numbers:numbers,
          drawDates:drawDates,
          drawDatesCount:drawDates.length,
          type: type
        });

        setChart({
          default:[
            {
              number:numbers.numbers[numbers.numbers.length-1].number.numeric,
              isBall : 0
            },
            {
              number:numbers.ball_numbers[numbers.ball_numbers.length-1].number.numeric,
              isBall : 1
            }
          ],
          range: {
            numbers: Object.keys(numbers.numbers_range).map((x) => {return parseInt(x,10)}),
            balls: Object.keys(numbers.ball_numbers_range).map((x) => {return parseInt(x,10)})
          },
          type: type,
          dateRange: dateRange
        });
      });
  };

  let timeoutDebounce = null
  const updateDateRange = (date, key) => {
    clearTimeout(timeoutDebounce)
    timeoutDebounce = setTimeout( () => {
      let dateRange_ = {...dateRange};
      dateRange_.minmax = false;
      dateRange_[key] = date;
      setDateRange(dateRange_);
    }, 500)
  }

  const updateMinMaxDateRange = () => {
    fetch(window.BACKEND_HOST + 'min_max_date?typeId=' + type)
      .then(async (response) => {
        let dateRange = (await response.json())[0];
        dateRange.minmax = true;
        dateRange.min = dateRange.last_rule_update;
        dateRange.max = dateRange.max.split('T')[0];
        setDateRange(dateRange);
      });
  };

  const updateQuickDate = (months) => {
    const d = new Date(dateRange.max);
    d.setMonth(d.getMonth() - months);
    let dateRange_ = {...dateRange};
    dateRange_.minmax = false;
    dateRange_.min = d.toISOString().split('T')[0];
    setDateRange(dateRange_);
    setQuickDate(months);
  };

  const downloadCSV = () => {
    let dateParams = '';
    if(!dateRange.minmax) {
      dateParams += '&fromDate=' + dateRange.min + '&toDate=' + dateRange.max;
    }
    window.open(window.BACKEND_HOST + 'download?typeId=' + type + dateParams);
  };

  return (
    <div className="App">
      <header className="header accent">
        Home is where the jackpot is.
      </header>
      <div className="selector sub1 dotted">
        <a href="#"
           onClick={() => setType(PB_TYPE)}
           className={'pb ' + (type === PB_TYPE ? 'active' : '')}>
          Powerball
        </a>
        <a href="#"
           onClick={() => setType(MM_TYPE)}
           className={'mm ' + (type === MM_TYPE ? 'active' : '')}>
          Mega Millions
        </a>
      </div>
      <div className="date-range">
        {
          dateRange &&
          <React.Fragment>
            <input type="date" id="min" name="min"
                   onChange={(e) => updateDateRange(e.target.value, 'min')}
                   value={dateRange.min}
                   min={dateRange.last_rule_update}
                   max={dateRange.max}/>
            {' - '}
            <input type="date" id="max" name="max"
                   onChange={(e) => updateDateRange(e.target.value, 'max')}
                   value={dateRange.max}
                   min={dateRange.last_rule_update}
                   max={dateRange.max}/>
            <span className="last-date">
              Last
              <a href="#" className={quickDate === 60 ? 'active': ''} onClick={ () => updateQuickDate(60)}>60</a>
              <a href="#" className={quickDate === 12 ? 'active': ''} onClick={ () => updateQuickDate(12)}>12</a>
              <a href="#" className={quickDate === 6 ? 'active': ''} onClick={ () => updateQuickDate(6)}>6</a>
              &nbsp;months
              <span className="download" onClick={() => downloadCSV()}>💾</span>
            </span>

          </React.Fragment>
        }
      </div>
      <Chart data={chart ? chart : null}></Chart>
      <AutoPick data={data ? data.numbers : null}></AutoPick>
      <Table data={data}></Table>
    </div>
  );
}

export default App;
