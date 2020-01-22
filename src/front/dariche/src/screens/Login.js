import React from 'react';
import '../styles/Login.css';

class Login extends React.Component {
	constructor(props) {
		super(props);
		if (!this.props.onLogin) {
			throw new Error('login screen needs on login clicked callback!');
		}

		this.state = {
			accountId: '',
		}
	}

	onLoginClicked = () => {
		const aid = this.state.accountId;
		if (aid === '') return;
		this.props.onLogin(aid);
	}

	render() {
		return (
			<div className="login-form-container">
			<div className="login-form">
			<input
			type="text"
			placeholder="account id"
			onChange={evt => this.setState({accountId: evt.target.value})}
			/>
			<input
			type="button"
			value="login"
			onClick={this.onLoginClicked}
			/>
			</div>
			</div>
		);
	}
}

export default Login;
