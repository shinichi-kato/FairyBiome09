import React from "react";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';
import PartIcon from '@mui/icons-material/RecordVoiceOver';



function Part(props) {
	function handleUpItem(items, pos) {
		// posのitemを一つ上げる操作
		if (pos < 1 || items.length <= pos) return;

		let poped = items.splice(pos, 1);
		items.splice(pos - 1, 0, poped[0]);

		props.handleChange(items);
	}

	function handleDownItem(items, pos) {
		// posのitemを一つ下げる操作
		if (pos < 0 || items.length - 1 < pos) return;

		let poped = items.splice(pos, 1);
		items.splice(pos + 1, 0, poped[0]);

		props.handleChange(items);

	}

	return (
		<ListItem key={props.item} className={props.partStyle}>
			<ListItemIcon>
				<PartIcon />
			</ListItemIcon>
			<ListItemText primary={props.item} />
			<ListItemSecondaryAction>
				<IconButton onClick={() => handleUpItem(props.items, props.pos)}>
					<UpIcon />
				</IconButton>
				<IconButton onClick={() => handleDownItem(props.items, props.pos)} edge="end">
					<DownIcon />
				</IconButton>
			</ListItemSecondaryAction>
		</ListItem>
	)
}

export default function PartOrder(props) {
	/* props.itemsをレンダリング
				"initialPartOrder": [
					"greeting",
					"faq",
					"cheer",
					"peace"
			],
			props.part : partOrderリスト
			props.handleChangePartOrder: 変更メソッド
		*/
	return (
		<List>
			{props.items.parts.map((item, index, arr) =>
				<Part
					key={item}
					item={item}
					items={arr}
					pos={index}
					handleChange={props.handleChange}
					partStyle={props.partStyle}
				/>
			)}
		</List>

	)
}