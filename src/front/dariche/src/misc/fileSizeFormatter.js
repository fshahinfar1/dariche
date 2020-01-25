/*
 * takes an integer as input
 * returns a string.
 * **/
function formatFileSize(size) {
	let res = size.toString()
	const len = res.length;
	if (len === 0) return '';
	const scale = Math.floor((len - 1) / 3);
	res = res.slice(0, len - scale * 3);
	let suffix = '';
	switch(scale) {
		case 0: return res;
		case 1:
			suffix = 'KB';
			break;
		case 2:
			suffix = 'MB';
			break;
		case 3:
			suffix = 'GB';
			break;
		case 4:
			suffix = 'TB';
			break;
		default:
			suffix = 'xB';
			break;
	}
	return `${res} ${suffix}`;
}

export default formatFileSize;

