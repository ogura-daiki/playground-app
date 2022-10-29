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
        }
      `,
    ];
  }
}

export default BaseElement;