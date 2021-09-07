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
	{ field: 'key', headerName: '名前', width: 120 },
	{ field: 'value', headerName: '値', width: 290 },
];

function lister(obj) {
	let work = [];
	let i = 0;
	for (let node in obj) {
		if (obj.hasOwnProperty(node)) {

			let value = obj[node];
			// if(Array.isArray(value)){
			// 	value = value.join(',');
			// }
			// if(typeof value === 'number'){
			// 	value = `${value}`;
			// }
			work.push({ id: i, key: node, value: value });
			i++;
		}
	}
	return work;
}

export default function WorkEditor() {
	/*
		state.workを編集

		state.workは辞書で、それをリストに変換して表示する。
	*/
	const classes = useStyles();
	const bot = useContext(BiomebotContext);
	const [message, setMessage] = useState("");

	const [rows, setRows] = useState([]);

	useEffect(() => {
		setRows(lister(bot.work));

	}, [bot.work]);

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
				<Box
					height={600}
				>
					<DataGrid
						rows={rows}
						columns={columns}
						hideFooterSelectedRowCount
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