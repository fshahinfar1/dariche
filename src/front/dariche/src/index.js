import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Route,
	Switch
} from 'react-router-dom';
import Header from './components/header';
import './styles/index.css';
import App from './screens/App';
import Login from './screens/Login';
import * as serviceWorker from './services/serviceWorker';

function AppScreenRouter(props) {
	const [isLoggedIn, setLogin] = useState(false);
	const [accountId, setAccountId] = useState('');
	const index = isLoggedIn ? <App accountId={accountId} /> :
		<Login onLogin={aid => {
			setAccountId(aid);
			setLogin(true);
		}}/>;

	return (
		<Router>
		<Header />
		<Switch>
		<Route path="/">
		{index}
		</Route>
		</Switch>
		</Router>
	);
}

ReactDOM.render(<AppScreenRouter />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
