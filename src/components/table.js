import React, { useEffect, useState} from 'react';
import './table.css';

function Table(props) {
  const [data,setData] = useState(null);
  const [sortOrder] = useState({
    numbers: {
      number: {
        order: 1, //asc
        active: -1
      },
      last_drawn: {
        order : 1,
        active : -1
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
      last_drawn: {
        order : 1,
        active : -1
      },
      count: {
        order: -1, //desc
        active: 1
      }
    }
  });

  useEffect(() => { //get numbers when type changes
    if(!props.data) return;
    setData(props.data);
  },[props.data])

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
            last drawn
          </span>
          <span className="up-down-arrow down active"
                onClick={() => sort('last_drawn', 1, type)}>
            {renderArrow('last_drawn', type)}
          </span>
        </th>
        <th>
          <span>
            Count
          </span>
          <span className="up-down-arrow down active"
                onClick={() => sort('count', 1, type)}>
            {renderArrow('count', type)}
          </span>
        </th>
      </tr>
      {
        data &&
        data.numbers[type].map((val, key) => {
          return (
            <tr key={key}>
              <td>{val.number.string}</td>
              <td>{val.last_drawn.string}</td>
              <td>{val.count.string + ' (' + ((val.count.string / data.drawDatesCount)*100).toFixed(2) + '%)'}</td>
            </tr>
          )
        })

      }
      </tbody>
    </table>
  }

  const sort = (sortKey, active, type) => {
    let data_ = {...data};
    data_.numbers[type].sort((a, b) => {
      if (sortOrder[type][sortKey].order === 1)
        return a[sortKey].numeric - b[sortKey].numeric;
      return b[sortKey].numeric - a[sortKey].numeric;
    });
    setData(data_);
    let sortOrder_ = {...sortOrder};
    sortOrder_[type][sortKey].active = 1;

    for(const key in sortOrder_[type]) {
      if(key !== sortKey)
        sortOrder_[type][key].active = 0;
    }
    sortOrder_[type][sortKey].order = sortOrder_[type][sortKey].order * -1;
    //setSortOrder(sortOrder_);
  };

  return (
    <div className="numbers">
      <div className="sub1 accent statistics-header">Statistics</div>
      <div className="draw-dates-total">{data ? data.drawDatesCount : ''} drawings</div>
      <div className={'table-container table-' + (data ? data.type : '')}>
        { renderTable('numbers') }
      </div>
      <div className="table-container">
        { renderTable('ball_numbers') }
      </div>
    </div>
  );
}

export default Table;