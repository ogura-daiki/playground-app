import { LitElement, html, css } from 'https://unpkg.com/lit-element/lit-element.js?module';

class MenuIcon extends LitElement {
  static get properties() {
    return {
      open: { type: Boolean },
    }
  }
  constructor() {
    super();
    this.open = false;
  }
  toggleOpen() {
    this.open = !this.open;
  }
  static get styles() {
    return css`
    :host{
      display:block;
      aspect-ratio:1;
    }
    #container{
      width:100%;
      height:100%;
      position:relative;
    }
    #container *:where(slot[name="open"], slot[name="close"]){
      display:grid;
      place-items:center;
      user-select:none;
      width:100%;
      height:100%;
      position:absolute;
      top:0px;
      left:0px;
      transition:transform .3s, opacity .3s;
      opacity:1;
    }
    #container slot[name="open"]{
      transform:rotateZ(0deg);
    }
    #container slot[name="close"]{
      transform:rotateZ(180deg);
    }
    #container.open slot[name="open"]{
      transform:rotateZ(180deg);
      opacity:0;
    }
    #container:not(.open) slot[name="close"]{
      transform:rotateZ(0deg);
      opacity:0;
    }
    `;
  }
  render() {
    return html`
    <div id=container class="${this.open ? "open" : ""}">
      <slot name=open></slot>
      <slot name=close></slot>
    </div>
    `;
  }
}
customElements.define("menu-icon", MenuIcon);