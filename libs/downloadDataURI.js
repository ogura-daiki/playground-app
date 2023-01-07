const dataURItoBlob = dataURI => {
	const b64 = atob(dataURI.split(',')[1]);
	const u8 = Uint8Array.from(b64.split(""), e => e.charCodeAt());
	return new Blob([u8], {type: "image/png"});
}

const downloadDataURI = (dataURI, filename) => {
	const blob = dataURItoBlob(dataURI);
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.download = filename;
	a.href = url;
	a.click();
	
	// ダウンロードの時間がわからないので多めに 最低 3s,  1MiB / sec として
	// 終わった頃に revoke する
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, Math.max(3000, 1000 * dataURI.length / 1024 * 1024));
}

export default downloadDataURI;