import React from 'react';
import Peer from 'simple-peer';
import {serverAddress} from '../constants';
import requests from '../misc/requests';
import download from '../misc/download';
import {createUser, fetchOnlineUsers} from '../misc/loginUtility';
import FileDesc from '../components/filedesc/filedesc.js';
import '../styles/App.css';


class App extends React.Component {
	constructor(props) {
		super(props);
		if (!props.accountId) {
			throw new Error('User does not have an account id');
		}
		this.state = {
			myAID: props.accountId,
			isSignallingChannelReady: false,
			isConnecting: false,
			isConnected: false,
			peerAccountId: '',
			peer: null,
			filesSharedWithMe: [],
			mySharedFiles: [],
		};
		this.selectedFile = React.createRef();
		this.fileDescription = '';
		this.rBuffers = [];
		this.wsConnection = null;
	}

	componentDidMount() {
		this.registerToServer()
	}

	componentWillUnmount() {
		this.clearPolling();
	}

	/*
	 * Register to signalling server to let
	 * other peers to send message to this
	 * client.
	 * **/
	registerToServer = async () => {
		// Send a message to let the server now I am here!
		// ...
		// polling server
		//const helloURL = `${serverAddress}/hello`;
		//const payload = {sender: this.state.myAID,};
		//requests.post(helloURL, payload);
		//this.pollInterval = setInterval(this.pollSignallingServer, 3000);
		//this.setState({isSignallingChannelReady: true}); //not tested

		// websocket
		//const loginRes = await createUser(this.state.myAID, 'password');
		//console.log(loginRes);
		const ws = new WebSocket(serverAddress +'/socket');
		ws.onopen = () => {
			this.wsSend('LOGIN', this.state.myAID, this.state.myAID);
			this.setState({isSignallingChannelReady: true});
		}
		ws.onmessage = msg => {
			console.log('ws onmessage:', msg.data);
			msg = JSON.parse(msg.data);
			this.signallingLogic(msg.data);
		}
		this.wsConnection = ws;
	};

	clearPolling = () => {
		if (this.pollInterval !== undefined) {
			clearInterval(this.pollInterval);
			this.pollInterval = undefined;
		}
	}

	/*
	 * poll server, checking if another user has
	 * any message for this client.
	 * **/
	pollSignallingServer = async () => {
		const url = `${serverAddress}/poll`;
		const resp = await requests.post(url, {sender: this.state.myAID});
		if (resp === undefined) return;
		const messages = resp.queue;
		if (messages === undefined) return;
		messages.forEach(item => {
			// console.log(item);
			this.signallingLogic(item);
		});
	}

	/*
	 * Sending data to the user with the given
	 * account id through signalling server.
	 * **/
	pushSignallingServer = (aid, paid, data, type) => {
		// send data to signalling server
		if (this.wsConnection === null || !this.state.isSignallingChannelReady) {
			throw new Error('signalling channel not established yet!');
		}
		if (aid === null || aid === undefined || paid === null
			|| paid === undefined || type === null || type === undefined) {
			throw new Error('pushing parameters is invalid');
		}
		// const url = serverAddress + '/';
		const payload = {
			sender: aid,
			recipient: paid,
			message: JSON.stringify(data),
			type,
		}
		// console.log('payload', payload);
		// requests.post(url, payload);
		this.wsSend('SIGNAL', paid, payload);
	}

	onConnectedToPeer = peer => {
		console.log('connected!');
		this.setState({
			isConnected: true,
			isConnecting: false,
			isSending: false,
			peer: peer,
		});
	};

	/*
	 * This function is called when a signalling
	 * data is received over shared channel
	 * **/
	onSignallingData = (sender, data) => {
		let peer = this.state.peer;
		if (peer === null) {
			// setting up peer
			peer = this.setupPeer(sender, false);
		}
		// console.log('signal', data);
		peer.signal(data);
	}

	onFileSharedWithMe = (sender, desc) => {
		const files = this.state.filesSharedWithMe.concat({ sender, ...desc});
		this.setState({filesSharedWithMe: files,});
	}

	/*
	 * This function is called when this client
	 * receives data over webRTC data channel
	 * **/
	onDataReceived = data => {
		const sender = this.state.peerAccountId;
		console.log('sender is ', sender);
		if (sender === '') {
			throw new Error('receive data on data channel but {paid} is not set');
		}
		try {
			const _data = JSON.parse(data.toString());
			console.log('on string data from web', _data);
			if (_data.type === 'filereq') {
				this.sendFile(_data.fileName);
			} else if (_data.type === 'filedone') {
				console.log('all chunks received');
				this.onAllFileChunkReceived(sender, _data.fileId);
			} else if (_data.type === 'goodbye') {
				this.disconnectFromPeer(false);
			} else {
				this.receiveFile(sender, data);
			}
		} catch {
			this.receiveFile(sender, data)
		}
	};

	onAllFileChunkReceived = (sender, fileId) => {
		console.log('on all file chunk received');
		if (!(sender in this.rBuffers)) {
			throw new Error('File received event but no buffer allocated!');
		}
		const rcvBuf = this.rBuffers[sender];
		const file = new Blob(rcvBuf);
		console.log('received file:', file, fileId);
		download(file, fileId);
		this.disconnectFromPeer(true);
		// TODO: free up the buffer
		delete this.rBuffers[sender];
	}

	/*
	 * This function shares a file descriptor with
	 * a peer.
	 * **/
	onShareClicked = () => {
		let file = this.selectedFile.current;
		if (file === null, file.files[0] === null)
			return
		file = file.files[0];
		// console.log(file);
		const description = this.state.fileDesc;
		const url = `${serverAddress}/relay`;
		const payload = {
			fileName: file.name,
			fileSize: file.size,
			description: this.fileDescription,
		};
		const recipient = this.state.peerAccountId;
		this.pushSignallingServer(this.state.myAID, recipient,
															payload, 'filedesc');
		// update my shared files state
		const fileId = file.name;
		let fileDesc = this.findFile(fileId);
		if (fileDesc === undefined) {
			fileDesc = {
				fileId: file.name,
				acl: [], // access control list
				file: file,
			}
		}
		fileDesc.acl.push(recipient);
		const mySharedFiles = this.state.
											mySharedFiles.filter(file => file.fileId !== fileId)
		mySharedFiles.push(fileDesc);
		this.setState({mySharedFiles,});
	}

	onDownloadFileClicked = fileDesc => {
		console.log('request download', fileDesc);
		const sender = fileDesc.sender;
		const fname = fileDesc.fileName;
		this.connectToPeer(sender, () => {
			// send file request through data channel
			const peer = this.state.peer;
			const payload = {
				type: 'filereq',
				...fileDesc
			}
			peer.send(JSON.stringify(payload));
		});
	}

	onTextAreaChange = evnt => {
		const text = evnt.target.value;
		console.log(text);
		this.fileDescription = text;
	}

	setupPeer = (paid, initiator, callback) => {
		console.log(`connecting to ${paid} ...`);
		this.setState({isConnecting: true});
		const opts = {
			initiator: initiator,
		}
		const peer = new Peer(opts);
		peer.on('signal', data => {
			const aid = this.state.myAID;
			const paid = this.state.peerAccountId;
			this.pushSignallingServer(aid, paid, data, 'signal');
		});
		this.setState({peer, peerAccountId: paid,});
		peer.on('connect', () => {
			this.onConnectedToPeer(peer)
			if (callback !== undefined) callback.call();
		});
		peer.on('data', this.onDataReceived);
		return peer;
	};

	connectToPeer = (paid, callback) => {
		this.setupPeer(paid, true, callback);
	};

	disconnectFromPeer = (notify, callback) => {
		const peer = this.state.peer;
		if (peer !== null) {
			if (notify) {
				const payload = {type:'goodbye',}
				peer.send(JSON.stringify(payload));
			}
			peer.destroy();
		}
		this.setState({
			peer: null,
			peerAccountId: '',
			isConnected: false,
			isConnecting: false,
		});
		callback.call();
	}

	/*
	 * Get the file from the shared files using
	 * a file id (file name) and start uploading to
	 * peer through data channel.
	 * The file could be unshared and the client
	 * can respond with fail request.
	 * **/
	sendFile = fileId => {
		const paid = this.state.peerAccountId;
		if (this.state.peer === null || paid === '') {
			console.error('sending file but peer not setup!');
			return;
		}
		console.log('looking for file', fileId);
		let file = this.findFile(fileId);
		if (file === undefined) {
			console.log('requested file not found');
			// TODO: inform the peer of this status
			// TODO: Disconnect
			return;
		}
		// check acl
		if (file.acl.indexOf(paid) < 0) {
			console.log('requester not in acl');
			// TODO: notify the peer
			// TODO: Disconnect
			return;
		}
		file = file.file;
		if (file === null) return;
		console.log('sending file:', file.name);
		file.arrayBuffer()
			.then(buffer => {
				// Send files in chunks
				this.setState({isSending: true});
				const len = buffer.byteLength;
				const chunkSize = 16 * 1024 * 1024; // 16KB chunks
				let sent = 0;
				while (sent < len) {
					const chunk = buffer.slice(sent, sent + chunkSize);
					sent += chunkSize;
					this.state.peer.send(chunk);
				}
				const payload = {
					type: 'filedone',
					fileId,
				}
				this.state.peer.send(JSON.stringify(payload));
			});
	};

	findFile = fileId => {
		const file = this.state.mySharedFiles
									.find(item => item.fileId === fileId);
		return file
	}

	receiveFile = (sender, data) => {
		if (!(sender in this.rBuffers)) {
			this.rBuffers[sender] = [];
		}
		const rcvBuf = this.rBuffers[sender];
		rcvBuf.push(data);
		console.log('file chunk received');
	}

	signallingLogic = data => {
		console.log('signalling logic', data);
		const sender = data.sender;
		const type = data.type;
		const payload = JSON.parse(data.message);
		if (type === 'signal') {
			this.onSignallingData(sender, payload);
		} else if (type === 'filedesc') {
			this.onFileSharedWithMe(sender, payload);
		}
	}

	wsSend = (type, dest, data) => {
		if (this.wsConnection === null) {
			throw new Error('ws connection does not exists');
		}
		const payload = {
			signalType: type,
			destUserName: dest,
			data: data,
		};
		console.log(payload);
		this.wsConnection.send(JSON.stringify(payload));
	}

	// ===== rendering ========================================
	renderOnlineUsers = () => {
		const users = ['farhad', 'fardin', 'hawk']
		const items = users.map(item => {
			return (
				<div
				className="user-list-instance"
				key={item}
				>
				<p>{item}</p>
				</div>
			);
		});
		return (
			<div >
			<h3>Online users</h3>
			{items}
			</div>
		);
	}

	renderSharingSection = () => {
		return (
			<div>
			<form className="share-form">
			<input
			type="text"
			placeholder="peer account id"
			value={this.state.peerAccountId}
			onChange={evt => this.setState({peerAccountId:evt.target.value})}
			disabled={this.state.isConnecting ? 'disabled' : ''}
			/>
			<input
			type="file"
			id="file-input"
			disabled={this.isSending ? 'disabled' : ''}
			ref={this.selectedFile}
			/>
			<textarea
			style={{resize: 'none',}}
			rows={5}
			cols={35}
			placeholder="Enter description for the file"
			onChange={this.onTextAreaChange}
			/>
			<input
			type="button"
			value="share"
			disabled={this.state.isConnecting ? 'disabled' : ''}
			onClick={this.onShareClicked}
			/>
			</form>
			</div>
		);
	}

	renderSendingSection = () => {
		return (
			<div>
					<div>
					<input
					type="file"
					id="file-input"
					disabled={this.isSending ? 'disabled' : ''}
					ref={this.selectedFile}
					/>
					<input
					type="button"
					value="share"
					onClick={this.onShareClicked}
					disabled={this.isSending ? 'disabled' : ''}
					/>
					</div>
			</div>
		);
	}

	renderSharedFilesSection = () => {
		const myFiles= this.state.filesSharedWithMe;
		const items = myFiles.map((item, i) => {
			return (
				<FileDesc
				file={item}
				key={i}
				onDownloadClicked={()=>this.onDownloadFileClicked(item)}
				/>
			)
		});
		return (
			<div>
			<h3>Files shared with me</h3>
			<div>
			{items}
			</div>
			</div>
		);
	}

	render() {
		if (!this.state.isSignallingChannelReady) {
			return (
				<div style={{
					display:'flex',
						justifyContent:'center',
						alignItems:'center',
						width:'100%',
						height:'100%'}}>
				<h2>Connecting to Signalling Server</h2>
				</div>
			);
		}
		return (
			<main className="main-container">
			<div className="card sharedfiles-container">
			{this.renderSharedFilesSection()}
			</div>
			<div className="card share-container">
			<h2>{`logged in as ${this.state.myAID}`}</h2>
			{this.renderSharingSection()}
			</div>
			<div className="card users-container">
				{this.renderOnlineUsers()}
			</div>
			</main>
		);
	}

}

export default App;
