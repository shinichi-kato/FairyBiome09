import React, { useRef, useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/SaveAlt';
import { FixedSizeList } from 'react-window';
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

function lister(obj) {
	let work = [];
	for (let node in obj) {
		if (obj.hasOwnProperty(node)) {
			work.push({ key: node, val: obj[node] })
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

	const [work, setWork] = useState([]);

	useEffect(() => {
		setWork(lister(bot.work))
	}, [bot.work]);

	function handleSave() {

	}

	const Row = ({ index, style }) => {
		return (
			<div style={style}>
				{work[index].key} : {work[index].val}
			</div>
		)
	};

	console.log(work);

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
					<FixedSizeList
						height={300}
						itemCount={work.length}
						itemSize={25}>
						{Row}
					</FixedSizeList>
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