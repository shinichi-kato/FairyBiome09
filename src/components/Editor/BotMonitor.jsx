import React from "react";
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';



const GaugeLinearProgress = styled(LinearProgress)(({ theme }) => ({

	height: 20,
	borderRadius: 10,

	[`& .${linearProgressClasses.bar}`]: {
		borderRadius: 10,
	},
}));

export default function BotMonitor(props) {
	/* チャットボットの現在の状態を表示 
  
		props.botState: bot.state
	*/
	const work = props.work;
	const mentalLevel = parseInt(work.mentalLevel);
	const moment = parseInt(work.moment);
	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
		>
			<Box
				sx={{
					width: 192,
					height: 256
				}}
			>
				<img
					style={{
						width: 192,
						height: 256
					}}
					src={props.photoURL}
					alt={props.photoURL} />
			</Box>
			<Box>
				<Typography variant="h4">{props.state.displayName}</Typography>
			</Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "stretch",
				}}
			>
				<Box >
					心のエネルギー {moment} / {mentalLevel} 
				</Box>
				<Box
					sx={{alignSelf: "stretch"}}
				>
					<GaugeLinearProgress
						variant="buffer"
						value={moment}
						valueBuffer={mentalLevel}
					/>
				</Box>
			</Box>

		</Box>
	)
}