import React, { useState, useContext, useEffect, useCallback } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import Typography from "@material-ui/core/Typography";
import SaveIcon from '@material-ui/icons/SaveAlt';
import AddIcon from '@material-ui/icons/Add';
import { DataGrid } from '@material-ui/data-grid';
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

const columns = [
	{ field: 'key', headerName: '名前', flex: 0.4, editable: true },
	{ field: 'value', headerName: '値', flex: 1, editable: true },
];

function obj2rows(obj) {
	let work = [];
	let i = 0;
	for (let node in obj) {
		if (obj.hasOwnProperty(node)) {
			work.push({ id: i, key: node, value: obj[node] });
			i++;
		}
	}
	return work;
}

function rows2obj(rows) {
	let obj = {};
	for (let row of rows) {
		obj[row.key] = row.value;
	}
	return obj;
}

function setify(rows, column) {
	let bag = {};
	for (let row of rows) {
		bag[row[column]] = true;
	}
	return bag;
}

function maxId(rows) {
	let ids = rows.map(row => row.id);
	return Math.max(ids);

}

export default function MainEditor() {
	const classes = useStyles();
	const bot = useContext(BiomebotContext);
	const [rows, setRows] = useState([]);
	const [message, setMessage] = useState("");

	useEffect(() => {
		setRows(obj2rows(bot.state.main))
	}, [bot.state.main]);

	function handleAdd() {
		const keys = setify(rows, "key");
		if ("" in keys) {
			setMessage("値が空白の行があります")
		}
		else {
			setRows(prevRows =>
				[...prevRows, { id: maxId(prevRows) + 1, key: "新しい値", value: "" }]
			);

		}
	}


	function handleSave() {
		(async () => {

			await bot.save('main', rows2obj(rows));
			setMessage("ok");
		})()
	}

	const handleCellEditCommit = useCallback(
		({ id, field, value }) => {

			if (field === 'key') {
				// keyはunique制約あり
				const keys = setify(rows, "key");

				const updatedRows = rows.map(row => {
					if (row.id === id) {
						if (value in keys) {
							setMessage(`名前${value}が重複しています`);
							return row;
						}
						return { ...row, key: value }
					}
					return row;
				});

				setRows(updatedRows);
			}

		}, [rows]
	);

	useEffect(() => {
		setTimeout(() => setMessage(""), 5000);
	}, [message]);


	return (
		<Box
			display="flex"
			flexDirection="column"
			className={classes.root}
		>
			<Paper className={classes.item} elevation={0} >
				<Box>
					<Typography variant="h5">主記憶</Typography>
					<Typography variant="body2">
						チャットボットが返答するときに使う設定や文字列を定義します。
						重複した「名前」は設定できません。<br />
						値をカンマ(,)で区切るとそれらの中からランダムに選んだ一つを使用します。
						値の中で{"{NAME}"}のように他の名前を使うと、それぞれの値に展開されます。
					</Typography>
				</Box>
				<Box
					height={600}
				>
					<Button
						variant="outlined"
						color="primary"
						startIcon={<AddIcon />}
						onClick={handleAdd}
					>
						行の追加
					</Button>
					<DataGrid
						height={500}
						rows={rows}
						columns={columns}
						hideFooterSelectedRowCount
						onCellEditCommit={handleCellEditCommit}
					/>
				</Box>
				<Typography color="error">
					{(message !== "" || message !== "ok") && message}
				</Typography>

			</Paper>

			<Box className={classes.fab}>
				<Fab
					variant="extended"
					color="primary"
					aria-label="save"
					onClick={handleSave}
				>
					<SaveIcon className={classes.fabIcon} />保存
					{message === "ok" && "- ok"}
				</Fab>
			</Box>

		</Box>
	)
}