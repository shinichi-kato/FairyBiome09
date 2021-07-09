import React, { useState, useContext } from 'react';

import { graphql } from 'gatsby';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import { EcosystemContext } from '../components/Ecosystem/EcosystemProvider';
import ParamEditor from '../components/Ecosystem/ParamEditor';
import LinearProgress from '@material-ui/core/LinearProgress';

export const query = graphql`
query {
  site {
    siteMetadata {
      ecosystem {
        changeRate
        randomSeed
      }
    }
  }
}
`


const range = (start, end) => [...Array(end + 1).keys()].slice(start);

const hours = range(0, 23);
const columns = [
  { field: 'id', headerName: 'no', width: 70 },
  { field: 'date', headerName: '日', width: 70 },
  { field: 'hour', headerName: '時', width: 70 },
  { field: 'dayPart', headerName: '日の運行', width: 130 },
  { field: 'weather', headerName: '天候', width: 130 }
];

function WeatherTable(props) {
  const ecosystem = useContext(EcosystemContext);
  const now = new Date();
  const time = now.getTime();

  const rows = hours.map(hour => {
    const timestamp = new Date(time + hour * 60 * 60 * 1000);
    return {
      id: hour,
      month: timestamp.getMonth() + 1,
      date: timestamp.getDate(),
      hour: timestamp.getHours(),
      dayPart: ecosystem.getDayPart(timestamp),
      pressure: ecosystem.getPressure(timestamp, props.changeRate),
      weather: ecosystem.getWeather(timestamp, props.changeRate),
    }
  });

  return (
    <TableContainer>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {columns.map(col => <TableCell>{col.headerName}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell>{row.month}/{row.date}</TableCell>
              <TableCell>{row.hour}</TableCell>
              <TableCell>{row.dayPart}</TableCell>
              <TableCell>
                <LinearProgress 
                variant="determinate"
                value={row.pressure*100}
                style={{width: "50px"}}/>
                {row.weather}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default function EcosystemPage({ data }) {
  const param = data.site.siteMetadata.ecosystem;
  const [changeRate, setChangeRate] = useState(param.changeRate);

  function handleChangeChangeRate(rate) {
    setChangeRate(rate);
  }

  return (
    <EcosystemProvider>
      <ParamEditor
        changeRate={changeRate}
        handleChangeChangeRate={handleChangeChangeRate}
      />
      <WeatherTable changeRate={changeRate} />
    </EcosystemProvider>

  )
}