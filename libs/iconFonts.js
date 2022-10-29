import { css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import make from './make.js';

const iconFonts = css`
/**
* アイコンフォント定義
*/
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");
/* クラス指定が長いので iタグで代替 */
i {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}
i {
  font-variation-settings:
  'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 48;
  /*font-size:1.5em;*/
  user-select:none;
  /*margin-top: -0.05em;*/
}
`;
document.head.append(make("style", {textContent:iconFonts}));

export default iconFonts;