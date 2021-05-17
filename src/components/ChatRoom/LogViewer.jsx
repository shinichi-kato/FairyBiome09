import React from 'react';
import Box from '@material-ui/core/Box';
import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
import Typography from '@material-ui/core/Typography';
import MusicNoteIcon from '@material-ui/icons/MusicNote';
import ClearIcon from '@material-ui/icons/Clear';
import HotelIcon from '@material-ui/icons/Hotel';

const moodBadgeIcon = {
	peace: null,
	cheer: <MusicNoteIcon />,
	down: <ClearIcon />,
	sleep: <HotelIcon />,
	absent: null,
}

function LeftBalloon(props) {
	const message = props.message;
	const avatarSrc = message.person === 'bot' ?
		`${message.avatarPath}/${message.mood}.svg`
		:
		`${message.avatarPath}`;

	return (
		<Box
			display="flex"
			flexDirection="row"
			alignItems="flex-start"
			key={props.index}
		>
			<Box>
				<Badge
					badgeContent={moodBadgeIcon[message.mood]}
					invisible={moodBadgeIcon[message.mood] === null}
				>
					<Avatar alt={message.name} src={avatarSrc} />
				</Badge>
			</Box>
			<Box>
				<Typography>{message.text}</Typography>
			</Box>
		</Box>
	)
}

function RightBalloon(props){
	const message = props.message;
	const avatarSrc = message.person === 'bot' ?
		`${message.avatarPath}/${message.mood}.svg`
		:
		`${message.avatarPath}`;

	return (
		<Box
			display="flex"
			flexDirection="row"
			alignItems="flex-end"
			key={props.index}
		>
			<Box>
				<Badge
					badgeContent={moodBadgeIcon[message.mood]}
					invisible={moodBadgeIcon[message.mood] === null}
				>
					<Avatar alt={message.name} src={avatarSrc} />
				</Badge>
			</Box>
			<Box>
				<Typography>{message.text}</Typography>
			</Box>
		</Box>
	)
}

function SystemMessage(props){
	const message = props.message;

	return (
		<Box
			display="flex"
			flexDirection="row"
			alignItems="center"
			key={props.index}
		>
			<Box>
				<Typography>{message.text}</Typography>
			</Box>
		</Box>
	)
}

export default function LogViewer(props) {
	/*
		props.logの内容をレンダリング
		ユーザ本人：右側の吹き出し
		ほかのユーザ・チャットボット：左側の吹き出し
		ユーザは右側、bot,othersは左側、それら以外は環境やシステムのメッセージで
		吹き出しではない表示.
	*/
	console.log("log:",props.log)
	const messages = props.log.map((message,index)=>{
		switch(message.person) {
			case 'user' : return <RightBalloon message={message} index={index} key={index}/>
			case 'bot' :
			case 'other': return <LeftBalloon message={message} index={index} key={index}/>
			default: return <SystemMessage message={message} index={index}/>
		}
	})
	return (
		<Box
			display="flex"
			flexDirection="column"
		>
			{messages}

		</Box>
	)
}