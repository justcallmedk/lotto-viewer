import React, { useEffect, useState} from 'react';
import './table.css';

function Table(props) {
  const [numbers,setNumbers] = useState(null);
  const [sortOrder, setSortOrder] = useState({
    numbers: {
      number: {
        order: 1, //asc
        active: -1
      },
      count: {
        order: -1, //desc
        active: 1
      }
    },
    ball_numbers : {
      number: {
        order: 1, //asc
        active: -1
      },
      count: {
        order: -1, //desc
        active: 1
      }
    }

  });

  useEffect(() => { //get numbers when type changes
    if(!props.numbers) return;
    setNumbers(props.numbers);
  },[props.numbers])

  const renderArrow = (sortKey,type) => {
    const sortOrder_ = sortOrder[type][sortKey];
    if(sortOrder_.order === 1) {
      return sortOrder_.active === 1 ? '▼' : '▽';
    }
    return sortOrder_.active === 1 ? '▲' : '△';
  }

  const renderTable = (type) => {
    return <table>
      <tbody>
      <tr>
        <th>
            <span>
              { type === 'numbers' ? 'numbers' : 'gold ball'}
            </span>
          <span className="up-down-arrow up"
                onClick={() => sort('number', 0, type)}>
            {renderArrow('number',type)}
          </span>
        </th>
        <th>
            <span>
              Count
            </span>
          <span className="up-down-arrow down active"
                onClick={() => sort('count', 1, type)}>
            {renderArrow('count',type)}
          </span>
        </th>
      </tr>
      {
        numbers &&
        numbers[type].map((val, key) => {
          return (
            <tr key={key}>
              <td>{val.number}</td>
              <td>{val.count}</td>
            </tr>
          )
        })

      }
      </tbody>
    </table>
  }

  const sort = (sortKey, active, type) => {
    let numbers_ = {...numbers};
    numbers_[type].sort((a, b) => {
      if (sortOrder[type][sortKey].order === 1) {
        return a[sortKey] - b[sortKey];
      }
      return b[sortKey] - a[sortKey];
    });
    setNumbers(numbers_);
    let sortOrder_ = {...sortOrder};
    sortOrder_[type][sortKey].active = 1;
    if (sortKey === 'number') {
      sortOrder_[type]['count'].active = 0;
    } else {
      sortOrder_[type]['number'].active = 0;
    }
    sortOrder_[type][sortKey].order = sortOrder_[type][sortKey].order * -1;
    setSortOrder(sortOrder_);
  };

  return (
    <div className="numbers">
      <div className="sub1">Statistics</div>
      { renderTable('numbers') }
      { renderTable('ball_numbers') }
    </div>
  );
}

export default Table;