import React, { useLayoutEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
import Typography from '@material-ui/core/Typography';
import MusicNoteIcon from '@material-ui/icons/MusicNote';
import ClearIcon from '@material-ui/icons/Clear';
import HotelIcon from '@material-ui/icons/Hotel';

const useStyles = makeStyles(theme => ({
	nonDotList: {
		listStyle: "none",
		margin: 0,
		padding: 0,
	},
	conatiner: {
		width: "100%"
	},
	leftBalloon: {
		borderRadius: "15px 15px 15px 0px",
		padding: "0.5em",
		marginLeft: 4,
		backgroundColor: theme.palette.secondary.light,
	},
	rightBalloon: {
		borderRadius: " 15px 15px 0px 15px",
		padding: "0.5em",
		marginRight: 4,
		backgroundColor: theme.palette.primary.light,
	}
}));

const moodBadgeIcon = {
	peace: null,
	cheer: <MusicNoteIcon />,
	down: <ClearIcon />,
	sleep: <HotelIcon />,
	absent: null,
}

function LeftBalloon(props) {
	const classes = useStyles();
	const message = props.message;
	const avatarSrc = message.person === 'bot' ?
		`${message.avatarPath}/${message.mood}.svg`
		:
		`${message.avatarPath}`;
	const texts = message.text.split('<br/>');


	return (
		<Box
			display="flex"
			flexDirection="row"
			alignSelf="flex-start"
		>
			<Box>
				<Badge
					badgeContent={moodBadgeIcon[message.mood]}
					invisible={moodBadgeIcon[message.mood] === null}
				>
					<Avatar alt={message.name} src={avatarSrc} />
				</Badge>
			</Box>
			<Box
				className={classes.leftBalloon}
			>
				<Typography variant="body1">{message.text}</Typography>
				{texts.map((text,index)=><Typography variant="caption" key={index}>{text}</Typography>)}
			</Box>
		</Box>
	)
}

function RightBalloon(props) {
	const classes = useStyles();
	const message = props.message;
	const avatarSrc = message.person === 'bot' ?
		`${message.avatarPath}/${message.mood}.svg`
		:
		`${message.avatarPath}`;

	return (
		<Box
			display="flex"
			flexDirection="row"
			alignSelf="flex-end"
		>

			<Box
				className={classes.rightBalloon}
			>
				<Typography variant="body1">{message.text}</Typography>
				<Typography variant="caption">{message.name}</Typography>

			</Box>
			<Box>
				<Badge
					badgeContent={moodBadgeIcon[message.mood]}
					invisible={moodBadgeIcon[message.mood] === null}
				>
					<Avatar alt={message.name} src={avatarSrc} />
				</Badge>
			</Box>
		</Box>
	)
}

function SystemMessage(props) {
	const message = props.message;

	return (
		<Box
			display="flex"
			flexDirection="row"
			alignItems="center"
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

	const scrollBottomRef = useRef();
	
	useLayoutEffect(()=>{
		// 書き換わるたびに最下行へ自動スクロール
		scrollBottomRef?.current?.scrollIntoView();
	},[props.log]);

	const messages = props.log.map(message => {

		switch (message.person) {
			case 'user': return <RightBalloon key={message.id} message={message} />
			case 'bot':
			case 'other': return <LeftBalloon key={message.id} message={message} />
			default: return <SystemMessage key={message.id} message={message} />
		}
	});

	return (
		<Box
			display="flex"
			flexDirection="column"
		>
			{messages}
			<div ref={scrollBottomRef}/>
		</Box>
	)
}