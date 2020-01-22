async function post(url, payload, _headers) {
	let headers = {'Content-Type': 'application/json',};
	if (_headers !== undefined) {
		headers = _headers;
	}
	const config = {
		method: 'POST',
		mode: 'cors',
		cache: 'no-cache',
		headers: headers,
		redirect: 'follow',
		referrerPolicy: 'no-referrer',
		body: JSON.stringify(payload),
	};
	try {
		const resp = await fetch(url, config);
//		console.log('response:', resp);
		const json = await resp.json();
		return json;
	} catch (e){
		console.log('post failed', e);
		return undefined;
	}
}

const requests = {
	post: post,
}

export default requests;

