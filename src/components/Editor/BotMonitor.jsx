import React from "react";
import Box from '@material-ui/core/Box';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles, makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
	container: {
		width: 192,
		height: 256,
	},
	portrait: {
		width: 192,
		height: 256,
	}
}));

const GaugeLinearProgress = withStyles((theme) => ({
	root: {
		height: 10,
		borderRadius: 5,
	},
	bar: {
		borderRadius: 5,
	},
}))(LinearProgress);

export default function BotMonitor(props) {
	/* チャットボットの現在の状態を表示 
  
		props.botState: bot.state
	*/
	const state = props.state;
	const work = props.work;
	const classes = useStyles();

	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
		>
			<Box
				className={classes.container}
			>
				<img
					className={classes.portrait}
					src={props.photoURL}
					alt="" />
			</Box>
			<Box>
				{props.work.displayName}
			</Box>
			<Box
				display="flex"
				flexDirection="row"
			>
				<Box >
					心のパワー（最大値）
				</Box>
				<Box>
					<GaugeLinearProgress variant="determinate" value={work.mentalLevel} />
				</Box>
			</Box>
			<Box
				display="flex"
				flexDirection="row"
			>
				<Box >
					心のパワー（現在の値）
				</Box>
				<Box>
					<GaugeLinearProgress variant="determinate" value={work.moment} />
				</Box>
			</Box>
			
		</Box>
	)
}