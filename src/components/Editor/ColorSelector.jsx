import React from "react";
import { useStaticQuery, graphql } from "gatsby"
import Box from '@mui/material/Box';
import CheckedIcon from './CheckedIcon';
import BlankIcon from './BlankIcon';
import IconButton from '@mui/material/IconButton';

const query = graphql`
	query palette {
		site {
			siteMetadata {
				palette
			}
		}
	}
`;

function ColorPick(props) {
	return (
		<IconButton
			key={props.color}
			onClick={() => props.handleClick(props.color)}
		>
			{
				props.currentColor === props.color
					?
					<CheckedIcon style={{ color: props.color }} />
					:
					<BlankIcon style={{ color: props.color }} />
			}
		</IconButton>
	)
}

export default function ColorSelector(props) {
	const data = useStaticQuery(query);
	return (
		<Box>
			<ColorPick
				key="default"
				color={props.defaultColor}
				currentColor={props.color}
				handleClick={()=>props.handleChange(props.defaultColor)}
			/>
			{
				data.site.siteMetadata.palette.map(c =>
					<ColorPick
						key={c}
						color={c}
						currentColor={props.color}
						handleClick={()=>props.handleChange(c)} />
				)
			}
		</Box>
	)
}