import React from 'react';
import formatFileSize from '../../misc/fileSizeFormatter';
import './filedesc.css';


function FileDesc(props) {
	if (props.file === null || props.file === undefined)
		throw new Error("FileDesc with no valid file property");
	const file = props.file;
	const fileSize = formatFileSize(file.fileSize);
	return (
		<div className="filedesc-container">
		<span>{file.sender}: {file.fileName}: {fileSize}</span>
		<button onClick={() => props.onDownloadClicked()}>
		download
		</button>
		</div>
	);
}

export default FileDesc;
