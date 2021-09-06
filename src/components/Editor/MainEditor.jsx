import React, { useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/SaveAlt';
import { DataGrid } from '@material-ui/data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';


const useStyles = makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
	item: {
		marginBottom: theme.spacing(2),
		padding: theme.spacing(2),
	},
	fab: {
		position: 'absolute',
		bottom: theme.spacing(4),
		right: theme.spacing(4),
	},
	fabIcon: {
		marginRight: theme.spacing(1),
	},
}));

const columns = [
	{ field: 'key', headerName: '名前', width: 100 },
	{ field: 'value', headerName: '値', width: 350 },
];

function lister(obj) {
	let work = [];
	let i = 0;
	for (let node in obj) {
		if (obj.hasOwnProperty(node)) {
			work.push({ id: i, col1: node, col2: obj[node] });
			i++;
		}
	}
	return work;
}

export default function MainEditor() {
	const classes = useStyles();
	const bot = useContext(BiomebotContext);
	const [rows, setRows] = useState([]);
	const [message, setMessage] = useState("");

	useEffect(() => {
		setRows(lister(bot.state.main))
	}, [bot.state.main]);

	function handleSave() {

	}

	return (
		<Box
			display="flex"
			flexDirection="column"
			className={classes.root}
		>
			<Paper className={classes.item} elevation={0} >
				<Box>
					作業記憶
				</Box>
				<Box>
					<DataGrid
						rows={rows}
						columns={columns}
						/>
				</Box>
			</Paper>
			
			<Box className={classes.fab}>
				<Fab
					variant="extended"
					color="primary"
					aria-label="save"
					onClick={handleSave}
				>
					<SaveIcon className={classes.fabIcon} />保存{message}
				</Fab>
			</Box>

		</Box>
	)
}