import React, {useContext} from "react";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import CircularProgress from '@material-ui/core/CircularProgress';
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import { EcosystemContext } from '../components/Ecosystem/EcosystemProvider';
import { getHourRad } from '../components/calendar-rad.jsx';

const range = (start, end) => [...Array(end + 1).keys()].slice(start);

const hours = range(0,23);
const columns = [
  {field: 'hour', headerName: '時刻', width: 70},
  {field: 'summer', headerName: '7月', width: 130},
  {field: 'winter', headerName: '12月', width: 130},
];

function SolarTable(){
  const ecosystem = useContext(EcosystemContext);
  const rows = hours.map(hour=>({
    id: hour, 
    rad: getHourRad(hour,0),
    summer: ecosystem.dayPart(new Date(2021,6,1,hour)),
    winter: ecosystem.dayPart(new Date(2021,11,1,hour))
  }));

  return (
    <TableContainer>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {columns.map(col=><TableCell>{col.headerName}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row=>(
            <TableRow key={row.id}>
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell>{row.summer}</TableCell>
              <TableCell>{row.winter}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default function ecosys(){
  return (
    <EcosystemProvider>
      <SolarTable />
    </EcosystemProvider>
  
  )  
}