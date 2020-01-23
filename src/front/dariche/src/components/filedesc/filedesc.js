import React from 'react';
import './filedesc.css';


function FileDesc(props) {
	if (props.file === null || props.file === undefined)
		throw new Error("FileDesc with no valid file property");
	const file = props.file;
	return (
		<div className="filedesc-container">
		<span>{file.sender}: {file.fileName}: {file.fileSize}</span>
		<button>download</button>
		</div>
	);
}

export default FileDesc;
