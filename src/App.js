import React, { useEffect, useState } from 'react';
import './App.css';
import Table from './components/table';

const PB_TYPE = 1;
const MM_TYPE = 2;

//dynamic backend host selector
if(window.location.hostname === 'localhost') {
  window.BACKEND_HOST = window.location.protocol + '//' + window.location.hostname + ':' + 6010 + '/';
}
else {
  window.BACKEND_HOST = '/api/';
}

function App() {
  const [type, setType] = useState(1);
  const [numbers, setNumbers] = useState(null);
  const [dateRange, setDateRange] = useState(null);

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
        const numbers_ = await response.json();
        let numbers = {
          numbers : [],
          ball_numbers : []
        };
        for(const row of numbers_) {
          numbers[row.is_ball ? 'ball_numbers' : 'numbers'].push({
            number : row.number,
            count : row.count
          });
        }
        setNumbers(numbers);
      });
  };

  const updateDateRange = (date, key) => {
    let dateRange_ = {...dateRange};
    dateRange_.minmax = false;
    dateRange_[key] = date;
    setDateRange(dateRange_);
  }

  const updateMinMaxDateRange = () => {
    fetch(window.BACKEND_HOST + 'min_max_date?typeId=' + type)
      .then(async (response) => {
        let dateRange = (await response.json())[0];
        dateRange.minmax = true;
        setDateRange(dateRange);
      });
  };

  return (
    <div className="App">
      <header className="header">
        lucky numbers
      </header>
      <div className="selector">
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
      <div className="date-range sub1">
        {
          dateRange &&
          <React.Fragment>
            <input type="date" id="min" name="min"
                   onChange={ (e) => updateDateRange(e.target.value, 'min') }
                   value={dateRange.last_rule_update.split('T')[0]}
                   min={dateRange.min.split('T')[0]}
                   max={dateRange.max.split('T')[0]} />
            {' '} - {' '}
            <input type="date" id="max" name="max"
                   onChange={(e) => updateDateRange(e.target.value, 'max')}
                   value={dateRange.max.split('T')[0]}
                   min={dateRange.min.split('T')[0]}
                   max={dateRange.max.split('T')[0]} />
          </React.Fragment>
        }

      </div>
      <Table numbers={numbers}></Table>
    </div>
  );
}

export default App;
