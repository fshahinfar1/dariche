import {restServerAddress} from '../constants';
import requests from './requests.js';


export async function createUser(userName, password='') {
	const url = `${restServerAddress}/users/add`;
	const payload = {userName, password,}
	const res = await requests.post(url, payload);
	return res;
}

export async function fetchOnlineUsers() {
	const url = `${restServerAddress}/users/online`;
	const res = await requests.get(url);
	return res;
}

