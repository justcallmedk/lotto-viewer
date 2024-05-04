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

  useEffect(() => { //get numbers when type changes
    fetch(window.BACKEND_HOST + 'numbers?typeId=' + type)
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
  },[type]);

  console.log('rendering App.js ...');
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
      <Table numbers={numbers}></Table>
    </div>
  );
}

export default App;
