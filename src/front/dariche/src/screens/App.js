import React from 'react';
import Peer from 'simple-peer';
import {serverAddress} from '../constants';
import requests from '../misc/requests';
import download from '../misc/download';
import '../styles/App.css';



class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoggedIn: false,
			myAID: '',
			isConnecting: false,
			isConnected: false,
			peerAccountId: '',
			peer: null,
			selectedFile: null,
		};
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
		const payload = {aid: this.state.myAID,};
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
		const resp = await requests.post(url, {aid: this.state.myAID});
		if (resp === undefined) return;
		const messages = resp.queue;
		if (messages === undefined) return;
		messages.forEach(item => {
			const payload = JSON.parse(item);
			this.onSignallingData(payload);
		});
	}

	/*
	 * Sending data to the user with the given
	 * account id through signalling server.
	 * **/
	pushSignallingServer = (accountId, data) => {
		// send data to signalling server
		const url = serverAddress + '/';
		let payload = {
			paid: accountId,
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

	onLoginClicked = () => {
		if (this.state.myAID === '') {
			return;
		}
		this.setState({isLoggedIn: true});
		this.registerToServer();
	}

	onConnectClicked = async () => {
		this.setupPeer(true);
	};

	onShareClicked = () => {
		if (this.state.selectedFile === null) {
			// show a flash message that no file is selected
			// TODO: seperate file validation from App component
			return;
		}
		console.log('sending file:', this.state.selectedFile)
		this.state.selectedFile.arrayBuffer()
		.then(buffer => {
			this.setState({isSending: true});
			this.state.self.send(buffer);
		});
	};

	setupPeer = initiator => {
		console.log('connecting ...');
		this.setState({isConnecting: true});
		const opts = {
			initiator: initiator,
		}
		const peer = new Peer(opts);
		peer.on('signal', data => {
			const paid = this.state.peerAccountId;
			this.pushSignallingServer(paid, data);
		});
		this.setState({peer,});
		peer.on('connect', () => this.onConnectedToPeer(peer));
		peer.on('data', this.onDataReceived);
	};

	onSignallingData = data => {
		const peer = this.state.peer;
		if (peer === null) {
			console.error('received signalling data but has not setup peer');
			this.setupPeer(false);
		}
		this.state.peer.signal(data);
	}

	onDataReceived = data => {
		const file = new Blob([data]);
		console.log('received file:', file);
		download(file, 'test.txt');  // TODO: save with a correct extention and name ...
	};

	renderLoginForm = () => {
		return (
			<div>
				<input
					type="text"
					onChange={evt => this.setState({myAID: evt.target.value})}
				/>
				<input
				type="button"
				value="login"
				onClick={this.onLoginClicked}
				/>
			</div>
		);
	}

	render() {
		if (!this.state.isLoggedIn) {
			return (this.renderLoginForm());
		}
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
