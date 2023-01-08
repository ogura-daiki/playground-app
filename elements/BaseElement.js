import { LitElement, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import iconFonts from '../libs/iconFonts.js';

class BaseElement extends LitElement{
  static get styles(){
    return [
      iconFonts,
      css`
        .fill {
          width: 100%;
          height: 100%;
          box-sizing:border-box;
        }

        .col, .row{
          display:flex;
        }
        .col{
          flex-flow:column;
        }
        .row{
          flex-flow:row;
        }

        .grow{
          flex-grow:1;
          flex-basis:0px;
        }

        .centering{
          display:grid;
          place-items:center;
          place-content:center;
        }

        .scroll_overlay::-webkit-scrollbar {
          width:4px;
          height:4px;
        }
        /*スクロールバーの軌道*/
        .scroll_overlay::-webkit-scrollbar-track {
          border-radius: 10px;
          box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
        }

        /*スクロールバーの動く部分*/
        .scroll_overlay::-webkit-scrollbar-thumb {
          background-color: rgba(200,200,200, .5);
          border-radius: 10px;
          box-shadow:0 0 0 1px rgba(255, 255, 255, .3);
        }
      `,
    ];
  }

  emit(type, detail={}, composed=true){
    this.dispatchEvent(new CustomEvent(type, {detail, composed, bubbles:composed}));
  }
}

export default BaseElement;