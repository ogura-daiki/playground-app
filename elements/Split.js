import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

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
  updateCurrentWeight(val) {
    this.currentWeight = this.weights.map(v => v / this.weight_sum);
  }
  constructor() {
    super();
    this.vertical = false;
    this.count = 5;
    this.weight_sum = 1;
    this.weights = [0.1, 0.2, 0.2, 0.2, 0.3];
    this.min_weights = [0.05, 0.05, 0.05, 0.05, 0.05];
    this.currentWeight = [];
    this.knob_overflow = false;
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("mousemove", e => {
      if (this.md !== null) {
        let move = e.movementX / this.offsetWidth;
        if (this.vertical) {
          move = e.movementY / this.offsetHeight;
        }
        if (move < 0) {
          if (this.currentWeight[this.md] + move < this.min_weights[this.md]) {
            move = (this.min_weights[this.md] - this.currentWeight[this.md]) / this.weight_sum;
          }
          this.currentWeight[this.md] += move;
          this.currentWeight[this.md + 1] -= move;
        }
        else {
          if (this.currentWeight[this.md + 1] - move < this.min_weights[this.md + 1]) {
            move = (this.currentWeight[this.md + 1] - this.min_weights[this.md + 1]) / this.weight_sum;
          }
          this.currentWeight[this.md] += move;
          this.currentWeight[this.md + 1] -= move;
        }
        this.requestUpdate();
      }
    });
    window.addEventListener("mouseup", e => {
      this.md = null;
    });
  }
  createKnob(i) {
    const knob = html`
      <div class="knob ${this.vertical ? "v" : "h"}"
      @mousedown=${e => {
        this.md = i;
      }}></div>
    `;
    if (this.knob_overflow) {
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
    else {
      return knob;
    }
  }
  render() {
    if (this.currentWeight.length !== this.count) {
      this.updateCurrentWeight(this.count);
    }
    return html`
    <style>
      :host{
        cursor:${this.md != null ? (this.vertical ? "row-resize" : "col-resize") : ""};
      }
    </style>
    <div style="width:100%;height:100%;display:flex;align-items:stretch;flex-direction:${this.vertical ? "column" : "row"};">
    ${[...Array(this.count)].map((v, i) => html`
      <slot
        name="${i}"
        style="
          ${this.md != null ? "user-select:none;pointer-events:none;" : ""}
          ${this.vertical ? "height" : "width"}:${this.currentWeight[i] * 100}%;
          display:block;
          overflow:hidden;
        "
      >${i}</slot>
    `).reduce((c, v, i) => {
      c.push(v);
      if (i + 1 < this.count) {
        c.push(this.createKnob(i));
      }
      return c;
    }, [])}
    </div>
`;
  }
  static get styles() {
    return css`
      :host{
        display:block;
      }
      .knob.h{
        background:rgba(99,99,99,.2);
        width:8px;
        height:max(100%,8px);
        border:solid rgba(50,50,50,.2) 1px;
        user-select:none;
        box-sizing:border-box;
        cursor:col-resize;
      }
      .knob.v{
        background:rgba(99,99,99,.2);
        height:8px;
        width:max(100%,8px);
        border:solid rgba(50,50,50,.2) 1px;
        user-select:none;
        box-sizing:border-box;
        cursor:row-resize;
      }
    `;
  }
}

customElements.define("split-panel", Split);