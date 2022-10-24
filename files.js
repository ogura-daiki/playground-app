
import Encoding from "https://cdn.skypack.dev/encoding-japanese";

const file2Array = async file => new Uint8Array(await file.arrayBuffer());
const encodeToUNICODE = (src) => {
  const currentEncoding = Encoding.detect(src);
  const test = new TextDecoder(currentEncoding);
  return test.decode(src);
}
const isTextFile = (() => {
  function* range(start, end) {
    for (let i = start; i <= end; i++) {
      yield i;
    }
  }
  const charSet = new Set([7, 8, 9, 10, 12, 13, 27, ...range(0x20, 0xff)]);
  return src => {
    return src.every(d => charSet.has(d));
  }
})();
const string2BinaryString = string => {
  return array2BinaryString(new TextEncoder().encode(string));
}
const binaryString2Array = binStr => Uint8Array.from(binStr.split(""), e => e.charCodeAt(0));
const binaryString2String = binStr => new TextDecoder().decode(binaryString2Array(binStr));
const binaryString2DataURI = (binStr, mimeType) => `data:${mimeType};charset=utf-8;base64,${btoa(binStr)}`;
addReadOnly(window, { string2BinaryString, binaryString2String, binaryString2DataURI });

const array2BinaryString = array => {
  let binaryStr = "";
  for (const part of array) {
    binaryStr += String.fromCharCode(part);
  }
  return binaryStr;
}

const FileUtil = async file => {
  const array = await file2Array(file);
  return {
    encodeToUNICODE: () => encodeToUNICODE(array),
    isTextFile: () => isTextFile(array),

    toBinaryString: () => array2BinaryString(array),
    toDataURI: () => binaryString2DataURI(this.toBinaryString(), file.type),
    file: file,
  };
}
Object.defineProperty(FileUtil, "fromNameValuePair", {
  value: (name, value) => {
    return new File([value], name, { type: getMimeTypeFromFileName(name) });
  },
  writable: false,
});
Object.defineProperty(window, "FileUtil", {
  value: FileUtil,
  writable: false,
});

const loadFile = async () => {
  // ファイル選択ダイアログを表示してユーザーのファイル選択を待つ
  const fh_list = await window.showOpenFilePicker();

  // 選択されたファイルを表す FileHandle オブジェクト
  const fh = fh_list[0];

  // File オブジェクトを取得
  const file = await fh.getFile();
  return { name: file.name, value: await FileUtil(file) };
}
Object.defineProperty(window, "loadFile", {
  value: loadFile,
  writable: false,
});