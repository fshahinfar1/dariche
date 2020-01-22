import React from 'react';
import Peer from 'simple-peer';
import {serverAddress} from '../constants';
import requests from '../misc/requests';
import download from '../misc/download';
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
		};
		this.selectedFile = React.createRef();
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
			const payload = JSON.parse(item.message);
			this.onSignallingData(sender, payload);
		});
	}

	/*
	 * Sending data to the user with the given
	 * account id through signalling server.
	 * **/
	pushSignallingServer = (aid, paid, data) => {
		// send data to signalling server
		const url = serverAddress + '/';
		let payload = {
			sender: aid,
			recipient: paid,
			message: JSON.stringify(data),
		}
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


	onConnectClicked = async () => {
		this.setupPeer(this.state.peerAccountId, true);
	};

	onShareClicked = () => {
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
			this.pushSignallingServer(aid, paid, data);
		});
		this.setState({peer, peerAccountId: paid,});
		peer.on('connect', () => this.onConnectedToPeer(peer));
		peer.on('data', this.onDataReceived);
		return peer;
	};

	onSignallingData = (sender, data) => {
		let peer = this.state.peer;
		if (peer === null) {
			console.error('received signalling data but has not setup peer');
			peer = this.setupPeer(sender, false);
		}
		console.log('signal', data);
		peer.signal(data);
	}

	onDataReceived = data => {
		const file = new Blob([data]);
		console.log('received file:', file);
		download(file, 'test.txt');  // TODO: save with a correct extention and name ...
	};

	render() {
		return (
			<div>
			<h1>Dariche</h1>
			<h2>{`logged in as ${this.state.myAID}`}</h2>
			{
				this.state.isConnected ? (
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
				) : (
					<div>
					<input
					type="text"
					placeholder="peer account id"
					onChange={evt => this.setState({peerAccountId:evt.target.value})}
					disabled={this.state.isConnecting ? 'disabled' : ''}
					/>
					<input
					type="button"
					value="connect"
					disabled={this.state.isConnecting ? 'disabled' : ''}
					onClick={this.onConnectClicked}
					/>
					</div>
				)
			}
			</div>
		);
	}

}

export default App;
