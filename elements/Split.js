import { LitElement, html, css, join } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class EventListenerManager {
    #list = [];
    #element;
    constructor(element){
        this.#element = element;
    }
    register(...a){
        this.#list.push(a);
    }
    assignAll(){
        for(const args of this.#list){
            this.#element.addEventListener(...args);
        }
    }
    removeAll(){
        for(const args of this.#list){
            this.#element.removeEventListener(...args);
        }
    }
}

class Split extends LitElement {
  static get properties() {
    return {
      vertical: { type: Boolean },
      count: { type: Number },
      weight_sum: { type: Number },
      weights: { type: Array },
      min_weights: { type: Array },
      knob_overflow: { type: Boolean },
      md: { state: true },
    };
  }

  #beforeHash;
  #updateCurrentWeightIfNeeded() {
    const hash = JSON.stringify({count:this.count, weights:this.weights, weight_sum:this.weight_sum, min_weights:this.min_weights});
    if(this.#beforeHash === hash){
        return;
    }
    this.#beforeHash = hash;
    this.currentWeight = this.weights.map(v => v / this.weight_sum);
  }

  #eventManager;
  constructor() {
    super();
    this.vertical = false;
    this.count = 2;
    this.weight_sum = 1;
    this.weights = [0.5, 0.5];
    this.min_weights = [0.15, 0.15];
    this.currentWeight = [];
    this.knob_overflow = true;

    this.#eventManager = new EventListenerManager(this);
    this.#eventManager.register("mousemove", e => {
      if (this.md !== null) {
        let move = e.movementX / this.offsetWidth;
        if (this.vertical) {
          move = e.movementY / this.offsetHeight;
        }
        if (move < 0) {
          move = Math.abs(move);
          const minWidth = this.min_weights[this.md]/this.weight_sum;
          if (this.currentWeight[this.md] - move < minWidth) {
            move = (this.currentWeight[this.md] - minWidth) / this.weight_sum;
          }
          move = -move;
        }
        else {
          const minWidth = this.min_weights[this.md + 1]/this.weight_sum;
          if (this.currentWeight[this.md + 1] - move < minWidth) {
            move = (this.currentWeight[this.md + 1] - minWidth) / this.weight_sum;
          }
        }
        this.currentWeight[this.md] += move;
        this.currentWeight[this.md + 1] -= move;
        this.requestUpdate();
      }
    });
    this.#eventManager.register("mouseup", e => {
      this.md = null;
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#eventManager.assignAll();
  }
  disconnectedCallback(){
    super.disconnectedCallback();
    this.#eventManager.removeAll();
  }

  createKnob(i) {
    if(!this.knob_overflow){
      return html`
        <div class="knob ${this.vertical ? "v" : "h"}"
        @mousedown=${e => {
          this.md = i;
        }}></div>
      `;
    }
    else {
      return html`
        <div style="
          overflow:visible;
          ${this.vertical ? "height" : "width"}:0px;
          position:relative;
          user-select:none;
        ">
          <div class="knob ${this.vertical ? "v" : "h"}" style="
            ${this.vertical ? "top" : "left"}:-4px;
            position:absolute;
          "
          @mousedown=${e => {
            this.md = i;
          }}></div>
        </div>
      `;
    }
  }
  render() {
    this.#updateCurrentWeightIfNeeded();
    return html`
    <style>
      :host{
        cursor:${this.md != null ? (this.vertical ? "row-resize" : "col-resize") : ""};
      }
    </style>
    <div id=container class="${this.vertical?"v":"h"}">
    ${join(
      this.currentWeight.map((weight, i) => html`
        <slot
        name="${i}"
        style="
            ${this.md != null ? "user-select:none;pointer-events:none;" : ""}
            ${this.vertical ? "height" : "width"}:${weight * 100}%;
            display:block;
        "
        >${i}</slot>
      `),
      i=>this.createKnob(i),
    )}
    </div>
`;
  }
  static get styles() {
    return css`
      :host{
        display:block;
      }
      
      #container{
        width:100%;
        height:100%;
        display:flex;
        align-items:stretch;
      }
      #container.v{
        flex-direction:column;
      }
      #container.h{
        flex-direction:row;
      }

      .knob{
        background:rgba(99,99,99,.2);
        border:solid rgba(50,50,50,.2) 1px;
        user-select:none;
        box-sizing:border-box;
      }
      .knob.h{
        width:8px;
        height:max(100%,8px);
        cursor:col-resize;
      }
      .knob.v{
        height:8px;
        width:max(100%,8px);
        cursor:row-resize;
      }
    `;
  }
}

customElements.define("split-panel", Split);