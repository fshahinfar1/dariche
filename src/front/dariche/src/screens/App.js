import React from 'react';
import Peer from 'simple-peer';
import '../styles/App.css';

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isConnecting: false,
			isConnected: false,
			peerAccountId: '',
			peer: null,
			selectedFile: null,
			//self: null,
		};
	}

	componentDidMount() {
		this.registerToServer()
	}

	/*
	 * Register to signalling server to let
	 * other peers to send message to this
	 * client.
	 * **/
	registerToServer = async () => {
		// Send a message to let the server now I am here!
		// ...
		this.pollInterval = setInterval(this.pollSignallingServer, 3000);
	};

	/*
	 * poll server, checking if another user has
	 * any message for this client.
	 * **/
	pollSignallingServer = () => {
		// send request to the serever
		// if there is a connection request
		// then call this.onConnectRequest
		// function and pass then offer.
		// ==
		// If this client has started the
		// communication then it is waiting for
		// the answer. if the answer is there then
		// call this.onAnswerReceived
	}

	/*
	 * Sending data to the user with the given
	 * account id through signalling server.
	 * **/
	pushSignallingServer = (accountId, data) => {
		// send data to signalling server
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
		console.log('connecting ...');
		// disable connect button
		await this.setState({isConnecting: true});
		const peer = new Peer();
		peer.on('signal', function (data) {
			// this should be the offer and ...
			const paid = this.state.peerAccountId; // peer account id
			this.pushSignallingServer(paid, data);
		});
		peer.on('connect', () => this.onConnectedToPeer(peer));
		peer.on('data', this.onDataReceived);
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

	onConnectRequest = offer => {
		// TODO: check if this is offer message is needed or not!
		console.log('connecting ...');
		await this.setState({isConnecting: true});
		// TODO: seperate peer creating logic with another function
		// because there are a lot in common with this.onConnectClicked
		const opts = {
			initiator: true,
		}
		const peer = new Peer(opts);
		peer.on('signal', function (data) {
			const paid = this.state.peerAccountId;
			this.pushSignallingServer(paid, data);
		});
		peer.on('connect', () => this.onConnectedToPeer(peer));
		peer.on('data', this.onDataReceived);
	};

	onDataReceived = data => {
		const file = new Blob([data]);
		console.log('received file:', file);
		download(file, 'test.txt');  // TODO: save with a correct extention and name ...
	};

	render() {
		return (
			<div>
			<h1>Dariche</h1>
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
					onTextChange={text => this.setState({peerAccountId:text})}
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
