import React, { useState } from "react";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import DownIcon from '@material-ui/icons/KeyboardArrowDown';
import UpIcon from '@material-ui/icons/KeyboardArrowUp';

function Part(props) {
	function handleUpItem(items,pos){
		// posのitemを一つ上げる操作

		props.handleChangePartOrder(items);
	}

	function handleDownItem(items,pos){
		// posのitemを一つ下げる操作
		
		props.handleChangePartOrder(items);

	}

	return (
		<ListItem key={props.item}>
			<ListItemText primary={props.item} />
			<ListItemSecondaryAction>
				<IconButton onClick={()=>handleUpItem(props.items,props.pos)}>
					<UpIcon />
				</IconButton>
				<IconButton onClick={()=>handleDownItem(props.items,props.pos)} edge={end}>
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

	<List>
		{props.items.map(item,index,arr => 
			<Part 
				item={item}
				items={arr}
				pos={index}
				handleChangePartOrder={props.handleChangePartOrder} 
			/>
		)}
	</List>
}