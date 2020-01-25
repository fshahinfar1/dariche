import React from 'react';
import {createUser} from '../misc/loginUtility'
import '../styles/Login.css';

function Tab(props) {
	const {name, onClick} = props;
	if (!name) {
		throw new Error('missing an expected property for tab');
	}
	return (
		<div
		className="tab-button"
		onClick={onClick}
		>
		<span>{name}</span>
		</div>
	)
}

class Login extends React.Component {
	constructor(props) {
		super(props);
		if (!this.props.onLogin) {
			throw new Error('login screen needs on login clicked callback!');
		}

		this.state = {
			accountId: '',
			selectedTab: 0,
		}
	}

	onLoginClicked = () => {
		const aid = this.state.accountId;
		if (aid === '') return;
		this.props.onLogin(aid);
	}

	onSignupClicked = async () => {
		const aid = this.state.accountId;
		if (aid === '')  return;
		await createUser(aid, 'password');
		this.props.onLogin(aid);
	}

	renderTab = tab => {
		if (tab === 0) {
			return (
				<div className="login-form">
				<input
				type="text"
				placeholder="account id"
				onChange={evt => this.setState({accountId: evt.target.value})}
				/>
				<input
				key={0}
				type="text"
				placeholder="password"
				onChange={evt => {}}
				/>
				<input
				key={1}
				type="button"
				value="login"
				onClick={this.onLoginClicked}
				/>
				</div>
			);
		}
		else if (tab === 1) {
			return (
				<div className="login-form">
				<input
				key={2}
				type="text"
				placeholder="account id"
				onChange={evt => this.setState({accountId: evt.target.value})}
				/>
				<input
				key={3}
				type="text"
				placeholder="password"
				onChange={evt => {}}
				/>
				<input
				key={4}
				type="text"
				placeholder="confirm password"
				onChange={evt => {}}
				/>
				<input
				key={5}
				type="button"
				value="signup"
				onClick={this.onSignupClicked}
				/>
				</div>
			);
		}
	}
	render() {
		return (
			<div className="login-form-container">
			<div className="tab-container">
			<Tab name="login"
			onClick={()=>this.setState({selectedTab:0})}
			/>
			<Tab name="signup"
			onClick={()=>this.setState({selectedTab:1})}
			/>
			</div>
			{this.renderTab(this.state.selectedTab)}
			</div>
		);
	}
}

export default Login;
