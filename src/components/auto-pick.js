import React, { useEffect, useState} from 'react';
import './auto-pick.css';

function AutoPick(props) {
  const [numbers,setNumbers] = useState(null);

  useEffect(() => { //get numbers when type changes
    if(!props.data) return;
    const data = props.data;
    setNumbers({
      minFreq : generateAutoPick(data.numbers,data.ball_numbers),
      maxFreq : generateAutoPick(data.numbers,data.ball_numbers,true)
    });
  },[props.data])

  useEffect(() => { //get numbers when type changes
    if(!numbers) return;
    console.info(numbers);
  },[numbers])

  const generateAutoPick = (numbers,ballNumbers,reverse) => {
    if(reverse) {
      numbers.reverse();
      ballNumbers.reverse();
    }

    let firstNumber = [];
    let uniqueNumbers = {};
    let finalNumbers = [];

    for(let i = 0; i < 5; i++) {
      firstNumber.push(numbers[i].number.numeric);
    }
    uniqueNumbers[firstNumber.join(',')] = true;
    firstNumber.push(ballNumbers[0].number.numeric);
    finalNumbers.push(firstNumber);
    const numbersSorted = numbers.slice(0,10).map((elm) => (elm.number.numeric)).sort();
    const ballNumbersSorted = ballNumbers.slice(0,5).map((elm) => (elm.number.numeric));

    while(Object.keys(uniqueNumbers).length < 5) {
      const minPicked = shuffle(numbersSorted,uniqueNumbers);
      finalNumbers.push(minPicked.concat([ballNumbersSorted[finalNumbers.length]]));
    }
    return finalNumbers;
  };

  const shuffle = (arr,uniqueMinNumbers) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    let ret = arr.slice(0,5);
    const retJoined = ret.join(',');
    if(!uniqueMinNumbers[retJoined]) {
      uniqueMinNumbers[retJoined] = true;
      return ret;
    }
    return shuffle(arr,uniqueMinNumbers);
  };

  const renderTable = (data) => {
    let rows = [];
    for(let i = 0; i < data.length; i++) {
      rows.push(
        <tr key={i}>
          <td>
            {data[i].map((obj, i) => {
              return <span
                      key={'ball_' + i}
                      className={ 'balls ' + (i === 5 ? 'gold-ball' : 'number-ball')}>{obj}</span>;
            })}
          </td>
        </tr>);
    }
    return rows;
  }

  return (
    <div className="auto-pick">
      <div className="sub1 accent">Auto Pick</div>
      <div className="table-container">
        <table>
          <tbody>
            <tr>
              <th>Most Frequent</th>
            </tr>
            {numbers && renderTable(numbers.maxFreq)}
          </tbody>
        </table>
      </div>
      <div className="table-container">
        <table>
          <tbody>
            <tr>
              <th>Least Frequent</th>
            </tr>
            {numbers && renderTable(numbers.minFreq)}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default AutoPick;