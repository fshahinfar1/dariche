import React from 'react';
import Peer from 'simple-peer';
import {serverAddress} from '../constants';
import requests from '../misc/requests';
import download from '../misc/download';
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
			isConnecting: false,
			isConnected: false,
			peerAccountId: '',
			peer: null,
			filesSharedWithMe: [],
			mySharedFiles: [],
		};
		this.selectedFile = React.createRef();
		this.fileDescription = '';
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
		const helloURL = `${serverAddress}/hello`;
		const payload = {sender: this.state.myAID,};
		requests.post(helloURL, payload);
		this.pollInterval = setInterval(this.pollSignallingServer, 3000);
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
			console.log(item);
			const sender = item.sender;
			const type = item.type;
			const payload = JSON.parse(item.message);
			if (type === 'signal') {
				this.onSignallingData(sender, payload);
			} else if (type === 'filedesc') {
				this.onFileSharedWithMe(sender, payload);
			}
		});
	}

	/*
	 * Sending data to the user with the given
	 * account id through signalling server.
	 * **/
	pushSignallingServer = (aid, paid, data, type) => {
		// send data to signalling server
		if (aid === null || aid === undefined || paid === null
			|| paid === undefined || type === null || type === undefined) {
			throw new Error('pushing parameters is invalid');
		}
		const url = serverAddress + '/';
		let payload = {
			sender: aid,
			recipient: paid,
			message: JSON.stringify(data),
			type,
		}
		console.log('payload', payload);
		requests.post(url, payload);
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


	onConnectRequest = async () => {
		this.setupPeer(this.state.peerAccountId, true);
	};

	onSendRequest = () => {
		if (this.state.peer === null) return;
		let file = this.selectedFile.current;
		if (file === null) {
			// show a flash message that no file is selected
			// TODO: seperate file validation from App component
			return;
		}
		file = file.files[0];
		if (file === null) return;
		console.log('sending file:', file);
		file.arrayBuffer()
			.then(buffer => {
				this.setState({isSending: true});
				this.state.peer.send(buffer);
			});
	};

	setupPeer = (paid, initiator) => {
		console.log('connecting ...');
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
		peer.on('connect', () => this.onConnectedToPeer(peer));
		peer.on('data', this.onDataReceived);
		return peer;
	};

	/*
	 * This function is called when a signalling
	 * data is received over shared channel
	 * **/
	onSignallingData = (sender, data) => {
		let peer = this.state.peer;
		if (peer === null) {
			console.error('received signalling data but has not setup peer');
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
		const file = new Blob([data]);
		console.log('received file:', file);
		download(file, 'test.txt');  // TODO: save with a correct extention and name ...
	};

	/*
	 * This function shares a file descriptor with
	 * a peer.
	 * **/
	onShareClicked = () => {
		let file = this.selectedFile.current;
		if (file === null, file.files[0] === null)
			return
		file = file.files[0];
		console.log(file);
		const description = this.state.fileDesc;
		const url = `${serverAddress}/relay`;
		const payload = {
			fileName: file.name,
			fileSize: file.size,
			description: this.fileDescription,
		};
		this.pushSignallingServer(this.state.myAID, this.state.peerAccountId,
															payload, 'filedesc');
	}

	onTextAreaChange = evnt => {
		const text = evnt.target.value;
		console.log(text);
		this.fileDescription = text;
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
				<FileDesc file={item} key={i} />
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
