import React, { useRef, useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/SaveAlt';
import { VariableSizeList } from 'react-window';
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


export default function WorkEditor(props) {
	const classes = useStyles();
	const bot = useContext(BiomebotContext);
	const [message, setMessage] = useState("");

	const work = bot.work;

	const Row = ({ index, style }) => {
		<div style={style}>{work[index]}</div>
	};

	return (
		<Box
			display="flex"
			flexDirection="column"
			className={classes.root}
		>
			<Box>
				<VariableSizeList
					height={300}
					itemcount={work.length}>

				</VariableSizeList>
			</Box>
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