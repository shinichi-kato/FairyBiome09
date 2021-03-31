import React, { useContext, useEffect, useState } from 'react';
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
		"${message.avatarPath}/${message.mood}.svg"
		:
		"${message.avatarPath}";

	return (
		<Box
			display="flex"
			flexDirection="row"
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

export default function LogViewer(props) {
	/*
		props.logの内容を吹き出しにレンダリング
	*/

	return (
		<Box
			display="flex"
			flexDirection="column"
		>

		</Box>
	)
}