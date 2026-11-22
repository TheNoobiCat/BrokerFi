var ef = Object.defineProperty;
var tf = (e, r, i) => r in e ? ef(e, r, { enumerable: !0, configurable: !0, writable: !0, value: i }) : e[r] = i;
var ht = (e, r, i) => (tf(e, typeof r != "symbol" ? r + "" : r, i), i);
import { utils as Se, init as nf, dispose as q2, registerOverlay as rf } from "klinecharts";
function ur(e, r, i) {
  const o = (e.x - r.x) * Math.cos(i) - (e.y - r.y) * Math.sin(i) + r.x, s = (e.x - r.x) * Math.sin(i) + (e.y - r.y) * Math.cos(i) + r.y;
  return { x: o, y: s };
}
function wo(e, r) {
  if (e.length > 1) {
    let i;
    return e[0].x === e[1].x && e[0].y !== e[1].y ? e[0].y < e[1].y ? i = {
      x: e[0].x,
      y: r.height
    } : i = {
      x: e[0].x,
      y: 0
    } : e[0].x > e[1].x ? i = {
      x: 0,
      y: Se.getLinearYFromCoordinates(e[0], e[1], { x: 0, y: e[0].y })
    } : i = {
      x: r.width,
      y: Se.getLinearYFromCoordinates(e[0], e[1], { x: r.width, y: e[0].y })
    }, { coordinates: [e[0], i] };
  }
  return [];
}
function X2(e, r) {
  const i = Math.abs(e.x - r.x), o = Math.abs(e.y - r.y);
  return Math.sqrt(i * i + o * o);
}
const of = {
  name: "arrow",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    if (e.length > 1) {
      const r = e[1].x > e[0].x ? 0 : 1, i = Se.getLinearSlopeIntercept(e[0], e[1]);
      let o;
      i ? o = Math.atan(i[0]) + Math.PI * r : e[1].y > e[0].y ? o = Math.PI / 2 : o = Math.PI / 2 * 3;
      const s = ur({ x: e[1].x - 8, y: e[1].y + 4 }, e[1], o), c = ur({ x: e[1].x - 8, y: e[1].y - 4 }, e[1], o);
      return [
        {
          type: "line",
          attrs: { coordinates: e }
        },
        {
          type: "line",
          ignoreEvent: !0,
          attrs: { coordinates: [s, e[1], c] }
        }
      ];
    }
    return [];
  }
}, af = {
  name: "circle",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  styles: {
    circle: {
      color: "rgba(22, 119, 255, 0.15)"
    }
  },
  createPointFigures: ({ coordinates: e }) => {
    if (e.length > 1) {
      const r = X2(e[0], e[1]);
      return {
        type: "circle",
        attrs: {
          ...e[0],
          r
        },
        styles: { style: "stroke_fill" }
      };
    }
    return [];
  }
}, sf = {
  name: "rect",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  styles: {
    polygon: {
      color: "rgba(22, 119, 255, 0.15)"
    }
  },
  createPointFigures: ({ coordinates: e }) => e.length > 1 ? [
    {
      type: "polygon",
      attrs: {
        coordinates: [
          e[0],
          { x: e[1].x, y: e[0].y },
          e[1],
          { x: e[0].x, y: e[1].y }
        ]
      },
      styles: { style: "stroke_fill" }
    }
  ] : []
}, lf = {
  name: "parallelogram",
  totalStep: 4,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  styles: {
    polygon: {
      color: "rgba(22, 119, 255, 0.15)"
    }
  },
  createPointFigures: ({ coordinates: e }) => {
    if (e.length === 2)
      return [
        {
          type: "line",
          ignoreEvent: !0,
          attrs: { coordinates: e }
        }
      ];
    if (e.length === 3) {
      const r = { x: e[0].x + (e[2].x - e[1].x), y: e[2].y };
      return [
        {
          type: "polygon",
          attrs: { coordinates: [e[0], e[1], e[2], r] },
          styles: { style: "stroke_fill" }
        }
      ];
    }
    return [];
  },
  performEventPressedMove: ({ points: e, performPointIndex: r, performPoint: i }) => {
    r < 2 && (e[0].price = i.price, e[1].price = i.price);
  },
  performEventMoveForDrawing: ({ currentStep: e, points: r, performPoint: i }) => {
    e === 2 && (r[0].price = i.price);
  }
}, cf = {
  name: "triangle",
  totalStep: 4,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  styles: {
    polygon: {
      color: "rgba(22, 119, 255, 0.15)"
    }
  },
  createPointFigures: ({ coordinates: e }) => [
    {
      type: "polygon",
      attrs: { coordinates: e },
      styles: { style: "stroke_fill" }
    }
  ]
}, uf = {
  name: "fibonacciCircle",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    if (e.length > 1) {
      const r = Math.abs(e[0].x - e[1].x), i = Math.abs(e[0].y - e[1].y), o = Math.sqrt(r * r + i * i), s = [0.236, 0.382, 0.5, 0.618, 0.786, 1], c = [], u = [];
      return s.forEach((f) => {
        const g = o * f;
        c.push(
          { ...e[0], r: g }
        ), u.push({
          x: e[0].x,
          y: e[0].y + g + 6,
          text: `${(f * 100).toFixed(1)}%`
        });
      }), [
        {
          type: "circle",
          attrs: c,
          styles: { style: "stroke" }
        },
        {
          type: "text",
          ignoreEvent: !0,
          attrs: u
        }
      ];
    }
    return [];
  }
}, ff = {
  name: "fibonacciSegment",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e, overlay: r, chart: i, yAxis: o }) => {
    const s = [], c = [];
    if (e.length > 1) {
      let u = 0;
      const f = i.getSymbol();
      ((o == null ? void 0 : o.isInCandle()) ?? !0) && f ? u = f.pricePrecision : i.getIndicators({ paneId: r.paneId }).forEach((k) => {
        u = Math.max(u, k.precision);
      });
      const g = e[1].x > e[0].x ? e[0].x : e[1].x, m = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0], C = e[0].y - e[1].y, b = r.points, _ = b[0].value - b[1].value;
      m.forEach((x) => {
        const k = e[1].y + C * x, T = (b[1].value + _ * x).toFixed(u.price);
        s.push({ coordinates: [{ x: e[0].x, y: k }, { x: e[1].x, y: k }] }), c.push({
          x: g,
          y: k,
          text: `${T} (${(x * 100).toFixed(1)}%)`,
          baseline: "bottom"
        });
      });
    }
    return [
      {
        type: "line",
        attrs: s
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: c
      }
    ];
  }
}, df = {
  name: "fibonacciSpiral",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e, bounding: r }) => {
    if (e.length > 1) {
      const i = X2(e[0], e[1]) / Math.sqrt(24), o = e[1].x > e[0].x ? 0 : 1, s = Se.getLinearSlopeIntercept(e[0], e[1]);
      let c;
      s ? c = Math.atan(s[0]) + Math.PI * o : e[1].y > e[0].y ? c = Math.PI / 2 : c = Math.PI / 2 * 3;
      const u = ur(
        { x: e[0].x - i, y: e[0].y },
        e[0],
        c
      ), f = ur(
        { x: e[0].x - i, y: e[0].y - i },
        e[0],
        c
      ), g = [{
        ...u,
        r: i,
        startAngle: c,
        endAngle: c + Math.PI / 2
      }, {
        ...f,
        r: i * 2,
        startAngle: c + Math.PI / 2,
        endAngle: c + Math.PI
      }];
      let m = e[0].x - i, C = e[0].y - i;
      for (let b = 2; b < 9; b++) {
        const _ = g[b - 2].r + g[b - 1].r;
        let x = 0;
        switch (b % 4) {
          case 0: {
            x = c, m -= g[b - 2].r;
            break;
          }
          case 1: {
            x = c + Math.PI / 2, C -= g[b - 2].r;
            break;
          }
          case 2: {
            x = c + Math.PI, m += g[b - 2].r;
            break;
          }
          case 3: {
            x = c + Math.PI / 2 * 3, C += g[b - 2].r;
            break;
          }
        }
        const k = x + Math.PI / 2, T = ur({ x: m, y: C }, e[0], c);
        g.push({
          ...T,
          r: _,
          startAngle: x,
          endAngle: k
        });
      }
      return [
        {
          type: "arc",
          attrs: g
        },
        {
          type: "line",
          attrs: wo(e, r)
        }
      ];
    }
    return [];
  }
}, hf = {
  name: "fibonacciSpeedResistanceFan",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e, bounding: r }) => {
    const i = [];
    let o = [];
    const s = [];
    if (e.length > 1) {
      const c = e[1].x > e[0].x ? -38 : 4, u = e[1].y > e[0].y ? -2 : 20, f = e[1].x - e[0].x, g = e[1].y - e[0].y;
      [1, 0.75, 0.618, 0.5, 0.382, 0.25, 0].forEach((C) => {
        const b = e[1].x - f * C, _ = e[1].y - g * C;
        i.push({ coordinates: [{ x: b, y: e[0].y }, { x: b, y: e[1].y }] }), i.push({ coordinates: [{ x: e[0].x, y: _ }, { x: e[1].x, y: _ }] }), o = o.concat(wo([e[0], { x: b, y: e[1].y }], r)), o = o.concat(wo([e[0], { x: e[1].x, y: _ }], r)), s.unshift({
          x: e[0].x + c,
          y: _ + 10,
          text: `${C.toFixed(3)}`
        }), s.unshift({
          x: b - 18,
          y: e[0].y + u,
          text: `${C.toFixed(3)}`
        });
      });
    }
    return [
      {
        type: "line",
        attrs: i
      },
      {
        type: "line",
        attrs: o
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: s
      }
    ];
  }
}, gf = {
  name: "fibonacciExtension",
  totalStep: 4,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ chart: e, yAxis: r, coordinates: i, overlay: o }) => {
    const s = [], c = [];
    if (i.length > 2) {
      let u = 0;
      const f = e.getSymbol();
      ((r == null ? void 0 : r.isInCandle()) ?? !0) && f ? u = f.pricePrecision : e.getIndicators({ paneId: o.paneId }).forEach((k) => {
        u = Math.max(u, k.precision);
      });
      const g = o.points, m = g[1].value - g[0].value, C = i[1].y - i[0].y, b = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1], _ = i[2].x > i[1].x ? i[1].x : i[2].x;
      b.forEach((x) => {
        const k = i[2].y + C * x, T = (g[2].value + m * x).toFixed(u.price);
        s.push({ coordinates: [{ x: i[1].x, y: k }, { x: i[2].x, y: k }] }), c.push({
          x: _,
          y: k,
          text: `${T} (${(x * 100).toFixed(1)}%)`,
          baseline: "bottom"
        });
      });
    }
    return [
      {
        type: "line",
        attrs: { coordinates: i },
        styles: { style: "dashed" }
      },
      {
        type: "line",
        attrs: s
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: c
      }
    ];
  }
}, pf = {
  name: "gannBox",
  totalStep: 3,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  styles: {
    polygon: {
      color: "rgba(22, 119, 255, 0.15)"
    }
  },
  createPointFigures: ({ coordinates: e }) => {
    if (e.length > 1) {
      const r = (e[1].y - e[0].y) / 4, i = e[1].x - e[0].x, o = [
        { coordinates: [e[0], { x: e[1].x, y: e[1].y - r }] },
        { coordinates: [e[0], { x: e[1].x, y: e[1].y - r * 2 }] },
        { coordinates: [{ x: e[0].x, y: e[1].y }, { x: e[1].x, y: e[0].y + r }] },
        { coordinates: [{ x: e[0].x, y: e[1].y }, { x: e[1].x, y: e[0].y + r * 2 }] },
        { coordinates: [{ ...e[0] }, { x: e[0].x + i * 0.236, y: e[1].y }] },
        { coordinates: [{ ...e[0] }, { x: e[0].x + i * 0.5, y: e[1].y }] },
        { coordinates: [{ x: e[0].x, y: e[1].y }, { x: e[0].x + i * 0.236, y: e[0].y }] },
        { coordinates: [{ x: e[0].x, y: e[1].y }, { x: e[0].x + i * 0.5, y: e[0].y }] }
      ], s = [
        { coordinates: [e[0], e[1]] },
        { coordinates: [{ x: e[0].x, y: e[1].y }, { x: e[1].x, y: e[0].y }] }
      ];
      return [
        {
          type: "line",
          attrs: [
            { coordinates: [e[0], { x: e[1].x, y: e[0].y }] },
            { coordinates: [{ x: e[1].x, y: e[0].y }, e[1]] },
            { coordinates: [e[1], { x: e[0].x, y: e[1].y }] },
            { coordinates: [{ x: e[0].x, y: e[1].y }, e[0]] }
          ]
        },
        {
          type: "polygon",
          ignoreEvent: !0,
          attrs: {
            coordinates: [
              e[0],
              { x: e[1].x, y: e[0].y },
              e[1],
              { x: e[0].x, y: e[1].y }
            ]
          },
          styles: { style: "fill" }
        },
        {
          type: "line",
          attrs: o,
          styles: { style: "dashed" }
        },
        {
          type: "line",
          attrs: s
        }
      ];
    }
    return [];
  }
}, yf = {
  name: "threeWaves",
  totalStep: 5,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    const r = e.map((i, o) => ({
      ...i,
      text: `(${o})`,
      baseline: "bottom"
    }));
    return [
      {
        type: "line",
        attrs: { coordinates: e }
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: r
      }
    ];
  }
}, mf = {
  name: "fiveWaves",
  totalStep: 7,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    const r = e.map((i, o) => ({
      ...i,
      text: `(${o})`,
      baseline: "bottom"
    }));
    return [
      {
        type: "line",
        attrs: { coordinates: e }
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: r
      }
    ];
  }
}, bf = {
  name: "eightWaves",
  totalStep: 10,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    const r = e.map((i, o) => ({
      ...i,
      text: `(${o})`,
      baseline: "bottom"
    }));
    return [
      {
        type: "line",
        attrs: { coordinates: e }
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: r
      }
    ];
  }
}, vf = {
  name: "anyWaves",
  totalStep: Number.MAX_SAFE_INTEGER,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    const r = e.map((i, o) => ({
      ...i,
      text: `(${o})`,
      baseline: "bottom"
    }));
    return [
      {
        type: "line",
        attrs: { coordinates: e }
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: r
      }
    ];
  }
}, _f = {
  name: "abcd",
  totalStep: 5,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  createPointFigures: ({ coordinates: e }) => {
    let r = [], i = [];
    const o = ["A", "B", "C", "D"], s = e.map((c, u) => ({
      ...c,
      baseline: "bottom",
      text: `(${o[u]})`
    }));
    return e.length > 2 && (r = [e[0], e[2]], e.length > 3 && (i = [e[1], e[3]])), [
      {
        type: "line",
        attrs: { coordinates: e }
      },
      {
        type: "line",
        attrs: [{ coordinates: r }, { coordinates: i }],
        styles: { style: "dashed" }
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: s
      }
    ];
  }
}, Cf = {
  name: "xabcd",
  totalStep: 6,
  needDefaultPointFigure: !0,
  needDefaultXAxisFigure: !0,
  needDefaultYAxisFigure: !0,
  styles: {
    polygon: {
      color: "rgba(22, 119, 255, 0.15)"
    }
  },
  createPointFigures: ({ coordinates: e, overlay: r }) => {
    const i = [], o = [], s = ["X", "A", "B", "C", "D"], c = e.map((u, f) => ({
      ...u,
      baseline: "bottom",
      text: `(${s[f]})`
    }));
    return e.length > 2 && (i.push({ coordinates: [e[0], e[2]] }), o.push({ coordinates: [e[0], e[1], e[2]] }), e.length > 3 && (i.push({ coordinates: [e[1], e[3]] }), e.length > 4 && (i.push({ coordinates: [e[2], e[4]] }), o.push({ coordinates: [e[2], e[3], e[4]] })))), [
      {
        type: "line",
        attrs: { coordinates: e }
      },
      {
        type: "line",
        attrs: i,
        styles: { style: "dashed" }
      },
      {
        type: "polygon",
        ignoreEvent: !0,
        attrs: o
      },
      {
        type: "text",
        ignoreEvent: !0,
        attrs: c
      }
    ];
  }
}, xf = !1, Lf = (e, r) => e === r, ko = Symbol("solid-proxy"), Sf = typeof Proxy == "function", wf = Symbol("solid-track"), g0 = {
  equals: Lf
};
let J2 = is;
const Sn = 1, p0 = 2, es = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
}, oo = {};
var Ie = null;
let ao = null, kf = null, Ae = null, st = null, _n = null, A0 = 0;
function f0(e, r) {
  const i = Ae, o = Ie, s = e.length === 0, c = r === void 0 ? o : r, u = s ? es : {
    owned: null,
    cleanups: null,
    context: c ? c.context : null,
    owner: c
  }, f = s ? e : () => e(() => Ht(() => dr(u)));
  Ie = u, Ae = null;
  try {
    return xn(f, !0);
  } finally {
    Ae = i, Ie = o;
  }
}
function E(e, r) {
  r = r ? Object.assign({}, g0, r) : g0;
  const i = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: r.equals || void 0
  }, o = (s) => (typeof s == "function" && (s = s(i.value)), rs(i, s));
  return [ns.bind(i), o];
}
function Ka(e, r, i) {
  const o = M0(e, r, !0, Sn);
  k1(o);
}
function ze(e, r, i) {
  const o = M0(e, r, !1, Sn);
  k1(o);
}
function mn(e, r, i) {
  J2 = Bf;
  const o = M0(e, r, !1, Sn);
  (!i || !i.render) && (o.user = !0), _n ? _n.push(o) : k1(o);
}
function Jt(e, r, i) {
  i = i ? Object.assign({}, g0, i) : g0;
  const o = M0(e, r, !0, 0);
  return o.observers = null, o.observerSlots = null, o.comparator = i.equals || void 0, k1(o), ns.bind(o);
}
function $f(e) {
  return e && typeof e == "object" && "then" in e;
}
function Af(e, r, i) {
  let o, s, c;
  typeof r == "function" ? (o = e, s = r, c = i || {}) : (o = !0, s = e, c = r || {});
  let u = null, f = oo, g = !1, m = "initialValue" in c, C = typeof o == "function" && Jt(o);
  const b = /* @__PURE__ */ new Set(), [_, x] = (c.storage || E)(c.initialValue), [k, T] = E(void 0), [$, A] = E(void 0, {
    equals: !1
  }), [F, Z] = E(m ? "ready" : "unresolved");
  function N(H, W, re, K) {
    return u === H && (u = null, K !== void 0 && (m = !0), (H === f || W === f) && c.onHydrated && queueMicrotask(() => c.onHydrated(K, {
      value: W
    })), f = oo, V(W, re)), W;
  }
  function V(H, W) {
    xn(() => {
      W === void 0 && x(() => H), Z(W !== void 0 ? "errored" : m ? "ready" : "unresolved"), T(W);
      for (const re of b.keys())
        re.decrement();
      b.clear();
    }, !1);
  }
  function Q() {
    const H = If, W = _(), re = k();
    if (re !== void 0 && !u)
      throw re;
    return Ae && !Ae.user && H && Ka(() => {
      $(), u && (H.resolved || b.has(H) || (H.increment(), b.add(H)));
    }), W;
  }
  function I(H = !0) {
    if (H !== !1 && g)
      return;
    g = !1;
    const W = C ? C() : o;
    if (W == null || W === !1) {
      N(u, Ht(_));
      return;
    }
    let re;
    const K = f !== oo ? f : Ht(() => {
      try {
        return s(W, {
          value: _(),
          refetching: H
        });
      } catch (X) {
        re = X;
      }
    });
    if (re !== void 0) {
      N(u, void 0, d0(re), W);
      return;
    } else if (!$f(K))
      return N(u, K, void 0, W), K;
    return u = K, "v" in K ? (K.s === 1 ? N(u, K.v, void 0, W) : N(u, void 0, d0(K.v), W), K) : (g = !0, queueMicrotask(() => g = !1), xn(() => {
      Z(m ? "refreshing" : "pending"), A();
    }, !1), K.then((X) => N(K, X, void 0, W), (X) => N(K, void 0, d0(X), W)));
  }
  Object.defineProperties(Q, {
    state: {
      get: () => F()
    },
    error: {
      get: () => k()
    },
    loading: {
      get() {
        const H = F();
        return H === "pending" || H === "refreshing";
      }
    },
    latest: {
      get() {
        if (!m)
          return Q();
        const H = k();
        if (H && !u)
          throw H;
        return _();
      }
    }
  });
  let q = Ie;
  return C ? Ka(() => (q = Ie, I(!1))) : I(!1), [Q, {
    refetch: (H) => Mf(q, () => I(H)),
    mutate: x
  }];
}
function Ht(e) {
  if (Ae === null)
    return e();
  const r = Ae;
  Ae = null;
  try {
    return e();
  } finally {
    Ae = r;
  }
}
function ts(e) {
  mn(() => Ht(e));
}
function y0(e) {
  return Ie === null || (Ie.cleanups === null ? Ie.cleanups = [e] : Ie.cleanups.push(e)), e;
}
function Mf(e, r) {
  const i = Ie, o = Ae;
  Ie = e, Ae = null;
  try {
    return xn(r, !0);
  } catch (s) {
    Fo(s);
  } finally {
    Ie = i, Ae = o;
  }
}
function Tf(e) {
  const r = Ae, i = Ie;
  return Promise.resolve().then(() => {
    Ae = r, Ie = i;
    let o;
    return xn(e, !1), Ae = Ie = null, o ? o.done : void 0;
  });
}
let If;
function ns() {
  if (this.sources && this.state)
    if (this.state === Sn)
      k1(this);
    else {
      const e = st;
      st = null, xn(() => b0(this), !1), st = e;
    }
  if (Ae) {
    const e = this.observers ? this.observers.length : 0;
    Ae.sources ? (Ae.sources.push(this), Ae.sourceSlots.push(e)) : (Ae.sources = [this], Ae.sourceSlots = [e]), this.observers ? (this.observers.push(Ae), this.observerSlots.push(Ae.sources.length - 1)) : (this.observers = [Ae], this.observerSlots = [Ae.sources.length - 1]);
  }
  return this.value;
}
function rs(e, r, i) {
  let o = e.value;
  return (!e.comparator || !e.comparator(o, r)) && (e.value = r, e.observers && e.observers.length && xn(() => {
    for (let s = 0; s < e.observers.length; s += 1) {
      const c = e.observers[s], u = ao && ao.running;
      u && ao.disposed.has(c), (u ? !c.tState : !c.state) && (c.pure ? st.push(c) : _n.push(c), c.observers && os(c)), u || (c.state = Sn);
    }
    if (st.length > 1e6)
      throw st = [], new Error();
  }, !1)), r;
}
function k1(e) {
  if (!e.fn)
    return;
  dr(e);
  const r = A0;
  Of(e, e.value, r);
}
function Of(e, r, i) {
  let o;
  const s = Ie, c = Ae;
  Ae = Ie = e;
  try {
    o = e.fn(r);
  } catch (u) {
    return e.pure && (e.state = Sn, e.owned && e.owned.forEach(dr), e.owned = null), e.updatedAt = i + 1, Fo(u);
  } finally {
    Ae = c, Ie = s;
  }
  (!e.updatedAt || e.updatedAt <= i) && (e.updatedAt != null && "observers" in e ? rs(e, o) : e.value = o, e.updatedAt = i);
}
function M0(e, r, i, o = Sn, s) {
  const c = {
    fn: e,
    state: o,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: r,
    owner: Ie,
    context: Ie ? Ie.context : null,
    pure: i
  };
  return Ie === null || Ie !== es && (Ie.owned ? Ie.owned.push(c) : Ie.owned = [c]), c;
}
function m0(e) {
  if (e.state === 0)
    return;
  if (e.state === p0)
    return b0(e);
  if (e.suspense && Ht(e.suspense.inFallback))
    return e.suspense.effects.push(e);
  const r = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < A0); )
    e.state && r.push(e);
  for (let i = r.length - 1; i >= 0; i--)
    if (e = r[i], e.state === Sn)
      k1(e);
    else if (e.state === p0) {
      const o = st;
      st = null, xn(() => b0(e, r[0]), !1), st = o;
    }
}
function xn(e, r) {
  if (st)
    return e();
  let i = !1;
  r || (st = []), _n ? i = !0 : _n = [], A0++;
  try {
    const o = e();
    return Pf(i), o;
  } catch (o) {
    i || (_n = null), st = null, Fo(o);
  }
}
function Pf(e) {
  if (st && (is(st), st = null), e)
    return;
  const r = _n;
  _n = null, r.length && xn(() => J2(r), !1);
}
function is(e) {
  for (let r = 0; r < e.length; r++)
    m0(e[r]);
}
function Bf(e) {
  let r, i = 0;
  for (r = 0; r < e.length; r++) {
    const o = e[r];
    o.user ? e[i++] = o : m0(o);
  }
  for (r = 0; r < i; r++)
    m0(e[r]);
}
function b0(e, r) {
  e.state = 0;
  for (let i = 0; i < e.sources.length; i += 1) {
    const o = e.sources[i];
    if (o.sources) {
      const s = o.state;
      s === Sn ? o !== r && (!o.updatedAt || o.updatedAt < A0) && m0(o) : s === p0 && b0(o, r);
    }
  }
}
function os(e) {
  for (let r = 0; r < e.observers.length; r += 1) {
    const i = e.observers[r];
    i.state || (i.state = p0, i.pure ? st.push(i) : _n.push(i), i.observers && os(i));
  }
}
function dr(e) {
  let r;
  if (e.sources)
    for (; e.sources.length; ) {
      const i = e.sources.pop(), o = e.sourceSlots.pop(), s = i.observers;
      if (s && s.length) {
        const c = s.pop(), u = i.observerSlots.pop();
        o < s.length && (c.sourceSlots[u] = o, s[o] = c, i.observerSlots[o] = u);
      }
    }
  if (e.tOwned) {
    for (r = e.tOwned.length - 1; r >= 0; r--)
      dr(e.tOwned[r]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (r = e.owned.length - 1; r >= 0; r--)
      dr(e.owned[r]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (r = e.cleanups.length - 1; r >= 0; r--)
      e.cleanups[r]();
    e.cleanups = null;
  }
  e.state = 0;
}
function d0(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function Fo(e, r = Ie) {
  throw d0(e);
}
const Ef = Symbol("fallback");
function Za(e) {
  for (let r = 0; r < e.length; r++)
    e[r]();
}
function Rf(e, r, i = {}) {
  let o = [], s = [], c = [], u = 0, f = r.length > 1 ? [] : null;
  return y0(() => Za(c)), () => {
    let g = e() || [], m = g.length, C, b;
    return g[wf], Ht(() => {
      let x, k, T, $, A, F, Z, N, V;
      if (m === 0)
        u !== 0 && (Za(c), c = [], o = [], s = [], u = 0, f && (f = [])), i.fallback && (o = [Ef], s[0] = f0((Q) => (c[0] = Q, i.fallback())), u = 1);
      else if (u === 0) {
        for (s = new Array(m), b = 0; b < m; b++)
          o[b] = g[b], s[b] = f0(_);
        u = m;
      } else {
        for (T = new Array(m), $ = new Array(m), f && (A = new Array(m)), F = 0, Z = Math.min(u, m); F < Z && o[F] === g[F]; F++)
          ;
        for (Z = u - 1, N = m - 1; Z >= F && N >= F && o[Z] === g[N]; Z--, N--)
          T[N] = s[Z], $[N] = c[Z], f && (A[N] = f[Z]);
        for (x = /* @__PURE__ */ new Map(), k = new Array(N + 1), b = N; b >= F; b--)
          V = g[b], C = x.get(V), k[b] = C === void 0 ? -1 : C, x.set(V, b);
        for (C = F; C <= Z; C++)
          V = o[C], b = x.get(V), b !== void 0 && b !== -1 ? (T[b] = s[C], $[b] = c[C], f && (A[b] = f[C]), b = k[b], x.set(V, b)) : c[C]();
        for (b = F; b < m; b++)
          b in T ? (s[b] = T[b], c[b] = $[b], f && (f[b] = A[b], f[b](b))) : s[b] = f0(_);
        s = s.slice(0, u = m), o = g.slice(0);
      }
      return s;
    });
    function _(x) {
      if (c[b] = x, f) {
        const [k, T] = E(b);
        return f[b] = T, r(g[b], k);
      }
      return r(g[b]);
    }
  };
}
function Y(e, r) {
  return Ht(() => e(r || {}));
}
function o0() {
  return !0;
}
const Df = {
  get(e, r, i) {
    return r === ko ? i : e.get(r);
  },
  has(e, r) {
    return r === ko ? !0 : e.has(r);
  },
  set: o0,
  deleteProperty: o0,
  getOwnPropertyDescriptor(e, r) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(r);
      },
      set: o0,
      deleteProperty: o0
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function so(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function Ff() {
  for (let e = 0, r = this.length; e < r; ++e) {
    const i = this[e]();
    if (i !== void 0)
      return i;
  }
}
function as(...e) {
  let r = !1;
  for (let u = 0; u < e.length; u++) {
    const f = e[u];
    r = r || !!f && ko in f, e[u] = typeof f == "function" ? (r = !0, Jt(f)) : f;
  }
  if (Sf && r)
    return new Proxy({
      get(u) {
        for (let f = e.length - 1; f >= 0; f--) {
          const g = so(e[f])[u];
          if (g !== void 0)
            return g;
        }
      },
      has(u) {
        for (let f = e.length - 1; f >= 0; f--)
          if (u in so(e[f]))
            return !0;
        return !1;
      },
      keys() {
        const u = [];
        for (let f = 0; f < e.length; f++)
          u.push(...Object.keys(so(e[f])));
        return [...new Set(u)];
      }
    }, Df);
  const i = {}, o = /* @__PURE__ */ Object.create(null);
  for (let u = e.length - 1; u >= 0; u--) {
    const f = e[u];
    if (!f)
      continue;
    const g = Object.getOwnPropertyNames(f);
    for (let m = g.length - 1; m >= 0; m--) {
      const C = g[m];
      if (C === "__proto__" || C === "constructor")
        continue;
      const b = Object.getOwnPropertyDescriptor(f, C);
      if (!o[C])
        o[C] = b.get ? {
          enumerable: !0,
          configurable: !0,
          get: Ff.bind(i[C] = [b.get.bind(f)])
        } : b.value !== void 0 ? b : void 0;
      else {
        const _ = i[C];
        _ && (b.get ? _.push(b.get.bind(f)) : b.value !== void 0 && _.push(() => b.value));
      }
    }
  }
  const s = {}, c = Object.keys(o);
  for (let u = c.length - 1; u >= 0; u--) {
    const f = c[u], g = o[f];
    g && g.get ? Object.defineProperty(s, f, g) : s[f] = g ? g.value : void 0;
  }
  return s;
}
const zf = (e) => `Stale read from <${e}>.`;
function $o(e) {
  const r = "fallback" in e && {
    fallback: () => e.fallback
  };
  return Jt(Rf(() => e.each, e.children, r || void 0));
}
function We(e) {
  const r = e.keyed, i = Jt(() => e.when, void 0, void 0), o = r ? i : Jt(i, void 0, {
    equals: (s, c) => !s == !c
  });
  return Jt(() => {
    const s = o();
    if (s) {
      const c = e.children;
      return typeof c == "function" && c.length > 0 ? Ht(() => c(r ? s : () => {
        if (!Ht(o))
          throw zf("Show");
        return i();
      })) : c;
    }
    return e.fallback;
  }, void 0, void 0);
}
const [Ge, Nf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#00698b",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "stroke_fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    borderDashedValue: [0, 0],
    borderRadius: 3,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#00698b",
    show: !0
  }
}), [jI, Uf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#00698b",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#00698b"
  }
}), [VI, Kf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#00698b",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#00698b"
  }
}), [qI, Zf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#fb7b50",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#fb7b50"
  }
}), [XI, Wf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#fb7b50",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#fb7b50"
  }
}), [JI, Qf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#fb7b50",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#fb7b50"
  }
}), [Hf, Yf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#00698b",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#00698b"
  }
}), [eO, Gf] = E({
  lineStyle: {
    style: "dashed",
    size: 1,
    color: "#fb7b50",
    dashedValue: [4, 4]
  },
  labelStyle: {
    style: "fill",
    size: 12,
    family: "Helvetica Neue",
    weight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 5,
    borderStyle: "solid",
    borderSize: 1,
    color: "#FFFFFF",
    borderColor: "#00698b",
    backgroundColor: "#fb7b50"
  }
}), x1 = () => ({ x: window.innerWidth, y: window.innerHeight }), jf = (e, r, i) => {
  const o = {
    price: 0,
    volume: 0
  }, s = e.getSymbol();
  return ((i == null ? void 0 : i.isInCandle()) ?? !0) && s ? (o.price = s.pricePrecision, o.volume = s.volumePrecision) : e.getIndicators({ paneId: r.paneId }).forEach((u) => {
    o.price = Math.max(o.price, u.precision);
  }), o;
}, lo = (e) => ({
  thin: 100,
  "extra-light": 200,
  light: 300,
  normal: 400,
  medium: 500,
  "semi-bold": 600,
  bold: 700,
  "extra-bold": 800,
  black: 900
})[e], ar = (e, r) => {
  if (e) {
    const { params: i, callback: o } = e;
    o(i, r);
  }
}, Vf = () => {
  let e = {
    isBodyVisible: !0,
    isCancelButtonVisible: !0,
    isQuantityVisible: !0,
    marginRight: 10
  };
  const r = () => ({
    style: e.lineStyle ?? Ge().lineStyle.style,
    size: e.lineWidth ?? Ge().lineStyle.size,
    color: e.lineColor ?? Ge().lineStyle.color,
    dashedValue: e.lineDashedValue ?? Ge().lineStyle.dashedValue
  }), i = (o) => ({
    style: Ge().labelStyle.style,
    size: (o == "body" ? e.bodySize : o == "quantity" ? e.quantitySize : e.cancelButtonSize) ?? e.bodySize ?? Ge().labelStyle.size,
    weight: (o == "body" ? e.bodyWeight : o == "quantity" ? e.quantityWeight : e.cancelButtonWeight) ?? e.bodyWeight ?? Ge().labelStyle.weight,
    family: (o == "body" ? e.bodyFont : o == "quantity" ? e.quantityFont : "icomoon") ?? e.bodyFont ?? Ge().labelStyle.family,
    color: (o == "body" ? e.bodyTextColor : o == "quantity" ? e.quantityColor : e.cancelButtonIconColor) ?? e.bodyTextColor ?? Ge().labelStyle.color,
    backgroundColor: (o == "body" ? e.bodyBackgroundColor : o == "quantity" ? e.quantityBackgroundColor : e.cancelButtonBackgroundColor) ?? e.bodyBackgroundColor ?? Ge().labelStyle.backgroundColor,
    borderColor: (o == "body" ? e.bodyBorderColor : o == "quantity" ? e.quantityBorderColor : e.cancelButtonBorderColor) ?? e.bodyBorderColor ?? Ge().labelStyle.borderColor,
    borderStyle: e.borderStyle ?? Ge().labelStyle.borderStyle,
    borderSize: e.borderSize ?? Ge().labelStyle.borderSize,
    borderDashedValue: e.borderDashedValue ?? Ge().labelStyle.borderDashedValue,
    borderRadius: e.borderRadius ?? Ge().labelStyle.borderRadius,
    paddingLeft: (o == "body" ? e.bodyPaddingLeft : o == "quantity" ? e.quantityPaddingLeft : e.cancelButtonPaddingLeft) ?? e.bodyPaddingLeft ?? Ge().labelStyle.paddingLeft,
    paddingRight: (o == "body" ? e.bodyPaddingRight : o == "quantity" ? e.quantityPaddingRight : e.cancelButtonPaddingRight) ?? e.bodyPaddingRight ?? Ge().labelStyle.paddingRight,
    paddingTop: (o == "body" ? e.bodyPaddingTop : o == "quantity" ? e.quantityPaddingTop : e.cancelButtonPaddingTop) ?? e.bodyPaddingTop ?? Ge().labelStyle.paddingTop,
    paddingBottom: (o == "body" ? e.bodyPaddingBottom : o == "quantity" ? e.quantityPaddingBottom : e.cancelButtonPaddingBottom) ?? e.bodyPaddingBottom ?? Ge().labelStyle.paddingBottom
  });
  return {
    name: "orderLine",
    totalStep: 2,
    needDefaultPointFigure: !1,
    needDefaultXAxisFigure: !1,
    needDefaultYAxisFigure: !0,
    createPointFigures: ({ chart: o, coordinates: s, bounding: c }) => {
      var $, A, F, Z, N, V, Q;
      const u = i("body"), f = i("quantity"), g = i("cancel-button"), m = "", C = (e.quantity ?? "Size").toString(), b = e.text ?? "Position Line", _ = e.marginRight, x = Se.calcTextWidth(m) + g.paddingLeft + g.paddingRight + _ - (e.borderSize ?? Ge().labelStyle.borderSize), k = Se.calcTextWidth(C.toString()) + f.paddingLeft + f.paddingRight + x, T = Se.calcTextWidth(b.toString()) + u.paddingLeft + u.paddingRight + k;
      return [
        {
          key: "price-line",
          type: "line",
          attrs: {
            coordinates: [
              {
                x: 0,
                y: e.price ? o.convertToPixel({ timestamp: ($ = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : $.timestamp, value: e.price }).y : s[0].y
              },
              {
                x: c.width - T,
                y: e.price ? o.convertToPixel({ timestamp: (A = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : A.timestamp, value: e.price }).y : s[0].y
              }
            ]
          },
          styles: r(),
          ignoreEvent: !0
        },
        {
          key: "price-line-two",
          type: "line",
          attrs: {
            coordinates: [
              {
                x: c.width - _,
                y: e.price ? o.convertToPixel({ timestamp: (F = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : F.timestamp, value: e.price }).y : s[0].y
              },
              {
                x: c.width,
                y: e.price ? o.convertToPixel({ timestamp: (Z = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : Z.timestamp, value: e.price }).y : s[0].y
              }
            ]
          },
          styles: r(),
          ignoreEvent: !0
        },
        {
          key: "body",
          type: "text",
          attrs: {
            x: c.width - k,
            y: e.price ? o.convertToPixel({ timestamp: (N = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : N.timestamp, value: e.price }).y : s[0].y,
            text: b,
            align: "right",
            baseline: "middle"
          },
          styles: u
        },
        {
          key: "quantity",
          type: "text",
          attrs: {
            x: c.width - x,
            y: e.price ? o.convertToPixel({ timestamp: (V = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : V.timestamp, value: e.price }).y : s[0].y,
            text: C,
            align: "right",
            baseline: "middle"
          },
          styles: f
        },
        {
          key: "cancel-button",
          type: "text",
          attrs: {
            x: c.width - _,
            y: e.price ? o.convertToPixel({ timestamp: (Q = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : Q.timestamp, value: e.price }).y : s[0].y,
            text: m,
            align: "right",
            baseline: "middle"
          },
          styles: g
        }
      ];
    },
    createYAxisFigures: ({ chart: o, overlay: s, coordinates: c, bounding: u, yAxis: f }) => {
      var x;
      const g = jf(o, s, f), m = (f == null ? void 0 : f.isFromZero()) ?? !1;
      let C, b;
      m ? (C = "left", b = 0) : (C = "right", b = u.width);
      let _;
      return e.price !== void 0 && (s.points[0].value = e.price), Se.isValid(s.extendData) && (Se.isFunction(s.extendData) ? _ = s.extendData(s) : _ = s.extendData ?? ""), !Se.isValid(_) && s.points[0].value !== void 0 && (_ = Se.formatPrecision(s.points[0].value, g.price)), {
        type: "text",
        attrs: {
          x: b,
          y: e.price ? o.convertToPixel({ timestamp: (x = o.getDataList().at(o.getDataList().length - 1)) == null ? void 0 : x.timestamp, value: e.price }).y : c[0].y,
          text: _ ?? "",
          align: C,
          baseline: "middle"
        },
        styles: i("body")
      };
    },
    onSelected: (o) => (o.preventDefault && o.preventDefault(), o.overlay.mode = "normal", !1),
    onRightClick: (o) => (o.preventDefault && o.preventDefault(), !1),
    onPressedMoveStart: (o) => (ar(e.onMoveStart, o), !1),
    onPressedMoving: (o) => (e.price = o.chart.convertFromPixel([{ y: o.y, x: o.x }], { paneId: "candle_pane" }).value, ar(e.onMove, o), !1),
    onPressedMoveEnd: (o) => (ar(e.onMoveEnd, o), !1),
    onClick: (o) => {
      var s;
      switch ((s = o.figure) == null ? void 0 : s.key) {
        case "cancel-button":
          ar(e.onCancel, o);
          break;
        case "quantity":
          ar(e.onModify, o);
          break;
      }
      return !1;
    },
    setPrice(o) {
      return e.price = o, this;
    },
    setText(o) {
      return e.text = o, this;
    },
    setQuantity(o) {
      return e.quantity = o, this;
    },
    setModifyTooltip(o) {
      return e.modifyTooltip = o, this;
    },
    setTooltip(o) {
      return e.tooltip = o, this;
    },
    setLineColor(o) {
      return e.lineColor = o, this;
    },
    setLineWidth(o) {
      return e.lineWidth = o, this;
    },
    setLineStyle(o) {
      return e.lineStyle = o, this;
    },
    setLineLength(o) {
      return e.lineDashedValue = [o, o], this;
    },
    setLineDashedValue(o) {
      return e.lineDashedValue = o, this;
    },
    setBodyFont(o) {
      return e.bodyFont = o, this;
    },
    setBodyFontWeight(o) {
      return Se.isString(o) && (o = lo(o)), e.bodyWeight = o, this;
    },
    setBodyTextColor(o) {
      return e.bodyTextColor = o, this;
    },
    setBodyBackgroundColor(o) {
      return e.bodyBackgroundColor = o, this;
    },
    setBodyBorderColor(o) {
      return e.bodyBorderColor = o, this;
    },
    setQuantityFont(o) {
      return e.quantityFont = o, this;
    },
    setQuantityFontWeight(o) {
      return Se.isString(o) && (o = lo(o)), e.quantityWeight = o, this;
    },
    setQuantityColor(o) {
      return e.quantityColor = o, this;
    },
    setQuantityBackgroundColor(o) {
      return e.quantityBackgroundColor = o, this;
    },
    setQuantityBorderColor(o) {
      return e.quantityBorderColor = o, this;
    },
    setCancelButtonFontWeight(o) {
      return Se.isString(o) && (o = lo(o)), e.cancelButtonWeight = o, this;
    },
    setCancelButtonIconColor(o) {
      return e.cancelButtonIconColor = o, this;
    },
    setCancelButtonBackgroundColor(o) {
      return e.cancelButtonBackgroundColor = o, this;
    },
    setCancelButtonBorderColor(o) {
      return e.cancelButtonBorderColor = o, this;
    },
    setBorderStyle(o) {
      return e.borderStyle = o, this;
    },
    setBorderSize(o) {
      return e.borderSize = o, this;
    },
    setBorderDashedValue(o) {
      return e.borderDashedValue = o, this;
    },
    setBorderRadius(o) {
      return e.borderRadius = o, this;
    },
    onMoveStart(o, s) {
      return e.onMoveStart = {
        params: o,
        callback: s
      }, this;
    },
    onMove(o, s) {
      return e.onMove = {
        params: o,
        callback: s
      }, this;
    },
    onMoveEnd(o, s) {
      return e.onMoveEnd = {
        params: o,
        callback: s
      }, this;
    },
    onCancel(o, s) {
      return e.onCancel = {
        params: o,
        callback: s
      }, this;
    },
    onModify(o, s) {
      return e.onModify = {
        params: o,
        callback: s
      }, this;
    }
  };
}, qf = [
  of,
  af,
  sf,
  cf,
  lf,
  uf,
  ff,
  df,
  hf,
  gf,
  pf,
  yf,
  mf,
  bf,
  vf,
  _f,
  Cf,
  Vf()
];
class tO {
  constructor(r) {
    ht(this, "_apiKey");
    ht(this, "_prevSymbolMarket");
    ht(this, "_ws");
    this._apiKey = r;
  }
  async searchSymbols(r) {
    return await ((await (await fetch(`https://api.polygon.io/v3/reference/tickers?apiKey=${this._apiKey}&active=true&search=${r ?? ""}`)).json()).results || []).map((s) => ({
      ticker: s.ticker,
      name: s.name,
      shortName: s.ticker,
      market: s.market,
      exchange: s.primary_exchange,
      priceCurrency: s.currency_name,
      type: s.type,
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAA66SURBVHic7Z17cFTVGcB/527AiKGgRA0ShGhKoQjFMb4qUMCMPIrWqdbHSEdlHDGgI9V2aq2d1hmKtVbRsSTGEcQRp4pStaZQlNYUwYLiSKU0SCMBDRCmoQSJGGF3T/84d2VZk+w9d899hf3NMBnl3ns+5vtyHt/5HoIehpQIaijDYjiSciRlwCCgBCgG+gNFQCGCAvUScaADaAfagFagBdiFoAlBI0m2UkWTEMgA/lmeIYIWIFdkLQNJMBbBJUjOA8agFOwF7cAmBO8hWUeMtWIWezwayxciZwByGb1pZTyCaUguA0YGLNIWBK8jWUExa8Q1HA5YHi0iYQByGTH2UYnkBmA6cHLQMnXBfqAOwXMMYLW4hkTQAmUj1AYgqzkLuAXBTUgGBi2PFoI9SJYAT4nZbA9anK4IpQHIhUzE4i4k04OWxQiCOpI8IubwZtCiZBIqA5A1TEdyH3Bh0LJ4xAYE80QVdUELkiIUBiCf4FIk85FcELQsviB4B8G94jb+GrwoASKfZBgJHkUyNUg5AkOwkhhzxa1sC06EAJALKUJwL3A30DsIGULEYeBhJPPFHNr9Htx3A5A1TECyGCjze+yQ04Rgpqii3s9BfTMAWUsfksxD8iO/xowkggVY3Cdmccif4XxAPskw4rwCjPBjvB5AAwVc6cfewPJ6AFnNzcTZSF75OowgzkZZzc1eD+SZAUiJkNX8FlgM9PVqnB5MX2CxrOa3Uno3U3vyYVlLPxIshR7iyQueOmLMELM4YPrDxg1A1jKQJKuQjDL97eMawWYsJpu+fjZqAPL3DMFiNVBu8rt5vqSRJJXidnaa+qAxA5CPU0aMvwFDTX0zT6fsIMEkcQdNJj5mxADs3/x68sr3ix0kmWBiJsjZAOyQrDXkp32/aSTG+Fz3BDkZgKylH0neym/4AkJtDMflcjpw7QeQEkGCpXnlB4hkFAmW5uIncO8IquFB8uf8MDDd1oUrXFmO7aJc7HbQPJ4wU8zmad2XtA3AvtjZSN69GzYOUkCF7gWSlgHIWvqQyF/shJgGYlToXCXr7QGSzCOv/DAzwtaRYxzPAHYkT+jCmvN0gmCi08giRwZgx/B9QD6MKyo0IRntJMbQ2RKgAjjzyo8OZbbOspJ1BrB3/ZvJR+9GjcMUMCrbqSD7DJDgUfLKjyK9bd11S7czgHyCS0my2pxMIaHvUCgshl5FUFQKQtWJ4FALHGmHz5rhizY43BaomEawqOwuA6mg25cl840L5DexQiithNMvhNMvglMr4IT+zt5t3QS762H332FXfTQNQumwy1zLLmcAO1HzNU+E8oNTK+AbN8KwGc4V3h3JODS9Av98GPauz/17fiK4vKuE1K4NoJr1RDFLd+BY+PYCOK3CuzH2rof3fg07Q5Pkm40NYjYXdfYXnRqAXMhEBH/zVibDFBbDRQ/AiFv8G3PbUlhTpfYNYUcyqbP6BJ2fAizu8lwgkwwcC9c3+Kt8UMvLtZuhZKy/47qhC51+ZQawy7J85LlApjhjAkx7Te3ogyIZhz9PhebQH5jOzixX09kM4POvUQ6cdTVc/kawygewCmDKy2omCjdf0e0xM4BdjeuTSBRk6jtUTb9BKz+djlZ4eRy0bQ1aks4R7GEAg9Orlx07A6hSbOFXPsCkp8OlfFAb0UnaQTn+IRnIPirT/1dBxgM3+CqQW0beptZ+NyTj0LIW9m6A//0L2puP/l1RKXytHAZ9RzmNYoX63z/9IrU53LbUnXxeo3S8KvWfXy4BdgXOFsJbhFFhFcAPP4E+JXrvJeOw+TH44NFjld4VfUrg3Htg5Cx9QzjUAn8YEVbP4X6KKUlVND26BLQynrArH9TGT1f5h1pg+fnw9o+dKT/1zrq58MeL4UCj3nh9StQsFU5OtnUNpBuAYFog4ugy5Lt6z3/RBq9OVH59N7RuUu93tOq9N3KWu/H8IE3XRw1AFV4OP2dO0Xt+4/2578o/a1YePx36DoXiMbmN6xVpurbAzu8Lvup2dgqL1R+nHGmHLU+YGfujl/RnkUGV2Z8JhpG2zu0ZIEHoPRgA9NPMP21eDYkOc+M3LNJ7/rTzzI1tGlvnygAElwQqjFPc7MZNouvq1TVYP7F1rgxAddrIkw3dvYTOcuU3ts4L7B47Id2tZHBwh97zXvwGNr4AfU539uyhvebHN8cYKREiUrd/sUK49XPnzyfj8FyZ87P/8cfZFhbDg5bCMYkOdSRzilUAFz/knTxRx2K4hYxYaZcdmmFY5ddBxa88ESXySMotu69edNi+XP+d838Jlz4bvtvDoJGUWaimitFhz1p3a/qwGXBdg/qZJ8UgC9VRMzokOuDdX7h7t6hUzQTX2fGDbq57exYlQlbzb6KY83/1uyr2PxeOtKtY/w+fUQkgybgJyaJEg5DV7IaIRAGlc8o58P1/mFvXj7SrOP+df4aP/6J/+xdN9ghZzadEtd7PmVNg6mvquGeSZFzNCB8th8bnwxrYYYKDQlZzGOgVtCSuGXELjK8xbwQpEh3KCLbURi8lLDtHhKwhiYcNCXzhzClw2YveH/N218O796ufPQGB7BkGANB/OEx9Wf30mubV8NYd4Q3/dopAWkh6xta3bSssO1clbZqMAeiM0kq45n3lYfRq6fEDSTzam8Cu6FcOYx/XDx9zw+56eON687EH/nDQAv+7VXrOgUaVq/fyOHXO9/J8f8YE+N6b4Q7+6Jr26DqCdOhXDufcrgpGmCgW0RmHWuCVcfoh5MHSIGQ1a4BxQUviC7FCtSycdRUMmW7eGNq2wkvnR6NegOItIatZBvwgaEl8xypQ03f5tcooTio1892ddbDicjPf8p4XC4BdQUsRCMm4Os6lAj1PrYCzr1bLhG7mUTpDpsM3boIPl5iQ0mt2WQgz3aciz383wvp74NnBsOoH7jOJAC5ZAL092muYRNBkIYjUrsVzknHY/hK8eK77490J/WH0XPOymUbQaJEk4u4sD2l8Hl4YBZ+syv5sJqPmhN9JlGSrRRVN9ERfgCk6WmHlldCyTu+9wmL3NQz8oZ0qmiwhkEAOC95xQKIDVl2tf7wbPNkbecywSQikmqME7yFDnB/Yq0jVBXDK5y0qqMMkh1rgg8fgvJ87fyes2cGgdE6qRIxkHXBnkPJ0i27tnb3rzRsAKLeyjgGE2T2sdG7nBsZYG6gw2dD15Zty6mTy3416z+fiT/AaW+cWgN1/dkugAnXHZ816629RqXeJmTqZSeGNOt6S6jmcXiLm9cDEcYLuJcsQj5qanhji32qnpOk6vUTMikCEcYru9DvMg4p3/cr1zvY6s4WfpOn6qAEUswbYH4Q8jtB1xpRWmp8Fvq6ZVfTpDrPjm2G/rWsgzQDsunHhLYD/8V9UxS8dxj1ubiN2UimMuVvvnX2hdK/UpWoEQmapWMFzvovjlCPt+jV6+g5V0Tp9h+Y2dp8SuMJFUeqPXbiQvSZDx8cawABWI9TuMJS8/xv9jJ3+w1VR6dFz3fnmB09RGUi60cZftIWvfLwqFn2MUMcYgLiGBJIlvgqlQ0crvP0T/fd6Fakr2hv3qJ+Dp3R/TDzlHPjmbXDVuzB9pbsZpGGR99HJukiWpFcKh6g2jJhWp18xtDMOtSglpa58+5QcbSeXC+3N6hYxfCllX2kY0XnPoBpeQ+LRQdoAJ5Wq7OCwetpWXB6+hlKCOlHFV2LVOu8ZlOQRzwXKhc+aVf3eMMbiNywKn/KhS51Gu21c/+Fqlx+WmWD7cnjjujDWGeiybVzXvYMF8zwTxxRtW1Usfi7xe6b48JmwKr9bXXbfO7iGDUguMC+RYawCuGAefOtu/8OwjrSrjOF//s7fcZ0ieEdUdT2Td9893GEP+sBJxlVE7/Mj1J29XzS9qnb7YVU+ZNVh1rRwWcMKJFPNSeQDp5yjHD/l15qvGZDoUEbWsCh8jp5MBCtFVfeNQLIbwJMMI85moLcxwfwilQo2eLJq5uQ2ROuLNnUbuX05/CcyJWMOU8AocSvbunvIUWEIWc184GdGxAqSXkWqzWvxGCgcoJw+J2Y4flI3eAd3qq5i+zZFLeEzxQNidvYl3JkBLKQIwQcQsaqixy9NSEaLOdnD/bvfBNqIObQjmJm7XHl8QTDTifLBoQEAiCrqESxwL1UeXxAsEFXUO33csQHYT98HNGiKlMc/GmwdOUa7Oph9KthIT6srFH0OUkBFtl1/JnozAGAPEN4kkuOXO3WVDy4MAEDM5mkg34ojPDxk60Qb1wUi7WZTf4IQxw0cH9RRxRV2kq82rmYAACGQxJiBYLPbb+TJEcFmYsxwq3zIwQAAxCwOYDEZ8lVGAqARi8liFgdy+UhOBgB2XmGSSmBHrt/K45gdJKlM5fflQs4GACBuZycJJpE3Aj/YQYJJ4nZ2mviYEQMAEHfQRJIJ5JcDL2kkyQRxh7nKbsbLxMtaBpJkFZJRpr99XCPYbK/5RhN3jM0AKcQs9mAxjjDnGUaPOizGmVY+eDADpLD9BA8CLlJ58qTxEFX8NJejXnd43ilEVnMz8Bj5uwNdDgJ3uvXwOcWXVjH2BdIr9PSy9OZooIAr3fj2dTG+B+gMcSvbiFGRjydwgGABMf1bPffD+YysYQKSxeTDyzJpQjBTJ5jDBL7MAOmIKuqRjAYegKOVKo5jDgMPIBntt/IhgBkgHfkkw0jwaOTyDkwhWEmMuX5N952LEALkE1yKZH4k0tBMIHgHwb3iNv4avCghQtYwHcl9hD0r2T0bEMwTVeFxkoXKAFLIhUzE4q5QF6nQQVBHkkfEHN4MWpRMQmkAKexyNbcguAkZsRb3gj12vaWnMsuyhIlQG0AKuYwY+6hEcgMqBO3koGXqgv1AHYLnGMDqzIJMYSQSBpCOXEZvWhmPYBqSy4CRAYu0BcHrSFZQzJr0IoxRIHIGkImsZSAJxiK4BMl5wBjAqz7y7cAmu8HGOmKs9eKGzk8ibwCZ2LeQZVgMR1KOpAwYBJQAxUB/lIEUIr5smBEHOlAKbgNagRZgF4ImBI0k2UoVTV7dygXF/wF+fTz59Jc5ygAAAABJRU5ErkJggg=="
    }));
  }
  async getHistoryKLineData(r, i, o, s) {
    return await ((await (await fetch(`https://api.polygon.io/v2/aggs/ticker/${r.ticker}/range/${i.span}/${i.type}/${o}/${s}?apiKey=${this._apiKey}`)).json()).results || []).map((f) => ({
      timestamp: f.t,
      open: f.o,
      high: f.h,
      low: f.l,
      close: f.c,
      volume: f.v,
      turnover: f.vw
    }));
  }
  subscribe(r, i, o) {
    var s, c;
    this._prevSymbolMarket !== r.market ? ((s = this._ws) == null || s.close(), this._ws = new WebSocket(`wss://delayed.polygon.io/${r.market}`), this._ws.onopen = () => {
      var u;
      (u = this._ws) == null || u.send(JSON.stringify({ action: "auth", params: this._apiKey }));
    }, this._ws.onmessage = (u) => {
      var g;
      const f = JSON.parse(u.data);
      f[0].ev === "status" ? f[0].status === "auth_success" && ((g = this._ws) == null || g.send(JSON.stringify({ action: "subscribe", params: `T.${r.ticker}` }))) : "sym" in f && o({
        timestamp: f.s,
        open: f.o,
        high: f.h,
        low: f.l,
        close: f.c,
        volume: f.v,
        turnover: f.vw
      });
    }) : (c = this._ws) == null || c.send(JSON.stringify({ action: "subscribe", params: `T.${r.ticker}` })), this._prevSymbolMarket = r.market;
  }
  unsubscribe(r, i) {
  }
}
class nO {
  constructor(r, i, o) {
    ht(this, "apikey");
    ht(this, "apiurl");
    ht(this, "testsesson_id");
    this.apiurl = r, this.apikey = i, this.testsesson_id = o;
  }
  async retrieveOrder(r) {
    const i = await this.makeFetchWithAuthAndBody("GET", `${this.apiurl}/positions/${r}`), o = await (i == null ? void 0 : i.json());
    return {
      entryPoint: o.data.entrypoint,
      stopLoss: o.data.stoploss,
      takeProfit: o.data.takeprofit,
      lotSize: o.data.lotsize,
      pl: o.data.pl,
      accountId: o.data.account_id,
      orderId: o.data.id,
      entryTime: o.data.entrytime,
      exitTime: o.data.exittime,
      exitPoint: o.data.exitpoint,
      action: o.data.action
    };
  }
  async retrieveOrders(r, i) {
    try {
      return ((await (await this.makeFetchWithAuthAndBody("GET", `${this.apiurl}/positions`)).json()).data || []).map((c) => ({
        entryPoint: c.entrypoint,
        stopLoss: c.stoploss,
        takeProfit: c.takeprofit,
        lotSize: c.lotsize,
        pl: c.pl,
        accountId: c.account_id,
        orderId: c.id,
        entryTime: c.entrytime,
        exitTime: c.exittime,
        exitPoint: c.exitpoint,
        action: c.action
      }));
    } catch {
      return [];
    }
  }
  async openOrder(r, i, o, s, c) {
    const u = await this.makeFetchWithAuthAndBody("POST", `${this.apiurl}/positions`, {
      account_id: this.testsesson_id,
      action: r,
      entrypoint: o,
      stoploss: s,
      takeprofit: c
    }), f = await (u == null ? void 0 : u.json());
    return {
      orderId: f.id,
      accountId: f.account_id,
      action: f.action,
      entryPoint: f.entrypoint,
      exitPoint: f.exitpoint,
      stopLoss: f.stoploss,
      takeProfit: f.takeprofit,
      lotSize: f.lotsize,
      pips: f.pips,
      pl: f.pl,
      entryTime: f.entrytime,
      exitTime: f.exittime,
      exitType: f.exittype,
      partials: f.partials
    };
  }
  async closeOrder(r, i) {
    try {
      const o = await this.makeFetchWithAuthAndBody("PUT", `${this.apiurl}/positions/${r}`);
      return await (o == null ? void 0 : o.json());
    } catch {
      return null;
    }
  }
  async modifyOrder(r) {
    const i = await this.makeFetchWithAuthAndBody("PUT", `${this.apiurl}/positions/${r.id}`, r), o = await (i == null ? void 0 : i.json());
    return {
      orderId: o.id,
      accountId: o.account_id,
      action: o.action,
      entryPoint: o.entrypoint,
      exitPoint: o.exitpoint,
      stopLoss: o.stoploss,
      takeProfit: o.takeprofit,
      lotSize: o.lotsize,
      pips: o.pips,
      pl: o.pl,
      entryTime: o.entrytime,
      exitTime: o.exittime,
      exitType: o.exittype,
      partials: o.partials
    };
  }
  async unsetSlOrTP(r, i) {
    const o = await this.makeFetchWithAuthAndBody("PUT", `${this.apiurl}/positions/${r}/unset/${i}`), s = await (o == null ? void 0 : o.json());
    return {
      orderId: s.id,
      accountId: s.account_id,
      action: s.action,
      entryPoint: s.entrypoint,
      exitPoint: s.exitpoint,
      stopLoss: s.stoploss,
      takeProfit: s.takeprofit,
      lotSize: s.lotsize,
      pips: s.pips,
      pl: s.pl,
      entryTime: s.entrytime,
      exitTime: s.exittime,
      exitType: s.exittype,
      partials: s.partials
    };
  }
  launchOrderModal(r, i, o) {
  }
  async makeFetchWithAuthAndBody(r, i, o) {
    const s = {
      method: r,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        authorization: `Bearer ${this.apikey}`
      },
      body: o ? JSON.stringify(o) : null
    };
    try {
      return await fetch(`${i}`, s);
    } catch (c) {
      return alert(c.message ?? "An error occured"), null;
    }
  }
}
class rO {
  constructor(r = "dummy_order_controller") {
    ht(this, "storage_name");
    this.storage_name = r;
  }
  async retrieveOrder(r) {
    return this.retrieveOrderFromLs(r);
  }
  async retrieveOrders(r, i) {
    let o = this.retrieveOrdersFromLs();
    return r && (o = o.filter((s, c) => s.action == r)), i && (o = o.filter((s) => s.accountId == i)), o;
  }
  async openOrder(r, i, o, s, c) {
    const u = this.retrieveOrdersFromLs(), f = {
      orderId: u.length ? u.at(u.length - 1).orderId + 1 : 0,
      action: r,
      entryPoint: o,
      exitPoint: void 0,
      stopLoss: s,
      takeProfit: c,
      lotSize: i,
      pips: 0,
      pl: 0,
      entryTime: (/* @__PURE__ */ new Date()).getTime().toString(),
      exitTime: void 0,
      exitType: void 0,
      partials: void 0
    };
    return this.storeOrder(f, u), f;
  }
  async closeOrder(r, i) {
    try {
      const o = this.retrieveOrdersFromLs(), s = o.findIndex((u) => u.orderId == r);
      if (s < 0)
        return null;
      const c = o[s];
      return (!i || i > c.lotSize) && (i = c.lotSize), c.lotSize -= i, this.storeOrder(c, o, s), c;
    } catch {
      return null;
    }
  }
  async modifyOrder(r) {
    const i = this.retrieveOrdersFromLs(), o = i.findIndex((c) => c.orderId == r.id);
    if (o < 0)
      return null;
    const s = i[o];
    return s.action = r.action ?? s.action, s.entryPoint = r.entrypoint ?? s.entryPoint, s.exitPoint = r.exitpoint ?? s.exitPoint, s.stopLoss = r.stoploss ?? s.stopLoss, s.takeProfit = r.takeprofit ?? s.takeProfit, s.lotSize = r.lotsize ?? s.lotSize, s.pips = r.pips ?? s.pips, s.pl = r.pl ?? s.pl, s.entryTime = ["buy", "sell"].includes(s.action) ? (/* @__PURE__ */ new Date()).getTime().toString() : s.entryTime, s.exitTime = s.exitPoint && s.exitTime ? (/* @__PURE__ */ new Date()).getTime().toString() : s.exitTime, this.storeOrder(s, i, o), s;
  }
  async unsetSlOrTP(r, i) {
    const o = this.retrieveOrdersFromLs(), s = o.findIndex((u) => u.orderId == r);
    if (s < 0)
      return null;
    const c = o[s];
    return i == "sl" ? c.stopLoss = void 0 : c.takeProfit = void 0, this.storeOrder(c, o, s), c;
  }
  launchOrderModal(r, i, o) {
  }
  retrieveOrdersFromLs() {
    return JSON.parse(localStorage.getItem(this.storage_name) ?? "[]");
  }
  retrieveOrderFromLs(r) {
    return this.retrieveOrdersFromLs().find((i) => i.orderId == r) ?? null;
  }
  storeOrder(r, i, o) {
    if (i || (i = this.retrieveOrdersFromLs()), o && o > i.length)
      throw new Error("storeOrder: index cannot be greater than total order length");
    o ? i[o] = r : i.push(r), localStorage.setItem(this.storage_name, JSON.stringify(i));
  }
}
const ot = (e) => Jt(() => e());
function Xf(e, r, i) {
  let o = i.length, s = r.length, c = o, u = 0, f = 0, g = r[s - 1].nextSibling, m = null;
  for (; u < s || f < c; ) {
    if (r[u] === i[f]) {
      u++, f++;
      continue;
    }
    for (; r[s - 1] === i[c - 1]; )
      s--, c--;
    if (s === u) {
      const C = c < o ? f ? i[f - 1].nextSibling : i[c - f] : g;
      for (; f < c; )
        e.insertBefore(i[f++], C);
    } else if (c === f)
      for (; u < s; )
        (!m || !m.has(r[u])) && r[u].remove(), u++;
    else if (r[u] === i[c - 1] && i[f] === r[s - 1]) {
      const C = r[--s].nextSibling;
      e.insertBefore(i[f++], r[u++].nextSibling), e.insertBefore(i[--c], C), r[s] = i[c];
    } else {
      if (!m) {
        m = /* @__PURE__ */ new Map();
        let b = f;
        for (; b < c; )
          m.set(i[b], b++);
      }
      const C = m.get(r[u]);
      if (C != null)
        if (f < C && C < c) {
          let b = u, _ = 1, x;
          for (; ++b < s && b < c && !((x = m.get(r[b])) == null || x !== C + _); )
            _++;
          if (_ > C - f) {
            const k = r[u];
            for (; f < C; )
              e.insertBefore(i[f++], k);
          } else
            e.replaceChild(i[f++], r[u++]);
        } else
          u++;
      else
        r[u++].remove();
    }
  }
}
const Wa = "_$DX_DELEGATE";
function Jf(e, r, i, o = {}) {
  let s;
  return f0((c) => {
    s = c, r === document ? e() : G(r, e(), r.firstChild ? null : void 0, i);
  }, o.owner), () => {
    s(), r.textContent = "";
  };
}
function U(e, r, i, o) {
  let s;
  const c = () => {
    const f = o ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
    return f.innerHTML = e, i ? f.content.firstChild.firstChild : o ? f.firstChild : f.content.firstChild;
  }, u = r ? () => Ht(() => document.importNode(s || (s = c()), !0)) : () => (s || (s = c())).cloneNode(!0);
  return u.cloneNode = u, u;
}
function At(e, r = window.document) {
  const i = r[Wa] || (r[Wa] = /* @__PURE__ */ new Set());
  for (let o = 0, s = e.length; o < s; o++) {
    const c = e[o];
    i.has(c) || (i.add(c), r.addEventListener(c, ed));
  }
}
function pt(e, r, i) {
  i == null ? e.removeAttribute(r) : e.setAttribute(r, i);
}
function Ln(e, r) {
  r == null ? e.removeAttribute("class") : e.className = r;
}
function En(e, r, i, o) {
  if (o)
    Array.isArray(i) ? (e[`$$${r}`] = i[0], e[`$$${r}Data`] = i[1]) : e[`$$${r}`] = i;
  else if (Array.isArray(i)) {
    const s = i[0];
    e.addEventListener(r, i[0] = (c) => s.call(e, i[1], c));
  } else
    e.addEventListener(r, i, typeof i != "function" && i);
}
function en(e, r, i) {
  if (!r)
    return i ? pt(e, "style") : r;
  const o = e.style;
  if (typeof r == "string")
    return o.cssText = r;
  typeof i == "string" && (o.cssText = i = void 0), i || (i = {}), r || (r = {});
  let s, c;
  for (c in i)
    r[c] == null && o.removeProperty(c), delete i[c];
  for (c in r)
    s = r[c], s !== i[c] && (o.setProperty(c, s), i[c] = s);
  return i;
}
function Ao(e, r, i) {
  i != null ? e.style.setProperty(r, i) : e.style.removeProperty(r);
}
function zo(e, r, i) {
  return Ht(() => e(r, i));
}
function G(e, r, i, o) {
  if (i !== void 0 && !o && (o = []), typeof r != "function")
    return v0(e, r, o, i);
  ze((s) => v0(e, r(), s, i), o);
}
function ed(e) {
  let r = e.target;
  const i = `$$${e.type}`, o = e.target, s = e.currentTarget, c = (g) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: g
  }), u = () => {
    const g = r[i];
    if (g && !r.disabled) {
      const m = r[`${i}Data`];
      if (m !== void 0 ? g.call(r, m, e) : g.call(r, e), e.cancelBubble)
        return;
    }
    return r.host && typeof r.host != "string" && !r.host._$host && r.contains(e.target) && c(r.host), !0;
  }, f = () => {
    for (; u() && (r = r._$host || r.parentNode || r.host); )
      ;
  };
  if (Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return r || document;
    }
  }), e.composedPath) {
    const g = e.composedPath();
    c(g[0]);
    for (let m = 0; m < g.length - 2 && (r = g[m], !!u()); m++) {
      if (r._$host) {
        r = r._$host, f();
        break;
      }
      if (r.parentNode === s)
        break;
    }
  } else
    f();
  c(o);
}
function v0(e, r, i, o, s) {
  for (; typeof i == "function"; )
    i = i();
  if (r === i)
    return i;
  const c = typeof r, u = o !== void 0;
  if (e = u && i[0] && i[0].parentNode || e, c === "string" || c === "number") {
    if (c === "number" && (r = r.toString(), r === i))
      return i;
    if (u) {
      let f = i[0];
      f && f.nodeType === 3 ? f.data !== r && (f.data = r) : f = document.createTextNode(r), i = m1(e, i, o, f);
    } else
      i !== "" && typeof i == "string" ? i = e.firstChild.data = r : i = e.textContent = r;
  } else if (r == null || c === "boolean")
    i = m1(e, i, o);
  else {
    if (c === "function")
      return ze(() => {
        let f = r();
        for (; typeof f == "function"; )
          f = f();
        i = v0(e, f, i, o);
      }), () => i;
    if (Array.isArray(r)) {
      const f = [], g = i && Array.isArray(i);
      if (Mo(f, r, i, s))
        return ze(() => i = v0(e, f, i, o, !0)), () => i;
      if (f.length === 0) {
        if (i = m1(e, i, o), u)
          return i;
      } else
        g ? i.length === 0 ? Qa(e, f, o) : Xf(e, i, f) : (i && m1(e), Qa(e, f));
      i = f;
    } else if (r.nodeType) {
      if (Array.isArray(i)) {
        if (u)
          return i = m1(e, i, o, r);
        m1(e, i, null, r);
      } else
        i == null || i === "" || !e.firstChild ? e.appendChild(r) : e.replaceChild(r, e.firstChild);
      i = r;
    }
  }
  return i;
}
function Mo(e, r, i, o) {
  let s = !1;
  for (let c = 0, u = r.length; c < u; c++) {
    let f = r[c], g = i && i[e.length], m;
    if (!(f == null || f === !0 || f === !1))
      if ((m = typeof f) == "object" && f.nodeType)
        e.push(f);
      else if (Array.isArray(f))
        s = Mo(e, f, g) || s;
      else if (m === "function")
        if (o) {
          for (; typeof f == "function"; )
            f = f();
          s = Mo(e, Array.isArray(f) ? f : [f], Array.isArray(g) ? g : [g]) || s;
        } else
          e.push(f), s = !0;
      else {
        const C = String(f);
        g && g.nodeType === 3 && g.data === C ? e.push(g) : e.push(document.createTextNode(C));
      }
  }
  return s;
}
function Qa(e, r, i = null) {
  for (let o = 0, s = r.length; o < s; o++)
    e.insertBefore(r[o], i);
}
function m1(e, r, i, o) {
  if (i === void 0)
    return e.textContent = "";
  const s = o || document.createTextNode("");
  if (r.length) {
    let c = !1;
    for (let u = r.length - 1; u >= 0; u--) {
      const f = r[u];
      if (s !== f) {
        const g = f.parentNode === e;
        !c && !u ? g ? e.replaceChild(s, f) : e.insertBefore(s, i) : g && f.remove();
      } else
        c = !0;
    }
  } else
    e.insertBefore(s, i);
  return [s];
}
var bn = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function No(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var td = typeof bn == "object" && bn && bn.Object === Object && bn, ss = td, nd = ss, rd = typeof self == "object" && self && self.Object === Object && self, id = nd || rd || Function("return this")(), nn = id, od = nn, ad = od.Symbol, T0 = ad, Ha = T0, ls = Object.prototype, sd = ls.hasOwnProperty, ld = ls.toString, sr = Ha ? Ha.toStringTag : void 0;
function cd(e) {
  var r = sd.call(e, sr), i = e[sr];
  try {
    e[sr] = void 0;
    var o = !0;
  } catch {
  }
  var s = ld.call(e);
  return o && (r ? e[sr] = i : delete e[sr]), s;
}
var ud = cd, fd = Object.prototype, dd = fd.toString;
function hd(e) {
  return dd.call(e);
}
var gd = hd, Ya = T0, pd = ud, yd = gd, md = "[object Null]", bd = "[object Undefined]", Ga = Ya ? Ya.toStringTag : void 0;
function vd(e) {
  return e == null ? e === void 0 ? bd : md : Ga && Ga in Object(e) ? pd(e) : yd(e);
}
var gr = vd;
function _d(e) {
  var r = typeof e;
  return e != null && (r == "object" || r == "function");
}
var $1 = _d, Cd = gr, xd = $1, Ld = "[object AsyncFunction]", Sd = "[object Function]", wd = "[object GeneratorFunction]", kd = "[object Proxy]";
function $d(e) {
  if (!xd(e))
    return !1;
  var r = Cd(e);
  return r == Sd || r == wd || r == Ld || r == kd;
}
var cs = $d, Ad = nn, Md = Ad["__core-js_shared__"], Td = Md, co = Td, ja = function() {
  var e = /[^.]+$/.exec(co && co.keys && co.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}();
function Id(e) {
  return !!ja && ja in e;
}
var Od = Id, Pd = Function.prototype, Bd = Pd.toString;
function Ed(e) {
  if (e != null) {
    try {
      return Bd.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var us = Ed, Rd = cs, Dd = Od, Fd = $1, zd = us, Nd = /[\\^$.*+?()[\]{}|]/g, Ud = /^\[object .+?Constructor\]$/, Kd = Function.prototype, Zd = Object.prototype, Wd = Kd.toString, Qd = Zd.hasOwnProperty, Hd = RegExp(
  "^" + Wd.call(Qd).replace(Nd, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function Yd(e) {
  if (!Fd(e) || Dd(e))
    return !1;
  var r = Rd(e) ? Hd : Ud;
  return r.test(zd(e));
}
var Gd = Yd;
function jd(e, r) {
  return e == null ? void 0 : e[r];
}
var Vd = jd, qd = Gd, Xd = Vd;
function Jd(e, r) {
  var i = Xd(e, r);
  return qd(i) ? i : void 0;
}
var Jn = Jd, eh = Jn, th = function() {
  try {
    var e = eh(Object, "defineProperty");
    return e({}, "", {}), e;
  } catch {
  }
}(), nh = th, Va = nh;
function rh(e, r, i) {
  r == "__proto__" && Va ? Va(e, r, {
    configurable: !0,
    enumerable: !0,
    value: i,
    writable: !0
  }) : e[r] = i;
}
var fs = rh;
function ih(e, r) {
  return e === r || e !== e && r !== r;
}
var ds = ih, oh = fs, ah = ds, sh = Object.prototype, lh = sh.hasOwnProperty;
function ch(e, r, i) {
  var o = e[r];
  (!(lh.call(e, r) && ah(o, i)) || i === void 0 && !(r in e)) && oh(e, r, i);
}
var Uo = ch, uh = Array.isArray, A1 = uh;
function fh(e) {
  return e != null && typeof e == "object";
}
var M1 = fh, dh = gr, hh = M1, gh = "[object Symbol]";
function ph(e) {
  return typeof e == "symbol" || hh(e) && dh(e) == gh;
}
var Ko = ph, yh = A1, mh = Ko, bh = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, vh = /^\w*$/;
function _h(e, r) {
  if (yh(e))
    return !1;
  var i = typeof e;
  return i == "number" || i == "symbol" || i == "boolean" || e == null || mh(e) ? !0 : vh.test(e) || !bh.test(e) || r != null && e in Object(r);
}
var Ch = _h, xh = Jn, Lh = xh(Object, "create"), I0 = Lh, qa = I0;
function Sh() {
  this.__data__ = qa ? qa(null) : {}, this.size = 0;
}
var wh = Sh;
function kh(e) {
  var r = this.has(e) && delete this.__data__[e];
  return this.size -= r ? 1 : 0, r;
}
var $h = kh, Ah = I0, Mh = "__lodash_hash_undefined__", Th = Object.prototype, Ih = Th.hasOwnProperty;
function Oh(e) {
  var r = this.__data__;
  if (Ah) {
    var i = r[e];
    return i === Mh ? void 0 : i;
  }
  return Ih.call(r, e) ? r[e] : void 0;
}
var Ph = Oh, Bh = I0, Eh = Object.prototype, Rh = Eh.hasOwnProperty;
function Dh(e) {
  var r = this.__data__;
  return Bh ? r[e] !== void 0 : Rh.call(r, e);
}
var Fh = Dh, zh = I0, Nh = "__lodash_hash_undefined__";
function Uh(e, r) {
  var i = this.__data__;
  return this.size += this.has(e) ? 0 : 1, i[e] = zh && r === void 0 ? Nh : r, this;
}
var Kh = Uh, Zh = wh, Wh = $h, Qh = Ph, Hh = Fh, Yh = Kh;
function T1(e) {
  var r = -1, i = e == null ? 0 : e.length;
  for (this.clear(); ++r < i; ) {
    var o = e[r];
    this.set(o[0], o[1]);
  }
}
T1.prototype.clear = Zh;
T1.prototype.delete = Wh;
T1.prototype.get = Qh;
T1.prototype.has = Hh;
T1.prototype.set = Yh;
var Gh = T1;
function jh() {
  this.__data__ = [], this.size = 0;
}
var Vh = jh, qh = ds;
function Xh(e, r) {
  for (var i = e.length; i--; )
    if (qh(e[i][0], r))
      return i;
  return -1;
}
var O0 = Xh, Jh = O0, eg = Array.prototype, tg = eg.splice;
function ng(e) {
  var r = this.__data__, i = Jh(r, e);
  if (i < 0)
    return !1;
  var o = r.length - 1;
  return i == o ? r.pop() : tg.call(r, i, 1), --this.size, !0;
}
var rg = ng, ig = O0;
function og(e) {
  var r = this.__data__, i = ig(r, e);
  return i < 0 ? void 0 : r[i][1];
}
var ag = og, sg = O0;
function lg(e) {
  return sg(this.__data__, e) > -1;
}
var cg = lg, ug = O0;
function fg(e, r) {
  var i = this.__data__, o = ug(i, e);
  return o < 0 ? (++this.size, i.push([e, r])) : i[o][1] = r, this;
}
var dg = fg, hg = Vh, gg = rg, pg = ag, yg = cg, mg = dg;
function I1(e) {
  var r = -1, i = e == null ? 0 : e.length;
  for (this.clear(); ++r < i; ) {
    var o = e[r];
    this.set(o[0], o[1]);
  }
}
I1.prototype.clear = hg;
I1.prototype.delete = gg;
I1.prototype.get = pg;
I1.prototype.has = yg;
I1.prototype.set = mg;
var P0 = I1, bg = Jn, vg = nn, _g = bg(vg, "Map"), Zo = _g, Xa = Gh, Cg = P0, xg = Zo;
function Lg() {
  this.size = 0, this.__data__ = {
    hash: new Xa(),
    map: new (xg || Cg)(),
    string: new Xa()
  };
}
var Sg = Lg;
function wg(e) {
  var r = typeof e;
  return r == "string" || r == "number" || r == "symbol" || r == "boolean" ? e !== "__proto__" : e === null;
}
var kg = wg, $g = kg;
function Ag(e, r) {
  var i = e.__data__;
  return $g(r) ? i[typeof r == "string" ? "string" : "hash"] : i.map;
}
var B0 = Ag, Mg = B0;
function Tg(e) {
  var r = Mg(this, e).delete(e);
  return this.size -= r ? 1 : 0, r;
}
var Ig = Tg, Og = B0;
function Pg(e) {
  return Og(this, e).get(e);
}
var Bg = Pg, Eg = B0;
function Rg(e) {
  return Eg(this, e).has(e);
}
var Dg = Rg, Fg = B0;
function zg(e, r) {
  var i = Fg(this, e), o = i.size;
  return i.set(e, r), this.size += i.size == o ? 0 : 1, this;
}
var Ng = zg, Ug = Sg, Kg = Ig, Zg = Bg, Wg = Dg, Qg = Ng;
function O1(e) {
  var r = -1, i = e == null ? 0 : e.length;
  for (this.clear(); ++r < i; ) {
    var o = e[r];
    this.set(o[0], o[1]);
  }
}
O1.prototype.clear = Ug;
O1.prototype.delete = Kg;
O1.prototype.get = Zg;
O1.prototype.has = Wg;
O1.prototype.set = Qg;
var hs = O1, gs = hs, Hg = "Expected a function";
function Wo(e, r) {
  if (typeof e != "function" || r != null && typeof r != "function")
    throw new TypeError(Hg);
  var i = function() {
    var o = arguments, s = r ? r.apply(this, o) : o[0], c = i.cache;
    if (c.has(s))
      return c.get(s);
    var u = e.apply(this, o);
    return i.cache = c.set(s, u) || c, u;
  };
  return i.cache = new (Wo.Cache || gs)(), i;
}
Wo.Cache = gs;
var Yg = Wo, Gg = Yg, jg = 500;
function Vg(e) {
  var r = Gg(e, function(o) {
    return i.size === jg && i.clear(), o;
  }), i = r.cache;
  return r;
}
var qg = Vg, Xg = qg, Jg = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, ep = /\\(\\)?/g, tp = Xg(function(e) {
  var r = [];
  return e.charCodeAt(0) === 46 && r.push(""), e.replace(Jg, function(i, o, s, c) {
    r.push(s ? c.replace(ep, "$1") : o || i);
  }), r;
}), np = tp;
function rp(e, r) {
  for (var i = -1, o = e == null ? 0 : e.length, s = Array(o); ++i < o; )
    s[i] = r(e[i], i, e);
  return s;
}
var ip = rp, Ja = T0, op = ip, ap = A1, sp = Ko, lp = 1 / 0, e2 = Ja ? Ja.prototype : void 0, t2 = e2 ? e2.toString : void 0;
function ps(e) {
  if (typeof e == "string")
    return e;
  if (ap(e))
    return op(e, ps) + "";
  if (sp(e))
    return t2 ? t2.call(e) : "";
  var r = e + "";
  return r == "0" && 1 / e == -lp ? "-0" : r;
}
var cp = ps, up = cp;
function fp(e) {
  return e == null ? "" : up(e);
}
var dp = fp, hp = A1, gp = Ch, pp = np, yp = dp;
function mp(e, r) {
  return hp(e) ? e : gp(e, r) ? [e] : pp(yp(e));
}
var bp = mp, vp = 9007199254740991, _p = /^(?:0|[1-9]\d*)$/;
function Cp(e, r) {
  var i = typeof e;
  return r = r ?? vp, !!r && (i == "number" || i != "symbol" && _p.test(e)) && e > -1 && e % 1 == 0 && e < r;
}
var ys = Cp, xp = Ko, Lp = 1 / 0;
function Sp(e) {
  if (typeof e == "string" || xp(e))
    return e;
  var r = e + "";
  return r == "0" && 1 / e == -Lp ? "-0" : r;
}
var wp = Sp, kp = Uo, $p = bp, Ap = ys, n2 = $1, Mp = wp;
function Tp(e, r, i, o) {
  if (!n2(e))
    return e;
  r = $p(r, e);
  for (var s = -1, c = r.length, u = c - 1, f = e; f != null && ++s < c; ) {
    var g = Mp(r[s]), m = i;
    if (g === "__proto__" || g === "constructor" || g === "prototype")
      return e;
    if (s != u) {
      var C = f[g];
      m = o ? o(C, g, f) : void 0, m === void 0 && (m = n2(C) ? C : Ap(r[s + 1]) ? [] : {});
    }
    kp(f, g, m), f = f[g];
  }
  return e;
}
var Ip = Tp, Op = Ip;
function Pp(e, r, i) {
  return e == null ? e : Op(e, r, i);
}
var Bp = Pp;
const cr = /* @__PURE__ */ No(Bp);
var Ep = P0;
function Rp() {
  this.__data__ = new Ep(), this.size = 0;
}
var Dp = Rp;
function Fp(e) {
  var r = this.__data__, i = r.delete(e);
  return this.size = r.size, i;
}
var zp = Fp;
function Np(e) {
  return this.__data__.get(e);
}
var Up = Np;
function Kp(e) {
  return this.__data__.has(e);
}
var Zp = Kp, Wp = P0, Qp = Zo, Hp = hs, Yp = 200;
function Gp(e, r) {
  var i = this.__data__;
  if (i instanceof Wp) {
    var o = i.__data__;
    if (!Qp || o.length < Yp - 1)
      return o.push([e, r]), this.size = ++i.size, this;
    i = this.__data__ = new Hp(o);
  }
  return i.set(e, r), this.size = i.size, this;
}
var jp = Gp, Vp = P0, qp = Dp, Xp = zp, Jp = Up, ey = Zp, ty = jp;
function P1(e) {
  var r = this.__data__ = new Vp(e);
  this.size = r.size;
}
P1.prototype.clear = qp;
P1.prototype.delete = Xp;
P1.prototype.get = Jp;
P1.prototype.has = ey;
P1.prototype.set = ty;
var ny = P1;
function ry(e, r) {
  for (var i = -1, o = e == null ? 0 : e.length; ++i < o && r(e[i], i, e) !== !1; )
    ;
  return e;
}
var iy = ry, oy = Uo, ay = fs;
function sy(e, r, i, o) {
  var s = !i;
  i || (i = {});
  for (var c = -1, u = r.length; ++c < u; ) {
    var f = r[c], g = o ? o(i[f], e[f], f, i, e) : void 0;
    g === void 0 && (g = e[f]), s ? ay(i, f, g) : oy(i, f, g);
  }
  return i;
}
var E0 = sy;
function ly(e, r) {
  for (var i = -1, o = Array(e); ++i < e; )
    o[i] = r(i);
  return o;
}
var cy = ly, uy = gr, fy = M1, dy = "[object Arguments]";
function hy(e) {
  return fy(e) && uy(e) == dy;
}
var gy = hy, r2 = gy, py = M1, ms = Object.prototype, yy = ms.hasOwnProperty, my = ms.propertyIsEnumerable, by = r2(function() {
  return arguments;
}()) ? r2 : function(e) {
  return py(e) && yy.call(e, "callee") && !my.call(e, "callee");
}, vy = by, _0 = { exports: {} };
function _y() {
  return !1;
}
var Cy = _y;
_0.exports;
(function(e, r) {
  var i = nn, o = Cy, s = r && !r.nodeType && r, c = s && !0 && e && !e.nodeType && e, u = c && c.exports === s, f = u ? i.Buffer : void 0, g = f ? f.isBuffer : void 0, m = g || o;
  e.exports = m;
})(_0, _0.exports);
var bs = _0.exports, xy = 9007199254740991;
function Ly(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= xy;
}
var vs = Ly, Sy = gr, wy = vs, ky = M1, $y = "[object Arguments]", Ay = "[object Array]", My = "[object Boolean]", Ty = "[object Date]", Iy = "[object Error]", Oy = "[object Function]", Py = "[object Map]", By = "[object Number]", Ey = "[object Object]", Ry = "[object RegExp]", Dy = "[object Set]", Fy = "[object String]", zy = "[object WeakMap]", Ny = "[object ArrayBuffer]", Uy = "[object DataView]", Ky = "[object Float32Array]", Zy = "[object Float64Array]", Wy = "[object Int8Array]", Qy = "[object Int16Array]", Hy = "[object Int32Array]", Yy = "[object Uint8Array]", Gy = "[object Uint8ClampedArray]", jy = "[object Uint16Array]", Vy = "[object Uint32Array]", Re = {};
Re[Ky] = Re[Zy] = Re[Wy] = Re[Qy] = Re[Hy] = Re[Yy] = Re[Gy] = Re[jy] = Re[Vy] = !0;
Re[$y] = Re[Ay] = Re[Ny] = Re[My] = Re[Uy] = Re[Ty] = Re[Iy] = Re[Oy] = Re[Py] = Re[By] = Re[Ey] = Re[Ry] = Re[Dy] = Re[Fy] = Re[zy] = !1;
function qy(e) {
  return ky(e) && wy(e.length) && !!Re[Sy(e)];
}
var Xy = qy;
function Jy(e) {
  return function(r) {
    return e(r);
  };
}
var Qo = Jy, C0 = { exports: {} };
C0.exports;
(function(e, r) {
  var i = ss, o = r && !r.nodeType && r, s = o && !0 && e && !e.nodeType && e, c = s && s.exports === o, u = c && i.process, f = function() {
    try {
      var g = s && s.require && s.require("util").types;
      return g || u && u.binding && u.binding("util");
    } catch {
    }
  }();
  e.exports = f;
})(C0, C0.exports);
var Ho = C0.exports, em = Xy, tm = Qo, i2 = Ho, o2 = i2 && i2.isTypedArray, nm = o2 ? tm(o2) : em, rm = nm, im = cy, om = vy, am = A1, sm = bs, lm = ys, cm = rm, um = Object.prototype, fm = um.hasOwnProperty;
function dm(e, r) {
  var i = am(e), o = !i && om(e), s = !i && !o && sm(e), c = !i && !o && !s && cm(e), u = i || o || s || c, f = u ? im(e.length, String) : [], g = f.length;
  for (var m in e)
    (r || fm.call(e, m)) && !(u && // Safari 9 has enumerable `arguments.length` in strict mode.
    (m == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    s && (m == "offset" || m == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    c && (m == "buffer" || m == "byteLength" || m == "byteOffset") || // Skip index properties.
    lm(m, g))) && f.push(m);
  return f;
}
var _s = dm, hm = Object.prototype;
function gm(e) {
  var r = e && e.constructor, i = typeof r == "function" && r.prototype || hm;
  return e === i;
}
var Yo = gm;
function pm(e, r) {
  return function(i) {
    return e(r(i));
  };
}
var Cs = pm, ym = Cs, mm = ym(Object.keys, Object), bm = mm, vm = Yo, _m = bm, Cm = Object.prototype, xm = Cm.hasOwnProperty;
function Lm(e) {
  if (!vm(e))
    return _m(e);
  var r = [];
  for (var i in Object(e))
    xm.call(e, i) && i != "constructor" && r.push(i);
  return r;
}
var Sm = Lm, wm = cs, km = vs;
function $m(e) {
  return e != null && km(e.length) && !wm(e);
}
var xs = $m, Am = _s, Mm = Sm, Tm = xs;
function Im(e) {
  return Tm(e) ? Am(e) : Mm(e);
}
var Go = Im, Om = E0, Pm = Go;
function Bm(e, r) {
  return e && Om(r, Pm(r), e);
}
var Em = Bm;
function Rm(e) {
  var r = [];
  if (e != null)
    for (var i in Object(e))
      r.push(i);
  return r;
}
var Dm = Rm, Fm = $1, zm = Yo, Nm = Dm, Um = Object.prototype, Km = Um.hasOwnProperty;
function Zm(e) {
  if (!Fm(e))
    return Nm(e);
  var r = zm(e), i = [];
  for (var o in e)
    o == "constructor" && (r || !Km.call(e, o)) || i.push(o);
  return i;
}
var Wm = Zm, Qm = _s, Hm = Wm, Ym = xs;
function Gm(e) {
  return Ym(e) ? Qm(e, !0) : Hm(e);
}
var jo = Gm, jm = E0, Vm = jo;
function qm(e, r) {
  return e && jm(r, Vm(r), e);
}
var Xm = qm, x0 = { exports: {} };
x0.exports;
(function(e, r) {
  var i = nn, o = r && !r.nodeType && r, s = o && !0 && e && !e.nodeType && e, c = s && s.exports === o, u = c ? i.Buffer : void 0, f = u ? u.allocUnsafe : void 0;
  function g(m, C) {
    if (C)
      return m.slice();
    var b = m.length, _ = f ? f(b) : new m.constructor(b);
    return m.copy(_), _;
  }
  e.exports = g;
})(x0, x0.exports);
var Jm = x0.exports;
function eb(e, r) {
  var i = -1, o = e.length;
  for (r || (r = Array(o)); ++i < o; )
    r[i] = e[i];
  return r;
}
var tb = eb;
function nb(e, r) {
  for (var i = -1, o = e == null ? 0 : e.length, s = 0, c = []; ++i < o; ) {
    var u = e[i];
    r(u, i, e) && (c[s++] = u);
  }
  return c;
}
var rb = nb;
function ib() {
  return [];
}
var Ls = ib, ob = rb, ab = Ls, sb = Object.prototype, lb = sb.propertyIsEnumerable, a2 = Object.getOwnPropertySymbols, cb = a2 ? function(e) {
  return e == null ? [] : (e = Object(e), ob(a2(e), function(r) {
    return lb.call(e, r);
  }));
} : ab, Vo = cb, ub = E0, fb = Vo;
function db(e, r) {
  return ub(e, fb(e), r);
}
var hb = db;
function gb(e, r) {
  for (var i = -1, o = r.length, s = e.length; ++i < o; )
    e[s + i] = r[i];
  return e;
}
var Ss = gb, pb = Cs, yb = pb(Object.getPrototypeOf, Object), ws = yb, mb = Ss, bb = ws, vb = Vo, _b = Ls, Cb = Object.getOwnPropertySymbols, xb = Cb ? function(e) {
  for (var r = []; e; )
    mb(r, vb(e)), e = bb(e);
  return r;
} : _b, ks = xb, Lb = E0, Sb = ks;
function wb(e, r) {
  return Lb(e, Sb(e), r);
}
var kb = wb, $b = Ss, Ab = A1;
function Mb(e, r, i) {
  var o = r(e);
  return Ab(e) ? o : $b(o, i(e));
}
var $s = Mb, Tb = $s, Ib = Vo, Ob = Go;
function Pb(e) {
  return Tb(e, Ob, Ib);
}
var Bb = Pb, Eb = $s, Rb = ks, Db = jo;
function Fb(e) {
  return Eb(e, Db, Rb);
}
var zb = Fb, Nb = Jn, Ub = nn, Kb = Nb(Ub, "DataView"), Zb = Kb, Wb = Jn, Qb = nn, Hb = Wb(Qb, "Promise"), Yb = Hb, Gb = Jn, jb = nn, Vb = Gb(jb, "Set"), qb = Vb, Xb = Jn, Jb = nn, ev = Xb(Jb, "WeakMap"), tv = ev, To = Zb, Io = Zo, Oo = Yb, Po = qb, Bo = tv, As = gr, B1 = us, s2 = "[object Map]", nv = "[object Object]", l2 = "[object Promise]", c2 = "[object Set]", u2 = "[object WeakMap]", f2 = "[object DataView]", rv = B1(To), iv = B1(Io), ov = B1(Oo), av = B1(Po), sv = B1(Bo), qn = As;
(To && qn(new To(new ArrayBuffer(1))) != f2 || Io && qn(new Io()) != s2 || Oo && qn(Oo.resolve()) != l2 || Po && qn(new Po()) != c2 || Bo && qn(new Bo()) != u2) && (qn = function(e) {
  var r = As(e), i = r == nv ? e.constructor : void 0, o = i ? B1(i) : "";
  if (o)
    switch (o) {
      case rv:
        return f2;
      case iv:
        return s2;
      case ov:
        return l2;
      case av:
        return c2;
      case sv:
        return u2;
    }
  return r;
});
var qo = qn, lv = Object.prototype, cv = lv.hasOwnProperty;
function uv(e) {
  var r = e.length, i = new e.constructor(r);
  return r && typeof e[0] == "string" && cv.call(e, "index") && (i.index = e.index, i.input = e.input), i;
}
var fv = uv, dv = nn, hv = dv.Uint8Array, gv = hv, d2 = gv;
function pv(e) {
  var r = new e.constructor(e.byteLength);
  return new d2(r).set(new d2(e)), r;
}
var Xo = pv, yv = Xo;
function mv(e, r) {
  var i = r ? yv(e.buffer) : e.buffer;
  return new e.constructor(i, e.byteOffset, e.byteLength);
}
var bv = mv, vv = /\w*$/;
function _v(e) {
  var r = new e.constructor(e.source, vv.exec(e));
  return r.lastIndex = e.lastIndex, r;
}
var Cv = _v, h2 = T0, g2 = h2 ? h2.prototype : void 0, p2 = g2 ? g2.valueOf : void 0;
function xv(e) {
  return p2 ? Object(p2.call(e)) : {};
}
var Lv = xv, Sv = Xo;
function wv(e, r) {
  var i = r ? Sv(e.buffer) : e.buffer;
  return new e.constructor(i, e.byteOffset, e.length);
}
var kv = wv, $v = Xo, Av = bv, Mv = Cv, Tv = Lv, Iv = kv, Ov = "[object Boolean]", Pv = "[object Date]", Bv = "[object Map]", Ev = "[object Number]", Rv = "[object RegExp]", Dv = "[object Set]", Fv = "[object String]", zv = "[object Symbol]", Nv = "[object ArrayBuffer]", Uv = "[object DataView]", Kv = "[object Float32Array]", Zv = "[object Float64Array]", Wv = "[object Int8Array]", Qv = "[object Int16Array]", Hv = "[object Int32Array]", Yv = "[object Uint8Array]", Gv = "[object Uint8ClampedArray]", jv = "[object Uint16Array]", Vv = "[object Uint32Array]";
function qv(e, r, i) {
  var o = e.constructor;
  switch (r) {
    case Nv:
      return $v(e);
    case Ov:
    case Pv:
      return new o(+e);
    case Uv:
      return Av(e, i);
    case Kv:
    case Zv:
    case Wv:
    case Qv:
    case Hv:
    case Yv:
    case Gv:
    case jv:
    case Vv:
      return Iv(e, i);
    case Bv:
      return new o();
    case Ev:
    case Fv:
      return new o(e);
    case Rv:
      return Mv(e);
    case Dv:
      return new o();
    case zv:
      return Tv(e);
  }
}
var Xv = qv, Jv = $1, y2 = Object.create, e_ = function() {
  function e() {
  }
  return function(r) {
    if (!Jv(r))
      return {};
    if (y2)
      return y2(r);
    e.prototype = r;
    var i = new e();
    return e.prototype = void 0, i;
  };
}(), t_ = e_, n_ = t_, r_ = ws, i_ = Yo;
function o_(e) {
  return typeof e.constructor == "function" && !i_(e) ? n_(r_(e)) : {};
}
var a_ = o_, s_ = qo, l_ = M1, c_ = "[object Map]";
function u_(e) {
  return l_(e) && s_(e) == c_;
}
var f_ = u_, d_ = f_, h_ = Qo, m2 = Ho, b2 = m2 && m2.isMap, g_ = b2 ? h_(b2) : d_, p_ = g_, y_ = qo, m_ = M1, b_ = "[object Set]";
function v_(e) {
  return m_(e) && y_(e) == b_;
}
var __ = v_, C_ = __, x_ = Qo, v2 = Ho, _2 = v2 && v2.isSet, L_ = _2 ? x_(_2) : C_, S_ = L_, w_ = ny, k_ = iy, $_ = Uo, A_ = Em, M_ = Xm, T_ = Jm, I_ = tb, O_ = hb, P_ = kb, B_ = Bb, E_ = zb, R_ = qo, D_ = fv, F_ = Xv, z_ = a_, N_ = A1, U_ = bs, K_ = p_, Z_ = $1, W_ = S_, Q_ = Go, H_ = jo, Y_ = 1, G_ = 2, j_ = 4, Ms = "[object Arguments]", V_ = "[object Array]", q_ = "[object Boolean]", X_ = "[object Date]", J_ = "[object Error]", Ts = "[object Function]", eC = "[object GeneratorFunction]", tC = "[object Map]", nC = "[object Number]", Is = "[object Object]", rC = "[object RegExp]", iC = "[object Set]", oC = "[object String]", aC = "[object Symbol]", sC = "[object WeakMap]", lC = "[object ArrayBuffer]", cC = "[object DataView]", uC = "[object Float32Array]", fC = "[object Float64Array]", dC = "[object Int8Array]", hC = "[object Int16Array]", gC = "[object Int32Array]", pC = "[object Uint8Array]", yC = "[object Uint8ClampedArray]", mC = "[object Uint16Array]", bC = "[object Uint32Array]", Be = {};
Be[Ms] = Be[V_] = Be[lC] = Be[cC] = Be[q_] = Be[X_] = Be[uC] = Be[fC] = Be[dC] = Be[hC] = Be[gC] = Be[tC] = Be[nC] = Be[Is] = Be[rC] = Be[iC] = Be[oC] = Be[aC] = Be[pC] = Be[yC] = Be[mC] = Be[bC] = !0;
Be[J_] = Be[Ts] = Be[sC] = !1;
function h0(e, r, i, o, s, c) {
  var u, f = r & Y_, g = r & G_, m = r & j_;
  if (i && (u = s ? i(e, o, s, c) : i(e)), u !== void 0)
    return u;
  if (!Z_(e))
    return e;
  var C = N_(e);
  if (C) {
    if (u = D_(e), !f)
      return I_(e, u);
  } else {
    var b = R_(e), _ = b == Ts || b == eC;
    if (U_(e))
      return T_(e, f);
    if (b == Is || b == Ms || _ && !s) {
      if (u = g || _ ? {} : z_(e), !f)
        return g ? P_(e, M_(u, e)) : O_(e, A_(u, e));
    } else {
      if (!Be[b])
        return s ? e : {};
      u = F_(e, b, f);
    }
  }
  c || (c = new w_());
  var x = c.get(e);
  if (x)
    return x;
  c.set(e, u), W_(e) ? e.forEach(function($) {
    u.add(h0($, r, i, $, e, c));
  }) : K_(e) && e.forEach(function($, A) {
    u.set(A, h0($, r, i, A, e, c));
  });
  var k = m ? g ? E_ : B_ : g ? H_ : Q_, T = C ? void 0 : k(e);
  return k_(T || e, function($, A) {
    T && (A = $, $ = e[A]), $_(u, A, h0($, r, i, A, e, c));
  }), u;
}
var vC = h0, _C = vC, CC = 1, xC = 4;
function LC(e) {
  return _C(e, CC | xC);
}
var SC = LC;
const wC = /* @__PURE__ */ No(SC);
var kC = /* @__PURE__ */ U("<button>");
const $C = (e) => (() => {
  var r = kC();
  return En(r, "click", e.onClick, !0), G(r, () => e.children), ze((i) => {
    var o = e.style, s = `klinecharts-pro-button ${e.type ?? "confirm"} ${e.class ?? ""}`;
    return i.e = en(r, o, i.e), s !== i.t && Ln(r, i.t = s), i;
  }, {
    e: void 0,
    t: void 0
  }), r;
})();
At(["click"]);
var AC = /* @__PURE__ */ U('<svg viewBox="0 0 1024 1024"class=icon><path d="M810.666667 128H213.333333c-46.933333 0-85.333333 38.4-85.333333 85.333333v597.333334c0 46.933333 38.4 85.333333 85.333333 85.333333h597.333334c46.933333 0 85.333333-38.4 85.333333-85.333333V213.333333c0-46.933333-38.4-85.333333-85.333333-85.333333z m-353.706667 567.04a42.496 42.496 0 0 1-60.16 0L243.626667 541.866667c-8.106667-8.106667-12.373333-18.773333-12.373334-29.866667s4.693333-22.186667 12.373334-29.866667a42.496 42.496 0 0 1 60.16 0L426.666667 604.586667l293.546666-293.546667a42.496 42.496 0 1 1 60.16 60.16l-323.413333 323.84z">'), MC = /* @__PURE__ */ U('<svg viewBox="0 0 1024 1024"class=icon><path d="M245.333333 128h533.333334A117.333333 117.333333 0 0 1 896 245.333333v533.333334A117.333333 117.333333 0 0 1 778.666667 896H245.333333A117.333333 117.333333 0 0 1 128 778.666667V245.333333A117.333333 117.333333 0 0 1 245.333333 128z m0 64c-29.44 0-53.333333 23.893333-53.333333 53.333333v533.333334c0 29.44 23.893333 53.333333 53.333333 53.333333h533.333334c29.44 0 53.333333-23.893333 53.333333-53.333333V245.333333c0-29.44-23.893333-53.333333-53.333333-53.333333H245.333333z">'), TC = /* @__PURE__ */ U("<div>"), IC = /* @__PURE__ */ U("<span class=label>");
const OC = () => AC(), PC = () => MC(), C2 = (e) => {
  const [r, i] = E(e.checked ?? !1);
  return mn(() => {
    "checked" in e && i(e.checked);
  }), (() => {
    var o = TC();
    return o.$$click = (s) => {
      const c = !r();
      e.onChange && e.onChange(c), i(c);
    }, G(o, (() => {
      var s = ot(() => !!r());
      return () => s() ? Y(OC, {}) : Y(PC, {});
    })(), null), G(o, (() => {
      var s = ot(() => !!e.label);
      return () => s() && (() => {
        var c = IC();
        return G(c, () => e.label), c;
      })();
    })(), null), ze((s) => {
      var c = e.style, u = `klinecharts-pro-checkbox ${r() && "checked" || ""} ${e.class || ""}`;
      return s.e = en(o, c, s.e), u !== s.t && Ln(o, s.t = u), s;
    }, {
      e: void 0,
      t: void 0
    }), o;
  })();
};
At(["click"]);
var BC = /* @__PURE__ */ U("<div class=klinecharts-pro-loading><i class=circle1></i><i class=circle2></i><i class=circle3>");
const Os = () => BC();
var EC = /* @__PURE__ */ U('<div class=klinecharts-pro-empty><svg class=icon viewBox="0 0 1024 1024"><path d="M855.6 427.2H168.5c-12.7 0-24.4 6.9-30.6 18L4.4 684.7C1.5 689.9 0 695.8 0 701.8v287.1c0 19.4 15.7 35.1 35.1 35.1H989c19.4 0 35.1-15.7 35.1-35.1V701.8c0-6-1.5-11.8-4.4-17.1L886.2 445.2c-6.2-11.1-17.9-18-30.6-18zM673.4 695.6c-16.5 0-30.8 11.5-34.3 27.7-12.7 58.5-64.8 102.3-127.2 102.3s-114.5-43.8-127.2-102.3c-3.5-16.1-17.8-27.7-34.3-27.7H119c-26.4 0-43.3-28-31.1-51.4l81.7-155.8c6.1-11.6 18-18.8 31.1-18.8h622.4c13 0 25 7.2 31.1 18.8l81.7 155.8c12.2 23.4-4.7 51.4-31.1 51.4H673.4zM819.9 209.5c-1-1.8-2.1-3.7-3.2-5.5-9.8-16.6-31.1-22.2-47.8-12.6L648.5 261c-17 9.8-22.7 31.6-12.6 48.4 0.9 1.4 1.7 2.9 2.5 4.4 9.5 17 31.2 22.8 48 13L807 257.3c16.7-9.7 22.4-31 12.9-47.8zM375.4 261.1L255 191.6c-16.7-9.6-38-4-47.8 12.6-1.1 1.8-2.1 3.6-3.2 5.5-9.5 16.8-3.8 38.1 12.9 47.8L337.3 327c16.9 9.7 38.6 4 48-13.1 0.8-1.5 1.7-2.9 2.5-4.4 10.2-16.8 4.5-38.6-12.4-48.4zM512 239.3h2.5c19.5 0.3 35.5-15.5 35.5-35.1v-139c0-19.3-15.6-34.9-34.8-35.1h-6.4C489.6 30.3 474 46 474 65.2v139c0 19.5 15.9 35.4 35.5 35.1h2.5z">');
const RC = () => EC();
var DC = /* @__PURE__ */ U("<ul>"), FC = /* @__PURE__ */ U("<li>");
const L0 = (e) => (() => {
  var r = DC();
  return G(r, Y(We, {
    get when() {
      return e.loading;
    },
    get children() {
      return Y(Os, {});
    }
  }), null), G(r, Y(We, {
    get when() {
      var i;
      return ot(() => !e.loading && !e.children)() && !((i = e.dataSource) != null && i.length);
    },
    get children() {
      return Y(RC, {});
    }
  }), null), G(r, Y(We, {
    get when() {
      return e.children;
    },
    get children() {
      return e.children;
    }
  }), null), G(r, Y(We, {
    get when() {
      return !e.children;
    },
    get children() {
      var i;
      return (i = e.dataSource) == null ? void 0 : i.map((o) => {
        var s;
        return ((s = e.renderItem) == null ? void 0 : s.call(e, o)) ?? FC();
      });
    }
  }), null), ze((i) => {
    var o = e.style, s = `klinecharts-pro-list ${e.class ?? ""}`;
    return i.e = en(r, o, i.e), s !== i.t && Ln(r, i.t = s), i;
  }, {
    e: void 0,
    t: void 0
  }), r;
})();
var zC = /* @__PURE__ */ U('<div class=klinecharts-pro-modal><div class=inner><div class=title-container><svg class=close-icon viewBox="0 0 1024 1024"><path d="M934.184927 199.723787 622.457206 511.452531l311.727721 311.703161c14.334473 14.229073 23.069415 33.951253 23.069415 55.743582 0 43.430138-35.178197 78.660524-78.735226 78.660524-21.664416 0-41.361013-8.865925-55.642275-23.069415L511.149121 622.838388 199.420377 934.490384c-14.204513 14.20349-33.901111 23.069415-55.642275 23.069415-43.482327 0-78.737272-35.230386-78.737272-78.660524 0-21.792329 8.864902-41.513486 23.094998-55.743582l311.677579-311.703161L88.135828 199.723787c-14.230096-14.255679-23.094998-33.92567-23.094998-55.642275 0-43.430138 35.254945-78.762855 78.737272-78.762855 21.741163 0 41.437761 8.813736 55.642275 23.069415l311.727721 311.727721L822.876842 88.389096c14.281261-14.255679 33.977859-23.069415 55.642275-23.069415 43.557028 0 78.735226 35.332716 78.735226 78.762855C957.254342 165.798117 948.5194 185.468109 934.184927 199.723787"></path></svg></div><div class=content-container>'), NC = /* @__PURE__ */ U("<div class=button-container>");
const e1 = (e) => {
  const r = (i) => {
    var o;
    i.target && i.target.classList.contains("klinecharts-pro-modal") && ((o = e.onClose) == null || o.call(e));
  };
  return (() => {
    var i = zC(), o = i.firstChild, s = o.firstChild, c = s.firstChild, u = s.nextSibling;
    return i.$$click = r, G(s, () => e.title, c), En(c, "click", e.onClose, !0), G(u, () => e.children), G(o, (() => {
      var f = ot(() => !!(e.buttons && e.buttons.length > 0));
      return () => f() && (() => {
        var g = NC();
        return G(g, () => e.buttons.map((m) => Y($C, as(m, {
          get children() {
            return m.children;
          }
        })))), g;
      })();
    })(), null), i;
  })();
};
At(["click"]);
var UC = /* @__PURE__ */ U("<div tabindex=0><div class=selector-container><span class=value></span><i class=arrow>"), KC = /* @__PURE__ */ U("<div class=drop-down-container><ul>"), ZC = /* @__PURE__ */ U("<li>");
const Jo = (e) => {
  const [r, i] = E(!1);
  return (() => {
    var o = UC(), s = o.firstChild, c = s.firstChild;
    return o.addEventListener("blur", (u) => {
      i(!1);
    }), o.$$click = (u) => {
      i((f) => !f);
    }, G(c, () => e.value), G(o, (() => {
      var u = ot(() => !!(e.dataSource && e.dataSource.length > 0));
      return () => u() && (() => {
        var f = KC(), g = f.firstChild;
        return G(g, () => e.dataSource.map((m) => {
          const b = m[e.valueKey ?? "text"] ?? m;
          return (() => {
            var _ = ZC();
            return _.$$click = (x) => {
              var k;
              x.stopPropagation(), e.value !== b && ((k = e.onSelected) == null || k.call(e, m)), i(!1);
            }, G(_, b), _;
          })();
        })), f;
      })();
    })(), null), ze((u) => {
      var f = e.style, g = `klinecharts-pro-select ${e.class ?? ""} ${r() ? "klinecharts-pro-select-show" : ""}`;
      return u.e = en(o, f, u.e), g !== u.t && Ln(o, u.t = g), u;
    }, {
      e: void 0,
      t: void 0
    }), o;
  })();
};
At(["click"]);
var WC = /* @__PURE__ */ U("<span class=prefix>"), QC = /* @__PURE__ */ U("<span class=suffix>"), HC = /* @__PURE__ */ U("<div><input id=myInput class=value>");
const [YC, iO] = E("klinecharts-pro-input klinecharts-pro-timeframe-modal-input"), fr = (e) => {
  const r = as({
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER
  }, e);
  let i;
  const [o, s] = E("normal"), c = (u) => {
    u && u.focus();
  };
  return mn(() => {
    c(document.querySelector("#myInput"));
  }), (() => {
    var u = HC(), f = u.firstChild;
    u.$$click = () => {
      i == null || i.focus();
    }, G(u, Y(We, {
      get when() {
        return r.prefix;
      },
      get children() {
        var m = WC();
        return G(m, () => r.prefix), m;
      }
    }), f), En(f, "keydown", r.onKeyDown, !0), f.addEventListener("change", (m) => {
      var b, _;
      const C = m.target.value;
      if ("precision" in r) {
        let x;
        const k = Math.max(0, Math.floor(r.precision));
        k <= 0 ? x = new RegExp(/^[1-9]\d*$/) : x = new RegExp("^\\d+\\.?\\d{0," + k + "}$"), (C === "" || x.test(C) && +C >= r.min && +C <= r.max) && ((b = r.onChange) == null || b.call(r, C === "" ? C : +C));
      } else
        (_ = r.onChange) == null || _.call(r, C);
    }), f.addEventListener("blur", () => {
      s("normal");
    }), f.addEventListener("focus", () => {
      s("focus");
    });
    var g = i;
    return typeof g == "function" ? zo(g, f) : i = f, G(u, Y(We, {
      get when() {
        return r.suffix;
      },
      get children() {
        var m = QC();
        return G(m, () => r.suffix), m;
      }
    }), null), ze((m) => {
      var C = r.style, b = `${YC()}${r.class ?? ""}`, _ = o(), x = r.placeholder ?? "", k = r.focus === !0 ? r.focus : !1;
      return m.e = en(u, C, m.e), b !== m.t && Ln(u, m.t = b), _ !== m.a && pt(u, "data-status", m.a = _), x !== m.o && pt(f, "placeholder", m.o = x), k !== m.i && (f.autofocus = m.i = k), m;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0
    }), ze(() => f.value = r.value), u;
  })();
};
At(["click", "keydown"]);
var GC = /* @__PURE__ */ U("<div><i class=thumb>");
const jC = (e) => (() => {
  var r = GC();
  return r.$$click = (i) => {
    e.onChange && e.onChange();
  }, ze((i) => {
    var o = e.style, s = `klinecharts-pro-switch ${e.open ? "turn-on" : "turn-off"} ${e.class ?? ""}`;
    return i.e = en(r, o, i.e), s !== i.t && Ln(r, i.t = s), i;
  }, {
    e: void 0,
    t: void 0
  }), r;
})();
At(["click"]);
const { min: VC, max: qC } = Math, Xn = (e, r = 0, i = 1) => VC(qC(r, e), i), e9 = (e) => {
  e._clipped = !1, e._unclipped = e.slice(0);
  for (let r = 0; r <= 3; r++)
    r < 3 ? ((e[r] < 0 || e[r] > 255) && (e._clipped = !0), e[r] = Xn(e[r], 0, 255)) : r === 3 && (e[r] = Xn(e[r], 0, 1));
  return e;
}, Ps = {};
for (let e of [
  "Boolean",
  "Number",
  "String",
  "Function",
  "Array",
  "Date",
  "RegExp",
  "Undefined",
  "Null"
])
  Ps[`[object ${e}]`] = e.toLowerCase();
function ve(e) {
  return Ps[Object.prototype.toString.call(e)] || "object";
}
const he = (e, r = null) => e.length >= 3 ? Array.prototype.slice.call(e) : ve(e[0]) == "object" && r ? r.split("").filter((i) => e[0][i] !== void 0).map((i) => e[0][i]) : e[0].slice(0), E1 = (e) => {
  if (e.length < 2)
    return null;
  const r = e.length - 1;
  return ve(e[r]) == "string" ? e[r].toLowerCase() : null;
}, { PI: R0, min: Bs, max: Es } = Math, Ft = (e) => Math.round(e * 100) / 100, Eo = (e) => Math.round(e * 100) / 100, pn = R0 * 2, uo = R0 / 3, XC = R0 / 180, JC = 180 / R0;
function Rs(e) {
  return [...e.slice(0, 3).reverse(), ...e.slice(3)];
}
const de = {
  format: {},
  autodetect: []
};
let z = class {
  constructor(...r) {
    const i = this;
    if (ve(r[0]) === "object" && r[0].constructor && r[0].constructor === this.constructor)
      return r[0];
    let o = E1(r), s = !1;
    if (!o) {
      s = !0, de.sorted || (de.autodetect = de.autodetect.sort((c, u) => u.p - c.p), de.sorted = !0);
      for (let c of de.autodetect)
        if (o = c.test(...r), o)
          break;
    }
    if (de.format[o]) {
      const c = de.format[o].apply(
        null,
        s ? r : r.slice(0, -1)
      );
      i._rgb = e9(c);
    } else
      throw new Error("unknown format: " + r);
    i._rgb.length === 3 && i._rgb.push(1);
  }
  toString() {
    return ve(this.hex) == "function" ? this.hex() : `[${this._rgb.join(",")}]`;
  }
};
const ex = "3.1.2", Ce = (...e) => new z(...e);
Ce.version = ex;
const S1 = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  laserlemon: "#ffff54",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrod: "#fafad2",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  maroon2: "#7f0000",
  maroon3: "#b03060",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  purple2: "#7f007f",
  purple3: "#a020f0",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32"
}, tx = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, nx = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/, Ds = (e) => {
  if (e.match(tx)) {
    (e.length === 4 || e.length === 7) && (e = e.substr(1)), e.length === 3 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]);
    const r = parseInt(e, 16), i = r >> 16, o = r >> 8 & 255, s = r & 255;
    return [i, o, s, 1];
  }
  if (e.match(nx)) {
    (e.length === 5 || e.length === 9) && (e = e.substr(1)), e.length === 4 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2] + e[3] + e[3]);
    const r = parseInt(e, 16), i = r >> 24 & 255, o = r >> 16 & 255, s = r >> 8 & 255, c = Math.round((r & 255) / 255 * 100) / 100;
    return [i, o, s, c];
  }
  throw new Error(`unknown hex color: ${e}`);
}, { round: a0 } = Math, Fs = (...e) => {
  let [r, i, o, s] = he(e, "rgba"), c = E1(e) || "auto";
  s === void 0 && (s = 1), c === "auto" && (c = s < 1 ? "rgba" : "rgb"), r = a0(r), i = a0(i), o = a0(o);
  let f = "000000" + (r << 16 | i << 8 | o).toString(16);
  f = f.substr(f.length - 6);
  let g = "0" + a0(s * 255).toString(16);
  switch (g = g.substr(g.length - 2), c.toLowerCase()) {
    case "rgba":
      return `#${f}${g}`;
    case "argb":
      return `#${g}${f}`;
    default:
      return `#${f}`;
  }
};
z.prototype.name = function() {
  const e = Fs(this._rgb, "rgb");
  for (let r of Object.keys(S1))
    if (S1[r] === e)
      return r.toLowerCase();
  return e;
};
de.format.named = (e) => {
  if (e = e.toLowerCase(), S1[e])
    return Ds(S1[e]);
  throw new Error("unknown color name: " + e);
};
de.autodetect.push({
  p: 5,
  test: (e, ...r) => {
    if (!r.length && ve(e) === "string" && S1[e.toLowerCase()])
      return "named";
  }
});
z.prototype.alpha = function(e, r = !1) {
  return e !== void 0 && ve(e) === "number" ? r ? (this._rgb[3] = e, this) : new z([this._rgb[0], this._rgb[1], this._rgb[2], e], "rgb") : this._rgb[3];
};
z.prototype.clipped = function() {
  return this._rgb._clipped || !1;
};
const tn = {
  // Corresponds roughly to RGB brighter/darker
  Kn: 18,
  // D65 standard referent
  labWhitePoint: "d65",
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,
  t0: 0.137931034,
  // 4 / 29
  t1: 0.206896552,
  // 6 / 29
  t2: 0.12841855,
  // 3 * t1 * t1
  t3: 8856452e-9,
  // t1 * t1 * t1,
  kE: 216 / 24389,
  kKE: 8,
  kK: 24389 / 27,
  RefWhiteRGB: {
    // sRGB
    X: 0.95047,
    Y: 1,
    Z: 1.08883
  },
  MtxRGB2XYZ: {
    m00: 0.4124564390896922,
    m01: 0.21267285140562253,
    m02: 0.0193338955823293,
    m10: 0.357576077643909,
    m11: 0.715152155287818,
    m12: 0.11919202588130297,
    m20: 0.18043748326639894,
    m21: 0.07217499330655958,
    m22: 0.9503040785363679
  },
  MtxXYZ2RGB: {
    m00: 3.2404541621141045,
    m01: -0.9692660305051868,
    m02: 0.055643430959114726,
    m10: -1.5371385127977166,
    m11: 1.8760108454466942,
    m12: -0.2040259135167538,
    m20: -0.498531409556016,
    m21: 0.041556017530349834,
    m22: 1.0572251882231791
  },
  // used in rgb2xyz
  As: 0.9414285350000001,
  Bs: 1.040417467,
  Cs: 1.089532651,
  MtxAdaptMa: {
    m00: 0.8951,
    m01: -0.7502,
    m02: 0.0389,
    m10: 0.2664,
    m11: 1.7135,
    m12: -0.0685,
    m20: -0.1614,
    m21: 0.0367,
    m22: 1.0296
  },
  MtxAdaptMaI: {
    m00: 0.9869929054667123,
    m01: 0.43230526972339456,
    m02: -0.008528664575177328,
    m10: -0.14705425642099013,
    m11: 0.5183602715367776,
    m12: 0.04004282165408487,
    m20: 0.15996265166373125,
    m21: 0.0492912282128556,
    m22: 0.9684866957875502
  }
}, rx = /* @__PURE__ */ new Map([
  // ASTM E308-01
  ["a", [1.0985, 0.35585]],
  // Wyszecki & Stiles, p. 769
  ["b", [1.0985, 0.35585]],
  // C ASTM E308-01
  ["c", [0.98074, 1.18232]],
  // D50 (ASTM E308-01)
  ["d50", [0.96422, 0.82521]],
  // D55 (ASTM E308-01)
  ["d55", [0.95682, 0.92149]],
  // D65 (ASTM E308-01)
  ["d65", [0.95047, 1.08883]],
  // E (ASTM E308-01)
  ["e", [1, 1, 1]],
  // F2 (ASTM E308-01)
  ["f2", [0.99186, 0.67393]],
  // F7 (ASTM E308-01)
  ["f7", [0.95041, 1.08747]],
  // F11 (ASTM E308-01)
  ["f11", [1.00962, 0.6435]],
  ["icc", [0.96422, 0.82521]]
]);
function vn(e) {
  const r = rx.get(String(e).toLowerCase());
  if (!r)
    throw new Error("unknown Lab illuminant " + e);
  tn.labWhitePoint = e, tn.Xn = r[0], tn.Zn = r[1];
}
function hr() {
  return tn.labWhitePoint;
}
const t9 = (...e) => {
  e = he(e, "lab");
  const [r, i, o] = e, [s, c, u] = ix(r, i, o), [f, g, m] = zs(s, c, u);
  return [f, g, m, e.length > 3 ? e[3] : 1];
}, ix = (e, r, i) => {
  const { kE: o, kK: s, kKE: c, Xn: u, Yn: f, Zn: g } = tn, m = (e + 16) / 116, C = 2e-3 * r + m, b = m - 5e-3 * i, _ = C * C * C, x = b * b * b, k = _ > o ? _ : (116 * C - 16) / s, T = e > c ? Math.pow((e + 16) / 116, 3) : e / s, $ = x > o ? x : (116 * b - 16) / s, A = k * u, F = T * f, Z = $ * g;
  return [A, F, Z];
}, fo = (e) => {
  const r = Math.sign(e);
  return e = Math.abs(e), (e <= 31308e-7 ? e * 12.92 : 1.055 * Math.pow(e, 1 / 2.4) - 0.055) * r;
}, zs = (e, r, i) => {
  const { MtxAdaptMa: o, MtxAdaptMaI: s, MtxXYZ2RGB: c, RefWhiteRGB: u, Xn: f, Yn: g, Zn: m } = tn, C = f * o.m00 + g * o.m10 + m * o.m20, b = f * o.m01 + g * o.m11 + m * o.m21, _ = f * o.m02 + g * o.m12 + m * o.m22, x = u.X * o.m00 + u.Y * o.m10 + u.Z * o.m20, k = u.X * o.m01 + u.Y * o.m11 + u.Z * o.m21, T = u.X * o.m02 + u.Y * o.m12 + u.Z * o.m22, $ = (e * o.m00 + r * o.m10 + i * o.m20) * (x / C), A = (e * o.m01 + r * o.m11 + i * o.m21) * (k / b), F = (e * o.m02 + r * o.m12 + i * o.m22) * (T / _), Z = $ * s.m00 + A * s.m10 + F * s.m20, N = $ * s.m01 + A * s.m11 + F * s.m21, V = $ * s.m02 + A * s.m12 + F * s.m22, Q = fo(
    Z * c.m00 + N * c.m10 + V * c.m20
  ), I = fo(
    Z * c.m01 + N * c.m11 + V * c.m21
  ), q = fo(
    Z * c.m02 + N * c.m12 + V * c.m22
  );
  return [Q * 255, I * 255, q * 255];
}, n9 = (...e) => {
  const [r, i, o, ...s] = he(e, "rgb"), [c, u, f] = Ns(r, i, o), [g, m, C] = ox(c, u, f);
  return [g, m, C, ...s.length > 0 && s[0] < 1 ? [s[0]] : []];
};
function ox(e, r, i) {
  const { Xn: o, Yn: s, Zn: c, kE: u, kK: f } = tn, g = e / o, m = r / s, C = i / c, b = g > u ? Math.pow(g, 1 / 3) : (f * g + 16) / 116, _ = m > u ? Math.pow(m, 1 / 3) : (f * m + 16) / 116, x = C > u ? Math.pow(C, 1 / 3) : (f * C + 16) / 116;
  return [116 * _ - 16, 500 * (b - _), 200 * (_ - x)];
}
function ho(e) {
  const r = Math.sign(e);
  return e = Math.abs(e), (e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4)) * r;
}
const Ns = (e, r, i) => {
  e = ho(e / 255), r = ho(r / 255), i = ho(i / 255);
  const { MtxRGB2XYZ: o, MtxAdaptMa: s, MtxAdaptMaI: c, Xn: u, Yn: f, Zn: g, As: m, Bs: C, Cs: b } = tn;
  let _ = e * o.m00 + r * o.m10 + i * o.m20, x = e * o.m01 + r * o.m11 + i * o.m21, k = e * o.m02 + r * o.m12 + i * o.m22;
  const T = u * s.m00 + f * s.m10 + g * s.m20, $ = u * s.m01 + f * s.m11 + g * s.m21, A = u * s.m02 + f * s.m12 + g * s.m22;
  let F = _ * s.m00 + x * s.m10 + k * s.m20, Z = _ * s.m01 + x * s.m11 + k * s.m21, N = _ * s.m02 + x * s.m12 + k * s.m22;
  return F *= T / m, Z *= $ / C, N *= A / b, _ = F * c.m00 + Z * c.m10 + N * c.m20, x = F * c.m01 + Z * c.m11 + N * c.m21, k = F * c.m02 + Z * c.m12 + N * c.m22, [_, x, k];
};
z.prototype.lab = function() {
  return n9(this._rgb);
};
const ax = (...e) => new z(...e, "lab");
Object.assign(Ce, { lab: ax, getLabWhitePoint: hr, setLabWhitePoint: vn });
de.format.lab = t9;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "lab"), ve(e) === "array" && e.length === 3)
      return "lab";
  }
});
z.prototype.darken = function(e = 1) {
  const r = this, i = r.lab();
  return i[0] -= tn.Kn * e, new z(i, "lab").alpha(r.alpha(), !0);
};
z.prototype.brighten = function(e = 1) {
  return this.darken(-e);
};
z.prototype.darker = z.prototype.darken;
z.prototype.brighter = z.prototype.brighten;
z.prototype.get = function(e) {
  const [r, i] = e.split("."), o = this[r]();
  if (i) {
    const s = r.indexOf(i) - (r.substr(0, 2) === "ok" ? 2 : 0);
    if (s > -1)
      return o[s];
    throw new Error(`unknown channel ${i} in mode ${r}`);
  } else
    return o;
};
const { pow: sx } = Math, lx = 1e-7, cx = 20;
z.prototype.luminance = function(e, r = "rgb") {
  if (e !== void 0 && ve(e) === "number") {
    if (e === 0)
      return new z([0, 0, 0, this._rgb[3]], "rgb");
    if (e === 1)
      return new z([255, 255, 255, this._rgb[3]], "rgb");
    let i = this.luminance(), o = cx;
    const s = (u, f) => {
      const g = u.interpolate(f, 0.5, r), m = g.luminance();
      return Math.abs(e - m) < lx || !o-- ? g : m > e ? s(u, g) : s(g, f);
    }, c = (i > e ? s(new z([0, 0, 0]), this) : s(this, new z([255, 255, 255]))).rgb();
    return new z([...c, this._rgb[3]]);
  }
  return ux(...this._rgb.slice(0, 3));
};
const ux = (e, r, i) => (e = go(e), r = go(r), i = go(i), 0.2126 * e + 0.7152 * r + 0.0722 * i), go = (e) => (e /= 255, e <= 0.03928 ? e / 12.92 : sx((e + 0.055) / 1.055, 2.4)), at = {}, w1 = (e, r, i = 0.5, ...o) => {
  let s = o[0] || "lrgb";
  if (!at[s] && !o.length && (s = Object.keys(at)[0]), !at[s])
    throw new Error(`interpolation mode ${s} is not defined`);
  return ve(e) !== "object" && (e = new z(e)), ve(r) !== "object" && (r = new z(r)), at[s](e, r, i).alpha(
    e.alpha() + i * (r.alpha() - e.alpha())
  );
};
z.prototype.mix = z.prototype.interpolate = function(e, r = 0.5, ...i) {
  return w1(this, e, r, ...i);
};
z.prototype.premultiply = function(e = !1) {
  const r = this._rgb, i = r[3];
  return e ? (this._rgb = [r[0] * i, r[1] * i, r[2] * i, i], this) : new z([r[0] * i, r[1] * i, r[2] * i, i], "rgb");
};
const { sin: fx, cos: dx } = Math, Us = (...e) => {
  let [r, i, o] = he(e, "lch");
  return isNaN(o) && (o = 0), o = o * XC, [r, dx(o) * i, fx(o) * i];
}, r9 = (...e) => {
  e = he(e, "lch");
  const [r, i, o] = e, [s, c, u] = Us(r, i, o), [f, g, m] = t9(s, c, u);
  return [f, g, m, e.length > 3 ? e[3] : 1];
}, hx = (...e) => {
  const r = Rs(he(e, "hcl"));
  return r9(...r);
}, { sqrt: gx, atan2: px, round: yx } = Math, Ks = (...e) => {
  const [r, i, o] = he(e, "lab"), s = gx(i * i + o * o);
  let c = (px(o, i) * JC + 360) % 360;
  return yx(s * 1e4) === 0 && (c = Number.NaN), [r, s, c];
}, i9 = (...e) => {
  const [r, i, o, ...s] = he(e, "rgb"), [c, u, f] = n9(r, i, o), [g, m, C] = Ks(c, u, f);
  return [g, m, C, ...s.length > 0 && s[0] < 1 ? [s[0]] : []];
};
z.prototype.lch = function() {
  return i9(this._rgb);
};
z.prototype.hcl = function() {
  return Rs(i9(this._rgb));
};
const mx = (...e) => new z(...e, "lch"), bx = (...e) => new z(...e, "hcl");
Object.assign(Ce, { lch: mx, hcl: bx });
de.format.lch = r9;
de.format.hcl = hx;
["lch", "hcl"].forEach(
  (e) => de.autodetect.push({
    p: 2,
    test: (...r) => {
      if (r = he(r, e), ve(r) === "array" && r.length === 3)
        return e;
    }
  })
);
z.prototype.saturate = function(e = 1) {
  const r = this, i = r.lch();
  return i[1] += tn.Kn * e, i[1] < 0 && (i[1] = 0), new z(i, "lch").alpha(r.alpha(), !0);
};
z.prototype.desaturate = function(e = 1) {
  return this.saturate(-e);
};
z.prototype.set = function(e, r, i = !1) {
  const [o, s] = e.split("."), c = this[o]();
  if (s) {
    const u = o.indexOf(s) - (o.substr(0, 2) === "ok" ? 2 : 0);
    if (u > -1) {
      if (ve(r) == "string")
        switch (r.charAt(0)) {
          case "+":
            c[u] += +r;
            break;
          case "-":
            c[u] += +r;
            break;
          case "*":
            c[u] *= +r.substr(1);
            break;
          case "/":
            c[u] /= +r.substr(1);
            break;
          default:
            c[u] = +r;
        }
      else if (ve(r) === "number")
        c[u] = r;
      else
        throw new Error("unsupported value for Color.set");
      const f = new z(c, o);
      return i ? (this._rgb = f._rgb, this) : f;
    }
    throw new Error(`unknown channel ${s} in mode ${o}`);
  } else
    return c;
};
z.prototype.tint = function(e = 0.5, ...r) {
  return w1(this, "white", e, ...r);
};
z.prototype.shade = function(e = 0.5, ...r) {
  return w1(this, "black", e, ...r);
};
const vx = (e, r, i) => {
  const o = e._rgb, s = r._rgb;
  return new z(
    o[0] + i * (s[0] - o[0]),
    o[1] + i * (s[1] - o[1]),
    o[2] + i * (s[2] - o[2]),
    "rgb"
  );
};
at.rgb = vx;
const { sqrt: po, pow: b1 } = Math, _x = (e, r, i) => {
  const [o, s, c] = e._rgb, [u, f, g] = r._rgb;
  return new z(
    po(b1(o, 2) * (1 - i) + b1(u, 2) * i),
    po(b1(s, 2) * (1 - i) + b1(f, 2) * i),
    po(b1(c, 2) * (1 - i) + b1(g, 2) * i),
    "rgb"
  );
};
at.lrgb = _x;
const Cx = (e, r, i) => {
  const o = e.lab(), s = r.lab();
  return new z(
    o[0] + i * (s[0] - o[0]),
    o[1] + i * (s[1] - o[1]),
    o[2] + i * (s[2] - o[2]),
    "lab"
  );
};
at.lab = Cx;
const R1 = (e, r, i, o) => {
  let s, c;
  o === "hsl" ? (s = e.hsl(), c = r.hsl()) : o === "hsv" ? (s = e.hsv(), c = r.hsv()) : o === "hcg" ? (s = e.hcg(), c = r.hcg()) : o === "hsi" ? (s = e.hsi(), c = r.hsi()) : o === "lch" || o === "hcl" ? (o = "hcl", s = e.hcl(), c = r.hcl()) : o === "oklch" && (s = e.oklch().reverse(), c = r.oklch().reverse());
  let u, f, g, m, C, b;
  (o.substr(0, 1) === "h" || o === "oklch") && ([u, g, C] = s, [f, m, b] = c);
  let _, x, k, T;
  return !isNaN(u) && !isNaN(f) ? (f > u && f - u > 180 ? T = f - (u + 360) : f < u && u - f > 180 ? T = f + 360 - u : T = f - u, x = u + i * T) : isNaN(u) ? isNaN(f) ? x = Number.NaN : (x = f, (C == 1 || C == 0) && o != "hsv" && (_ = m)) : (x = u, (b == 1 || b == 0) && o != "hsv" && (_ = g)), _ === void 0 && (_ = g + i * (m - g)), k = C + i * (b - C), o === "oklch" ? new z([k, _, x], o) : new z([x, _, k], o);
}, Zs = (e, r, i) => R1(e, r, i, "lch");
at.lch = Zs;
at.hcl = Zs;
const xx = (e) => {
  if (ve(e) == "number" && e >= 0 && e <= 16777215) {
    const r = e >> 16, i = e >> 8 & 255, o = e & 255;
    return [r, i, o, 1];
  }
  throw new Error("unknown num color: " + e);
}, Lx = (...e) => {
  const [r, i, o] = he(e, "rgb");
  return (r << 16) + (i << 8) + o;
};
z.prototype.num = function() {
  return Lx(this._rgb);
};
const Sx = (...e) => new z(...e, "num");
Object.assign(Ce, { num: Sx });
de.format.num = xx;
de.autodetect.push({
  p: 5,
  test: (...e) => {
    if (e.length === 1 && ve(e[0]) === "number" && e[0] >= 0 && e[0] <= 16777215)
      return "num";
  }
});
const wx = (e, r, i) => {
  const o = e.num(), s = r.num();
  return new z(o + i * (s - o), "num");
};
at.num = wx;
const { floor: kx } = Math, $x = (...e) => {
  e = he(e, "hcg");
  let [r, i, o] = e, s, c, u;
  o = o * 255;
  const f = i * 255;
  if (i === 0)
    s = c = u = o;
  else {
    r === 360 && (r = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 60;
    const g = kx(r), m = r - g, C = o * (1 - i), b = C + f * (1 - m), _ = C + f * m, x = C + f;
    switch (g) {
      case 0:
        [s, c, u] = [x, _, C];
        break;
      case 1:
        [s, c, u] = [b, x, C];
        break;
      case 2:
        [s, c, u] = [C, x, _];
        break;
      case 3:
        [s, c, u] = [C, b, x];
        break;
      case 4:
        [s, c, u] = [_, C, x];
        break;
      case 5:
        [s, c, u] = [x, C, b];
        break;
    }
  }
  return [s, c, u, e.length > 3 ? e[3] : 1];
}, Ax = (...e) => {
  const [r, i, o] = he(e, "rgb"), s = Bs(r, i, o), c = Es(r, i, o), u = c - s, f = u * 100 / 255, g = s / (255 - u) * 100;
  let m;
  return u === 0 ? m = Number.NaN : (r === c && (m = (i - o) / u), i === c && (m = 2 + (o - r) / u), o === c && (m = 4 + (r - i) / u), m *= 60, m < 0 && (m += 360)), [m, f, g];
};
z.prototype.hcg = function() {
  return Ax(this._rgb);
};
const Mx = (...e) => new z(...e, "hcg");
Ce.hcg = Mx;
de.format.hcg = $x;
de.autodetect.push({
  p: 1,
  test: (...e) => {
    if (e = he(e, "hcg"), ve(e) === "array" && e.length === 3)
      return "hcg";
  }
});
const Tx = (e, r, i) => R1(e, r, i, "hcg");
at.hcg = Tx;
const { cos: v1 } = Math, Ix = (...e) => {
  e = he(e, "hsi");
  let [r, i, o] = e, s, c, u;
  return isNaN(r) && (r = 0), isNaN(i) && (i = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 360, r < 1 / 3 ? (u = (1 - i) / 3, s = (1 + i * v1(pn * r) / v1(uo - pn * r)) / 3, c = 1 - (u + s)) : r < 2 / 3 ? (r -= 1 / 3, s = (1 - i) / 3, c = (1 + i * v1(pn * r) / v1(uo - pn * r)) / 3, u = 1 - (s + c)) : (r -= 2 / 3, c = (1 - i) / 3, u = (1 + i * v1(pn * r) / v1(uo - pn * r)) / 3, s = 1 - (c + u)), s = Xn(o * s * 3), c = Xn(o * c * 3), u = Xn(o * u * 3), [s * 255, c * 255, u * 255, e.length > 3 ? e[3] : 1];
}, { min: Ox, sqrt: Px, acos: Bx } = Math, Ex = (...e) => {
  let [r, i, o] = he(e, "rgb");
  r /= 255, i /= 255, o /= 255;
  let s;
  const c = Ox(r, i, o), u = (r + i + o) / 3, f = u > 0 ? 1 - c / u : 0;
  return f === 0 ? s = NaN : (s = (r - i + (r - o)) / 2, s /= Px((r - i) * (r - i) + (r - o) * (i - o)), s = Bx(s), o > i && (s = pn - s), s /= pn), [s * 360, f, u];
};
z.prototype.hsi = function() {
  return Ex(this._rgb);
};
const Rx = (...e) => new z(...e, "hsi");
Ce.hsi = Rx;
de.format.hsi = Ix;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "hsi"), ve(e) === "array" && e.length === 3)
      return "hsi";
  }
});
const Dx = (e, r, i) => R1(e, r, i, "hsi");
at.hsi = Dx;
const Ro = (...e) => {
  e = he(e, "hsl");
  const [r, i, o] = e;
  let s, c, u;
  if (i === 0)
    s = c = u = o * 255;
  else {
    const f = [0, 0, 0], g = [0, 0, 0], m = o < 0.5 ? o * (1 + i) : o + i - o * i, C = 2 * o - m, b = r / 360;
    f[0] = b + 1 / 3, f[1] = b, f[2] = b - 1 / 3;
    for (let _ = 0; _ < 3; _++)
      f[_] < 0 && (f[_] += 1), f[_] > 1 && (f[_] -= 1), 6 * f[_] < 1 ? g[_] = C + (m - C) * 6 * f[_] : 2 * f[_] < 1 ? g[_] = m : 3 * f[_] < 2 ? g[_] = C + (m - C) * (2 / 3 - f[_]) * 6 : g[_] = C;
    [s, c, u] = [g[0] * 255, g[1] * 255, g[2] * 255];
  }
  return e.length > 3 ? [s, c, u, e[3]] : [s, c, u, 1];
}, Ws = (...e) => {
  e = he(e, "rgba");
  let [r, i, o] = e;
  r /= 255, i /= 255, o /= 255;
  const s = Bs(r, i, o), c = Es(r, i, o), u = (c + s) / 2;
  let f, g;
  return c === s ? (f = 0, g = Number.NaN) : f = u < 0.5 ? (c - s) / (c + s) : (c - s) / (2 - c - s), r == c ? g = (i - o) / (c - s) : i == c ? g = 2 + (o - r) / (c - s) : o == c && (g = 4 + (r - i) / (c - s)), g *= 60, g < 0 && (g += 360), e.length > 3 && e[3] !== void 0 ? [g, f, u, e[3]] : [g, f, u];
};
z.prototype.hsl = function() {
  return Ws(this._rgb);
};
const Fx = (...e) => new z(...e, "hsl");
Ce.hsl = Fx;
de.format.hsl = Ro;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "hsl"), ve(e) === "array" && e.length === 3)
      return "hsl";
  }
});
const zx = (e, r, i) => R1(e, r, i, "hsl");
at.hsl = zx;
const { floor: Nx } = Math, Ux = (...e) => {
  e = he(e, "hsv");
  let [r, i, o] = e, s, c, u;
  if (o *= 255, i === 0)
    s = c = u = o;
  else {
    r === 360 && (r = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 60;
    const f = Nx(r), g = r - f, m = o * (1 - i), C = o * (1 - i * g), b = o * (1 - i * (1 - g));
    switch (f) {
      case 0:
        [s, c, u] = [o, b, m];
        break;
      case 1:
        [s, c, u] = [C, o, m];
        break;
      case 2:
        [s, c, u] = [m, o, b];
        break;
      case 3:
        [s, c, u] = [m, C, o];
        break;
      case 4:
        [s, c, u] = [b, m, o];
        break;
      case 5:
        [s, c, u] = [o, m, C];
        break;
    }
  }
  return [s, c, u, e.length > 3 ? e[3] : 1];
}, { min: Kx, max: Zx } = Math, Wx = (...e) => {
  e = he(e, "rgb");
  let [r, i, o] = e;
  const s = Kx(r, i, o), c = Zx(r, i, o), u = c - s;
  let f, g, m;
  return m = c / 255, c === 0 ? (f = Number.NaN, g = 0) : (g = u / c, r === c && (f = (i - o) / u), i === c && (f = 2 + (o - r) / u), o === c && (f = 4 + (r - i) / u), f *= 60, f < 0 && (f += 360)), [f, g, m];
};
z.prototype.hsv = function() {
  return Wx(this._rgb);
};
const Qx = (...e) => new z(...e, "hsv");
Ce.hsv = Qx;
de.format.hsv = Ux;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "hsv"), ve(e) === "array" && e.length === 3)
      return "hsv";
  }
});
const Hx = (e, r, i) => R1(e, r, i, "hsv");
at.hsv = Hx;
function S0(e, r) {
  let i = e.length;
  Array.isArray(e[0]) || (e = [e]), Array.isArray(r[0]) || (r = r.map((u) => [u]));
  let o = r[0].length, s = r[0].map((u, f) => r.map((g) => g[f])), c = e.map(
    (u) => s.map((f) => Array.isArray(u) ? u.reduce((g, m, C) => g + m * (f[C] || 0), 0) : f.reduce((g, m) => g + m * u, 0))
  );
  return i === 1 && (c = c[0]), o === 1 ? c.map((u) => u[0]) : c;
}
const o9 = (...e) => {
  e = he(e, "lab");
  const [r, i, o, ...s] = e, [c, u, f] = Yx([r, i, o]), [g, m, C] = zs(c, u, f);
  return [g, m, C, ...s.length > 0 && s[0] < 1 ? [s[0]] : []];
};
function Yx(e) {
  var r = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
  ], i = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092]
  ], o = S0(i, e);
  return S0(
    r,
    o.map((s) => s ** 3)
  );
}
const a9 = (...e) => {
  const [r, i, o, ...s] = he(e, "rgb"), c = Ns(r, i, o);
  return [...Gx(c), ...s.length > 0 && s[0] < 1 ? [s[0]] : []];
};
function Gx(e) {
  const r = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], i = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.42859224204858, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], o = S0(r, e);
  return S0(
    i,
    o.map((s) => Math.cbrt(s))
  );
}
z.prototype.oklab = function() {
  return a9(this._rgb);
};
const jx = (...e) => new z(...e, "oklab");
Object.assign(Ce, { oklab: jx });
de.format.oklab = o9;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "oklab"), ve(e) === "array" && e.length === 3)
      return "oklab";
  }
});
const Vx = (e, r, i) => {
  const o = e.oklab(), s = r.oklab();
  return new z(
    o[0] + i * (s[0] - o[0]),
    o[1] + i * (s[1] - o[1]),
    o[2] + i * (s[2] - o[2]),
    "oklab"
  );
};
at.oklab = Vx;
const qx = (e, r, i) => R1(e, r, i, "oklch");
at.oklch = qx;
const { pow: yo, sqrt: mo, PI: bo, cos: x2, sin: L2, atan2: Xx } = Math, Jx = (e, r = "lrgb", i = null) => {
  const o = e.length;
  i || (i = Array.from(new Array(o)).map(() => 1));
  const s = o / i.reduce(function(b, _) {
    return b + _;
  });
  if (i.forEach((b, _) => {
    i[_] *= s;
  }), e = e.map((b) => new z(b)), r === "lrgb")
    return eL(e, i);
  const c = e.shift(), u = c.get(r), f = [];
  let g = 0, m = 0;
  for (let b = 0; b < u.length; b++)
    if (u[b] = (u[b] || 0) * i[0], f.push(isNaN(u[b]) ? 0 : i[0]), r.charAt(b) === "h" && !isNaN(u[b])) {
      const _ = u[b] / 180 * bo;
      g += x2(_) * i[0], m += L2(_) * i[0];
    }
  let C = c.alpha() * i[0];
  e.forEach((b, _) => {
    const x = b.get(r);
    C += b.alpha() * i[_ + 1];
    for (let k = 0; k < u.length; k++)
      if (!isNaN(x[k]))
        if (f[k] += i[_ + 1], r.charAt(k) === "h") {
          const T = x[k] / 180 * bo;
          g += x2(T) * i[_ + 1], m += L2(T) * i[_ + 1];
        } else
          u[k] += x[k] * i[_ + 1];
  });
  for (let b = 0; b < u.length; b++)
    if (r.charAt(b) === "h") {
      let _ = Xx(m / f[b], g / f[b]) / bo * 180;
      for (; _ < 0; )
        _ += 360;
      for (; _ >= 360; )
        _ -= 360;
      u[b] = _;
    } else
      u[b] = u[b] / f[b];
  return C /= o, new z(u, r).alpha(C > 0.99999 ? 1 : C, !0);
}, eL = (e, r) => {
  const i = e.length, o = [0, 0, 0, 0];
  for (let s = 0; s < e.length; s++) {
    const c = e[s], u = r[s] / i, f = c._rgb;
    o[0] += yo(f[0], 2) * u, o[1] += yo(f[1], 2) * u, o[2] += yo(f[2], 2) * u, o[3] += f[3] * u;
  }
  return o[0] = mo(o[0]), o[1] = mo(o[1]), o[2] = mo(o[2]), o[3] > 0.9999999 && (o[3] = 1), new z(e9(o));
}, { pow: tL } = Math;
function w0(e) {
  let r = "rgb", i = Ce("#ccc"), o = 0, s = [0, 1], c = [], u = [0, 0], f = !1, g = [], m = !1, C = 0, b = 1, _ = !1, x = {}, k = !0, T = 1;
  const $ = function(I) {
    if (I = I || ["#fff", "#000"], I && ve(I) === "string" && Ce.brewer && Ce.brewer[I.toLowerCase()] && (I = Ce.brewer[I.toLowerCase()]), ve(I) === "array") {
      I.length === 1 && (I = [I[0], I[0]]), I = I.slice(0);
      for (let q = 0; q < I.length; q++)
        I[q] = Ce(I[q]);
      c.length = 0;
      for (let q = 0; q < I.length; q++)
        c.push(q / (I.length - 1));
    }
    return V(), g = I;
  }, A = function(I) {
    if (f != null) {
      const q = f.length - 1;
      let H = 0;
      for (; H < q && I >= f[H]; )
        H++;
      return H - 1;
    }
    return 0;
  };
  let F = (I) => I, Z = (I) => I;
  const N = function(I, q) {
    let H, W;
    if (q == null && (q = !1), isNaN(I) || I === null)
      return i;
    q ? W = I : f && f.length > 2 ? W = A(I) / (f.length - 2) : b !== C ? W = (I - C) / (b - C) : W = 1, W = Z(W), q || (W = F(W)), T !== 1 && (W = tL(W, T)), W = u[0] + W * (1 - u[0] - u[1]), W = Xn(W, 0, 1);
    const re = Math.floor(W * 1e4);
    if (k && x[re])
      H = x[re];
    else {
      if (ve(g) === "array")
        for (let K = 0; K < c.length; K++) {
          const X = c[K];
          if (W <= X) {
            H = g[K];
            break;
          }
          if (W >= X && K === c.length - 1) {
            H = g[K];
            break;
          }
          if (W > X && W < c[K + 1]) {
            W = (W - X) / (c[K + 1] - X), H = Ce.interpolate(
              g[K],
              g[K + 1],
              W,
              r
            );
            break;
          }
        }
      else
        ve(g) === "function" && (H = g(W));
      k && (x[re] = H);
    }
    return H;
  };
  var V = () => x = {};
  $(e);
  const Q = function(I) {
    const q = Ce(N(I));
    return m && q[m] ? q[m]() : q;
  };
  return Q.classes = function(I) {
    if (I != null) {
      if (ve(I) === "array")
        f = I, s = [I[0], I[I.length - 1]];
      else {
        const q = Ce.analyze(s);
        I === 0 ? f = [q.min, q.max] : f = Ce.limits(q, "e", I);
      }
      return Q;
    }
    return f;
  }, Q.domain = function(I) {
    if (!arguments.length)
      return s;
    C = I[0], b = I[I.length - 1], c = [];
    const q = g.length;
    if (I.length === q && C !== b)
      for (let H of Array.from(I))
        c.push((H - C) / (b - C));
    else {
      for (let H = 0; H < q; H++)
        c.push(H / (q - 1));
      if (I.length > 2) {
        const H = I.map((re, K) => K / (I.length - 1)), W = I.map((re) => (re - C) / (b - C));
        W.every((re, K) => H[K] === re) || (Z = (re) => {
          if (re <= 0 || re >= 1)
            return re;
          let K = 0;
          for (; re >= W[K + 1]; )
            K++;
          const X = (re - W[K]) / (W[K + 1] - W[K]);
          return H[K] + X * (H[K + 1] - H[K]);
        });
      }
    }
    return s = [C, b], Q;
  }, Q.mode = function(I) {
    return arguments.length ? (r = I, V(), Q) : r;
  }, Q.range = function(I, q) {
    return $(I), Q;
  }, Q.out = function(I) {
    return m = I, Q;
  }, Q.spread = function(I) {
    return arguments.length ? (o = I, Q) : o;
  }, Q.correctLightness = function(I) {
    return I == null && (I = !0), _ = I, V(), _ ? F = function(q) {
      const H = N(0, !0).lab()[0], W = N(1, !0).lab()[0], re = H > W;
      let K = N(q, !0).lab()[0];
      const X = H + (W - H) * q;
      let R = K - X, te = 0, le = 1, ie = 20;
      for (; Math.abs(R) > 0.01 && ie-- > 0; )
        (function() {
          return re && (R *= -1), R < 0 ? (te = q, q += (le - q) * 0.5) : (le = q, q += (te - q) * 0.5), K = N(q, !0).lab()[0], R = K - X;
        })();
      return q;
    } : F = (q) => q, Q;
  }, Q.padding = function(I) {
    return I != null ? (ve(I) === "number" && (I = [I, I]), u = I, Q) : u;
  }, Q.colors = function(I, q) {
    arguments.length < 2 && (q = "hex");
    let H = [];
    if (arguments.length === 0)
      H = g.slice(0);
    else if (I === 1)
      H = [Q(0.5)];
    else if (I > 1) {
      const W = s[0], re = s[1] - W;
      H = nL(0, I, !1).map(
        (K) => Q(W + K / (I - 1) * re)
      );
    } else {
      e = [];
      let W = [];
      if (f && f.length > 2)
        for (let re = 1, K = f.length, X = 1 <= K; X ? re < K : re > K; X ? re++ : re--)
          W.push((f[re - 1] + f[re]) * 0.5);
      else
        W = s;
      H = W.map((re) => Q(re));
    }
    return Ce[q] && (H = H.map((W) => W[q]())), H;
  }, Q.cache = function(I) {
    return I != null ? (k = I, Q) : k;
  }, Q.gamma = function(I) {
    return I != null ? (T = I, Q) : T;
  }, Q.nodata = function(I) {
    return I != null ? (i = Ce(I), Q) : i;
  }, Q;
}
function nL(e, r, i) {
  let o = [], s = e < r, c = i ? s ? r + 1 : r - 1 : r;
  for (let u = e; s ? u < c : u > c; s ? u++ : u--)
    o.push(u);
  return o;
}
const rL = function(e) {
  let r = [1, 1];
  for (let i = 1; i < e; i++) {
    let o = [1];
    for (let s = 1; s <= r.length; s++)
      o[s] = (r[s] || 0) + r[s - 1];
    r = o;
  }
  return r;
}, iL = function(e) {
  let r, i, o, s;
  if (e = e.map((c) => new z(c)), e.length === 2)
    [i, o] = e.map((c) => c.lab()), r = function(c) {
      const u = [0, 1, 2].map((f) => i[f] + c * (o[f] - i[f]));
      return new z(u, "lab");
    };
  else if (e.length === 3)
    [i, o, s] = e.map((c) => c.lab()), r = function(c) {
      const u = [0, 1, 2].map(
        (f) => (1 - c) * (1 - c) * i[f] + 2 * (1 - c) * c * o[f] + c * c * s[f]
      );
      return new z(u, "lab");
    };
  else if (e.length === 4) {
    let c;
    [i, o, s, c] = e.map((u) => u.lab()), r = function(u) {
      const f = [0, 1, 2].map(
        (g) => (1 - u) * (1 - u) * (1 - u) * i[g] + 3 * (1 - u) * (1 - u) * u * o[g] + 3 * (1 - u) * u * u * s[g] + u * u * u * c[g]
      );
      return new z(f, "lab");
    };
  } else if (e.length >= 5) {
    let c, u, f;
    c = e.map((g) => g.lab()), f = e.length - 1, u = rL(f), r = function(g) {
      const m = 1 - g, C = [0, 1, 2].map(
        (b) => c.reduce(
          (_, x, k) => _ + u[k] * m ** (f - k) * g ** k * x[b],
          0
        )
      );
      return new z(C, "lab");
    };
  } else
    throw new RangeError("No point in running bezier with only one color.");
  return r;
}, oL = (e) => {
  const r = iL(e);
  return r.scale = () => w0(r), r;
}, { round: Qs } = Math;
z.prototype.rgb = function(e = !0) {
  return e === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(Qs);
};
z.prototype.rgba = function(e = !0) {
  return this._rgb.slice(0, 4).map((r, i) => i < 3 ? e === !1 ? r : Qs(r) : r);
};
const aL = (...e) => new z(...e, "rgb");
Object.assign(Ce, { rgb: aL });
de.format.rgb = (...e) => {
  const r = he(e, "rgba");
  return r[3] === void 0 && (r[3] = 1), r;
};
de.autodetect.push({
  p: 3,
  test: (...e) => {
    if (e = he(e, "rgba"), ve(e) === "array" && (e.length === 3 || e.length === 4 && ve(e[3]) == "number" && e[3] >= 0 && e[3] <= 1))
      return "rgb";
  }
});
const Yt = (e, r, i) => {
  if (!Yt[i])
    throw new Error("unknown blend mode " + i);
  return Yt[i](e, r);
}, Fn = (e) => (r, i) => {
  const o = Ce(i).rgb(), s = Ce(r).rgb();
  return Ce.rgb(e(o, s));
}, zn = (e) => (r, i) => {
  const o = [];
  return o[0] = e(r[0], i[0]), o[1] = e(r[1], i[1]), o[2] = e(r[2], i[2]), o;
}, sL = (e) => e, lL = (e, r) => e * r / 255, cL = (e, r) => e > r ? r : e, uL = (e, r) => e > r ? e : r, fL = (e, r) => 255 * (1 - (1 - e / 255) * (1 - r / 255)), dL = (e, r) => r < 128 ? 2 * e * r / 255 : 255 * (1 - 2 * (1 - e / 255) * (1 - r / 255)), hL = (e, r) => 255 * (1 - (1 - r / 255) / (e / 255)), gL = (e, r) => e === 255 ? 255 : (e = 255 * (r / 255) / (1 - e / 255), e > 255 ? 255 : e);
Yt.normal = Fn(zn(sL));
Yt.multiply = Fn(zn(lL));
Yt.screen = Fn(zn(fL));
Yt.overlay = Fn(zn(dL));
Yt.darken = Fn(zn(cL));
Yt.lighten = Fn(zn(uL));
Yt.dodge = Fn(zn(gL));
Yt.burn = Fn(zn(hL));
const { pow: pL, sin: yL, cos: mL } = Math;
function bL(e = 300, r = -1.5, i = 1, o = 1, s = [0, 1]) {
  let c = 0, u;
  ve(s) === "array" ? u = s[1] - s[0] : (u = 0, s = [s, s]);
  const f = function(g) {
    const m = pn * ((e + 120) / 360 + r * g), C = pL(s[0] + u * g, o), _ = (c !== 0 ? i[0] + g * c : i) * C * (1 - C) / 2, x = mL(m), k = yL(m), T = C + _ * (-0.14861 * x + 1.78277 * k), $ = C + _ * (-0.29227 * x - 0.90649 * k), A = C + _ * (1.97294 * x);
    return Ce(e9([T * 255, $ * 255, A * 255, 1]));
  };
  return f.start = function(g) {
    return g == null ? e : (e = g, f);
  }, f.rotations = function(g) {
    return g == null ? r : (r = g, f);
  }, f.gamma = function(g) {
    return g == null ? o : (o = g, f);
  }, f.hue = function(g) {
    return g == null ? i : (i = g, ve(i) === "array" ? (c = i[1] - i[0], c === 0 && (i = i[1])) : c = 0, f);
  }, f.lightness = function(g) {
    return g == null ? s : (ve(g) === "array" ? (s = g, u = g[1] - g[0]) : (s = [g, g], u = 0), f);
  }, f.scale = () => Ce.scale(f), f.hue(i), f;
}
const vL = "0123456789abcdef", { floor: _L, random: CL } = Math, xL = () => {
  let e = "#";
  for (let r = 0; r < 6; r++)
    e += vL.charAt(_L(CL() * 16));
  return new z(e, "hex");
}, { log: S2, pow: LL, floor: SL, abs: wL } = Math;
function Hs(e, r = null) {
  const i = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  return ve(e) === "object" && (e = Object.values(e)), e.forEach((o) => {
    r && ve(o) === "object" && (o = o[r]), o != null && !isNaN(o) && (i.values.push(o), i.sum += o, o < i.min && (i.min = o), o > i.max && (i.max = o), i.count += 1);
  }), i.domain = [i.min, i.max], i.limits = (o, s) => Ys(i, o, s), i;
}
function Ys(e, r = "equal", i = 7) {
  ve(e) == "array" && (e = Hs(e));
  const { min: o, max: s } = e, c = e.values.sort((f, g) => f - g);
  if (i === 1)
    return [o, s];
  const u = [];
  if (r.substr(0, 1) === "c" && (u.push(o), u.push(s)), r.substr(0, 1) === "e") {
    u.push(o);
    for (let f = 1; f < i; f++)
      u.push(o + f / i * (s - o));
    u.push(s);
  } else if (r.substr(0, 1) === "l") {
    if (o <= 0)
      throw new Error(
        "Logarithmic scales are only possible for values > 0"
      );
    const f = Math.LOG10E * S2(o), g = Math.LOG10E * S2(s);
    u.push(o);
    for (let m = 1; m < i; m++)
      u.push(LL(10, f + m / i * (g - f)));
    u.push(s);
  } else if (r.substr(0, 1) === "q") {
    u.push(o);
    for (let f = 1; f < i; f++) {
      const g = (c.length - 1) * f / i, m = SL(g);
      if (m === g)
        u.push(c[m]);
      else {
        const C = g - m;
        u.push(c[m] * (1 - C) + c[m + 1] * C);
      }
    }
    u.push(s);
  } else if (r.substr(0, 1) === "k") {
    let f;
    const g = c.length, m = new Array(g), C = new Array(i);
    let b = !0, _ = 0, x = null;
    x = [], x.push(o);
    for (let $ = 1; $ < i; $++)
      x.push(o + $ / i * (s - o));
    for (x.push(s); b; ) {
      for (let A = 0; A < i; A++)
        C[A] = 0;
      for (let A = 0; A < g; A++) {
        const F = c[A];
        let Z = Number.MAX_VALUE, N;
        for (let V = 0; V < i; V++) {
          const Q = wL(x[V] - F);
          Q < Z && (Z = Q, N = V), C[N]++, m[A] = N;
        }
      }
      const $ = new Array(i);
      for (let A = 0; A < i; A++)
        $[A] = null;
      for (let A = 0; A < g; A++)
        f = m[A], $[f] === null ? $[f] = c[A] : $[f] += c[A];
      for (let A = 0; A < i; A++)
        $[A] *= 1 / C[A];
      b = !1;
      for (let A = 0; A < i; A++)
        if ($[A] !== x[A]) {
          b = !0;
          break;
        }
      x = $, _++, _ > 200 && (b = !1);
    }
    const k = {};
    for (let $ = 0; $ < i; $++)
      k[$] = [];
    for (let $ = 0; $ < g; $++)
      f = m[$], k[f].push(c[$]);
    let T = [];
    for (let $ = 0; $ < i; $++)
      T.push(k[$][0]), T.push(k[$][k[$].length - 1]);
    T = T.sort(($, A) => $ - A), u.push(T[0]);
    for (let $ = 1; $ < T.length; $ += 2) {
      const A = T[$];
      !isNaN(A) && u.indexOf(A) === -1 && u.push(A);
    }
  }
  return u;
}
const kL = (e, r) => {
  e = new z(e), r = new z(r);
  const i = e.luminance(), o = r.luminance();
  return i > o ? (i + 0.05) / (o + 0.05) : (o + 0.05) / (i + 0.05);
};
/**
 * @license
 *
 * The APCA contrast prediction algorithm is based of the formulas published
 * in the APCA-1.0.98G specification by Myndex. The specification is available at:
 * https://raw.githubusercontent.com/Myndex/apca-w3/master/images/APCAw3_0.1.17_APCA0.0.98G.svg
 *
 * Note that the APCA implementation is still beta, so please update to
 * future versions of chroma.js when they become available.
 *
 * You can read more about the APCA Readability Criterion at
 * https://readtech.org/ARC/
 */
const w2 = 0.027, $L = 5e-4, AL = 0.1, k2 = 1.14, s0 = 0.022, $2 = 1.414, ML = (e, r) => {
  e = new z(e), r = new z(r), e.alpha() < 1 && (e = w1(r, e, e.alpha(), "rgb"));
  const i = A2(...e.rgb()), o = A2(...r.rgb()), s = i >= s0 ? i : i + Math.pow(s0 - i, $2), c = o >= s0 ? o : o + Math.pow(s0 - o, $2), u = Math.pow(c, 0.56) - Math.pow(s, 0.57), f = Math.pow(c, 0.65) - Math.pow(s, 0.62), g = Math.abs(c - s) < $L ? 0 : s < c ? u * k2 : f * k2;
  return (Math.abs(g) < AL ? 0 : g > 0 ? g - w2 : g + w2) * 100;
};
function A2(e, r, i) {
  return 0.2126729 * Math.pow(e / 255, 2.4) + 0.7151522 * Math.pow(r / 255, 2.4) + 0.072175 * Math.pow(i / 255, 2.4);
}
const { sqrt: gn, pow: je, min: TL, max: IL, atan2: M2, abs: T2, cos: l0, sin: I2, exp: OL, PI: O2 } = Math;
function PL(e, r, i = 1, o = 1, s = 1) {
  var c = function(yt) {
    return 360 * yt / (2 * O2);
  }, u = function(yt) {
    return 2 * O2 * yt / 360;
  };
  e = new z(e), r = new z(r);
  const [f, g, m] = Array.from(e.lab()), [C, b, _] = Array.from(r.lab()), x = (f + C) / 2, k = gn(je(g, 2) + je(m, 2)), T = gn(je(b, 2) + je(_, 2)), $ = (k + T) / 2, A = 0.5 * (1 - gn(je($, 7) / (je($, 7) + je(25, 7)))), F = g * (1 + A), Z = b * (1 + A), N = gn(je(F, 2) + je(m, 2)), V = gn(je(Z, 2) + je(_, 2)), Q = (N + V) / 2, I = c(M2(m, F)), q = c(M2(_, Z)), H = I >= 0 ? I : I + 360, W = q >= 0 ? q : q + 360, re = T2(H - W) > 180 ? (H + W + 360) / 2 : (H + W) / 2, K = 1 - 0.17 * l0(u(re - 30)) + 0.24 * l0(u(2 * re)) + 0.32 * l0(u(3 * re + 6)) - 0.2 * l0(u(4 * re - 63));
  let X = W - H;
  X = T2(X) <= 180 ? X : W <= H ? X + 360 : X - 360, X = 2 * gn(N * V) * I2(u(X) / 2);
  const R = C - f, te = V - N, le = 1 + 0.015 * je(x - 50, 2) / gn(20 + je(x - 50, 2)), ie = 1 + 0.045 * Q, ce = 1 + 0.015 * Q * K, Ye = 30 * OL(-je((re - 275) / 25, 2)), Oe = -(2 * gn(je(Q, 7) / (je(Q, 7) + je(25, 7)))) * I2(2 * u(Ye)), lt = gn(
    je(R / (i * le), 2) + je(te / (o * ie), 2) + je(X / (s * ce), 2) + Oe * (te / (o * ie)) * (X / (s * ce))
  );
  return IL(0, TL(100, lt));
}
function BL(e, r, i = "lab") {
  e = new z(e), r = new z(r);
  const o = e.get(i), s = r.get(i);
  let c = 0;
  for (let u in o) {
    const f = (o[u] || 0) - (s[u] || 0);
    c += f * f;
  }
  return Math.sqrt(c);
}
const EL = (...e) => {
  try {
    return new z(...e), !0;
  } catch {
    return !1;
  }
}, RL = {
  cool() {
    return w0([Ce.hsl(180, 1, 0.9), Ce.hsl(250, 0.7, 0.4)]);
  },
  hot() {
    return w0(["#000", "#f00", "#ff0", "#fff"]).mode(
      "rgb"
    );
  }
}, Do = {
  // sequential
  OrRd: ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"],
  PuBu: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858"],
  BuPu: ["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"],
  Oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  BuGn: ["#f7fcfd", "#e5f5f9", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#006d2c", "#00441b"],
  YlOrBr: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"],
  YlGn: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#006837", "#004529"],
  Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
  RdPu: ["#fff7f3", "#fde0dd", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"],
  Greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
  YlGnBu: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
  Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  GnBu: ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"],
  Greys: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
  YlOrRd: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
  PuRd: ["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#980043", "#67001f"],
  Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  PuBuGn: ["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"],
  Viridis: ["#440154", "#482777", "#3f4a8a", "#31678e", "#26838f", "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825"],
  // diverging
  Spectral: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
  RdYlGn: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
  RdBu: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
  PiYG: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"],
  PRGn: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"],
  RdYlBu: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
  BrBG: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"],
  RdGy: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#ffffff", "#e0e0e0", "#bababa", "#878787", "#4d4d4d", "#1a1a1a"],
  PuOr: ["#7f3b08", "#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788", "#2d004b"],
  // qualitative
  Set2: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"],
  Accent: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"],
  Set1: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"],
  Set3: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"],
  Dark2: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
  Paired: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"],
  Pastel2: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc"],
  Pastel1: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]
}, Gs = Object.keys(Do), P2 = new Map(Gs.map((e) => [e.toLowerCase(), e])), DL = typeof Proxy == "function" ? new Proxy(Do, {
  get(e, r) {
    const i = r.toLowerCase();
    if (P2.has(i))
      return e[P2.get(i)];
  },
  getOwnPropertyNames() {
    return Object.getOwnPropertyNames(Gs);
  }
}) : Do, FL = (...e) => {
  e = he(e, "cmyk");
  const [r, i, o, s] = e, c = e.length > 4 ? e[4] : 1;
  return s === 1 ? [0, 0, 0, c] : [
    r >= 1 ? 0 : 255 * (1 - r) * (1 - s),
    // r
    i >= 1 ? 0 : 255 * (1 - i) * (1 - s),
    // g
    o >= 1 ? 0 : 255 * (1 - o) * (1 - s),
    // b
    c
  ];
}, { max: B2 } = Math, zL = (...e) => {
  let [r, i, o] = he(e, "rgb");
  r = r / 255, i = i / 255, o = o / 255;
  const s = 1 - B2(r, B2(i, o)), c = s < 1 ? 1 / (1 - s) : 0, u = (1 - r - s) * c, f = (1 - i - s) * c, g = (1 - o - s) * c;
  return [u, f, g, s];
};
z.prototype.cmyk = function() {
  return zL(this._rgb);
};
const NL = (...e) => new z(...e, "cmyk");
Object.assign(Ce, { cmyk: NL });
de.format.cmyk = FL;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "cmyk"), ve(e) === "array" && e.length === 4)
      return "cmyk";
  }
});
const UL = (...e) => {
  const r = he(e, "hsla");
  let i = E1(e) || "lsa";
  return r[0] = Ft(r[0] || 0) + "deg", r[1] = Ft(r[1] * 100) + "%", r[2] = Ft(r[2] * 100) + "%", i === "hsla" || r.length > 3 && r[3] < 1 ? (r[3] = "/ " + (r.length > 3 ? r[3] : 1), i = "hsla") : r.length = 3, `${i.substr(0, 3)}(${r.join(" ")})`;
}, KL = (...e) => {
  const r = he(e, "lab");
  let i = E1(e) || "lab";
  return r[0] = Ft(r[0]) + "%", r[1] = Ft(r[1]), r[2] = Ft(r[2]), i === "laba" || r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `lab(${r.join(" ")})`;
}, ZL = (...e) => {
  const r = he(e, "lch");
  let i = E1(e) || "lab";
  return r[0] = Ft(r[0]) + "%", r[1] = Ft(r[1]), r[2] = isNaN(r[2]) ? "none" : Ft(r[2]) + "deg", i === "lcha" || r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `lch(${r.join(" ")})`;
}, WL = (...e) => {
  const r = he(e, "lab");
  return r[0] = Ft(r[0] * 100) + "%", r[1] = Eo(r[1]), r[2] = Eo(r[2]), r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `oklab(${r.join(" ")})`;
}, js = (...e) => {
  const [r, i, o, ...s] = he(e, "rgb"), [c, u, f] = a9(r, i, o), [g, m, C] = Ks(c, u, f);
  return [g, m, C, ...s.length > 0 && s[0] < 1 ? [s[0]] : []];
}, QL = (...e) => {
  const r = he(e, "lch");
  return r[0] = Ft(r[0] * 100) + "%", r[1] = Eo(r[1]), r[2] = isNaN(r[2]) ? "none" : Ft(r[2]) + "deg", r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `oklch(${r.join(" ")})`;
}, { round: vo } = Math, HL = (...e) => {
  const r = he(e, "rgba");
  let i = E1(e) || "rgb";
  if (i.substr(0, 3) === "hsl")
    return UL(Ws(r), i);
  if (i.substr(0, 3) === "lab") {
    const o = hr();
    vn("d50");
    const s = KL(n9(r), i);
    return vn(o), s;
  }
  if (i.substr(0, 3) === "lch") {
    const o = hr();
    vn("d50");
    const s = ZL(i9(r), i);
    return vn(o), s;
  }
  return i.substr(0, 5) === "oklab" ? WL(a9(r)) : i.substr(0, 5) === "oklch" ? QL(js(r)) : (r[0] = vo(r[0]), r[1] = vo(r[1]), r[2] = vo(r[2]), (i === "rgba" || r.length > 3 && r[3] < 1) && (r[3] = "/ " + (r.length > 3 ? r[3] : 1), i = "rgba"), `${i.substr(0, 3)}(${r.slice(0, i === "rgb" ? 3 : 4).join(" ")})`);
}, Vs = (...e) => {
  e = he(e, "lch");
  const [r, i, o, ...s] = e, [c, u, f] = Us(r, i, o), [g, m, C] = o9(c, u, f);
  return [g, m, C, ...s.length > 0 && s[0] < 1 ? [s[0]] : []];
}, Cn = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source, Qt = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source, k0 = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source, zt = /\s*/.source, D1 = /\s+/.source, s9 = /\s*,\s*/.source, D0 = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source, F1 = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source, qs = new RegExp(
  "^rgba?\\(" + zt + [Cn, Cn, Cn].join(D1) + F1 + "\\)$"
), Xs = new RegExp(
  "^rgb\\(" + zt + [Cn, Cn, Cn].join(s9) + zt + "\\)$"
), Js = new RegExp(
  "^rgba\\(" + zt + [Cn, Cn, Cn, Qt].join(s9) + zt + "\\)$"
), e6 = new RegExp(
  "^hsla?\\(" + zt + [D0, k0, k0].join(D1) + F1 + "\\)$"
), t6 = new RegExp(
  "^hsl?\\(" + zt + [D0, k0, k0].join(s9) + zt + "\\)$"
), n6 = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/, r6 = new RegExp(
  "^lab\\(" + zt + [Qt, Qt, Qt].join(D1) + F1 + "\\)$"
), i6 = new RegExp(
  "^lch\\(" + zt + [Qt, Qt, D0].join(D1) + F1 + "\\)$"
), o6 = new RegExp(
  "^oklab\\(" + zt + [Qt, Qt, Qt].join(D1) + F1 + "\\)$"
), a6 = new RegExp(
  "^oklch\\(" + zt + [Qt, Qt, D0].join(D1) + F1 + "\\)$"
), { round: s6 } = Math, _1 = (e) => e.map((r, i) => i <= 2 ? Xn(s6(r), 0, 255) : r), Ve = (e, r = 0, i = 100, o = !1) => (typeof e == "string" && e.endsWith("%") && (e = parseFloat(e.substring(0, e.length - 1)) / 100, o ? e = r + (e + 1) * 0.5 * (i - r) : e = r + e * (i - r)), +e), gt = (e, r) => e === "none" ? r : e, l9 = (e) => {
  if (e = e.toLowerCase().trim(), e === "transparent")
    return [0, 0, 0, 0];
  let r;
  if (de.format.named)
    try {
      return de.format.named(e);
    } catch {
    }
  if ((r = e.match(qs)) || (r = e.match(Xs))) {
    let i = r.slice(1, 4);
    for (let s = 0; s < 3; s++)
      i[s] = +Ve(gt(i[s], 0), 0, 255);
    i = _1(i);
    const o = r[4] !== void 0 ? +Ve(r[4], 0, 1) : 1;
    return i[3] = o, i;
  }
  if (r = e.match(Js)) {
    const i = r.slice(1, 5);
    for (let o = 0; o < 4; o++)
      i[o] = +Ve(i[o], 0, 255);
    return i;
  }
  if ((r = e.match(e6)) || (r = e.match(t6))) {
    const i = r.slice(1, 4);
    i[0] = +gt(i[0].replace("deg", ""), 0), i[1] = +Ve(gt(i[1], 0), 0, 100) * 0.01, i[2] = +Ve(gt(i[2], 0), 0, 100) * 0.01;
    const o = _1(Ro(i)), s = r[4] !== void 0 ? +Ve(r[4], 0, 1) : 1;
    return o[3] = s, o;
  }
  if (r = e.match(n6)) {
    const i = r.slice(1, 4);
    i[1] *= 0.01, i[2] *= 0.01;
    const o = Ro(i);
    for (let s = 0; s < 3; s++)
      o[s] = s6(o[s]);
    return o[3] = +r[4], o;
  }
  if (r = e.match(r6)) {
    const i = r.slice(1, 4);
    i[0] = Ve(gt(i[0], 0), 0, 100), i[1] = Ve(gt(i[1], 0), -125, 125, !0), i[2] = Ve(gt(i[2], 0), -125, 125, !0);
    const o = hr();
    vn("d50");
    const s = _1(t9(i));
    vn(o);
    const c = r[4] !== void 0 ? +Ve(r[4], 0, 1) : 1;
    return s[3] = c, s;
  }
  if (r = e.match(i6)) {
    const i = r.slice(1, 4);
    i[0] = Ve(i[0], 0, 100), i[1] = Ve(gt(i[1], 0), 0, 150, !1), i[2] = +gt(i[2].replace("deg", ""), 0);
    const o = hr();
    vn("d50");
    const s = _1(r9(i));
    vn(o);
    const c = r[4] !== void 0 ? +Ve(r[4], 0, 1) : 1;
    return s[3] = c, s;
  }
  if (r = e.match(o6)) {
    const i = r.slice(1, 4);
    i[0] = Ve(gt(i[0], 0), 0, 1), i[1] = Ve(gt(i[1], 0), -0.4, 0.4, !0), i[2] = Ve(gt(i[2], 0), -0.4, 0.4, !0);
    const o = _1(o9(i)), s = r[4] !== void 0 ? +Ve(r[4], 0, 1) : 1;
    return o[3] = s, o;
  }
  if (r = e.match(a6)) {
    const i = r.slice(1, 4);
    i[0] = Ve(gt(i[0], 0), 0, 1), i[1] = Ve(gt(i[1], 0), 0, 0.4, !1), i[2] = +gt(i[2].replace("deg", ""), 0);
    const o = _1(Vs(i)), s = r[4] !== void 0 ? +Ve(r[4], 0, 1) : 1;
    return o[3] = s, o;
  }
};
l9.test = (e) => (
  // modern
  qs.test(e) || e6.test(e) || r6.test(e) || i6.test(e) || o6.test(e) || a6.test(e) || // legacy
  Xs.test(e) || Js.test(e) || t6.test(e) || n6.test(e) || e === "transparent"
);
z.prototype.css = function(e) {
  return HL(this._rgb, e);
};
const YL = (...e) => new z(...e, "css");
Ce.css = YL;
de.format.css = l9;
de.autodetect.push({
  p: 5,
  test: (e, ...r) => {
    if (!r.length && ve(e) === "string" && l9.test(e))
      return "css";
  }
});
de.format.gl = (...e) => {
  const r = he(e, "rgba");
  return r[0] *= 255, r[1] *= 255, r[2] *= 255, r;
};
const GL = (...e) => new z(...e, "gl");
Ce.gl = GL;
z.prototype.gl = function() {
  const e = this._rgb;
  return [e[0] / 255, e[1] / 255, e[2] / 255, e[3]];
};
z.prototype.hex = function(e) {
  return Fs(this._rgb, e);
};
const jL = (...e) => new z(...e, "hex");
Ce.hex = jL;
de.format.hex = Ds;
de.autodetect.push({
  p: 4,
  test: (e, ...r) => {
    if (!r.length && ve(e) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(e.length) >= 0)
      return "hex";
  }
});
const { log: c0 } = Math, l6 = (e) => {
  const r = e / 100;
  let i, o, s;
  return r < 66 ? (i = 255, o = r < 6 ? 0 : -155.25485562709179 - 0.44596950469579133 * (o = r - 2) + 104.49216199393888 * c0(o), s = r < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (s = r - 10) + 115.67994401066147 * c0(s)) : (i = 351.97690566805693 + 0.114206453784165 * (i = r - 55) - 40.25366309332127 * c0(i), o = 325.4494125711974 + 0.07943456536662342 * (o = r - 50) - 28.0852963507957 * c0(o), s = 255), [i, o, s, 1];
}, { round: VL } = Math, qL = (...e) => {
  const r = he(e, "rgb"), i = r[0], o = r[2];
  let s = 1e3, c = 4e4;
  const u = 0.4;
  let f;
  for (; c - s > u; ) {
    f = (c + s) * 0.5;
    const g = l6(f);
    g[2] / g[0] >= o / i ? c = f : s = f;
  }
  return VL(f);
};
z.prototype.temp = z.prototype.kelvin = z.prototype.temperature = function() {
  return qL(this._rgb);
};
const _o = (...e) => new z(...e, "temp");
Object.assign(Ce, { temp: _o, kelvin: _o, temperature: _o });
de.format.temp = de.format.kelvin = de.format.temperature = l6;
z.prototype.oklch = function() {
  return js(this._rgb);
};
const XL = (...e) => new z(...e, "oklch");
Object.assign(Ce, { oklch: XL });
de.format.oklch = Vs;
de.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = he(e, "oklch"), ve(e) === "array" && e.length === 3)
      return "oklch";
  }
});
Object.assign(Ce, {
  analyze: Hs,
  average: Jx,
  bezier: oL,
  blend: Yt,
  brewer: DL,
  Color: z,
  colors: S1,
  contrast: kL,
  contrastAPCA: ML,
  cubehelix: bL,
  deltaE: PL,
  distance: BL,
  input: de,
  interpolate: w1,
  limits: Ys,
  mix: w1,
  random: xL,
  scale: w0,
  scales: RL,
  valid: EL
});
var JL = /* @__PURE__ */ U("<div tabindex=0><div class=selector-container><i class=arrow></i></div><div class=drop-down-container style=left:50%;top:20%><div class=split_line></div><div class=range_div><input class=range type=range min=1 max=100><p>%</p></div><div class=split_line></div><div class=submit><span class=cancel>Cancel</span><span>Ok"), eS = /* @__PURE__ */ U("<div class=each_line>"), tS = /* @__PURE__ */ U("<div>");
const c6 = (e) => {
  const r = String(e.value).includes("rgba") ? Ce(String(e.value)).alpha() * 100 : 100, [i, o] = E(!1), [s, c] = E(r), [u, f] = E(e.value), [g, m] = E(e.value), [C, b] = E(!1), _ = [["rgb(255, 255, 255)", "rgb(178, 181, 190)", "rgb(149, 152, 161)", "rgb(120, 123, 134)", "rgb(93, 96, 107)", "rgb(42, 46, 57)", "rgb(0, 0, 0)"], ["rgb(242, 54, 69)", "rgb(252, 203, 205)", "rgb(250, 161, 164)", "rgb(247, 124, 128)", "rgb(247, 82, 95)", "rgb(178, 40, 51)", "rgb(128, 25, 34)"], ["rgb(255, 152, 0)", "rgb(255, 224, 178)", "rgb(255, 204, 128)", "rgb(255, 183, 77)", "rgb(255, 167, 38)", "rgb(245, 124, 0)", "rgb(230, 81, 0)"], ["rgb(255, 235, 59)", "rgb(255, 249, 196)", "rgb(255, 245, 157)", "rgb(255, 241, 118)", "rgb(255, 238, 88)", "rgb(251, 192, 45)", "rgb(245, 127, 23)"], ["rgb(76, 175, 80)", "rgb(200, 230, 201)", "rgb(165, 214, 167)", "rgb(129, 199, 132)", "rgb(102, 187, 106)", "rgb(56, 142, 60)", "rgb(27, 94, 32)"], ["rgb(8, 153, 129)", "rgb(172, 229, 220)", "rgb(112, 204, 189)", "rgb(66, 189, 168)", "rgb(34, 171, 148)", "rgb(5, 102, 86)", "rgb(0, 51, 42)"], ["rgb(0, 188, 212)", "rgb(178, 235, 242)", "rgb(128, 222, 234)", "rgb(77, 208, 225)", "rgb(38, 198, 218)", "rgb(0, 151, 167)", "rgb(0, 96, 100)"], ["rgb(41, 98, 255)", "rgb(187, 217, 251)", "rgb(144, 191, 249)", "rgb(91, 156, 246)", "rgb(49, 121, 245)", "rgb(24, 72, 204)", "rgb(12, 50, 153)"], ["rgb(103, 58, 183)", "rgb(209, 196, 233)", "rgb(179, 157, 219)", "rgb(149, 117, 205)", "rgb(126, 87, 194)", "rgb(81, 45, 168)", "rgb(49, 27, 146)"], ["rgb(156, 39, 176)", "rgb(225, 190, 231)", "rgb(206, 147, 216)", "rgb(186, 104, 200)", "rgb(171, 71, 188)", "rgb(123, 31, 162)", "rgb(74, 20, 140)"], ["rgb(233, 30, 99)", "rgb(248, 187, 208)", "rgb(244, 143, 177)", "rgb(240, 98, 146)", "rgb(236, 64, 122)", "rgb(194, 24, 91)", "rgb(136, 14, 79)"], ["#00698b", "#fb7b50"]], x = () => {
    o(!1);
  }, k = () => {
    var A;
    f(e.value), m(e.value), (A = e.onChange) == null || A.call(e, e.value), x();
  }, T = () => {
    var Z;
    const A = s() / 100, F = Ce(u()).alpha(A).css();
    m(F), (e.reactiveChange ?? !0) && ((Z = e.onChange) == null || Z.call(e, g()));
  }, $ = (A) => {
    c(A.target.value), T();
  };
  return (() => {
    var A = JL(), F = A.firstChild, Z = F.nextSibling, N = Z.firstChild, V = N.nextSibling, Q = V.firstChild, I = Q.nextSibling, q = I.firstChild, H = V.nextSibling, W = H.nextSibling, re = W.firstChild, K = re.nextSibling;
    return F.$$click = (X) => {
      o(!0);
    }, G(Z, () => _.map((X) => (() => {
      var R = eS();
      return G(R, () => X.map((te) => (() => {
        var le = tS();
        return le.$$click = (ie) => {
          ie.preventDefault(), f(te), T();
        }, ze((ie) => {
          var ce = `each_color ${te == u() ? "selected" : ""}`, Ye = `background-color: ${te}`;
          return ce !== ie.e && Ln(le, ie.e = ce), ie.t = en(le, Ye, ie.t), ie;
        }, {
          e: void 0,
          t: void 0
        }), le;
      })())), R;
    })()), N), Q.addEventListener("blur", () => {
      b(!1);
    }), Q.addEventListener("focus", () => {
      b(!0);
    }), Q.$$input = (X) => {
      X.preventDefault, $(X);
    }, G(I, s, q), re.$$click = k, K.$$click = () => {
      var X;
      e.reactiveChange === !1 && ((X = e.onChange) == null || X.call(e, g())), x();
    }, ze((X) => {
      var R = `width: 120px; background-color: ${g()}`, te = `klinecharts-pro-color ${e.class ?? ""} ${i() ? "klinecharts-pro-color-show" : ""}`, le = `background-color: ${g()}; border: 1px solid ${u()}`;
      return X.e = en(A, R, X.e), te !== X.t && Ln(A, X.t = te), X.a = en(Q, le, X.a), X;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), ze(() => Q.value = s()), A;
  })();
};
At(["click", "input"]);
const [nS, E2] = E(!1), [rS, iS] = E(0), [oS, aS] = E(0), [Fe, z1] = E(), [lr, sS] = E();
E(!1);
const [lS, u6] = E(!1);
E(!1);
E(!1);
E(!1);
const f6 = () => {
  var e;
  return ((e = Fe()) == null ? void 0 : e.name) ?? "Object";
}, d6 = () => ({ openPopup: (i, o) => {
  iS(x1().y - i.pageY > 200 ? i.pageY : x1().y - 200), aS(x1().x - i.pageX > 200 ? i.pageX : x1().x - 200), z1(i.overlay), sS(o), E2(!0);
}, closePopup: () => {
  E2(!1);
} });
var $0 = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
$0.exports;
(function(e, r) {
  (function() {
    var i, o = "4.17.21", s = 200, c = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", u = "Expected a function", f = "Invalid `variable` option passed into `_.template`", g = "__lodash_hash_undefined__", m = 500, C = "__lodash_placeholder__", b = 1, _ = 2, x = 4, k = 1, T = 2, $ = 1, A = 2, F = 4, Z = 8, N = 16, V = 32, Q = 64, I = 128, q = 256, H = 512, W = 30, re = "...", K = 800, X = 16, R = 1, te = 2, le = 3, ie = 1 / 0, ce = 9007199254740991, Ye = 17976931348623157e292, be = 0 / 0, Oe = 4294967295, lt = Oe - 1, yt = Oe >>> 1, t1 = [
      ["ary", I],
      ["bind", $],
      ["bindKey", A],
      ["curry", Z],
      ["curryRight", N],
      ["flip", H],
      ["partial", V],
      ["partialRight", Q],
      ["rearg", q]
    ], ye = "[object Arguments]", qe = "[object Array]", Ne = "[object AsyncFunction]", Ue = "[object Boolean]", Me = "[object Date]", pr = "[object DOMException]", Nn = "[object Error]", Un = "[object Function]", N1 = "[object GeneratorFunction]", mt = "[object Map]", ct = "[object Number]", m6 = "[object Null]", rn = "[object Object]", d9 = "[object Promise]", b6 = "[object Proxy]", U1 = "[object RegExp]", Nt = "[object Set]", K1 = "[object String]", yr = "[object Symbol]", v6 = "[object Undefined]", Z1 = "[object WeakMap]", _6 = "[object WeakSet]", W1 = "[object ArrayBuffer]", n1 = "[object DataView]", F0 = "[object Float32Array]", z0 = "[object Float64Array]", N0 = "[object Int8Array]", U0 = "[object Int16Array]", K0 = "[object Int32Array]", Z0 = "[object Uint8Array]", W0 = "[object Uint8ClampedArray]", Q0 = "[object Uint16Array]", H0 = "[object Uint32Array]", C6 = /\b__p \+= '';/g, x6 = /\b(__p \+=) '' \+/g, L6 = /(__e\(.*?\)|\b__t\)) \+\n'';/g, h9 = /&(?:amp|lt|gt|quot|#39);/g, g9 = /[&<>"']/g, S6 = RegExp(h9.source), w6 = RegExp(g9.source), k6 = /<%-([\s\S]+?)%>/g, $6 = /<%([\s\S]+?)%>/g, p9 = /<%=([\s\S]+?)%>/g, A6 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, M6 = /^\w*$/, T6 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Y0 = /[\\^$.*+?()[\]{}|]/g, I6 = RegExp(Y0.source), G0 = /^\s+/, O6 = /\s/, P6 = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, B6 = /\{\n\/\* \[wrapped with (.+)\] \*/, E6 = /,? & /, R6 = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, D6 = /[()=,{}\[\]\/\s]/, F6 = /\\(\\)?/g, z6 = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, y9 = /\w*$/, N6 = /^[-+]0x[0-9a-f]+$/i, U6 = /^0b[01]+$/i, K6 = /^\[object .+?Constructor\]$/, Z6 = /^0o[0-7]+$/i, W6 = /^(?:0|[1-9]\d*)$/, Q6 = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, mr = /($^)/, H6 = /['\n\r\u2028\u2029\\]/g, br = "\\ud800-\\udfff", Y6 = "\\u0300-\\u036f", G6 = "\\ufe20-\\ufe2f", j6 = "\\u20d0-\\u20ff", m9 = Y6 + G6 + j6, b9 = "\\u2700-\\u27bf", v9 = "a-z\\xdf-\\xf6\\xf8-\\xff", V6 = "\\xac\\xb1\\xd7\\xf7", q6 = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", X6 = "\\u2000-\\u206f", J6 = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", _9 = "A-Z\\xc0-\\xd6\\xd8-\\xde", C9 = "\\ufe0e\\ufe0f", x9 = V6 + q6 + X6 + J6, j0 = "['’]", e3 = "[" + br + "]", L9 = "[" + x9 + "]", vr = "[" + m9 + "]", S9 = "\\d+", t3 = "[" + b9 + "]", w9 = "[" + v9 + "]", k9 = "[^" + br + x9 + S9 + b9 + v9 + _9 + "]", V0 = "\\ud83c[\\udffb-\\udfff]", n3 = "(?:" + vr + "|" + V0 + ")", $9 = "[^" + br + "]", q0 = "(?:\\ud83c[\\udde6-\\uddff]){2}", X0 = "[\\ud800-\\udbff][\\udc00-\\udfff]", r1 = "[" + _9 + "]", A9 = "\\u200d", M9 = "(?:" + w9 + "|" + k9 + ")", r3 = "(?:" + r1 + "|" + k9 + ")", T9 = "(?:" + j0 + "(?:d|ll|m|re|s|t|ve))?", I9 = "(?:" + j0 + "(?:D|LL|M|RE|S|T|VE))?", O9 = n3 + "?", P9 = "[" + C9 + "]?", i3 = "(?:" + A9 + "(?:" + [$9, q0, X0].join("|") + ")" + P9 + O9 + ")*", o3 = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", a3 = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", B9 = P9 + O9 + i3, s3 = "(?:" + [t3, q0, X0].join("|") + ")" + B9, l3 = "(?:" + [$9 + vr + "?", vr, q0, X0, e3].join("|") + ")", c3 = RegExp(j0, "g"), u3 = RegExp(vr, "g"), J0 = RegExp(V0 + "(?=" + V0 + ")|" + l3 + B9, "g"), f3 = RegExp([
      r1 + "?" + w9 + "+" + T9 + "(?=" + [L9, r1, "$"].join("|") + ")",
      r3 + "+" + I9 + "(?=" + [L9, r1 + M9, "$"].join("|") + ")",
      r1 + "?" + M9 + "+" + T9,
      r1 + "+" + I9,
      a3,
      o3,
      S9,
      s3
    ].join("|"), "g"), d3 = RegExp("[" + A9 + br + m9 + C9 + "]"), h3 = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, g3 = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ], p3 = -1, Ee = {};
    Ee[F0] = Ee[z0] = Ee[N0] = Ee[U0] = Ee[K0] = Ee[Z0] = Ee[W0] = Ee[Q0] = Ee[H0] = !0, Ee[ye] = Ee[qe] = Ee[W1] = Ee[Ue] = Ee[n1] = Ee[Me] = Ee[Nn] = Ee[Un] = Ee[mt] = Ee[ct] = Ee[rn] = Ee[U1] = Ee[Nt] = Ee[K1] = Ee[Z1] = !1;
    var Pe = {};
    Pe[ye] = Pe[qe] = Pe[W1] = Pe[n1] = Pe[Ue] = Pe[Me] = Pe[F0] = Pe[z0] = Pe[N0] = Pe[U0] = Pe[K0] = Pe[mt] = Pe[ct] = Pe[rn] = Pe[U1] = Pe[Nt] = Pe[K1] = Pe[yr] = Pe[Z0] = Pe[W0] = Pe[Q0] = Pe[H0] = !0, Pe[Nn] = Pe[Un] = Pe[Z1] = !1;
    var y3 = {
      // Latin-1 Supplement block.
      À: "A",
      Á: "A",
      Â: "A",
      Ã: "A",
      Ä: "A",
      Å: "A",
      à: "a",
      á: "a",
      â: "a",
      ã: "a",
      ä: "a",
      å: "a",
      Ç: "C",
      ç: "c",
      Ð: "D",
      ð: "d",
      È: "E",
      É: "E",
      Ê: "E",
      Ë: "E",
      è: "e",
      é: "e",
      ê: "e",
      ë: "e",
      Ì: "I",
      Í: "I",
      Î: "I",
      Ï: "I",
      ì: "i",
      í: "i",
      î: "i",
      ï: "i",
      Ñ: "N",
      ñ: "n",
      Ò: "O",
      Ó: "O",
      Ô: "O",
      Õ: "O",
      Ö: "O",
      Ø: "O",
      ò: "o",
      ó: "o",
      ô: "o",
      õ: "o",
      ö: "o",
      ø: "o",
      Ù: "U",
      Ú: "U",
      Û: "U",
      Ü: "U",
      ù: "u",
      ú: "u",
      û: "u",
      ü: "u",
      Ý: "Y",
      ý: "y",
      ÿ: "y",
      Æ: "Ae",
      æ: "ae",
      Þ: "Th",
      þ: "th",
      ß: "ss",
      // Latin Extended-A block.
      Ā: "A",
      Ă: "A",
      Ą: "A",
      ā: "a",
      ă: "a",
      ą: "a",
      Ć: "C",
      Ĉ: "C",
      Ċ: "C",
      Č: "C",
      ć: "c",
      ĉ: "c",
      ċ: "c",
      č: "c",
      Ď: "D",
      Đ: "D",
      ď: "d",
      đ: "d",
      Ē: "E",
      Ĕ: "E",
      Ė: "E",
      Ę: "E",
      Ě: "E",
      ē: "e",
      ĕ: "e",
      ė: "e",
      ę: "e",
      ě: "e",
      Ĝ: "G",
      Ğ: "G",
      Ġ: "G",
      Ģ: "G",
      ĝ: "g",
      ğ: "g",
      ġ: "g",
      ģ: "g",
      Ĥ: "H",
      Ħ: "H",
      ĥ: "h",
      ħ: "h",
      Ĩ: "I",
      Ī: "I",
      Ĭ: "I",
      Į: "I",
      İ: "I",
      ĩ: "i",
      ī: "i",
      ĭ: "i",
      į: "i",
      ı: "i",
      Ĵ: "J",
      ĵ: "j",
      Ķ: "K",
      ķ: "k",
      ĸ: "k",
      Ĺ: "L",
      Ļ: "L",
      Ľ: "L",
      Ŀ: "L",
      Ł: "L",
      ĺ: "l",
      ļ: "l",
      ľ: "l",
      ŀ: "l",
      ł: "l",
      Ń: "N",
      Ņ: "N",
      Ň: "N",
      Ŋ: "N",
      ń: "n",
      ņ: "n",
      ň: "n",
      ŋ: "n",
      Ō: "O",
      Ŏ: "O",
      Ő: "O",
      ō: "o",
      ŏ: "o",
      ő: "o",
      Ŕ: "R",
      Ŗ: "R",
      Ř: "R",
      ŕ: "r",
      ŗ: "r",
      ř: "r",
      Ś: "S",
      Ŝ: "S",
      Ş: "S",
      Š: "S",
      ś: "s",
      ŝ: "s",
      ş: "s",
      š: "s",
      Ţ: "T",
      Ť: "T",
      Ŧ: "T",
      ţ: "t",
      ť: "t",
      ŧ: "t",
      Ũ: "U",
      Ū: "U",
      Ŭ: "U",
      Ů: "U",
      Ű: "U",
      Ų: "U",
      ũ: "u",
      ū: "u",
      ŭ: "u",
      ů: "u",
      ű: "u",
      ų: "u",
      Ŵ: "W",
      ŵ: "w",
      Ŷ: "Y",
      ŷ: "y",
      Ÿ: "Y",
      Ź: "Z",
      Ż: "Z",
      Ž: "Z",
      ź: "z",
      ż: "z",
      ž: "z",
      Ĳ: "IJ",
      ĳ: "ij",
      Œ: "Oe",
      œ: "oe",
      ŉ: "'n",
      ſ: "s"
    }, m3 = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }, b3 = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    }, v3 = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    }, _3 = parseFloat, C3 = parseInt, E9 = typeof bn == "object" && bn && bn.Object === Object && bn, x3 = typeof self == "object" && self && self.Object === Object && self, tt = E9 || x3 || Function("return this")(), ei = r && !r.nodeType && r, Kn = ei && !0 && e && !e.nodeType && e, R9 = Kn && Kn.exports === ei, ti = R9 && E9.process, Mt = function() {
      try {
        var S = Kn && Kn.require && Kn.require("util").types;
        return S || ti && ti.binding && ti.binding("util");
      } catch {
      }
    }(), D9 = Mt && Mt.isArrayBuffer, F9 = Mt && Mt.isDate, z9 = Mt && Mt.isMap, N9 = Mt && Mt.isRegExp, U9 = Mt && Mt.isSet, K9 = Mt && Mt.isTypedArray;
    function xt(S, O, M) {
      switch (M.length) {
        case 0:
          return S.call(O);
        case 1:
          return S.call(O, M[0]);
        case 2:
          return S.call(O, M[0], M[1]);
        case 3:
          return S.call(O, M[0], M[1], M[2]);
      }
      return S.apply(O, M);
    }
    function L3(S, O, M, J) {
      for (var ue = -1, we = S == null ? 0 : S.length; ++ue < we; ) {
        var Xe = S[ue];
        O(J, Xe, M(Xe), S);
      }
      return J;
    }
    function Tt(S, O) {
      for (var M = -1, J = S == null ? 0 : S.length; ++M < J && O(S[M], M, S) !== !1; )
        ;
      return S;
    }
    function S3(S, O) {
      for (var M = S == null ? 0 : S.length; M-- && O(S[M], M, S) !== !1; )
        ;
      return S;
    }
    function Z9(S, O) {
      for (var M = -1, J = S == null ? 0 : S.length; ++M < J; )
        if (!O(S[M], M, S))
          return !1;
      return !0;
    }
    function kn(S, O) {
      for (var M = -1, J = S == null ? 0 : S.length, ue = 0, we = []; ++M < J; ) {
        var Xe = S[M];
        O(Xe, M, S) && (we[ue++] = Xe);
      }
      return we;
    }
    function _r(S, O) {
      var M = S == null ? 0 : S.length;
      return !!M && i1(S, O, 0) > -1;
    }
    function ni(S, O, M) {
      for (var J = -1, ue = S == null ? 0 : S.length; ++J < ue; )
        if (M(O, S[J]))
          return !0;
      return !1;
    }
    function De(S, O) {
      for (var M = -1, J = S == null ? 0 : S.length, ue = Array(J); ++M < J; )
        ue[M] = O(S[M], M, S);
      return ue;
    }
    function $n(S, O) {
      for (var M = -1, J = O.length, ue = S.length; ++M < J; )
        S[ue + M] = O[M];
      return S;
    }
    function ri(S, O, M, J) {
      var ue = -1, we = S == null ? 0 : S.length;
      for (J && we && (M = S[++ue]); ++ue < we; )
        M = O(M, S[ue], ue, S);
      return M;
    }
    function w3(S, O, M, J) {
      var ue = S == null ? 0 : S.length;
      for (J && ue && (M = S[--ue]); ue--; )
        M = O(M, S[ue], ue, S);
      return M;
    }
    function ii(S, O) {
      for (var M = -1, J = S == null ? 0 : S.length; ++M < J; )
        if (O(S[M], M, S))
          return !0;
      return !1;
    }
    var k3 = oi("length");
    function $3(S) {
      return S.split("");
    }
    function A3(S) {
      return S.match(R6) || [];
    }
    function W9(S, O, M) {
      var J;
      return M(S, function(ue, we, Xe) {
        if (O(ue, we, Xe))
          return J = we, !1;
      }), J;
    }
    function Cr(S, O, M, J) {
      for (var ue = S.length, we = M + (J ? 1 : -1); J ? we-- : ++we < ue; )
        if (O(S[we], we, S))
          return we;
      return -1;
    }
    function i1(S, O, M) {
      return O === O ? N3(S, O, M) : Cr(S, Q9, M);
    }
    function M3(S, O, M, J) {
      for (var ue = M - 1, we = S.length; ++ue < we; )
        if (J(S[ue], O))
          return ue;
      return -1;
    }
    function Q9(S) {
      return S !== S;
    }
    function H9(S, O) {
      var M = S == null ? 0 : S.length;
      return M ? si(S, O) / M : be;
    }
    function oi(S) {
      return function(O) {
        return O == null ? i : O[S];
      };
    }
    function ai(S) {
      return function(O) {
        return S == null ? i : S[O];
      };
    }
    function Y9(S, O, M, J, ue) {
      return ue(S, function(we, Xe, Te) {
        M = J ? (J = !1, we) : O(M, we, Xe, Te);
      }), M;
    }
    function T3(S, O) {
      var M = S.length;
      for (S.sort(O); M--; )
        S[M] = S[M].value;
      return S;
    }
    function si(S, O) {
      for (var M, J = -1, ue = S.length; ++J < ue; ) {
        var we = O(S[J]);
        we !== i && (M = M === i ? we : M + we);
      }
      return M;
    }
    function li(S, O) {
      for (var M = -1, J = Array(S); ++M < S; )
        J[M] = O(M);
      return J;
    }
    function I3(S, O) {
      return De(O, function(M) {
        return [M, S[M]];
      });
    }
    function G9(S) {
      return S && S.slice(0, X9(S) + 1).replace(G0, "");
    }
    function Lt(S) {
      return function(O) {
        return S(O);
      };
    }
    function ci(S, O) {
      return De(O, function(M) {
        return S[M];
      });
    }
    function Q1(S, O) {
      return S.has(O);
    }
    function j9(S, O) {
      for (var M = -1, J = S.length; ++M < J && i1(O, S[M], 0) > -1; )
        ;
      return M;
    }
    function V9(S, O) {
      for (var M = S.length; M-- && i1(O, S[M], 0) > -1; )
        ;
      return M;
    }
    function O3(S, O) {
      for (var M = S.length, J = 0; M--; )
        S[M] === O && ++J;
      return J;
    }
    var P3 = ai(y3), B3 = ai(m3);
    function E3(S) {
      return "\\" + v3[S];
    }
    function R3(S, O) {
      return S == null ? i : S[O];
    }
    function o1(S) {
      return d3.test(S);
    }
    function D3(S) {
      return h3.test(S);
    }
    function F3(S) {
      for (var O, M = []; !(O = S.next()).done; )
        M.push(O.value);
      return M;
    }
    function ui(S) {
      var O = -1, M = Array(S.size);
      return S.forEach(function(J, ue) {
        M[++O] = [ue, J];
      }), M;
    }
    function q9(S, O) {
      return function(M) {
        return S(O(M));
      };
    }
    function An(S, O) {
      for (var M = -1, J = S.length, ue = 0, we = []; ++M < J; ) {
        var Xe = S[M];
        (Xe === O || Xe === C) && (S[M] = C, we[ue++] = M);
      }
      return we;
    }
    function xr(S) {
      var O = -1, M = Array(S.size);
      return S.forEach(function(J) {
        M[++O] = J;
      }), M;
    }
    function z3(S) {
      var O = -1, M = Array(S.size);
      return S.forEach(function(J) {
        M[++O] = [J, J];
      }), M;
    }
    function N3(S, O, M) {
      for (var J = M - 1, ue = S.length; ++J < ue; )
        if (S[J] === O)
          return J;
      return -1;
    }
    function U3(S, O, M) {
      for (var J = M + 1; J--; )
        if (S[J] === O)
          return J;
      return J;
    }
    function a1(S) {
      return o1(S) ? Z3(S) : k3(S);
    }
    function Ut(S) {
      return o1(S) ? W3(S) : $3(S);
    }
    function X9(S) {
      for (var O = S.length; O-- && O6.test(S.charAt(O)); )
        ;
      return O;
    }
    var K3 = ai(b3);
    function Z3(S) {
      for (var O = J0.lastIndex = 0; J0.test(S); )
        ++O;
      return O;
    }
    function W3(S) {
      return S.match(J0) || [];
    }
    function Q3(S) {
      return S.match(f3) || [];
    }
    var H3 = function S(O) {
      O = O == null ? tt : s1.defaults(tt.Object(), O, s1.pick(tt, g3));
      var M = O.Array, J = O.Date, ue = O.Error, we = O.Function, Xe = O.Math, Te = O.Object, fi = O.RegExp, Y3 = O.String, It = O.TypeError, Lr = M.prototype, G3 = we.prototype, l1 = Te.prototype, Sr = O["__core-js_shared__"], wr = G3.toString, $e = l1.hasOwnProperty, j3 = 0, J9 = function() {
        var t = /[^.]+$/.exec(Sr && Sr.keys && Sr.keys.IE_PROTO || "");
        return t ? "Symbol(src)_1." + t : "";
      }(), kr = l1.toString, V3 = wr.call(Te), q3 = tt._, X3 = fi(
        "^" + wr.call($e).replace(Y0, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      ), $r = R9 ? O.Buffer : i, Mn = O.Symbol, Ar = O.Uint8Array, e5 = $r ? $r.allocUnsafe : i, Mr = q9(Te.getPrototypeOf, Te), t5 = Te.create, n5 = l1.propertyIsEnumerable, Tr = Lr.splice, r5 = Mn ? Mn.isConcatSpreadable : i, H1 = Mn ? Mn.iterator : i, Zn = Mn ? Mn.toStringTag : i, Ir = function() {
        try {
          var t = Gn(Te, "defineProperty");
          return t({}, "", {}), t;
        } catch {
        }
      }(), J3 = O.clearTimeout !== tt.clearTimeout && O.clearTimeout, e8 = J && J.now !== tt.Date.now && J.now, t8 = O.setTimeout !== tt.setTimeout && O.setTimeout, Or = Xe.ceil, Pr = Xe.floor, di = Te.getOwnPropertySymbols, n8 = $r ? $r.isBuffer : i, i5 = O.isFinite, r8 = Lr.join, i8 = q9(Te.keys, Te), Je = Xe.max, rt = Xe.min, o8 = J.now, a8 = O.parseInt, o5 = Xe.random, s8 = Lr.reverse, hi = Gn(O, "DataView"), Y1 = Gn(O, "Map"), gi = Gn(O, "Promise"), c1 = Gn(O, "Set"), G1 = Gn(O, "WeakMap"), j1 = Gn(Te, "create"), Br = G1 && new G1(), u1 = {}, l8 = jn(hi), c8 = jn(Y1), u8 = jn(gi), f8 = jn(c1), d8 = jn(G1), Er = Mn ? Mn.prototype : i, V1 = Er ? Er.valueOf : i, a5 = Er ? Er.toString : i;
      function h(t) {
        if (Ze(t) && !fe(t) && !(t instanceof xe)) {
          if (t instanceof Ot)
            return t;
          if ($e.call(t, "__wrapped__"))
            return sa(t);
        }
        return new Ot(t);
      }
      var f1 = function() {
        function t() {
        }
        return function(n) {
          if (!Ke(n))
            return {};
          if (t5)
            return t5(n);
          t.prototype = n;
          var a = new t();
          return t.prototype = i, a;
        };
      }();
      function Rr() {
      }
      function Ot(t, n) {
        this.__wrapped__ = t, this.__actions__ = [], this.__chain__ = !!n, this.__index__ = 0, this.__values__ = i;
      }
      h.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        escape: k6,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        evaluate: $6,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        interpolate: p9,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        variable: "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        imports: {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          _: h
        }
      }, h.prototype = Rr.prototype, h.prototype.constructor = h, Ot.prototype = f1(Rr.prototype), Ot.prototype.constructor = Ot;
      function xe(t) {
        this.__wrapped__ = t, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Oe, this.__views__ = [];
      }
      function h8() {
        var t = new xe(this.__wrapped__);
        return t.__actions__ = bt(this.__actions__), t.__dir__ = this.__dir__, t.__filtered__ = this.__filtered__, t.__iteratees__ = bt(this.__iteratees__), t.__takeCount__ = this.__takeCount__, t.__views__ = bt(this.__views__), t;
      }
      function g8() {
        if (this.__filtered__) {
          var t = new xe(this);
          t.__dir__ = -1, t.__filtered__ = !0;
        } else
          t = this.clone(), t.__dir__ *= -1;
        return t;
      }
      function p8() {
        var t = this.__wrapped__.value(), n = this.__dir__, a = fe(t), l = n < 0, d = a ? t.length : 0, p = $l(0, d, this.__views__), v = p.start, L = p.end, w = L - v, P = l ? L : v - 1, B = this.__iteratees__, D = B.length, j = 0, ne = rt(w, this.__takeCount__);
        if (!a || !l && d == w && ne == w)
          return T5(t, this.__actions__);
        var ae = [];
        e:
          for (; w-- && j < ne; ) {
            P += n;
            for (var pe = -1, se = t[P]; ++pe < D; ) {
              var _e = B[pe], Le = _e.iteratee, kt = _e.type, dt = Le(se);
              if (kt == te)
                se = dt;
              else if (!dt) {
                if (kt == R)
                  continue e;
                break e;
              }
            }
            ae[j++] = se;
          }
        return ae;
      }
      xe.prototype = f1(Rr.prototype), xe.prototype.constructor = xe;
      function Wn(t) {
        var n = -1, a = t == null ? 0 : t.length;
        for (this.clear(); ++n < a; ) {
          var l = t[n];
          this.set(l[0], l[1]);
        }
      }
      function y8() {
        this.__data__ = j1 ? j1(null) : {}, this.size = 0;
      }
      function m8(t) {
        var n = this.has(t) && delete this.__data__[t];
        return this.size -= n ? 1 : 0, n;
      }
      function b8(t) {
        var n = this.__data__;
        if (j1) {
          var a = n[t];
          return a === g ? i : a;
        }
        return $e.call(n, t) ? n[t] : i;
      }
      function v8(t) {
        var n = this.__data__;
        return j1 ? n[t] !== i : $e.call(n, t);
      }
      function _8(t, n) {
        var a = this.__data__;
        return this.size += this.has(t) ? 0 : 1, a[t] = j1 && n === i ? g : n, this;
      }
      Wn.prototype.clear = y8, Wn.prototype.delete = m8, Wn.prototype.get = b8, Wn.prototype.has = v8, Wn.prototype.set = _8;
      function on(t) {
        var n = -1, a = t == null ? 0 : t.length;
        for (this.clear(); ++n < a; ) {
          var l = t[n];
          this.set(l[0], l[1]);
        }
      }
      function C8() {
        this.__data__ = [], this.size = 0;
      }
      function x8(t) {
        var n = this.__data__, a = Dr(n, t);
        if (a < 0)
          return !1;
        var l = n.length - 1;
        return a == l ? n.pop() : Tr.call(n, a, 1), --this.size, !0;
      }
      function L8(t) {
        var n = this.__data__, a = Dr(n, t);
        return a < 0 ? i : n[a][1];
      }
      function S8(t) {
        return Dr(this.__data__, t) > -1;
      }
      function w8(t, n) {
        var a = this.__data__, l = Dr(a, t);
        return l < 0 ? (++this.size, a.push([t, n])) : a[l][1] = n, this;
      }
      on.prototype.clear = C8, on.prototype.delete = x8, on.prototype.get = L8, on.prototype.has = S8, on.prototype.set = w8;
      function an(t) {
        var n = -1, a = t == null ? 0 : t.length;
        for (this.clear(); ++n < a; ) {
          var l = t[n];
          this.set(l[0], l[1]);
        }
      }
      function k8() {
        this.size = 0, this.__data__ = {
          hash: new Wn(),
          map: new (Y1 || on)(),
          string: new Wn()
        };
      }
      function $8(t) {
        var n = jr(this, t).delete(t);
        return this.size -= n ? 1 : 0, n;
      }
      function A8(t) {
        return jr(this, t).get(t);
      }
      function M8(t) {
        return jr(this, t).has(t);
      }
      function T8(t, n) {
        var a = jr(this, t), l = a.size;
        return a.set(t, n), this.size += a.size == l ? 0 : 1, this;
      }
      an.prototype.clear = k8, an.prototype.delete = $8, an.prototype.get = A8, an.prototype.has = M8, an.prototype.set = T8;
      function Qn(t) {
        var n = -1, a = t == null ? 0 : t.length;
        for (this.__data__ = new an(); ++n < a; )
          this.add(t[n]);
      }
      function I8(t) {
        return this.__data__.set(t, g), this;
      }
      function O8(t) {
        return this.__data__.has(t);
      }
      Qn.prototype.add = Qn.prototype.push = I8, Qn.prototype.has = O8;
      function Kt(t) {
        var n = this.__data__ = new on(t);
        this.size = n.size;
      }
      function P8() {
        this.__data__ = new on(), this.size = 0;
      }
      function B8(t) {
        var n = this.__data__, a = n.delete(t);
        return this.size = n.size, a;
      }
      function E8(t) {
        return this.__data__.get(t);
      }
      function R8(t) {
        return this.__data__.has(t);
      }
      function D8(t, n) {
        var a = this.__data__;
        if (a instanceof on) {
          var l = a.__data__;
          if (!Y1 || l.length < s - 1)
            return l.push([t, n]), this.size = ++a.size, this;
          a = this.__data__ = new an(l);
        }
        return a.set(t, n), this.size = a.size, this;
      }
      Kt.prototype.clear = P8, Kt.prototype.delete = B8, Kt.prototype.get = E8, Kt.prototype.has = R8, Kt.prototype.set = D8;
      function s5(t, n) {
        var a = fe(t), l = !a && Vn(t), d = !a && !l && Bn(t), p = !a && !l && !d && p1(t), v = a || l || d || p, L = v ? li(t.length, Y3) : [], w = L.length;
        for (var P in t)
          (n || $e.call(t, P)) && !(v && // Safari 9 has enumerable `arguments.length` in strict mode.
          (P == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          d && (P == "offset" || P == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          p && (P == "buffer" || P == "byteLength" || P == "byteOffset") || // Skip index properties.
          un(P, w))) && L.push(P);
        return L;
      }
      function l5(t) {
        var n = t.length;
        return n ? t[wi(0, n - 1)] : i;
      }
      function F8(t, n) {
        return Vr(bt(t), Hn(n, 0, t.length));
      }
      function z8(t) {
        return Vr(bt(t));
      }
      function pi(t, n, a) {
        (a !== i && !Zt(t[n], a) || a === i && !(n in t)) && sn(t, n, a);
      }
      function q1(t, n, a) {
        var l = t[n];
        (!($e.call(t, n) && Zt(l, a)) || a === i && !(n in t)) && sn(t, n, a);
      }
      function Dr(t, n) {
        for (var a = t.length; a--; )
          if (Zt(t[a][0], n))
            return a;
        return -1;
      }
      function N8(t, n, a, l) {
        return Tn(t, function(d, p, v) {
          n(l, d, a(d), v);
        }), l;
      }
      function c5(t, n) {
        return t && Vt(n, et(n), t);
      }
      function U8(t, n) {
        return t && Vt(n, _t(n), t);
      }
      function sn(t, n, a) {
        n == "__proto__" && Ir ? Ir(t, n, {
          configurable: !0,
          enumerable: !0,
          value: a,
          writable: !0
        }) : t[n] = a;
      }
      function yi(t, n) {
        for (var a = -1, l = n.length, d = M(l), p = t == null; ++a < l; )
          d[a] = p ? i : Vi(t, n[a]);
        return d;
      }
      function Hn(t, n, a) {
        return t === t && (a !== i && (t = t <= a ? t : a), n !== i && (t = t >= n ? t : n)), t;
      }
      function Pt(t, n, a, l, d, p) {
        var v, L = n & b, w = n & _, P = n & x;
        if (a && (v = d ? a(t, l, d, p) : a(t)), v !== i)
          return v;
        if (!Ke(t))
          return t;
        var B = fe(t);
        if (B) {
          if (v = Ml(t), !L)
            return bt(t, v);
        } else {
          var D = it(t), j = D == Un || D == N1;
          if (Bn(t))
            return P5(t, L);
          if (D == rn || D == ye || j && !d) {
            if (v = w || j ? {} : X5(t), !L)
              return w ? bl(t, U8(v, t)) : ml(t, c5(v, t));
          } else {
            if (!Pe[D])
              return d ? t : {};
            v = Tl(t, D, L);
          }
        }
        p || (p = new Kt());
        var ne = p.get(t);
        if (ne)
          return ne;
        p.set(t, v), $a(t) ? t.forEach(function(se) {
          v.add(Pt(se, n, a, se, t, p));
        }) : wa(t) && t.forEach(function(se, _e) {
          v.set(_e, Pt(se, n, a, _e, t, p));
        });
        var ae = P ? w ? Ri : Ei : w ? _t : et, pe = B ? i : ae(t);
        return Tt(pe || t, function(se, _e) {
          pe && (_e = se, se = t[_e]), q1(v, _e, Pt(se, n, a, _e, t, p));
        }), v;
      }
      function K8(t) {
        var n = et(t);
        return function(a) {
          return u5(a, t, n);
        };
      }
      function u5(t, n, a) {
        var l = a.length;
        if (t == null)
          return !l;
        for (t = Te(t); l--; ) {
          var d = a[l], p = n[d], v = t[d];
          if (v === i && !(d in t) || !p(v))
            return !1;
        }
        return !0;
      }
      function f5(t, n, a) {
        if (typeof t != "function")
          throw new It(u);
        return ir(function() {
          t.apply(i, a);
        }, n);
      }
      function X1(t, n, a, l) {
        var d = -1, p = _r, v = !0, L = t.length, w = [], P = n.length;
        if (!L)
          return w;
        a && (n = De(n, Lt(a))), l ? (p = ni, v = !1) : n.length >= s && (p = Q1, v = !1, n = new Qn(n));
        e:
          for (; ++d < L; ) {
            var B = t[d], D = a == null ? B : a(B);
            if (B = l || B !== 0 ? B : 0, v && D === D) {
              for (var j = P; j--; )
                if (n[j] === D)
                  continue e;
              w.push(B);
            } else
              p(n, D, l) || w.push(B);
          }
        return w;
      }
      var Tn = F5(jt), d5 = F5(bi, !0);
      function Z8(t, n) {
        var a = !0;
        return Tn(t, function(l, d, p) {
          return a = !!n(l, d, p), a;
        }), a;
      }
      function Fr(t, n, a) {
        for (var l = -1, d = t.length; ++l < d; ) {
          var p = t[l], v = n(p);
          if (v != null && (L === i ? v === v && !wt(v) : a(v, L)))
            var L = v, w = p;
        }
        return w;
      }
      function W8(t, n, a, l) {
        var d = t.length;
        for (a = ge(a), a < 0 && (a = -a > d ? 0 : d + a), l = l === i || l > d ? d : ge(l), l < 0 && (l += d), l = a > l ? 0 : Ma(l); a < l; )
          t[a++] = n;
        return t;
      }
      function h5(t, n) {
        var a = [];
        return Tn(t, function(l, d, p) {
          n(l, d, p) && a.push(l);
        }), a;
      }
      function nt(t, n, a, l, d) {
        var p = -1, v = t.length;
        for (a || (a = Ol), d || (d = []); ++p < v; ) {
          var L = t[p];
          n > 0 && a(L) ? n > 1 ? nt(L, n - 1, a, l, d) : $n(d, L) : l || (d[d.length] = L);
        }
        return d;
      }
      var mi = z5(), g5 = z5(!0);
      function jt(t, n) {
        return t && mi(t, n, et);
      }
      function bi(t, n) {
        return t && g5(t, n, et);
      }
      function zr(t, n) {
        return kn(n, function(a) {
          return fn(t[a]);
        });
      }
      function Yn(t, n) {
        n = On(n, t);
        for (var a = 0, l = n.length; t != null && a < l; )
          t = t[qt(n[a++])];
        return a && a == l ? t : i;
      }
      function p5(t, n, a) {
        var l = n(t);
        return fe(t) ? l : $n(l, a(t));
      }
      function ut(t) {
        return t == null ? t === i ? v6 : m6 : Zn && Zn in Te(t) ? kl(t) : zl(t);
      }
      function vi(t, n) {
        return t > n;
      }
      function Q8(t, n) {
        return t != null && $e.call(t, n);
      }
      function H8(t, n) {
        return t != null && n in Te(t);
      }
      function Y8(t, n, a) {
        return t >= rt(n, a) && t < Je(n, a);
      }
      function _i(t, n, a) {
        for (var l = a ? ni : _r, d = t[0].length, p = t.length, v = p, L = M(p), w = 1 / 0, P = []; v--; ) {
          var B = t[v];
          v && n && (B = De(B, Lt(n))), w = rt(B.length, w), L[v] = !a && (n || d >= 120 && B.length >= 120) ? new Qn(v && B) : i;
        }
        B = t[0];
        var D = -1, j = L[0];
        e:
          for (; ++D < d && P.length < w; ) {
            var ne = B[D], ae = n ? n(ne) : ne;
            if (ne = a || ne !== 0 ? ne : 0, !(j ? Q1(j, ae) : l(P, ae, a))) {
              for (v = p; --v; ) {
                var pe = L[v];
                if (!(pe ? Q1(pe, ae) : l(t[v], ae, a)))
                  continue e;
              }
              j && j.push(ae), P.push(ne);
            }
          }
        return P;
      }
      function G8(t, n, a, l) {
        return jt(t, function(d, p, v) {
          n(l, a(d), p, v);
        }), l;
      }
      function J1(t, n, a) {
        n = On(n, t), t = na(t, n);
        var l = t == null ? t : t[qt(Et(n))];
        return l == null ? i : xt(l, t, a);
      }
      function y5(t) {
        return Ze(t) && ut(t) == ye;
      }
      function j8(t) {
        return Ze(t) && ut(t) == W1;
      }
      function V8(t) {
        return Ze(t) && ut(t) == Me;
      }
      function er(t, n, a, l, d) {
        return t === n ? !0 : t == null || n == null || !Ze(t) && !Ze(n) ? t !== t && n !== n : q8(t, n, a, l, er, d);
      }
      function q8(t, n, a, l, d, p) {
        var v = fe(t), L = fe(n), w = v ? qe : it(t), P = L ? qe : it(n);
        w = w == ye ? rn : w, P = P == ye ? rn : P;
        var B = w == rn, D = P == rn, j = w == P;
        if (j && Bn(t)) {
          if (!Bn(n))
            return !1;
          v = !0, B = !1;
        }
        if (j && !B)
          return p || (p = new Kt()), v || p1(t) ? j5(t, n, a, l, d, p) : Sl(t, n, w, a, l, d, p);
        if (!(a & k)) {
          var ne = B && $e.call(t, "__wrapped__"), ae = D && $e.call(n, "__wrapped__");
          if (ne || ae) {
            var pe = ne ? t.value() : t, se = ae ? n.value() : n;
            return p || (p = new Kt()), d(pe, se, a, l, p);
          }
        }
        return j ? (p || (p = new Kt()), wl(t, n, a, l, d, p)) : !1;
      }
      function X8(t) {
        return Ze(t) && it(t) == mt;
      }
      function Ci(t, n, a, l) {
        var d = a.length, p = d, v = !l;
        if (t == null)
          return !p;
        for (t = Te(t); d--; ) {
          var L = a[d];
          if (v && L[2] ? L[1] !== t[L[0]] : !(L[0] in t))
            return !1;
        }
        for (; ++d < p; ) {
          L = a[d];
          var w = L[0], P = t[w], B = L[1];
          if (v && L[2]) {
            if (P === i && !(w in t))
              return !1;
          } else {
            var D = new Kt();
            if (l)
              var j = l(P, B, w, t, n, D);
            if (!(j === i ? er(B, P, k | T, l, D) : j))
              return !1;
          }
        }
        return !0;
      }
      function m5(t) {
        if (!Ke(t) || Bl(t))
          return !1;
        var n = fn(t) ? X3 : K6;
        return n.test(jn(t));
      }
      function J8(t) {
        return Ze(t) && ut(t) == U1;
      }
      function el(t) {
        return Ze(t) && it(t) == Nt;
      }
      function tl(t) {
        return Ze(t) && n0(t.length) && !!Ee[ut(t)];
      }
      function b5(t) {
        return typeof t == "function" ? t : t == null ? Ct : typeof t == "object" ? fe(t) ? C5(t[0], t[1]) : _5(t) : Na(t);
      }
      function xi(t) {
        if (!rr(t))
          return i8(t);
        var n = [];
        for (var a in Te(t))
          $e.call(t, a) && a != "constructor" && n.push(a);
        return n;
      }
      function nl(t) {
        if (!Ke(t))
          return Fl(t);
        var n = rr(t), a = [];
        for (var l in t)
          l == "constructor" && (n || !$e.call(t, l)) || a.push(l);
        return a;
      }
      function Li(t, n) {
        return t < n;
      }
      function v5(t, n) {
        var a = -1, l = vt(t) ? M(t.length) : [];
        return Tn(t, function(d, p, v) {
          l[++a] = n(d, p, v);
        }), l;
      }
      function _5(t) {
        var n = Fi(t);
        return n.length == 1 && n[0][2] ? ea(n[0][0], n[0][1]) : function(a) {
          return a === t || Ci(a, t, n);
        };
      }
      function C5(t, n) {
        return Ni(t) && J5(n) ? ea(qt(t), n) : function(a) {
          var l = Vi(a, t);
          return l === i && l === n ? qi(a, t) : er(n, l, k | T);
        };
      }
      function Nr(t, n, a, l, d) {
        t !== n && mi(n, function(p, v) {
          if (d || (d = new Kt()), Ke(p))
            rl(t, n, v, a, Nr, l, d);
          else {
            var L = l ? l(Ki(t, v), p, v + "", t, n, d) : i;
            L === i && (L = p), pi(t, v, L);
          }
        }, _t);
      }
      function rl(t, n, a, l, d, p, v) {
        var L = Ki(t, a), w = Ki(n, a), P = v.get(w);
        if (P) {
          pi(t, a, P);
          return;
        }
        var B = p ? p(L, w, a + "", t, n, v) : i, D = B === i;
        if (D) {
          var j = fe(w), ne = !j && Bn(w), ae = !j && !ne && p1(w);
          B = w, j || ne || ae ? fe(L) ? B = L : Qe(L) ? B = bt(L) : ne ? (D = !1, B = P5(w, !0)) : ae ? (D = !1, B = B5(w, !0)) : B = [] : or(w) || Vn(w) ? (B = L, Vn(L) ? B = Ta(L) : (!Ke(L) || fn(L)) && (B = X5(w))) : D = !1;
        }
        D && (v.set(w, B), d(B, w, l, p, v), v.delete(w)), pi(t, a, B);
      }
      function x5(t, n) {
        var a = t.length;
        if (a)
          return n += n < 0 ? a : 0, un(n, a) ? t[n] : i;
      }
      function L5(t, n, a) {
        n.length ? n = De(n, function(p) {
          return fe(p) ? function(v) {
            return Yn(v, p.length === 1 ? p[0] : p);
          } : p;
        }) : n = [Ct];
        var l = -1;
        n = De(n, Lt(oe()));
        var d = v5(t, function(p, v, L) {
          var w = De(n, function(P) {
            return P(p);
          });
          return { criteria: w, index: ++l, value: p };
        });
        return T3(d, function(p, v) {
          return yl(p, v, a);
        });
      }
      function il(t, n) {
        return S5(t, n, function(a, l) {
          return qi(t, l);
        });
      }
      function S5(t, n, a) {
        for (var l = -1, d = n.length, p = {}; ++l < d; ) {
          var v = n[l], L = Yn(t, v);
          a(L, v) && tr(p, On(v, t), L);
        }
        return p;
      }
      function ol(t) {
        return function(n) {
          return Yn(n, t);
        };
      }
      function Si(t, n, a, l) {
        var d = l ? M3 : i1, p = -1, v = n.length, L = t;
        for (t === n && (n = bt(n)), a && (L = De(t, Lt(a))); ++p < v; )
          for (var w = 0, P = n[p], B = a ? a(P) : P; (w = d(L, B, w, l)) > -1; )
            L !== t && Tr.call(L, w, 1), Tr.call(t, w, 1);
        return t;
      }
      function w5(t, n) {
        for (var a = t ? n.length : 0, l = a - 1; a--; ) {
          var d = n[a];
          if (a == l || d !== p) {
            var p = d;
            un(d) ? Tr.call(t, d, 1) : Ai(t, d);
          }
        }
        return t;
      }
      function wi(t, n) {
        return t + Pr(o5() * (n - t + 1));
      }
      function al(t, n, a, l) {
        for (var d = -1, p = Je(Or((n - t) / (a || 1)), 0), v = M(p); p--; )
          v[l ? p : ++d] = t, t += a;
        return v;
      }
      function ki(t, n) {
        var a = "";
        if (!t || n < 1 || n > ce)
          return a;
        do
          n % 2 && (a += t), n = Pr(n / 2), n && (t += t);
        while (n);
        return a;
      }
      function me(t, n) {
        return Zi(ta(t, n, Ct), t + "");
      }
      function sl(t) {
        return l5(y1(t));
      }
      function ll(t, n) {
        var a = y1(t);
        return Vr(a, Hn(n, 0, a.length));
      }
      function tr(t, n, a, l) {
        if (!Ke(t))
          return t;
        n = On(n, t);
        for (var d = -1, p = n.length, v = p - 1, L = t; L != null && ++d < p; ) {
          var w = qt(n[d]), P = a;
          if (w === "__proto__" || w === "constructor" || w === "prototype")
            return t;
          if (d != v) {
            var B = L[w];
            P = l ? l(B, w, L) : i, P === i && (P = Ke(B) ? B : un(n[d + 1]) ? [] : {});
          }
          q1(L, w, P), L = L[w];
        }
        return t;
      }
      var k5 = Br ? function(t, n) {
        return Br.set(t, n), t;
      } : Ct, cl = Ir ? function(t, n) {
        return Ir(t, "toString", {
          configurable: !0,
          enumerable: !1,
          value: Ji(n),
          writable: !0
        });
      } : Ct;
      function ul(t) {
        return Vr(y1(t));
      }
      function Bt(t, n, a) {
        var l = -1, d = t.length;
        n < 0 && (n = -n > d ? 0 : d + n), a = a > d ? d : a, a < 0 && (a += d), d = n > a ? 0 : a - n >>> 0, n >>>= 0;
        for (var p = M(d); ++l < d; )
          p[l] = t[l + n];
        return p;
      }
      function fl(t, n) {
        var a;
        return Tn(t, function(l, d, p) {
          return a = n(l, d, p), !a;
        }), !!a;
      }
      function Ur(t, n, a) {
        var l = 0, d = t == null ? l : t.length;
        if (typeof n == "number" && n === n && d <= yt) {
          for (; l < d; ) {
            var p = l + d >>> 1, v = t[p];
            v !== null && !wt(v) && (a ? v <= n : v < n) ? l = p + 1 : d = p;
          }
          return d;
        }
        return $i(t, n, Ct, a);
      }
      function $i(t, n, a, l) {
        var d = 0, p = t == null ? 0 : t.length;
        if (p === 0)
          return 0;
        n = a(n);
        for (var v = n !== n, L = n === null, w = wt(n), P = n === i; d < p; ) {
          var B = Pr((d + p) / 2), D = a(t[B]), j = D !== i, ne = D === null, ae = D === D, pe = wt(D);
          if (v)
            var se = l || ae;
          else
            P ? se = ae && (l || j) : L ? se = ae && j && (l || !ne) : w ? se = ae && j && !ne && (l || !pe) : ne || pe ? se = !1 : se = l ? D <= n : D < n;
          se ? d = B + 1 : p = B;
        }
        return rt(p, lt);
      }
      function $5(t, n) {
        for (var a = -1, l = t.length, d = 0, p = []; ++a < l; ) {
          var v = t[a], L = n ? n(v) : v;
          if (!a || !Zt(L, w)) {
            var w = L;
            p[d++] = v === 0 ? 0 : v;
          }
        }
        return p;
      }
      function A5(t) {
        return typeof t == "number" ? t : wt(t) ? be : +t;
      }
      function St(t) {
        if (typeof t == "string")
          return t;
        if (fe(t))
          return De(t, St) + "";
        if (wt(t))
          return a5 ? a5.call(t) : "";
        var n = t + "";
        return n == "0" && 1 / t == -ie ? "-0" : n;
      }
      function In(t, n, a) {
        var l = -1, d = _r, p = t.length, v = !0, L = [], w = L;
        if (a)
          v = !1, d = ni;
        else if (p >= s) {
          var P = n ? null : xl(t);
          if (P)
            return xr(P);
          v = !1, d = Q1, w = new Qn();
        } else
          w = n ? [] : L;
        e:
          for (; ++l < p; ) {
            var B = t[l], D = n ? n(B) : B;
            if (B = a || B !== 0 ? B : 0, v && D === D) {
              for (var j = w.length; j--; )
                if (w[j] === D)
                  continue e;
              n && w.push(D), L.push(B);
            } else
              d(w, D, a) || (w !== L && w.push(D), L.push(B));
          }
        return L;
      }
      function Ai(t, n) {
        return n = On(n, t), t = na(t, n), t == null || delete t[qt(Et(n))];
      }
      function M5(t, n, a, l) {
        return tr(t, n, a(Yn(t, n)), l);
      }
      function Kr(t, n, a, l) {
        for (var d = t.length, p = l ? d : -1; (l ? p-- : ++p < d) && n(t[p], p, t); )
          ;
        return a ? Bt(t, l ? 0 : p, l ? p + 1 : d) : Bt(t, l ? p + 1 : 0, l ? d : p);
      }
      function T5(t, n) {
        var a = t;
        return a instanceof xe && (a = a.value()), ri(n, function(l, d) {
          return d.func.apply(d.thisArg, $n([l], d.args));
        }, a);
      }
      function Mi(t, n, a) {
        var l = t.length;
        if (l < 2)
          return l ? In(t[0]) : [];
        for (var d = -1, p = M(l); ++d < l; )
          for (var v = t[d], L = -1; ++L < l; )
            L != d && (p[d] = X1(p[d] || v, t[L], n, a));
        return In(nt(p, 1), n, a);
      }
      function I5(t, n, a) {
        for (var l = -1, d = t.length, p = n.length, v = {}; ++l < d; ) {
          var L = l < p ? n[l] : i;
          a(v, t[l], L);
        }
        return v;
      }
      function Ti(t) {
        return Qe(t) ? t : [];
      }
      function Ii(t) {
        return typeof t == "function" ? t : Ct;
      }
      function On(t, n) {
        return fe(t) ? t : Ni(t, n) ? [t] : aa(ke(t));
      }
      var dl = me;
      function Pn(t, n, a) {
        var l = t.length;
        return a = a === i ? l : a, !n && a >= l ? t : Bt(t, n, a);
      }
      var O5 = J3 || function(t) {
        return tt.clearTimeout(t);
      };
      function P5(t, n) {
        if (n)
          return t.slice();
        var a = t.length, l = e5 ? e5(a) : new t.constructor(a);
        return t.copy(l), l;
      }
      function Oi(t) {
        var n = new t.constructor(t.byteLength);
        return new Ar(n).set(new Ar(t)), n;
      }
      function hl(t, n) {
        var a = n ? Oi(t.buffer) : t.buffer;
        return new t.constructor(a, t.byteOffset, t.byteLength);
      }
      function gl(t) {
        var n = new t.constructor(t.source, y9.exec(t));
        return n.lastIndex = t.lastIndex, n;
      }
      function pl(t) {
        return V1 ? Te(V1.call(t)) : {};
      }
      function B5(t, n) {
        var a = n ? Oi(t.buffer) : t.buffer;
        return new t.constructor(a, t.byteOffset, t.length);
      }
      function E5(t, n) {
        if (t !== n) {
          var a = t !== i, l = t === null, d = t === t, p = wt(t), v = n !== i, L = n === null, w = n === n, P = wt(n);
          if (!L && !P && !p && t > n || p && v && w && !L && !P || l && v && w || !a && w || !d)
            return 1;
          if (!l && !p && !P && t < n || P && a && d && !l && !p || L && a && d || !v && d || !w)
            return -1;
        }
        return 0;
      }
      function yl(t, n, a) {
        for (var l = -1, d = t.criteria, p = n.criteria, v = d.length, L = a.length; ++l < v; ) {
          var w = E5(d[l], p[l]);
          if (w) {
            if (l >= L)
              return w;
            var P = a[l];
            return w * (P == "desc" ? -1 : 1);
          }
        }
        return t.index - n.index;
      }
      function R5(t, n, a, l) {
        for (var d = -1, p = t.length, v = a.length, L = -1, w = n.length, P = Je(p - v, 0), B = M(w + P), D = !l; ++L < w; )
          B[L] = n[L];
        for (; ++d < v; )
          (D || d < p) && (B[a[d]] = t[d]);
        for (; P--; )
          B[L++] = t[d++];
        return B;
      }
      function D5(t, n, a, l) {
        for (var d = -1, p = t.length, v = -1, L = a.length, w = -1, P = n.length, B = Je(p - L, 0), D = M(B + P), j = !l; ++d < B; )
          D[d] = t[d];
        for (var ne = d; ++w < P; )
          D[ne + w] = n[w];
        for (; ++v < L; )
          (j || d < p) && (D[ne + a[v]] = t[d++]);
        return D;
      }
      function bt(t, n) {
        var a = -1, l = t.length;
        for (n || (n = M(l)); ++a < l; )
          n[a] = t[a];
        return n;
      }
      function Vt(t, n, a, l) {
        var d = !a;
        a || (a = {});
        for (var p = -1, v = n.length; ++p < v; ) {
          var L = n[p], w = l ? l(a[L], t[L], L, a, t) : i;
          w === i && (w = t[L]), d ? sn(a, L, w) : q1(a, L, w);
        }
        return a;
      }
      function ml(t, n) {
        return Vt(t, zi(t), n);
      }
      function bl(t, n) {
        return Vt(t, V5(t), n);
      }
      function Zr(t, n) {
        return function(a, l) {
          var d = fe(a) ? L3 : N8, p = n ? n() : {};
          return d(a, t, oe(l, 2), p);
        };
      }
      function d1(t) {
        return me(function(n, a) {
          var l = -1, d = a.length, p = d > 1 ? a[d - 1] : i, v = d > 2 ? a[2] : i;
          for (p = t.length > 3 && typeof p == "function" ? (d--, p) : i, v && ft(a[0], a[1], v) && (p = d < 3 ? i : p, d = 1), n = Te(n); ++l < d; ) {
            var L = a[l];
            L && t(n, L, l, p);
          }
          return n;
        });
      }
      function F5(t, n) {
        return function(a, l) {
          if (a == null)
            return a;
          if (!vt(a))
            return t(a, l);
          for (var d = a.length, p = n ? d : -1, v = Te(a); (n ? p-- : ++p < d) && l(v[p], p, v) !== !1; )
            ;
          return a;
        };
      }
      function z5(t) {
        return function(n, a, l) {
          for (var d = -1, p = Te(n), v = l(n), L = v.length; L--; ) {
            var w = v[t ? L : ++d];
            if (a(p[w], w, p) === !1)
              break;
          }
          return n;
        };
      }
      function vl(t, n, a) {
        var l = n & $, d = nr(t);
        function p() {
          var v = this && this !== tt && this instanceof p ? d : t;
          return v.apply(l ? a : this, arguments);
        }
        return p;
      }
      function N5(t) {
        return function(n) {
          n = ke(n);
          var a = o1(n) ? Ut(n) : i, l = a ? a[0] : n.charAt(0), d = a ? Pn(a, 1).join("") : n.slice(1);
          return l[t]() + d;
        };
      }
      function h1(t) {
        return function(n) {
          return ri(Fa(Da(n).replace(c3, "")), t, "");
        };
      }
      function nr(t) {
        return function() {
          var n = arguments;
          switch (n.length) {
            case 0:
              return new t();
            case 1:
              return new t(n[0]);
            case 2:
              return new t(n[0], n[1]);
            case 3:
              return new t(n[0], n[1], n[2]);
            case 4:
              return new t(n[0], n[1], n[2], n[3]);
            case 5:
              return new t(n[0], n[1], n[2], n[3], n[4]);
            case 6:
              return new t(n[0], n[1], n[2], n[3], n[4], n[5]);
            case 7:
              return new t(n[0], n[1], n[2], n[3], n[4], n[5], n[6]);
          }
          var a = f1(t.prototype), l = t.apply(a, n);
          return Ke(l) ? l : a;
        };
      }
      function _l(t, n, a) {
        var l = nr(t);
        function d() {
          for (var p = arguments.length, v = M(p), L = p, w = g1(d); L--; )
            v[L] = arguments[L];
          var P = p < 3 && v[0] !== w && v[p - 1] !== w ? [] : An(v, w);
          if (p -= P.length, p < a)
            return Q5(
              t,
              n,
              Wr,
              d.placeholder,
              i,
              v,
              P,
              i,
              i,
              a - p
            );
          var B = this && this !== tt && this instanceof d ? l : t;
          return xt(B, this, v);
        }
        return d;
      }
      function U5(t) {
        return function(n, a, l) {
          var d = Te(n);
          if (!vt(n)) {
            var p = oe(a, 3);
            n = et(n), a = function(L) {
              return p(d[L], L, d);
            };
          }
          var v = t(n, a, l);
          return v > -1 ? d[p ? n[v] : v] : i;
        };
      }
      function K5(t) {
        return cn(function(n) {
          var a = n.length, l = a, d = Ot.prototype.thru;
          for (t && n.reverse(); l--; ) {
            var p = n[l];
            if (typeof p != "function")
              throw new It(u);
            if (d && !v && Gr(p) == "wrapper")
              var v = new Ot([], !0);
          }
          for (l = v ? l : a; ++l < a; ) {
            p = n[l];
            var L = Gr(p), w = L == "wrapper" ? Di(p) : i;
            w && Ui(w[0]) && w[1] == (I | Z | V | q) && !w[4].length && w[9] == 1 ? v = v[Gr(w[0])].apply(v, w[3]) : v = p.length == 1 && Ui(p) ? v[L]() : v.thru(p);
          }
          return function() {
            var P = arguments, B = P[0];
            if (v && P.length == 1 && fe(B))
              return v.plant(B).value();
            for (var D = 0, j = a ? n[D].apply(this, P) : B; ++D < a; )
              j = n[D].call(this, j);
            return j;
          };
        });
      }
      function Wr(t, n, a, l, d, p, v, L, w, P) {
        var B = n & I, D = n & $, j = n & A, ne = n & (Z | N), ae = n & H, pe = j ? i : nr(t);
        function se() {
          for (var _e = arguments.length, Le = M(_e), kt = _e; kt--; )
            Le[kt] = arguments[kt];
          if (ne)
            var dt = g1(se), $t = O3(Le, dt);
          if (l && (Le = R5(Le, l, d, ne)), p && (Le = D5(Le, p, v, ne)), _e -= $t, ne && _e < P) {
            var He = An(Le, dt);
            return Q5(
              t,
              n,
              Wr,
              se.placeholder,
              a,
              Le,
              He,
              L,
              w,
              P - _e
            );
          }
          var Wt = D ? a : this, hn = j ? Wt[t] : t;
          return _e = Le.length, L ? Le = Nl(Le, L) : ae && _e > 1 && Le.reverse(), B && w < _e && (Le.length = w), this && this !== tt && this instanceof se && (hn = pe || nr(hn)), hn.apply(Wt, Le);
        }
        return se;
      }
      function Z5(t, n) {
        return function(a, l) {
          return G8(a, t, n(l), {});
        };
      }
      function Qr(t, n) {
        return function(a, l) {
          var d;
          if (a === i && l === i)
            return n;
          if (a !== i && (d = a), l !== i) {
            if (d === i)
              return l;
            typeof a == "string" || typeof l == "string" ? (a = St(a), l = St(l)) : (a = A5(a), l = A5(l)), d = t(a, l);
          }
          return d;
        };
      }
      function Pi(t) {
        return cn(function(n) {
          return n = De(n, Lt(oe())), me(function(a) {
            var l = this;
            return t(n, function(d) {
              return xt(d, l, a);
            });
          });
        });
      }
      function Hr(t, n) {
        n = n === i ? " " : St(n);
        var a = n.length;
        if (a < 2)
          return a ? ki(n, t) : n;
        var l = ki(n, Or(t / a1(n)));
        return o1(n) ? Pn(Ut(l), 0, t).join("") : l.slice(0, t);
      }
      function Cl(t, n, a, l) {
        var d = n & $, p = nr(t);
        function v() {
          for (var L = -1, w = arguments.length, P = -1, B = l.length, D = M(B + w), j = this && this !== tt && this instanceof v ? p : t; ++P < B; )
            D[P] = l[P];
          for (; w--; )
            D[P++] = arguments[++L];
          return xt(j, d ? a : this, D);
        }
        return v;
      }
      function W5(t) {
        return function(n, a, l) {
          return l && typeof l != "number" && ft(n, a, l) && (a = l = i), n = dn(n), a === i ? (a = n, n = 0) : a = dn(a), l = l === i ? n < a ? 1 : -1 : dn(l), al(n, a, l, t);
        };
      }
      function Yr(t) {
        return function(n, a) {
          return typeof n == "string" && typeof a == "string" || (n = Rt(n), a = Rt(a)), t(n, a);
        };
      }
      function Q5(t, n, a, l, d, p, v, L, w, P) {
        var B = n & Z, D = B ? v : i, j = B ? i : v, ne = B ? p : i, ae = B ? i : p;
        n |= B ? V : Q, n &= ~(B ? Q : V), n & F || (n &= ~($ | A));
        var pe = [
          t,
          n,
          d,
          ne,
          D,
          ae,
          j,
          L,
          w,
          P
        ], se = a.apply(i, pe);
        return Ui(t) && ra(se, pe), se.placeholder = l, ia(se, t, n);
      }
      function Bi(t) {
        var n = Xe[t];
        return function(a, l) {
          if (a = Rt(a), l = l == null ? 0 : rt(ge(l), 292), l && i5(a)) {
            var d = (ke(a) + "e").split("e"), p = n(d[0] + "e" + (+d[1] + l));
            return d = (ke(p) + "e").split("e"), +(d[0] + "e" + (+d[1] - l));
          }
          return n(a);
        };
      }
      var xl = c1 && 1 / xr(new c1([, -0]))[1] == ie ? function(t) {
        return new c1(t);
      } : no;
      function H5(t) {
        return function(n) {
          var a = it(n);
          return a == mt ? ui(n) : a == Nt ? z3(n) : I3(n, t(n));
        };
      }
      function ln(t, n, a, l, d, p, v, L) {
        var w = n & A;
        if (!w && typeof t != "function")
          throw new It(u);
        var P = l ? l.length : 0;
        if (P || (n &= ~(V | Q), l = d = i), v = v === i ? v : Je(ge(v), 0), L = L === i ? L : ge(L), P -= d ? d.length : 0, n & Q) {
          var B = l, D = d;
          l = d = i;
        }
        var j = w ? i : Di(t), ne = [
          t,
          n,
          a,
          l,
          d,
          B,
          D,
          p,
          v,
          L
        ];
        if (j && Dl(ne, j), t = ne[0], n = ne[1], a = ne[2], l = ne[3], d = ne[4], L = ne[9] = ne[9] === i ? w ? 0 : t.length : Je(ne[9] - P, 0), !L && n & (Z | N) && (n &= ~(Z | N)), !n || n == $)
          var ae = vl(t, n, a);
        else
          n == Z || n == N ? ae = _l(t, n, L) : (n == V || n == ($ | V)) && !d.length ? ae = Cl(t, n, a, l) : ae = Wr.apply(i, ne);
        var pe = j ? k5 : ra;
        return ia(pe(ae, ne), t, n);
      }
      function Y5(t, n, a, l) {
        return t === i || Zt(t, l1[a]) && !$e.call(l, a) ? n : t;
      }
      function G5(t, n, a, l, d, p) {
        return Ke(t) && Ke(n) && (p.set(n, t), Nr(t, n, i, G5, p), p.delete(n)), t;
      }
      function Ll(t) {
        return or(t) ? i : t;
      }
      function j5(t, n, a, l, d, p) {
        var v = a & k, L = t.length, w = n.length;
        if (L != w && !(v && w > L))
          return !1;
        var P = p.get(t), B = p.get(n);
        if (P && B)
          return P == n && B == t;
        var D = -1, j = !0, ne = a & T ? new Qn() : i;
        for (p.set(t, n), p.set(n, t); ++D < L; ) {
          var ae = t[D], pe = n[D];
          if (l)
            var se = v ? l(pe, ae, D, n, t, p) : l(ae, pe, D, t, n, p);
          if (se !== i) {
            if (se)
              continue;
            j = !1;
            break;
          }
          if (ne) {
            if (!ii(n, function(_e, Le) {
              if (!Q1(ne, Le) && (ae === _e || d(ae, _e, a, l, p)))
                return ne.push(Le);
            })) {
              j = !1;
              break;
            }
          } else if (!(ae === pe || d(ae, pe, a, l, p))) {
            j = !1;
            break;
          }
        }
        return p.delete(t), p.delete(n), j;
      }
      function Sl(t, n, a, l, d, p, v) {
        switch (a) {
          case n1:
            if (t.byteLength != n.byteLength || t.byteOffset != n.byteOffset)
              return !1;
            t = t.buffer, n = n.buffer;
          case W1:
            return !(t.byteLength != n.byteLength || !p(new Ar(t), new Ar(n)));
          case Ue:
          case Me:
          case ct:
            return Zt(+t, +n);
          case Nn:
            return t.name == n.name && t.message == n.message;
          case U1:
          case K1:
            return t == n + "";
          case mt:
            var L = ui;
          case Nt:
            var w = l & k;
            if (L || (L = xr), t.size != n.size && !w)
              return !1;
            var P = v.get(t);
            if (P)
              return P == n;
            l |= T, v.set(t, n);
            var B = j5(L(t), L(n), l, d, p, v);
            return v.delete(t), B;
          case yr:
            if (V1)
              return V1.call(t) == V1.call(n);
        }
        return !1;
      }
      function wl(t, n, a, l, d, p) {
        var v = a & k, L = Ei(t), w = L.length, P = Ei(n), B = P.length;
        if (w != B && !v)
          return !1;
        for (var D = w; D--; ) {
          var j = L[D];
          if (!(v ? j in n : $e.call(n, j)))
            return !1;
        }
        var ne = p.get(t), ae = p.get(n);
        if (ne && ae)
          return ne == n && ae == t;
        var pe = !0;
        p.set(t, n), p.set(n, t);
        for (var se = v; ++D < w; ) {
          j = L[D];
          var _e = t[j], Le = n[j];
          if (l)
            var kt = v ? l(Le, _e, j, n, t, p) : l(_e, Le, j, t, n, p);
          if (!(kt === i ? _e === Le || d(_e, Le, a, l, p) : kt)) {
            pe = !1;
            break;
          }
          se || (se = j == "constructor");
        }
        if (pe && !se) {
          var dt = t.constructor, $t = n.constructor;
          dt != $t && "constructor" in t && "constructor" in n && !(typeof dt == "function" && dt instanceof dt && typeof $t == "function" && $t instanceof $t) && (pe = !1);
        }
        return p.delete(t), p.delete(n), pe;
      }
      function cn(t) {
        return Zi(ta(t, i, ua), t + "");
      }
      function Ei(t) {
        return p5(t, et, zi);
      }
      function Ri(t) {
        return p5(t, _t, V5);
      }
      var Di = Br ? function(t) {
        return Br.get(t);
      } : no;
      function Gr(t) {
        for (var n = t.name + "", a = u1[n], l = $e.call(u1, n) ? a.length : 0; l--; ) {
          var d = a[l], p = d.func;
          if (p == null || p == t)
            return d.name;
        }
        return n;
      }
      function g1(t) {
        var n = $e.call(h, "placeholder") ? h : t;
        return n.placeholder;
      }
      function oe() {
        var t = h.iteratee || eo;
        return t = t === eo ? b5 : t, arguments.length ? t(arguments[0], arguments[1]) : t;
      }
      function jr(t, n) {
        var a = t.__data__;
        return Pl(n) ? a[typeof n == "string" ? "string" : "hash"] : a.map;
      }
      function Fi(t) {
        for (var n = et(t), a = n.length; a--; ) {
          var l = n[a], d = t[l];
          n[a] = [l, d, J5(d)];
        }
        return n;
      }
      function Gn(t, n) {
        var a = R3(t, n);
        return m5(a) ? a : i;
      }
      function kl(t) {
        var n = $e.call(t, Zn), a = t[Zn];
        try {
          t[Zn] = i;
          var l = !0;
        } catch {
        }
        var d = kr.call(t);
        return l && (n ? t[Zn] = a : delete t[Zn]), d;
      }
      var zi = di ? function(t) {
        return t == null ? [] : (t = Te(t), kn(di(t), function(n) {
          return n5.call(t, n);
        }));
      } : ro, V5 = di ? function(t) {
        for (var n = []; t; )
          $n(n, zi(t)), t = Mr(t);
        return n;
      } : ro, it = ut;
      (hi && it(new hi(new ArrayBuffer(1))) != n1 || Y1 && it(new Y1()) != mt || gi && it(gi.resolve()) != d9 || c1 && it(new c1()) != Nt || G1 && it(new G1()) != Z1) && (it = function(t) {
        var n = ut(t), a = n == rn ? t.constructor : i, l = a ? jn(a) : "";
        if (l)
          switch (l) {
            case l8:
              return n1;
            case c8:
              return mt;
            case u8:
              return d9;
            case f8:
              return Nt;
            case d8:
              return Z1;
          }
        return n;
      });
      function $l(t, n, a) {
        for (var l = -1, d = a.length; ++l < d; ) {
          var p = a[l], v = p.size;
          switch (p.type) {
            case "drop":
              t += v;
              break;
            case "dropRight":
              n -= v;
              break;
            case "take":
              n = rt(n, t + v);
              break;
            case "takeRight":
              t = Je(t, n - v);
              break;
          }
        }
        return { start: t, end: n };
      }
      function Al(t) {
        var n = t.match(B6);
        return n ? n[1].split(E6) : [];
      }
      function q5(t, n, a) {
        n = On(n, t);
        for (var l = -1, d = n.length, p = !1; ++l < d; ) {
          var v = qt(n[l]);
          if (!(p = t != null && a(t, v)))
            break;
          t = t[v];
        }
        return p || ++l != d ? p : (d = t == null ? 0 : t.length, !!d && n0(d) && un(v, d) && (fe(t) || Vn(t)));
      }
      function Ml(t) {
        var n = t.length, a = new t.constructor(n);
        return n && typeof t[0] == "string" && $e.call(t, "index") && (a.index = t.index, a.input = t.input), a;
      }
      function X5(t) {
        return typeof t.constructor == "function" && !rr(t) ? f1(Mr(t)) : {};
      }
      function Tl(t, n, a) {
        var l = t.constructor;
        switch (n) {
          case W1:
            return Oi(t);
          case Ue:
          case Me:
            return new l(+t);
          case n1:
            return hl(t, a);
          case F0:
          case z0:
          case N0:
          case U0:
          case K0:
          case Z0:
          case W0:
          case Q0:
          case H0:
            return B5(t, a);
          case mt:
            return new l();
          case ct:
          case K1:
            return new l(t);
          case U1:
            return gl(t);
          case Nt:
            return new l();
          case yr:
            return pl(t);
        }
      }
      function Il(t, n) {
        var a = n.length;
        if (!a)
          return t;
        var l = a - 1;
        return n[l] = (a > 1 ? "& " : "") + n[l], n = n.join(a > 2 ? ", " : " "), t.replace(P6, `{
/* [wrapped with ` + n + `] */
`);
      }
      function Ol(t) {
        return fe(t) || Vn(t) || !!(r5 && t && t[r5]);
      }
      function un(t, n) {
        var a = typeof t;
        return n = n ?? ce, !!n && (a == "number" || a != "symbol" && W6.test(t)) && t > -1 && t % 1 == 0 && t < n;
      }
      function ft(t, n, a) {
        if (!Ke(a))
          return !1;
        var l = typeof n;
        return (l == "number" ? vt(a) && un(n, a.length) : l == "string" && n in a) ? Zt(a[n], t) : !1;
      }
      function Ni(t, n) {
        if (fe(t))
          return !1;
        var a = typeof t;
        return a == "number" || a == "symbol" || a == "boolean" || t == null || wt(t) ? !0 : M6.test(t) || !A6.test(t) || n != null && t in Te(n);
      }
      function Pl(t) {
        var n = typeof t;
        return n == "string" || n == "number" || n == "symbol" || n == "boolean" ? t !== "__proto__" : t === null;
      }
      function Ui(t) {
        var n = Gr(t), a = h[n];
        if (typeof a != "function" || !(n in xe.prototype))
          return !1;
        if (t === a)
          return !0;
        var l = Di(a);
        return !!l && t === l[0];
      }
      function Bl(t) {
        return !!J9 && J9 in t;
      }
      var El = Sr ? fn : io;
      function rr(t) {
        var n = t && t.constructor, a = typeof n == "function" && n.prototype || l1;
        return t === a;
      }
      function J5(t) {
        return t === t && !Ke(t);
      }
      function ea(t, n) {
        return function(a) {
          return a == null ? !1 : a[t] === n && (n !== i || t in Te(a));
        };
      }
      function Rl(t) {
        var n = e0(t, function(l) {
          return a.size === m && a.clear(), l;
        }), a = n.cache;
        return n;
      }
      function Dl(t, n) {
        var a = t[1], l = n[1], d = a | l, p = d < ($ | A | I), v = l == I && a == Z || l == I && a == q && t[7].length <= n[8] || l == (I | q) && n[7].length <= n[8] && a == Z;
        if (!(p || v))
          return t;
        l & $ && (t[2] = n[2], d |= a & $ ? 0 : F);
        var L = n[3];
        if (L) {
          var w = t[3];
          t[3] = w ? R5(w, L, n[4]) : L, t[4] = w ? An(t[3], C) : n[4];
        }
        return L = n[5], L && (w = t[5], t[5] = w ? D5(w, L, n[6]) : L, t[6] = w ? An(t[5], C) : n[6]), L = n[7], L && (t[7] = L), l & I && (t[8] = t[8] == null ? n[8] : rt(t[8], n[8])), t[9] == null && (t[9] = n[9]), t[0] = n[0], t[1] = d, t;
      }
      function Fl(t) {
        var n = [];
        if (t != null)
          for (var a in Te(t))
            n.push(a);
        return n;
      }
      function zl(t) {
        return kr.call(t);
      }
      function ta(t, n, a) {
        return n = Je(n === i ? t.length - 1 : n, 0), function() {
          for (var l = arguments, d = -1, p = Je(l.length - n, 0), v = M(p); ++d < p; )
            v[d] = l[n + d];
          d = -1;
          for (var L = M(n + 1); ++d < n; )
            L[d] = l[d];
          return L[n] = a(v), xt(t, this, L);
        };
      }
      function na(t, n) {
        return n.length < 2 ? t : Yn(t, Bt(n, 0, -1));
      }
      function Nl(t, n) {
        for (var a = t.length, l = rt(n.length, a), d = bt(t); l--; ) {
          var p = n[l];
          t[l] = un(p, a) ? d[p] : i;
        }
        return t;
      }
      function Ki(t, n) {
        if (!(n === "constructor" && typeof t[n] == "function") && n != "__proto__")
          return t[n];
      }
      var ra = oa(k5), ir = t8 || function(t, n) {
        return tt.setTimeout(t, n);
      }, Zi = oa(cl);
      function ia(t, n, a) {
        var l = n + "";
        return Zi(t, Il(l, Ul(Al(l), a)));
      }
      function oa(t) {
        var n = 0, a = 0;
        return function() {
          var l = o8(), d = X - (l - a);
          if (a = l, d > 0) {
            if (++n >= K)
              return arguments[0];
          } else
            n = 0;
          return t.apply(i, arguments);
        };
      }
      function Vr(t, n) {
        var a = -1, l = t.length, d = l - 1;
        for (n = n === i ? l : n; ++a < n; ) {
          var p = wi(a, d), v = t[p];
          t[p] = t[a], t[a] = v;
        }
        return t.length = n, t;
      }
      var aa = Rl(function(t) {
        var n = [];
        return t.charCodeAt(0) === 46 && n.push(""), t.replace(T6, function(a, l, d, p) {
          n.push(d ? p.replace(F6, "$1") : l || a);
        }), n;
      });
      function qt(t) {
        if (typeof t == "string" || wt(t))
          return t;
        var n = t + "";
        return n == "0" && 1 / t == -ie ? "-0" : n;
      }
      function jn(t) {
        if (t != null) {
          try {
            return wr.call(t);
          } catch {
          }
          try {
            return t + "";
          } catch {
          }
        }
        return "";
      }
      function Ul(t, n) {
        return Tt(t1, function(a) {
          var l = "_." + a[0];
          n & a[1] && !_r(t, l) && t.push(l);
        }), t.sort();
      }
      function sa(t) {
        if (t instanceof xe)
          return t.clone();
        var n = new Ot(t.__wrapped__, t.__chain__);
        return n.__actions__ = bt(t.__actions__), n.__index__ = t.__index__, n.__values__ = t.__values__, n;
      }
      function Kl(t, n, a) {
        (a ? ft(t, n, a) : n === i) ? n = 1 : n = Je(ge(n), 0);
        var l = t == null ? 0 : t.length;
        if (!l || n < 1)
          return [];
        for (var d = 0, p = 0, v = M(Or(l / n)); d < l; )
          v[p++] = Bt(t, d, d += n);
        return v;
      }
      function Zl(t) {
        for (var n = -1, a = t == null ? 0 : t.length, l = 0, d = []; ++n < a; ) {
          var p = t[n];
          p && (d[l++] = p);
        }
        return d;
      }
      function Wl() {
        var t = arguments.length;
        if (!t)
          return [];
        for (var n = M(t - 1), a = arguments[0], l = t; l--; )
          n[l - 1] = arguments[l];
        return $n(fe(a) ? bt(a) : [a], nt(n, 1));
      }
      var Ql = me(function(t, n) {
        return Qe(t) ? X1(t, nt(n, 1, Qe, !0)) : [];
      }), Hl = me(function(t, n) {
        var a = Et(n);
        return Qe(a) && (a = i), Qe(t) ? X1(t, nt(n, 1, Qe, !0), oe(a, 2)) : [];
      }), Yl = me(function(t, n) {
        var a = Et(n);
        return Qe(a) && (a = i), Qe(t) ? X1(t, nt(n, 1, Qe, !0), i, a) : [];
      });
      function Gl(t, n, a) {
        var l = t == null ? 0 : t.length;
        return l ? (n = a || n === i ? 1 : ge(n), Bt(t, n < 0 ? 0 : n, l)) : [];
      }
      function jl(t, n, a) {
        var l = t == null ? 0 : t.length;
        return l ? (n = a || n === i ? 1 : ge(n), n = l - n, Bt(t, 0, n < 0 ? 0 : n)) : [];
      }
      function Vl(t, n) {
        return t && t.length ? Kr(t, oe(n, 3), !0, !0) : [];
      }
      function ql(t, n) {
        return t && t.length ? Kr(t, oe(n, 3), !0) : [];
      }
      function Xl(t, n, a, l) {
        var d = t == null ? 0 : t.length;
        return d ? (a && typeof a != "number" && ft(t, n, a) && (a = 0, l = d), W8(t, n, a, l)) : [];
      }
      function la(t, n, a) {
        var l = t == null ? 0 : t.length;
        if (!l)
          return -1;
        var d = a == null ? 0 : ge(a);
        return d < 0 && (d = Je(l + d, 0)), Cr(t, oe(n, 3), d);
      }
      function ca(t, n, a) {
        var l = t == null ? 0 : t.length;
        if (!l)
          return -1;
        var d = l - 1;
        return a !== i && (d = ge(a), d = a < 0 ? Je(l + d, 0) : rt(d, l - 1)), Cr(t, oe(n, 3), d, !0);
      }
      function ua(t) {
        var n = t == null ? 0 : t.length;
        return n ? nt(t, 1) : [];
      }
      function Jl(t) {
        var n = t == null ? 0 : t.length;
        return n ? nt(t, ie) : [];
      }
      function ec(t, n) {
        var a = t == null ? 0 : t.length;
        return a ? (n = n === i ? 1 : ge(n), nt(t, n)) : [];
      }
      function tc(t) {
        for (var n = -1, a = t == null ? 0 : t.length, l = {}; ++n < a; ) {
          var d = t[n];
          l[d[0]] = d[1];
        }
        return l;
      }
      function fa(t) {
        return t && t.length ? t[0] : i;
      }
      function nc(t, n, a) {
        var l = t == null ? 0 : t.length;
        if (!l)
          return -1;
        var d = a == null ? 0 : ge(a);
        return d < 0 && (d = Je(l + d, 0)), i1(t, n, d);
      }
      function rc(t) {
        var n = t == null ? 0 : t.length;
        return n ? Bt(t, 0, -1) : [];
      }
      var ic = me(function(t) {
        var n = De(t, Ti);
        return n.length && n[0] === t[0] ? _i(n) : [];
      }), oc = me(function(t) {
        var n = Et(t), a = De(t, Ti);
        return n === Et(a) ? n = i : a.pop(), a.length && a[0] === t[0] ? _i(a, oe(n, 2)) : [];
      }), ac = me(function(t) {
        var n = Et(t), a = De(t, Ti);
        return n = typeof n == "function" ? n : i, n && a.pop(), a.length && a[0] === t[0] ? _i(a, i, n) : [];
      });
      function sc(t, n) {
        return t == null ? "" : r8.call(t, n);
      }
      function Et(t) {
        var n = t == null ? 0 : t.length;
        return n ? t[n - 1] : i;
      }
      function lc(t, n, a) {
        var l = t == null ? 0 : t.length;
        if (!l)
          return -1;
        var d = l;
        return a !== i && (d = ge(a), d = d < 0 ? Je(l + d, 0) : rt(d, l - 1)), n === n ? U3(t, n, d) : Cr(t, Q9, d, !0);
      }
      function cc(t, n) {
        return t && t.length ? x5(t, ge(n)) : i;
      }
      var uc = me(da);
      function da(t, n) {
        return t && t.length && n && n.length ? Si(t, n) : t;
      }
      function fc(t, n, a) {
        return t && t.length && n && n.length ? Si(t, n, oe(a, 2)) : t;
      }
      function dc(t, n, a) {
        return t && t.length && n && n.length ? Si(t, n, i, a) : t;
      }
      var hc = cn(function(t, n) {
        var a = t == null ? 0 : t.length, l = yi(t, n);
        return w5(t, De(n, function(d) {
          return un(d, a) ? +d : d;
        }).sort(E5)), l;
      });
      function gc(t, n) {
        var a = [];
        if (!(t && t.length))
          return a;
        var l = -1, d = [], p = t.length;
        for (n = oe(n, 3); ++l < p; ) {
          var v = t[l];
          n(v, l, t) && (a.push(v), d.push(l));
        }
        return w5(t, d), a;
      }
      function Wi(t) {
        return t == null ? t : s8.call(t);
      }
      function pc(t, n, a) {
        var l = t == null ? 0 : t.length;
        return l ? (a && typeof a != "number" && ft(t, n, a) ? (n = 0, a = l) : (n = n == null ? 0 : ge(n), a = a === i ? l : ge(a)), Bt(t, n, a)) : [];
      }
      function yc(t, n) {
        return Ur(t, n);
      }
      function mc(t, n, a) {
        return $i(t, n, oe(a, 2));
      }
      function bc(t, n) {
        var a = t == null ? 0 : t.length;
        if (a) {
          var l = Ur(t, n);
          if (l < a && Zt(t[l], n))
            return l;
        }
        return -1;
      }
      function vc(t, n) {
        return Ur(t, n, !0);
      }
      function _c(t, n, a) {
        return $i(t, n, oe(a, 2), !0);
      }
      function Cc(t, n) {
        var a = t == null ? 0 : t.length;
        if (a) {
          var l = Ur(t, n, !0) - 1;
          if (Zt(t[l], n))
            return l;
        }
        return -1;
      }
      function xc(t) {
        return t && t.length ? $5(t) : [];
      }
      function Lc(t, n) {
        return t && t.length ? $5(t, oe(n, 2)) : [];
      }
      function Sc(t) {
        var n = t == null ? 0 : t.length;
        return n ? Bt(t, 1, n) : [];
      }
      function wc(t, n, a) {
        return t && t.length ? (n = a || n === i ? 1 : ge(n), Bt(t, 0, n < 0 ? 0 : n)) : [];
      }
      function kc(t, n, a) {
        var l = t == null ? 0 : t.length;
        return l ? (n = a || n === i ? 1 : ge(n), n = l - n, Bt(t, n < 0 ? 0 : n, l)) : [];
      }
      function $c(t, n) {
        return t && t.length ? Kr(t, oe(n, 3), !1, !0) : [];
      }
      function Ac(t, n) {
        return t && t.length ? Kr(t, oe(n, 3)) : [];
      }
      var Mc = me(function(t) {
        return In(nt(t, 1, Qe, !0));
      }), Tc = me(function(t) {
        var n = Et(t);
        return Qe(n) && (n = i), In(nt(t, 1, Qe, !0), oe(n, 2));
      }), Ic = me(function(t) {
        var n = Et(t);
        return n = typeof n == "function" ? n : i, In(nt(t, 1, Qe, !0), i, n);
      });
      function Oc(t) {
        return t && t.length ? In(t) : [];
      }
      function Pc(t, n) {
        return t && t.length ? In(t, oe(n, 2)) : [];
      }
      function Bc(t, n) {
        return n = typeof n == "function" ? n : i, t && t.length ? In(t, i, n) : [];
      }
      function Qi(t) {
        if (!(t && t.length))
          return [];
        var n = 0;
        return t = kn(t, function(a) {
          if (Qe(a))
            return n = Je(a.length, n), !0;
        }), li(n, function(a) {
          return De(t, oi(a));
        });
      }
      function ha(t, n) {
        if (!(t && t.length))
          return [];
        var a = Qi(t);
        return n == null ? a : De(a, function(l) {
          return xt(n, i, l);
        });
      }
      var Ec = me(function(t, n) {
        return Qe(t) ? X1(t, n) : [];
      }), Rc = me(function(t) {
        return Mi(kn(t, Qe));
      }), Dc = me(function(t) {
        var n = Et(t);
        return Qe(n) && (n = i), Mi(kn(t, Qe), oe(n, 2));
      }), Fc = me(function(t) {
        var n = Et(t);
        return n = typeof n == "function" ? n : i, Mi(kn(t, Qe), i, n);
      }), zc = me(Qi);
      function Nc(t, n) {
        return I5(t || [], n || [], q1);
      }
      function Uc(t, n) {
        return I5(t || [], n || [], tr);
      }
      var Kc = me(function(t) {
        var n = t.length, a = n > 1 ? t[n - 1] : i;
        return a = typeof a == "function" ? (t.pop(), a) : i, ha(t, a);
      });
      function ga(t) {
        var n = h(t);
        return n.__chain__ = !0, n;
      }
      function Zc(t, n) {
        return n(t), t;
      }
      function qr(t, n) {
        return n(t);
      }
      var Wc = cn(function(t) {
        var n = t.length, a = n ? t[0] : 0, l = this.__wrapped__, d = function(p) {
          return yi(p, t);
        };
        return n > 1 || this.__actions__.length || !(l instanceof xe) || !un(a) ? this.thru(d) : (l = l.slice(a, +a + (n ? 1 : 0)), l.__actions__.push({
          func: qr,
          args: [d],
          thisArg: i
        }), new Ot(l, this.__chain__).thru(function(p) {
          return n && !p.length && p.push(i), p;
        }));
      });
      function Qc() {
        return ga(this);
      }
      function Hc() {
        return new Ot(this.value(), this.__chain__);
      }
      function Yc() {
        this.__values__ === i && (this.__values__ = Aa(this.value()));
        var t = this.__index__ >= this.__values__.length, n = t ? i : this.__values__[this.__index__++];
        return { done: t, value: n };
      }
      function Gc() {
        return this;
      }
      function jc(t) {
        for (var n, a = this; a instanceof Rr; ) {
          var l = sa(a);
          l.__index__ = 0, l.__values__ = i, n ? d.__wrapped__ = l : n = l;
          var d = l;
          a = a.__wrapped__;
        }
        return d.__wrapped__ = t, n;
      }
      function Vc() {
        var t = this.__wrapped__;
        if (t instanceof xe) {
          var n = t;
          return this.__actions__.length && (n = new xe(this)), n = n.reverse(), n.__actions__.push({
            func: qr,
            args: [Wi],
            thisArg: i
          }), new Ot(n, this.__chain__);
        }
        return this.thru(Wi);
      }
      function qc() {
        return T5(this.__wrapped__, this.__actions__);
      }
      var Xc = Zr(function(t, n, a) {
        $e.call(t, a) ? ++t[a] : sn(t, a, 1);
      });
      function Jc(t, n, a) {
        var l = fe(t) ? Z9 : Z8;
        return a && ft(t, n, a) && (n = i), l(t, oe(n, 3));
      }
      function e7(t, n) {
        var a = fe(t) ? kn : h5;
        return a(t, oe(n, 3));
      }
      var t7 = U5(la), n7 = U5(ca);
      function r7(t, n) {
        return nt(Xr(t, n), 1);
      }
      function i7(t, n) {
        return nt(Xr(t, n), ie);
      }
      function o7(t, n, a) {
        return a = a === i ? 1 : ge(a), nt(Xr(t, n), a);
      }
      function pa(t, n) {
        var a = fe(t) ? Tt : Tn;
        return a(t, oe(n, 3));
      }
      function ya(t, n) {
        var a = fe(t) ? S3 : d5;
        return a(t, oe(n, 3));
      }
      var a7 = Zr(function(t, n, a) {
        $e.call(t, a) ? t[a].push(n) : sn(t, a, [n]);
      });
      function s7(t, n, a, l) {
        t = vt(t) ? t : y1(t), a = a && !l ? ge(a) : 0;
        var d = t.length;
        return a < 0 && (a = Je(d + a, 0)), r0(t) ? a <= d && t.indexOf(n, a) > -1 : !!d && i1(t, n, a) > -1;
      }
      var l7 = me(function(t, n, a) {
        var l = -1, d = typeof n == "function", p = vt(t) ? M(t.length) : [];
        return Tn(t, function(v) {
          p[++l] = d ? xt(n, v, a) : J1(v, n, a);
        }), p;
      }), c7 = Zr(function(t, n, a) {
        sn(t, a, n);
      });
      function Xr(t, n) {
        var a = fe(t) ? De : v5;
        return a(t, oe(n, 3));
      }
      function u7(t, n, a, l) {
        return t == null ? [] : (fe(n) || (n = n == null ? [] : [n]), a = l ? i : a, fe(a) || (a = a == null ? [] : [a]), L5(t, n, a));
      }
      var f7 = Zr(function(t, n, a) {
        t[a ? 0 : 1].push(n);
      }, function() {
        return [[], []];
      });
      function d7(t, n, a) {
        var l = fe(t) ? ri : Y9, d = arguments.length < 3;
        return l(t, oe(n, 4), a, d, Tn);
      }
      function h7(t, n, a) {
        var l = fe(t) ? w3 : Y9, d = arguments.length < 3;
        return l(t, oe(n, 4), a, d, d5);
      }
      function g7(t, n) {
        var a = fe(t) ? kn : h5;
        return a(t, t0(oe(n, 3)));
      }
      function p7(t) {
        var n = fe(t) ? l5 : sl;
        return n(t);
      }
      function y7(t, n, a) {
        (a ? ft(t, n, a) : n === i) ? n = 1 : n = ge(n);
        var l = fe(t) ? F8 : ll;
        return l(t, n);
      }
      function m7(t) {
        var n = fe(t) ? z8 : ul;
        return n(t);
      }
      function b7(t) {
        if (t == null)
          return 0;
        if (vt(t))
          return r0(t) ? a1(t) : t.length;
        var n = it(t);
        return n == mt || n == Nt ? t.size : xi(t).length;
      }
      function v7(t, n, a) {
        var l = fe(t) ? ii : fl;
        return a && ft(t, n, a) && (n = i), l(t, oe(n, 3));
      }
      var _7 = me(function(t, n) {
        if (t == null)
          return [];
        var a = n.length;
        return a > 1 && ft(t, n[0], n[1]) ? n = [] : a > 2 && ft(n[0], n[1], n[2]) && (n = [n[0]]), L5(t, nt(n, 1), []);
      }), Jr = e8 || function() {
        return tt.Date.now();
      };
      function C7(t, n) {
        if (typeof n != "function")
          throw new It(u);
        return t = ge(t), function() {
          if (--t < 1)
            return n.apply(this, arguments);
        };
      }
      function ma(t, n, a) {
        return n = a ? i : n, n = t && n == null ? t.length : n, ln(t, I, i, i, i, i, n);
      }
      function ba(t, n) {
        var a;
        if (typeof n != "function")
          throw new It(u);
        return t = ge(t), function() {
          return --t > 0 && (a = n.apply(this, arguments)), t <= 1 && (n = i), a;
        };
      }
      var Hi = me(function(t, n, a) {
        var l = $;
        if (a.length) {
          var d = An(a, g1(Hi));
          l |= V;
        }
        return ln(t, l, n, a, d);
      }), va = me(function(t, n, a) {
        var l = $ | A;
        if (a.length) {
          var d = An(a, g1(va));
          l |= V;
        }
        return ln(n, l, t, a, d);
      });
      function _a(t, n, a) {
        n = a ? i : n;
        var l = ln(t, Z, i, i, i, i, i, n);
        return l.placeholder = _a.placeholder, l;
      }
      function Ca(t, n, a) {
        n = a ? i : n;
        var l = ln(t, N, i, i, i, i, i, n);
        return l.placeholder = Ca.placeholder, l;
      }
      function xa(t, n, a) {
        var l, d, p, v, L, w, P = 0, B = !1, D = !1, j = !0;
        if (typeof t != "function")
          throw new It(u);
        n = Rt(n) || 0, Ke(a) && (B = !!a.leading, D = "maxWait" in a, p = D ? Je(Rt(a.maxWait) || 0, n) : p, j = "trailing" in a ? !!a.trailing : j);
        function ne(He) {
          var Wt = l, hn = d;
          return l = d = i, P = He, v = t.apply(hn, Wt), v;
        }
        function ae(He) {
          return P = He, L = ir(_e, n), B ? ne(He) : v;
        }
        function pe(He) {
          var Wt = He - w, hn = He - P, Ua = n - Wt;
          return D ? rt(Ua, p - hn) : Ua;
        }
        function se(He) {
          var Wt = He - w, hn = He - P;
          return w === i || Wt >= n || Wt < 0 || D && hn >= p;
        }
        function _e() {
          var He = Jr();
          if (se(He))
            return Le(He);
          L = ir(_e, pe(He));
        }
        function Le(He) {
          return L = i, j && l ? ne(He) : (l = d = i, v);
        }
        function kt() {
          L !== i && O5(L), P = 0, l = w = d = L = i;
        }
        function dt() {
          return L === i ? v : Le(Jr());
        }
        function $t() {
          var He = Jr(), Wt = se(He);
          if (l = arguments, d = this, w = He, Wt) {
            if (L === i)
              return ae(w);
            if (D)
              return O5(L), L = ir(_e, n), ne(w);
          }
          return L === i && (L = ir(_e, n)), v;
        }
        return $t.cancel = kt, $t.flush = dt, $t;
      }
      var x7 = me(function(t, n) {
        return f5(t, 1, n);
      }), L7 = me(function(t, n, a) {
        return f5(t, Rt(n) || 0, a);
      });
      function S7(t) {
        return ln(t, H);
      }
      function e0(t, n) {
        if (typeof t != "function" || n != null && typeof n != "function")
          throw new It(u);
        var a = function() {
          var l = arguments, d = n ? n.apply(this, l) : l[0], p = a.cache;
          if (p.has(d))
            return p.get(d);
          var v = t.apply(this, l);
          return a.cache = p.set(d, v) || p, v;
        };
        return a.cache = new (e0.Cache || an)(), a;
      }
      e0.Cache = an;
      function t0(t) {
        if (typeof t != "function")
          throw new It(u);
        return function() {
          var n = arguments;
          switch (n.length) {
            case 0:
              return !t.call(this);
            case 1:
              return !t.call(this, n[0]);
            case 2:
              return !t.call(this, n[0], n[1]);
            case 3:
              return !t.call(this, n[0], n[1], n[2]);
          }
          return !t.apply(this, n);
        };
      }
      function w7(t) {
        return ba(2, t);
      }
      var k7 = dl(function(t, n) {
        n = n.length == 1 && fe(n[0]) ? De(n[0], Lt(oe())) : De(nt(n, 1), Lt(oe()));
        var a = n.length;
        return me(function(l) {
          for (var d = -1, p = rt(l.length, a); ++d < p; )
            l[d] = n[d].call(this, l[d]);
          return xt(t, this, l);
        });
      }), Yi = me(function(t, n) {
        var a = An(n, g1(Yi));
        return ln(t, V, i, n, a);
      }), La = me(function(t, n) {
        var a = An(n, g1(La));
        return ln(t, Q, i, n, a);
      }), $7 = cn(function(t, n) {
        return ln(t, q, i, i, i, n);
      });
      function A7(t, n) {
        if (typeof t != "function")
          throw new It(u);
        return n = n === i ? n : ge(n), me(t, n);
      }
      function M7(t, n) {
        if (typeof t != "function")
          throw new It(u);
        return n = n == null ? 0 : Je(ge(n), 0), me(function(a) {
          var l = a[n], d = Pn(a, 0, n);
          return l && $n(d, l), xt(t, this, d);
        });
      }
      function T7(t, n, a) {
        var l = !0, d = !0;
        if (typeof t != "function")
          throw new It(u);
        return Ke(a) && (l = "leading" in a ? !!a.leading : l, d = "trailing" in a ? !!a.trailing : d), xa(t, n, {
          leading: l,
          maxWait: n,
          trailing: d
        });
      }
      function I7(t) {
        return ma(t, 1);
      }
      function O7(t, n) {
        return Yi(Ii(n), t);
      }
      function P7() {
        if (!arguments.length)
          return [];
        var t = arguments[0];
        return fe(t) ? t : [t];
      }
      function B7(t) {
        return Pt(t, x);
      }
      function E7(t, n) {
        return n = typeof n == "function" ? n : i, Pt(t, x, n);
      }
      function R7(t) {
        return Pt(t, b | x);
      }
      function D7(t, n) {
        return n = typeof n == "function" ? n : i, Pt(t, b | x, n);
      }
      function F7(t, n) {
        return n == null || u5(t, n, et(n));
      }
      function Zt(t, n) {
        return t === n || t !== t && n !== n;
      }
      var z7 = Yr(vi), N7 = Yr(function(t, n) {
        return t >= n;
      }), Vn = y5(function() {
        return arguments;
      }()) ? y5 : function(t) {
        return Ze(t) && $e.call(t, "callee") && !n5.call(t, "callee");
      }, fe = M.isArray, U7 = D9 ? Lt(D9) : j8;
      function vt(t) {
        return t != null && n0(t.length) && !fn(t);
      }
      function Qe(t) {
        return Ze(t) && vt(t);
      }
      function K7(t) {
        return t === !0 || t === !1 || Ze(t) && ut(t) == Ue;
      }
      var Bn = n8 || io, Z7 = F9 ? Lt(F9) : V8;
      function W7(t) {
        return Ze(t) && t.nodeType === 1 && !or(t);
      }
      function Q7(t) {
        if (t == null)
          return !0;
        if (vt(t) && (fe(t) || typeof t == "string" || typeof t.splice == "function" || Bn(t) || p1(t) || Vn(t)))
          return !t.length;
        var n = it(t);
        if (n == mt || n == Nt)
          return !t.size;
        if (rr(t))
          return !xi(t).length;
        for (var a in t)
          if ($e.call(t, a))
            return !1;
        return !0;
      }
      function H7(t, n) {
        return er(t, n);
      }
      function Y7(t, n, a) {
        a = typeof a == "function" ? a : i;
        var l = a ? a(t, n) : i;
        return l === i ? er(t, n, i, a) : !!l;
      }
      function Gi(t) {
        if (!Ze(t))
          return !1;
        var n = ut(t);
        return n == Nn || n == pr || typeof t.message == "string" && typeof t.name == "string" && !or(t);
      }
      function G7(t) {
        return typeof t == "number" && i5(t);
      }
      function fn(t) {
        if (!Ke(t))
          return !1;
        var n = ut(t);
        return n == Un || n == N1 || n == Ne || n == b6;
      }
      function Sa(t) {
        return typeof t == "number" && t == ge(t);
      }
      function n0(t) {
        return typeof t == "number" && t > -1 && t % 1 == 0 && t <= ce;
      }
      function Ke(t) {
        var n = typeof t;
        return t != null && (n == "object" || n == "function");
      }
      function Ze(t) {
        return t != null && typeof t == "object";
      }
      var wa = z9 ? Lt(z9) : X8;
      function j7(t, n) {
        return t === n || Ci(t, n, Fi(n));
      }
      function V7(t, n, a) {
        return a = typeof a == "function" ? a : i, Ci(t, n, Fi(n), a);
      }
      function q7(t) {
        return ka(t) && t != +t;
      }
      function X7(t) {
        if (El(t))
          throw new ue(c);
        return m5(t);
      }
      function J7(t) {
        return t === null;
      }
      function e4(t) {
        return t == null;
      }
      function ka(t) {
        return typeof t == "number" || Ze(t) && ut(t) == ct;
      }
      function or(t) {
        if (!Ze(t) || ut(t) != rn)
          return !1;
        var n = Mr(t);
        if (n === null)
          return !0;
        var a = $e.call(n, "constructor") && n.constructor;
        return typeof a == "function" && a instanceof a && wr.call(a) == V3;
      }
      var ji = N9 ? Lt(N9) : J8;
      function t4(t) {
        return Sa(t) && t >= -ce && t <= ce;
      }
      var $a = U9 ? Lt(U9) : el;
      function r0(t) {
        return typeof t == "string" || !fe(t) && Ze(t) && ut(t) == K1;
      }
      function wt(t) {
        return typeof t == "symbol" || Ze(t) && ut(t) == yr;
      }
      var p1 = K9 ? Lt(K9) : tl;
      function n4(t) {
        return t === i;
      }
      function r4(t) {
        return Ze(t) && it(t) == Z1;
      }
      function i4(t) {
        return Ze(t) && ut(t) == _6;
      }
      var o4 = Yr(Li), a4 = Yr(function(t, n) {
        return t <= n;
      });
      function Aa(t) {
        if (!t)
          return [];
        if (vt(t))
          return r0(t) ? Ut(t) : bt(t);
        if (H1 && t[H1])
          return F3(t[H1]());
        var n = it(t), a = n == mt ? ui : n == Nt ? xr : y1;
        return a(t);
      }
      function dn(t) {
        if (!t)
          return t === 0 ? t : 0;
        if (t = Rt(t), t === ie || t === -ie) {
          var n = t < 0 ? -1 : 1;
          return n * Ye;
        }
        return t === t ? t : 0;
      }
      function ge(t) {
        var n = dn(t), a = n % 1;
        return n === n ? a ? n - a : n : 0;
      }
      function Ma(t) {
        return t ? Hn(ge(t), 0, Oe) : 0;
      }
      function Rt(t) {
        if (typeof t == "number")
          return t;
        if (wt(t))
          return be;
        if (Ke(t)) {
          var n = typeof t.valueOf == "function" ? t.valueOf() : t;
          t = Ke(n) ? n + "" : n;
        }
        if (typeof t != "string")
          return t === 0 ? t : +t;
        t = G9(t);
        var a = U6.test(t);
        return a || Z6.test(t) ? C3(t.slice(2), a ? 2 : 8) : N6.test(t) ? be : +t;
      }
      function Ta(t) {
        return Vt(t, _t(t));
      }
      function s4(t) {
        return t ? Hn(ge(t), -ce, ce) : t === 0 ? t : 0;
      }
      function ke(t) {
        return t == null ? "" : St(t);
      }
      var l4 = d1(function(t, n) {
        if (rr(n) || vt(n)) {
          Vt(n, et(n), t);
          return;
        }
        for (var a in n)
          $e.call(n, a) && q1(t, a, n[a]);
      }), Ia = d1(function(t, n) {
        Vt(n, _t(n), t);
      }), i0 = d1(function(t, n, a, l) {
        Vt(n, _t(n), t, l);
      }), c4 = d1(function(t, n, a, l) {
        Vt(n, et(n), t, l);
      }), u4 = cn(yi);
      function f4(t, n) {
        var a = f1(t);
        return n == null ? a : c5(a, n);
      }
      var d4 = me(function(t, n) {
        t = Te(t);
        var a = -1, l = n.length, d = l > 2 ? n[2] : i;
        for (d && ft(n[0], n[1], d) && (l = 1); ++a < l; )
          for (var p = n[a], v = _t(p), L = -1, w = v.length; ++L < w; ) {
            var P = v[L], B = t[P];
            (B === i || Zt(B, l1[P]) && !$e.call(t, P)) && (t[P] = p[P]);
          }
        return t;
      }), h4 = me(function(t) {
        return t.push(i, G5), xt(Oa, i, t);
      });
      function g4(t, n) {
        return W9(t, oe(n, 3), jt);
      }
      function p4(t, n) {
        return W9(t, oe(n, 3), bi);
      }
      function y4(t, n) {
        return t == null ? t : mi(t, oe(n, 3), _t);
      }
      function m4(t, n) {
        return t == null ? t : g5(t, oe(n, 3), _t);
      }
      function b4(t, n) {
        return t && jt(t, oe(n, 3));
      }
      function v4(t, n) {
        return t && bi(t, oe(n, 3));
      }
      function _4(t) {
        return t == null ? [] : zr(t, et(t));
      }
      function C4(t) {
        return t == null ? [] : zr(t, _t(t));
      }
      function Vi(t, n, a) {
        var l = t == null ? i : Yn(t, n);
        return l === i ? a : l;
      }
      function x4(t, n) {
        return t != null && q5(t, n, Q8);
      }
      function qi(t, n) {
        return t != null && q5(t, n, H8);
      }
      var L4 = Z5(function(t, n, a) {
        n != null && typeof n.toString != "function" && (n = kr.call(n)), t[n] = a;
      }, Ji(Ct)), S4 = Z5(function(t, n, a) {
        n != null && typeof n.toString != "function" && (n = kr.call(n)), $e.call(t, n) ? t[n].push(a) : t[n] = [a];
      }, oe), w4 = me(J1);
      function et(t) {
        return vt(t) ? s5(t) : xi(t);
      }
      function _t(t) {
        return vt(t) ? s5(t, !0) : nl(t);
      }
      function k4(t, n) {
        var a = {};
        return n = oe(n, 3), jt(t, function(l, d, p) {
          sn(a, n(l, d, p), l);
        }), a;
      }
      function $4(t, n) {
        var a = {};
        return n = oe(n, 3), jt(t, function(l, d, p) {
          sn(a, d, n(l, d, p));
        }), a;
      }
      var A4 = d1(function(t, n, a) {
        Nr(t, n, a);
      }), Oa = d1(function(t, n, a, l) {
        Nr(t, n, a, l);
      }), M4 = cn(function(t, n) {
        var a = {};
        if (t == null)
          return a;
        var l = !1;
        n = De(n, function(p) {
          return p = On(p, t), l || (l = p.length > 1), p;
        }), Vt(t, Ri(t), a), l && (a = Pt(a, b | _ | x, Ll));
        for (var d = n.length; d--; )
          Ai(a, n[d]);
        return a;
      });
      function T4(t, n) {
        return Pa(t, t0(oe(n)));
      }
      var I4 = cn(function(t, n) {
        return t == null ? {} : il(t, n);
      });
      function Pa(t, n) {
        if (t == null)
          return {};
        var a = De(Ri(t), function(l) {
          return [l];
        });
        return n = oe(n), S5(t, a, function(l, d) {
          return n(l, d[0]);
        });
      }
      function O4(t, n, a) {
        n = On(n, t);
        var l = -1, d = n.length;
        for (d || (d = 1, t = i); ++l < d; ) {
          var p = t == null ? i : t[qt(n[l])];
          p === i && (l = d, p = a), t = fn(p) ? p.call(t) : p;
        }
        return t;
      }
      function P4(t, n, a) {
        return t == null ? t : tr(t, n, a);
      }
      function B4(t, n, a, l) {
        return l = typeof l == "function" ? l : i, t == null ? t : tr(t, n, a, l);
      }
      var Ba = H5(et), Ea = H5(_t);
      function E4(t, n, a) {
        var l = fe(t), d = l || Bn(t) || p1(t);
        if (n = oe(n, 4), a == null) {
          var p = t && t.constructor;
          d ? a = l ? new p() : [] : Ke(t) ? a = fn(p) ? f1(Mr(t)) : {} : a = {};
        }
        return (d ? Tt : jt)(t, function(v, L, w) {
          return n(a, v, L, w);
        }), a;
      }
      function R4(t, n) {
        return t == null ? !0 : Ai(t, n);
      }
      function D4(t, n, a) {
        return t == null ? t : M5(t, n, Ii(a));
      }
      function F4(t, n, a, l) {
        return l = typeof l == "function" ? l : i, t == null ? t : M5(t, n, Ii(a), l);
      }
      function y1(t) {
        return t == null ? [] : ci(t, et(t));
      }
      function z4(t) {
        return t == null ? [] : ci(t, _t(t));
      }
      function N4(t, n, a) {
        return a === i && (a = n, n = i), a !== i && (a = Rt(a), a = a === a ? a : 0), n !== i && (n = Rt(n), n = n === n ? n : 0), Hn(Rt(t), n, a);
      }
      function U4(t, n, a) {
        return n = dn(n), a === i ? (a = n, n = 0) : a = dn(a), t = Rt(t), Y8(t, n, a);
      }
      function K4(t, n, a) {
        if (a && typeof a != "boolean" && ft(t, n, a) && (n = a = i), a === i && (typeof n == "boolean" ? (a = n, n = i) : typeof t == "boolean" && (a = t, t = i)), t === i && n === i ? (t = 0, n = 1) : (t = dn(t), n === i ? (n = t, t = 0) : n = dn(n)), t > n) {
          var l = t;
          t = n, n = l;
        }
        if (a || t % 1 || n % 1) {
          var d = o5();
          return rt(t + d * (n - t + _3("1e-" + ((d + "").length - 1))), n);
        }
        return wi(t, n);
      }
      var Z4 = h1(function(t, n, a) {
        return n = n.toLowerCase(), t + (a ? Ra(n) : n);
      });
      function Ra(t) {
        return Xi(ke(t).toLowerCase());
      }
      function Da(t) {
        return t = ke(t), t && t.replace(Q6, P3).replace(u3, "");
      }
      function W4(t, n, a) {
        t = ke(t), n = St(n);
        var l = t.length;
        a = a === i ? l : Hn(ge(a), 0, l);
        var d = a;
        return a -= n.length, a >= 0 && t.slice(a, d) == n;
      }
      function Q4(t) {
        return t = ke(t), t && w6.test(t) ? t.replace(g9, B3) : t;
      }
      function H4(t) {
        return t = ke(t), t && I6.test(t) ? t.replace(Y0, "\\$&") : t;
      }
      var Y4 = h1(function(t, n, a) {
        return t + (a ? "-" : "") + n.toLowerCase();
      }), G4 = h1(function(t, n, a) {
        return t + (a ? " " : "") + n.toLowerCase();
      }), j4 = N5("toLowerCase");
      function V4(t, n, a) {
        t = ke(t), n = ge(n);
        var l = n ? a1(t) : 0;
        if (!n || l >= n)
          return t;
        var d = (n - l) / 2;
        return Hr(Pr(d), a) + t + Hr(Or(d), a);
      }
      function q4(t, n, a) {
        t = ke(t), n = ge(n);
        var l = n ? a1(t) : 0;
        return n && l < n ? t + Hr(n - l, a) : t;
      }
      function X4(t, n, a) {
        t = ke(t), n = ge(n);
        var l = n ? a1(t) : 0;
        return n && l < n ? Hr(n - l, a) + t : t;
      }
      function J4(t, n, a) {
        return a || n == null ? n = 0 : n && (n = +n), a8(ke(t).replace(G0, ""), n || 0);
      }
      function eu(t, n, a) {
        return (a ? ft(t, n, a) : n === i) ? n = 1 : n = ge(n), ki(ke(t), n);
      }
      function tu() {
        var t = arguments, n = ke(t[0]);
        return t.length < 3 ? n : n.replace(t[1], t[2]);
      }
      var nu = h1(function(t, n, a) {
        return t + (a ? "_" : "") + n.toLowerCase();
      });
      function ru(t, n, a) {
        return a && typeof a != "number" && ft(t, n, a) && (n = a = i), a = a === i ? Oe : a >>> 0, a ? (t = ke(t), t && (typeof n == "string" || n != null && !ji(n)) && (n = St(n), !n && o1(t)) ? Pn(Ut(t), 0, a) : t.split(n, a)) : [];
      }
      var iu = h1(function(t, n, a) {
        return t + (a ? " " : "") + Xi(n);
      });
      function ou(t, n, a) {
        return t = ke(t), a = a == null ? 0 : Hn(ge(a), 0, t.length), n = St(n), t.slice(a, a + n.length) == n;
      }
      function au(t, n, a) {
        var l = h.templateSettings;
        a && ft(t, n, a) && (n = i), t = ke(t), n = i0({}, n, l, Y5);
        var d = i0({}, n.imports, l.imports, Y5), p = et(d), v = ci(d, p), L, w, P = 0, B = n.interpolate || mr, D = "__p += '", j = fi(
          (n.escape || mr).source + "|" + B.source + "|" + (B === p9 ? z6 : mr).source + "|" + (n.evaluate || mr).source + "|$",
          "g"
        ), ne = "//# sourceURL=" + ($e.call(n, "sourceURL") ? (n.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++p3 + "]") + `
`;
        t.replace(j, function(se, _e, Le, kt, dt, $t) {
          return Le || (Le = kt), D += t.slice(P, $t).replace(H6, E3), _e && (L = !0, D += `' +
__e(` + _e + `) +
'`), dt && (w = !0, D += `';
` + dt + `;
__p += '`), Le && (D += `' +
((__t = (` + Le + `)) == null ? '' : __t) +
'`), P = $t + se.length, se;
        }), D += `';
`;
        var ae = $e.call(n, "variable") && n.variable;
        if (!ae)
          D = `with (obj) {
` + D + `
}
`;
        else if (D6.test(ae))
          throw new ue(f);
        D = (w ? D.replace(C6, "") : D).replace(x6, "$1").replace(L6, "$1;"), D = "function(" + (ae || "obj") + `) {
` + (ae ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (L ? ", __e = _.escape" : "") + (w ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + D + `return __p
}`;
        var pe = za(function() {
          return we(p, ne + "return " + D).apply(i, v);
        });
        if (pe.source = D, Gi(pe))
          throw pe;
        return pe;
      }
      function su(t) {
        return ke(t).toLowerCase();
      }
      function lu(t) {
        return ke(t).toUpperCase();
      }
      function cu(t, n, a) {
        if (t = ke(t), t && (a || n === i))
          return G9(t);
        if (!t || !(n = St(n)))
          return t;
        var l = Ut(t), d = Ut(n), p = j9(l, d), v = V9(l, d) + 1;
        return Pn(l, p, v).join("");
      }
      function uu(t, n, a) {
        if (t = ke(t), t && (a || n === i))
          return t.slice(0, X9(t) + 1);
        if (!t || !(n = St(n)))
          return t;
        var l = Ut(t), d = V9(l, Ut(n)) + 1;
        return Pn(l, 0, d).join("");
      }
      function fu(t, n, a) {
        if (t = ke(t), t && (a || n === i))
          return t.replace(G0, "");
        if (!t || !(n = St(n)))
          return t;
        var l = Ut(t), d = j9(l, Ut(n));
        return Pn(l, d).join("");
      }
      function du(t, n) {
        var a = W, l = re;
        if (Ke(n)) {
          var d = "separator" in n ? n.separator : d;
          a = "length" in n ? ge(n.length) : a, l = "omission" in n ? St(n.omission) : l;
        }
        t = ke(t);
        var p = t.length;
        if (o1(t)) {
          var v = Ut(t);
          p = v.length;
        }
        if (a >= p)
          return t;
        var L = a - a1(l);
        if (L < 1)
          return l;
        var w = v ? Pn(v, 0, L).join("") : t.slice(0, L);
        if (d === i)
          return w + l;
        if (v && (L += w.length - L), ji(d)) {
          if (t.slice(L).search(d)) {
            var P, B = w;
            for (d.global || (d = fi(d.source, ke(y9.exec(d)) + "g")), d.lastIndex = 0; P = d.exec(B); )
              var D = P.index;
            w = w.slice(0, D === i ? L : D);
          }
        } else if (t.indexOf(St(d), L) != L) {
          var j = w.lastIndexOf(d);
          j > -1 && (w = w.slice(0, j));
        }
        return w + l;
      }
      function hu(t) {
        return t = ke(t), t && S6.test(t) ? t.replace(h9, K3) : t;
      }
      var gu = h1(function(t, n, a) {
        return t + (a ? " " : "") + n.toUpperCase();
      }), Xi = N5("toUpperCase");
      function Fa(t, n, a) {
        return t = ke(t), n = a ? i : n, n === i ? D3(t) ? Q3(t) : A3(t) : t.match(n) || [];
      }
      var za = me(function(t, n) {
        try {
          return xt(t, i, n);
        } catch (a) {
          return Gi(a) ? a : new ue(a);
        }
      }), pu = cn(function(t, n) {
        return Tt(n, function(a) {
          a = qt(a), sn(t, a, Hi(t[a], t));
        }), t;
      });
      function yu(t) {
        var n = t == null ? 0 : t.length, a = oe();
        return t = n ? De(t, function(l) {
          if (typeof l[1] != "function")
            throw new It(u);
          return [a(l[0]), l[1]];
        }) : [], me(function(l) {
          for (var d = -1; ++d < n; ) {
            var p = t[d];
            if (xt(p[0], this, l))
              return xt(p[1], this, l);
          }
        });
      }
      function mu(t) {
        return K8(Pt(t, b));
      }
      function Ji(t) {
        return function() {
          return t;
        };
      }
      function bu(t, n) {
        return t == null || t !== t ? n : t;
      }
      var vu = K5(), _u = K5(!0);
      function Ct(t) {
        return t;
      }
      function eo(t) {
        return b5(typeof t == "function" ? t : Pt(t, b));
      }
      function Cu(t) {
        return _5(Pt(t, b));
      }
      function xu(t, n) {
        return C5(t, Pt(n, b));
      }
      var Lu = me(function(t, n) {
        return function(a) {
          return J1(a, t, n);
        };
      }), Su = me(function(t, n) {
        return function(a) {
          return J1(t, a, n);
        };
      });
      function to(t, n, a) {
        var l = et(n), d = zr(n, l);
        a == null && !(Ke(n) && (d.length || !l.length)) && (a = n, n = t, t = this, d = zr(n, et(n)));
        var p = !(Ke(a) && "chain" in a) || !!a.chain, v = fn(t);
        return Tt(d, function(L) {
          var w = n[L];
          t[L] = w, v && (t.prototype[L] = function() {
            var P = this.__chain__;
            if (p || P) {
              var B = t(this.__wrapped__), D = B.__actions__ = bt(this.__actions__);
              return D.push({ func: w, args: arguments, thisArg: t }), B.__chain__ = P, B;
            }
            return w.apply(t, $n([this.value()], arguments));
          });
        }), t;
      }
      function wu() {
        return tt._ === this && (tt._ = q3), this;
      }
      function no() {
      }
      function ku(t) {
        return t = ge(t), me(function(n) {
          return x5(n, t);
        });
      }
      var $u = Pi(De), Au = Pi(Z9), Mu = Pi(ii);
      function Na(t) {
        return Ni(t) ? oi(qt(t)) : ol(t);
      }
      function Tu(t) {
        return function(n) {
          return t == null ? i : Yn(t, n);
        };
      }
      var Iu = W5(), Ou = W5(!0);
      function ro() {
        return [];
      }
      function io() {
        return !1;
      }
      function Pu() {
        return {};
      }
      function Bu() {
        return "";
      }
      function Eu() {
        return !0;
      }
      function Ru(t, n) {
        if (t = ge(t), t < 1 || t > ce)
          return [];
        var a = Oe, l = rt(t, Oe);
        n = oe(n), t -= Oe;
        for (var d = li(l, n); ++a < t; )
          n(a);
        return d;
      }
      function Du(t) {
        return fe(t) ? De(t, qt) : wt(t) ? [t] : bt(aa(ke(t)));
      }
      function Fu(t) {
        var n = ++j3;
        return ke(t) + n;
      }
      var zu = Qr(function(t, n) {
        return t + n;
      }, 0), Nu = Bi("ceil"), Uu = Qr(function(t, n) {
        return t / n;
      }, 1), Ku = Bi("floor");
      function Zu(t) {
        return t && t.length ? Fr(t, Ct, vi) : i;
      }
      function Wu(t, n) {
        return t && t.length ? Fr(t, oe(n, 2), vi) : i;
      }
      function Qu(t) {
        return H9(t, Ct);
      }
      function Hu(t, n) {
        return H9(t, oe(n, 2));
      }
      function Yu(t) {
        return t && t.length ? Fr(t, Ct, Li) : i;
      }
      function Gu(t, n) {
        return t && t.length ? Fr(t, oe(n, 2), Li) : i;
      }
      var ju = Qr(function(t, n) {
        return t * n;
      }, 1), Vu = Bi("round"), qu = Qr(function(t, n) {
        return t - n;
      }, 0);
      function Xu(t) {
        return t && t.length ? si(t, Ct) : 0;
      }
      function Ju(t, n) {
        return t && t.length ? si(t, oe(n, 2)) : 0;
      }
      return h.after = C7, h.ary = ma, h.assign = l4, h.assignIn = Ia, h.assignInWith = i0, h.assignWith = c4, h.at = u4, h.before = ba, h.bind = Hi, h.bindAll = pu, h.bindKey = va, h.castArray = P7, h.chain = ga, h.chunk = Kl, h.compact = Zl, h.concat = Wl, h.cond = yu, h.conforms = mu, h.constant = Ji, h.countBy = Xc, h.create = f4, h.curry = _a, h.curryRight = Ca, h.debounce = xa, h.defaults = d4, h.defaultsDeep = h4, h.defer = x7, h.delay = L7, h.difference = Ql, h.differenceBy = Hl, h.differenceWith = Yl, h.drop = Gl, h.dropRight = jl, h.dropRightWhile = Vl, h.dropWhile = ql, h.fill = Xl, h.filter = e7, h.flatMap = r7, h.flatMapDeep = i7, h.flatMapDepth = o7, h.flatten = ua, h.flattenDeep = Jl, h.flattenDepth = ec, h.flip = S7, h.flow = vu, h.flowRight = _u, h.fromPairs = tc, h.functions = _4, h.functionsIn = C4, h.groupBy = a7, h.initial = rc, h.intersection = ic, h.intersectionBy = oc, h.intersectionWith = ac, h.invert = L4, h.invertBy = S4, h.invokeMap = l7, h.iteratee = eo, h.keyBy = c7, h.keys = et, h.keysIn = _t, h.map = Xr, h.mapKeys = k4, h.mapValues = $4, h.matches = Cu, h.matchesProperty = xu, h.memoize = e0, h.merge = A4, h.mergeWith = Oa, h.method = Lu, h.methodOf = Su, h.mixin = to, h.negate = t0, h.nthArg = ku, h.omit = M4, h.omitBy = T4, h.once = w7, h.orderBy = u7, h.over = $u, h.overArgs = k7, h.overEvery = Au, h.overSome = Mu, h.partial = Yi, h.partialRight = La, h.partition = f7, h.pick = I4, h.pickBy = Pa, h.property = Na, h.propertyOf = Tu, h.pull = uc, h.pullAll = da, h.pullAllBy = fc, h.pullAllWith = dc, h.pullAt = hc, h.range = Iu, h.rangeRight = Ou, h.rearg = $7, h.reject = g7, h.remove = gc, h.rest = A7, h.reverse = Wi, h.sampleSize = y7, h.set = P4, h.setWith = B4, h.shuffle = m7, h.slice = pc, h.sortBy = _7, h.sortedUniq = xc, h.sortedUniqBy = Lc, h.split = ru, h.spread = M7, h.tail = Sc, h.take = wc, h.takeRight = kc, h.takeRightWhile = $c, h.takeWhile = Ac, h.tap = Zc, h.throttle = T7, h.thru = qr, h.toArray = Aa, h.toPairs = Ba, h.toPairsIn = Ea, h.toPath = Du, h.toPlainObject = Ta, h.transform = E4, h.unary = I7, h.union = Mc, h.unionBy = Tc, h.unionWith = Ic, h.uniq = Oc, h.uniqBy = Pc, h.uniqWith = Bc, h.unset = R4, h.unzip = Qi, h.unzipWith = ha, h.update = D4, h.updateWith = F4, h.values = y1, h.valuesIn = z4, h.without = Ec, h.words = Fa, h.wrap = O7, h.xor = Rc, h.xorBy = Dc, h.xorWith = Fc, h.zip = zc, h.zipObject = Nc, h.zipObjectDeep = Uc, h.zipWith = Kc, h.entries = Ba, h.entriesIn = Ea, h.extend = Ia, h.extendWith = i0, to(h, h), h.add = zu, h.attempt = za, h.camelCase = Z4, h.capitalize = Ra, h.ceil = Nu, h.clamp = N4, h.clone = B7, h.cloneDeep = R7, h.cloneDeepWith = D7, h.cloneWith = E7, h.conformsTo = F7, h.deburr = Da, h.defaultTo = bu, h.divide = Uu, h.endsWith = W4, h.eq = Zt, h.escape = Q4, h.escapeRegExp = H4, h.every = Jc, h.find = t7, h.findIndex = la, h.findKey = g4, h.findLast = n7, h.findLastIndex = ca, h.findLastKey = p4, h.floor = Ku, h.forEach = pa, h.forEachRight = ya, h.forIn = y4, h.forInRight = m4, h.forOwn = b4, h.forOwnRight = v4, h.get = Vi, h.gt = z7, h.gte = N7, h.has = x4, h.hasIn = qi, h.head = fa, h.identity = Ct, h.includes = s7, h.indexOf = nc, h.inRange = U4, h.invoke = w4, h.isArguments = Vn, h.isArray = fe, h.isArrayBuffer = U7, h.isArrayLike = vt, h.isArrayLikeObject = Qe, h.isBoolean = K7, h.isBuffer = Bn, h.isDate = Z7, h.isElement = W7, h.isEmpty = Q7, h.isEqual = H7, h.isEqualWith = Y7, h.isError = Gi, h.isFinite = G7, h.isFunction = fn, h.isInteger = Sa, h.isLength = n0, h.isMap = wa, h.isMatch = j7, h.isMatchWith = V7, h.isNaN = q7, h.isNative = X7, h.isNil = e4, h.isNull = J7, h.isNumber = ka, h.isObject = Ke, h.isObjectLike = Ze, h.isPlainObject = or, h.isRegExp = ji, h.isSafeInteger = t4, h.isSet = $a, h.isString = r0, h.isSymbol = wt, h.isTypedArray = p1, h.isUndefined = n4, h.isWeakMap = r4, h.isWeakSet = i4, h.join = sc, h.kebabCase = Y4, h.last = Et, h.lastIndexOf = lc, h.lowerCase = G4, h.lowerFirst = j4, h.lt = o4, h.lte = a4, h.max = Zu, h.maxBy = Wu, h.mean = Qu, h.meanBy = Hu, h.min = Yu, h.minBy = Gu, h.stubArray = ro, h.stubFalse = io, h.stubObject = Pu, h.stubString = Bu, h.stubTrue = Eu, h.multiply = ju, h.nth = cc, h.noConflict = wu, h.noop = no, h.now = Jr, h.pad = V4, h.padEnd = q4, h.padStart = X4, h.parseInt = J4, h.random = K4, h.reduce = d7, h.reduceRight = h7, h.repeat = eu, h.replace = tu, h.result = O4, h.round = Vu, h.runInContext = S, h.sample = p7, h.size = b7, h.snakeCase = nu, h.some = v7, h.sortedIndex = yc, h.sortedIndexBy = mc, h.sortedIndexOf = bc, h.sortedLastIndex = vc, h.sortedLastIndexBy = _c, h.sortedLastIndexOf = Cc, h.startCase = iu, h.startsWith = ou, h.subtract = qu, h.sum = Xu, h.sumBy = Ju, h.template = au, h.times = Ru, h.toFinite = dn, h.toInteger = ge, h.toLength = Ma, h.toLower = su, h.toNumber = Rt, h.toSafeInteger = s4, h.toString = ke, h.toUpper = lu, h.trim = cu, h.trimEnd = uu, h.trimStart = fu, h.truncate = du, h.unescape = hu, h.uniqueId = Fu, h.upperCase = gu, h.upperFirst = Xi, h.each = pa, h.eachRight = ya, h.first = fa, to(h, function() {
        var t = {};
        return jt(h, function(n, a) {
          $e.call(h.prototype, a) || (t[a] = n);
        }), t;
      }(), { chain: !1 }), h.VERSION = o, Tt(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(t) {
        h[t].placeholder = h;
      }), Tt(["drop", "take"], function(t, n) {
        xe.prototype[t] = function(a) {
          a = a === i ? 1 : Je(ge(a), 0);
          var l = this.__filtered__ && !n ? new xe(this) : this.clone();
          return l.__filtered__ ? l.__takeCount__ = rt(a, l.__takeCount__) : l.__views__.push({
            size: rt(a, Oe),
            type: t + (l.__dir__ < 0 ? "Right" : "")
          }), l;
        }, xe.prototype[t + "Right"] = function(a) {
          return this.reverse()[t](a).reverse();
        };
      }), Tt(["filter", "map", "takeWhile"], function(t, n) {
        var a = n + 1, l = a == R || a == le;
        xe.prototype[t] = function(d) {
          var p = this.clone();
          return p.__iteratees__.push({
            iteratee: oe(d, 3),
            type: a
          }), p.__filtered__ = p.__filtered__ || l, p;
        };
      }), Tt(["head", "last"], function(t, n) {
        var a = "take" + (n ? "Right" : "");
        xe.prototype[t] = function() {
          return this[a](1).value()[0];
        };
      }), Tt(["initial", "tail"], function(t, n) {
        var a = "drop" + (n ? "" : "Right");
        xe.prototype[t] = function() {
          return this.__filtered__ ? new xe(this) : this[a](1);
        };
      }), xe.prototype.compact = function() {
        return this.filter(Ct);
      }, xe.prototype.find = function(t) {
        return this.filter(t).head();
      }, xe.prototype.findLast = function(t) {
        return this.reverse().find(t);
      }, xe.prototype.invokeMap = me(function(t, n) {
        return typeof t == "function" ? new xe(this) : this.map(function(a) {
          return J1(a, t, n);
        });
      }), xe.prototype.reject = function(t) {
        return this.filter(t0(oe(t)));
      }, xe.prototype.slice = function(t, n) {
        t = ge(t);
        var a = this;
        return a.__filtered__ && (t > 0 || n < 0) ? new xe(a) : (t < 0 ? a = a.takeRight(-t) : t && (a = a.drop(t)), n !== i && (n = ge(n), a = n < 0 ? a.dropRight(-n) : a.take(n - t)), a);
      }, xe.prototype.takeRightWhile = function(t) {
        return this.reverse().takeWhile(t).reverse();
      }, xe.prototype.toArray = function() {
        return this.take(Oe);
      }, jt(xe.prototype, function(t, n) {
        var a = /^(?:filter|find|map|reject)|While$/.test(n), l = /^(?:head|last)$/.test(n), d = h[l ? "take" + (n == "last" ? "Right" : "") : n], p = l || /^find/.test(n);
        d && (h.prototype[n] = function() {
          var v = this.__wrapped__, L = l ? [1] : arguments, w = v instanceof xe, P = L[0], B = w || fe(v), D = function(_e) {
            var Le = d.apply(h, $n([_e], L));
            return l && j ? Le[0] : Le;
          };
          B && a && typeof P == "function" && P.length != 1 && (w = B = !1);
          var j = this.__chain__, ne = !!this.__actions__.length, ae = p && !j, pe = w && !ne;
          if (!p && B) {
            v = pe ? v : new xe(this);
            var se = t.apply(v, L);
            return se.__actions__.push({ func: qr, args: [D], thisArg: i }), new Ot(se, j);
          }
          return ae && pe ? t.apply(this, L) : (se = this.thru(D), ae ? l ? se.value()[0] : se.value() : se);
        });
      }), Tt(["pop", "push", "shift", "sort", "splice", "unshift"], function(t) {
        var n = Lr[t], a = /^(?:push|sort|unshift)$/.test(t) ? "tap" : "thru", l = /^(?:pop|shift)$/.test(t);
        h.prototype[t] = function() {
          var d = arguments;
          if (l && !this.__chain__) {
            var p = this.value();
            return n.apply(fe(p) ? p : [], d);
          }
          return this[a](function(v) {
            return n.apply(fe(v) ? v : [], d);
          });
        };
      }), jt(xe.prototype, function(t, n) {
        var a = h[n];
        if (a) {
          var l = a.name + "";
          $e.call(u1, l) || (u1[l] = []), u1[l].push({ name: n, func: a });
        }
      }), u1[Wr(i, A).name] = [{
        name: "wrapper",
        func: i
      }], xe.prototype.clone = h8, xe.prototype.reverse = g8, xe.prototype.value = p8, h.prototype.at = Wc, h.prototype.chain = Qc, h.prototype.commit = Hc, h.prototype.next = Yc, h.prototype.plant = jc, h.prototype.reverse = Vc, h.prototype.toJSON = h.prototype.valueOf = h.prototype.value = qc, h.prototype.first = h.prototype.head, H1 && (h.prototype[H1] = Gc), h;
    }, s1 = H3();
    Kn ? ((Kn.exports = s1)._ = s1, ei._ = s1) : tt._ = s1;
  }).call(bn);
})($0, $0.exports);
var Rn = $0.exports;
const Xt = /* @__PURE__ */ No(Rn);
E(!1);
E(!1);
const [cS, aO] = E(!1);
E(!1);
E(!1);
E(!1);
E(!1);
E("");
const [Co, uS] = E(""), [fS, R2] = E(!1), [Dn, xo] = E(null), [yn, Lo] = E(null);
E();
const [ee, dS] = E(null), [So, h6] = E(null), [D2, F2] = E([""]), [z2, N2] = E({}), [sO, C1] = E(!1);
E("");
const [U2, hS] = E(!1);
E(1);
E();
const gS = "指标", pS = "主图指标", yS = "副图指标", mS = "设置", bS = "时区", vS = "截屏", _S = "全屏", CS = "退出全屏", xS = "保存", LS = "确定", SS = "取消", wS = "MA(移动平均线)", kS = "EMA(指数平滑移动平均线)", $S = "SMA", AS = "BOLL(布林线)", MS = "BBI(多空指数)", TS = "SAR(停损点指向指标)", IS = "VOL(成交量)", OS = "MACD(指数平滑异同移动平均线)", PS = "KDJ(随机指标)", BS = "RSI(相对强弱指标)", ES = "BIAS(乖离率)", RS = "BRAR(情绪指标)", DS = "CCI(顺势指标)", FS = "DMI(动向指标)", zS = "CR(能量指标)", NS = "PSY(心理线)", US = "DMA(平行线差指标)", KS = "TRIX(三重指数平滑平均线)", ZS = "OBV(能量潮指标)", WS = "VR(成交量变异率)", QS = "WR(威廉指标)", HS = "MTM(动量指标)", YS = "EMV(简易波动指标)", GS = "ROC(变动率指标)", jS = "PVT(价量趋势指标)", VS = "AO(动量震荡指标)", qS = "世界统一时间", XS = "(UTC-10) 檀香山", JS = "(UTC-8) 朱诺", ew = "(UTC-7) 洛杉矶", tw = "(UTC-5) 芝加哥", nw = "(UTC-4) 多伦多", rw = "(UTC-3) 圣保罗", iw = "(UTC+1) 伦敦", ow = "(UTC+2) 柏林", aw = "(UTC+3) 巴林", sw = "(UTC+4) 迪拜", lw = "(UTC+5) 阿什哈巴德", cw = "(UTC+6) 阿拉木图", uw = "(UTC+7) 曼谷", fw = "(UTC+8) 上海", dw = "(UTC+9) 东京", hw = "(UTC+10) 悉尼", gw = "(UTC+12) 诺福克岛", pw = "水平直线", yw = "水平射线", mw = "水平线段", bw = "垂直直线", vw = "垂直射线", _w = "垂直线段", Cw = "直线", xw = "射线", Lw = "线段", Sw = "箭头", ww = "价格线", kw = "价格通道线", $w = "平行直线", Aw = "斐波那契回调直线", Mw = "斐波那契回调线段", Tw = "斐波那契圆环", Iw = "斐波那契螺旋", Ow = "斐波那契速度阻力扇", Pw = "斐波那契趋势扩展", Bw = "江恩箱", Ew = "矩形", Rw = "平行四边形", Dw = "圆", Fw = "三角形", zw = "三浪", Nw = "五浪", Uw = "八浪", Kw = "任意浪", Zw = "ABCD形态", Ww = "XABCD形态", Qw = "弱磁模式", Hw = "强磁模式", Yw = "商品搜索", Gw = "商品代码", jw = "参数1", Vw = "参数2", qw = "参数3", Xw = "参数4", Jw = "参数5", ek = "周期", tk = "标准差", nk = "蜡烛图类型", rk = "全实心", ik = "全空心", ok = "涨空心", ak = "跌空心", sk = "OHLC", lk = "面积图", ck = "平金·阿什", uk = "最新价显示", fk = "最高价显示", dk = "最低价显示", hk = "指标最新值显示", gk = "价格轴类型", pk = "线性轴", yk = "百分比轴", mk = "对数轴", bk = "倒置坐标", vk = "网格线显示", _k = "恢复默认", Ck = {
  indicator: gS,
  main_indicator: pS,
  sub_indicator: yS,
  setting: mS,
  timezone: bS,
  screenshot: vS,
  full_screen: _S,
  exit_full_screen: CS,
  save: xS,
  confirm: LS,
  cancel: SS,
  ma: wS,
  ema: kS,
  sma: $S,
  boll: AS,
  bbi: MS,
  sar: TS,
  vol: IS,
  macd: OS,
  kdj: PS,
  rsi: BS,
  bias: ES,
  brar: RS,
  cci: DS,
  dmi: FS,
  cr: zS,
  psy: NS,
  dma: US,
  trix: KS,
  obv: ZS,
  vr: WS,
  wr: QS,
  mtm: HS,
  emv: YS,
  roc: GS,
  pvt: jS,
  ao: VS,
  utc: qS,
  honolulu: XS,
  juneau: JS,
  los_angeles: ew,
  chicago: tw,
  toronto: nw,
  sao_paulo: rw,
  london: iw,
  berlin: ow,
  bahrain: aw,
  dubai: sw,
  ashkhabad: lw,
  almaty: cw,
  bangkok: uw,
  shanghai: fw,
  tokyo: dw,
  sydney: hw,
  norfolk: gw,
  horizontal_straight_line: pw,
  horizontal_ray_line: yw,
  horizontal_segment: mw,
  vertical_straight_line: bw,
  vertical_ray_line: vw,
  vertical_segment: _w,
  straight_line: Cw,
  ray_line: xw,
  segment: Lw,
  arrow: Sw,
  price_line: ww,
  price_channel_line: kw,
  parallel_straight_line: $w,
  fibonacci_line: Aw,
  fibonacci_segment: Mw,
  fibonacci_circle: Tw,
  fibonacci_spiral: Iw,
  fibonacci_speed_resistance_fan: Ow,
  fibonacci_extension: Pw,
  gann_box: Bw,
  rect: Ew,
  parallelogram: Rw,
  circle: Dw,
  triangle: Fw,
  three_waves: zw,
  five_waves: Nw,
  eight_waves: Uw,
  any_waves: Kw,
  abcd: Zw,
  xabcd: Ww,
  weak_magnet: Qw,
  strong_magnet: Hw,
  symbol_search: Yw,
  symbol_code: Gw,
  params_1: jw,
  params_2: Vw,
  params_3: qw,
  params_4: Xw,
  params_5: Jw,
  period: ek,
  standard_deviation: tk,
  candle_type: nk,
  candle_solid: rk,
  candle_stroke: ik,
  candle_up_stroke: ok,
  candle_down_stroke: ak,
  ohlc: sk,
  area: lk,
  heikin_ashi: ck,
  last_price_show: uk,
  high_price_show: fk,
  low_price_show: dk,
  indicator_last_value_show: hk,
  price_axis_type: gk,
  normal: pk,
  percentage: yk,
  log: mk,
  reverse_coordinate: bk,
  grid_show: vk,
  restore_default: _k
}, xk = "Indicator", Lk = "Main Indicator", Sk = "Sub Indicator", wk = "Setting", kk = "Timezone", $k = "Screenshot", Ak = "Full Screen", Mk = "Exit", Tk = "Save", Ik = "Confirm", Ok = "Cancel", Pk = "MA(Moving Average)", Bk = "EMA(Exponential Moving Average)", Ek = "SMA", Rk = "BOLL(Bolinger Bands)", Dk = "BBI(Bull And Bearlndex)", Fk = "SAR(Stop and Reverse)", zk = "VOL(Volume)", Nk = "MACD(Moving Average Convergence / Divergence)", Uk = "KDJ(KDJ Index)", Kk = "RSI(Relative Strength Index)", Zk = "BIAS(Bias Ratio)", Wk = "BRAR(情绪指标)", Qk = "CCI(Commodity Channel Index)", Hk = "DMI(Directional Movement Index)", Yk = "CR(能量指标)", Gk = "PSY(Psychological Line)", jk = "DMA(Different of Moving Average)", Vk = "TRIX(Triple Exponentially Smoothed Moving Average)", qk = "OBV(On Balance Volume)", Xk = "VR(Volatility Volume Ratio)", Jk = "WR(Williams %R)", e$ = "MTM(Momentum Index)", t$ = "EMV(Ease of Movement Value)", n$ = "ROC(Price Rate of Change)", r$ = "PVT(Price and Volume Trend)", i$ = "AO(Awesome Oscillator)", o$ = "UTC", a$ = "(UTC-10) Honolulu", s$ = "(UTC-8) Juneau", l$ = "(UTC-7) Los Angeles", c$ = "(UTC-5) Chicago", u$ = "(UTC-4) Toronto", f$ = "(UTC-3) Sao Paulo", d$ = "(UTC+1) London", h$ = "(UTC+2) Berlin", g$ = "(UTC+3) Bahrain", p$ = "(UTC+4) Dubai", y$ = "(UTC+5) Ashkhabad", m$ = "(UTC+6) Almaty", b$ = "(UTC+7) Bangkok", v$ = "(UTC+8) Shanghai", _$ = "(UTC+9) Tokyo", C$ = "(UTC+10) Sydney", x$ = "(UTC+12) Norfolk", L$ = "Horizontal Line", S$ = "Horizontal Ray", w$ = "Horizontal Segment", k$ = "Vertical Line", $$ = "Vertical Ray", A$ = "Vertical Segment", M$ = "Trend Line", T$ = "Ray", I$ = "Segment", O$ = "Arrow", P$ = "Price Line", B$ = "Price Channel Line", E$ = "Parallel Line", R$ = "Fibonacci Line", D$ = "Fibonacci Segment", F$ = "Fibonacci Circle", z$ = "Fibonacci Spiral", N$ = "Fibonacci Sector", U$ = "Fibonacci Extension", K$ = "Gann Box", Z$ = "Rect", W$ = "Parallelogram", Q$ = "Circle", H$ = "Triangle", Y$ = "Three Waves", G$ = "Five Waves", j$ = "Eight Waves", V$ = "Any Waves", q$ = "ABCD Pattern", X$ = "XABCD Pattern", J$ = "Weak Magnet", eA = "Strong Magnet", tA = "Symbol Search", nA = "Symbol Code", rA = "Parameter 1", iA = "Parameter 2", oA = "Parameter 3", aA = "Parameter 4", sA = "Parameter 5", lA = "Period", cA = "Standard Deviation", uA = "Candle Type", fA = "Candle Solid", dA = "Candle Stroke", hA = "Candle Up Stroke", gA = "Candle Down Stroke", pA = "OHLC", yA = "Area", mA = "Heikin Ashi", bA = "Show Last Price", vA = "Show Highest Price", _A = "Show Lowest Price", CA = "Show indicator's last value", xA = "Price Axis Type", LA = "Normal", SA = "Percentage", wA = "Log", kA = "Reverse Coordinate", $A = "Show Grids", AA = "Restore Defaults", MA = {
  indicator: xk,
  main_indicator: Lk,
  sub_indicator: Sk,
  setting: wk,
  timezone: kk,
  screenshot: $k,
  full_screen: Ak,
  exit_full_screen: Mk,
  save: Tk,
  confirm: Ik,
  cancel: Ok,
  ma: Pk,
  ema: Bk,
  sma: Ek,
  boll: Rk,
  bbi: Dk,
  sar: Fk,
  vol: zk,
  macd: Nk,
  kdj: Uk,
  rsi: Kk,
  bias: Zk,
  brar: Wk,
  cci: Qk,
  dmi: Hk,
  cr: Yk,
  psy: Gk,
  dma: jk,
  trix: Vk,
  obv: qk,
  vr: Xk,
  wr: Jk,
  mtm: e$,
  emv: t$,
  roc: n$,
  pvt: r$,
  ao: i$,
  utc: o$,
  honolulu: a$,
  juneau: s$,
  los_angeles: l$,
  chicago: c$,
  toronto: u$,
  sao_paulo: f$,
  london: d$,
  berlin: h$,
  bahrain: g$,
  dubai: p$,
  ashkhabad: y$,
  almaty: m$,
  bangkok: b$,
  shanghai: v$,
  tokyo: _$,
  sydney: C$,
  norfolk: x$,
  horizontal_straight_line: L$,
  horizontal_ray_line: S$,
  horizontal_segment: w$,
  vertical_straight_line: k$,
  vertical_ray_line: $$,
  vertical_segment: A$,
  straight_line: M$,
  ray_line: T$,
  segment: I$,
  arrow: O$,
  price_line: P$,
  price_channel_line: B$,
  parallel_straight_line: E$,
  fibonacci_line: R$,
  fibonacci_segment: D$,
  fibonacci_circle: F$,
  fibonacci_spiral: z$,
  fibonacci_speed_resistance_fan: N$,
  fibonacci_extension: U$,
  gann_box: K$,
  rect: Z$,
  parallelogram: W$,
  circle: Q$,
  triangle: H$,
  three_waves: Y$,
  five_waves: G$,
  eight_waves: j$,
  any_waves: V$,
  abcd: q$,
  xabcd: X$,
  weak_magnet: J$,
  strong_magnet: eA,
  symbol_search: tA,
  symbol_code: nA,
  params_1: rA,
  params_2: iA,
  params_3: oA,
  params_4: aA,
  params_5: sA,
  period: lA,
  standard_deviation: cA,
  candle_type: uA,
  candle_solid: fA,
  candle_stroke: dA,
  candle_up_stroke: hA,
  candle_down_stroke: gA,
  ohlc: pA,
  area: yA,
  heikin_ashi: mA,
  last_price_show: bA,
  high_price_show: vA,
  low_price_show: _A,
  indicator_last_value_show: CA,
  price_axis_type: xA,
  normal: LA,
  percentage: SA,
  log: wA,
  reverse_coordinate: kA,
  grid_show: $A,
  restore_default: AA
}, g6 = {
  "zh-CN": Ck,
  "en-US": MA
};
function lO(e, r) {
  g6[e] = r;
}
const y = (e, r) => {
  var i;
  return ((i = g6[r]) == null ? void 0 : i[e]) ?? e;
};
E("");
const [TA, cO] = E(!1);
E("");
E();
const IA = {
  color: "#1677FF",
  borderColor: "rgba(22, 119, 255, 0.35)",
  borderSize: 1,
  radius: 5,
  activeColor: "#1677FF",
  activeBorderColor: "rgba(22, 119, 255, 0.35)",
  activeBorderSize: 3,
  activeRadius: 5
}, OA = {
  // 'fill' | 'stroke' | 'stroke_fill'
  style: "fill",
  color: "#FFFFFF",
  size: 12,
  family: "Helvetica Neue",
  weight: "normal",
  // 'solid' | 'dashed'
  borderStyle: "solid",
  borderDashedValue: [2, 2],
  borderSize: 0,
  borderRadius: 2,
  borderColor: "#1677FF",
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  backgroundColor: "transparent"
}, c9 = {
  // 'fill' | 'stroke' | 'stroke_fill'
  style: "fill",
  color: "rgba(22, 119, 255, 0.25)",
  borderColor: "#1677FF",
  borderSize: 1,
  // 'solid' | 'dashed'
  borderStyle: "solid",
  borderDashedValue: [2, 2]
}, p6 = c9;
({
  ...c9
});
const y6 = {
  // 'solid' | 'dashed'
  style: "solid",
  color: "#1677FF",
  size: 1,
  dashedValue: [2, 2]
}, Gt = {
  ...y6,
  smooth: !1
}, [PA, BA] = E({
  point: IA
}), [EA, RA] = E({
  line: Gt
}), [DA, FA] = E({
  line: Gt
}), [zA, NA] = E({
  line: Gt
}), [UA, KA] = E({
  line: Gt
}), [ZA, WA] = E({
  line: Gt
}), [QA, HA] = E({
  line: Gt
}), [YA, GA] = E({
  line: Gt
}), [jA, VA] = E({
  line: Gt
}), [qA, XA] = E({
  line: Gt
}), [JA, eM] = E({
  line: Gt
}), [tM, nM] = E({
  line: Gt
}), [rM, iM] = E({
  polygon: p6
}), [oM, aM] = E({
  polygon: p6
}), [sM, lM] = E({
  circle: c9
}), [cM, uM] = E({
  arc: y6
}), [fM, dM] = E({
  text: OA
}), L1 = {
  pointStyle: PA,
  horizontalStraightLineStyle: EA,
  horizontalRayLineStyle: zA,
  horizontalSegmentStyle: DA,
  verticalStraightLineStyle: QA,
  verticalRayLineStyle: UA,
  verticalSegmentStyle: ZA,
  straightLineStyle: tM,
  rayLineStyle: YA,
  segmentStyle: jA,
  arrowStyle: qA,
  priceLineStyle: JA,
  rectStyle: rM,
  polygonStyle: oM,
  circleStyle: sM,
  arcStyle: cM,
  textStyle: fM
}, K2 = {
  setpointStyle: (e) => BA(e),
  sethorizontalStraightLineStyle: (e) => RA(e),
  sethorizontalRayLineStyle: (e) => NA(e),
  sethorizontalSegmentStyle: (e) => FA(e),
  setverticalStraightLineStyle: (e) => HA(e),
  setverticalRayLineStyle: (e) => KA(e),
  setverticalSegmentStyle: (e) => WA(e),
  setstraightLineStyle: (e) => nM(e),
  setrayLineStyle: (e) => GA(e),
  setsegmentStyle: (e) => VA(e),
  setarrowStyle: (e) => XA(e),
  setpriceLineStyle: (e) => eM(e),
  setrectStyle: (e) => iM(e),
  setpolygonStyle: (e) => aM(e),
  setcircleStyle: (e) => lM(e),
  setarcStyle: (e) => uM(e),
  settextStyle: (e) => dM(e)
}, hM = (e) => {
  const r = [
    "calc",
    "figures",
    "regenerateFigures",
    "draw",
    "createTooltipDataSource"
  ];
  let i = e;
  return r.forEach((o) => {
    delete i[o];
  }), i;
}, gM = (e) => {
  const r = [
    "onDrawStart",
    "onDrawing",
    "onDrawEnd",
    "onClick",
    "onDoubleClick",
    "onRightClick",
    "onMouseEnter",
    "onMouseLeave",
    "onPressedMoveStart",
    "onPressedMoving",
    "onPressedMoveEnd",
    "onRemoved",
    "onSelected",
    "onDeselected",
    "performEventMoveForDrawing",
    "performEventPressedMove",
    "_prevPressedPoint",
    "_prevPressedPoints",
    "createPointFigures",
    "createXAxisFigures",
    "createYAxisFigures"
  ];
  let i = e;
  return r.forEach((o) => {
    delete i[o];
  }), i;
}, u9 = () => {
  const e = (_, x, k) => {
    const T = localStorage.getItem("chartstatedata");
    let $;
    const A = hM(Xt.cloneDeep(_));
    return T ? ($ = JSON.parse(T), $.indicators ? $.indicators.find((F) => {
      var Z, N;
      return ((Z = F.value) == null ? void 0 : Z.name) === A.name && ((N = F.paneOptions) == null ? void 0 : N.id) === (k == null ? void 0 : k.id);
    }) ? $.indicators = $.indicators.map((F) => {
      var Z;
      return ((Z = F.value) == null ? void 0 : Z.id) !== A.id ? F : {
        value: A,
        isStack: x,
        paneOptions: k
      };
    }) : $.indicators.push({
      value: A,
      isStack: x,
      paneOptions: k
    }) : $.indicators = [{
      value: A,
      isStack: x,
      paneOptions: k
    }]) : $ = {
      indicators: [{
        value: A,
        isStack: x,
        paneOptions: k
      }]
    }, localStorage.setItem("chartstatedata", JSON.stringify($)), C1(!0), !1;
  }, r = (_) => {
    const x = localStorage.getItem("chartstatedata");
    let k;
    const T = gM(Xt.cloneDeep(_));
    return x ? (k = JSON.parse(x), k.overlays ? k.overlays.find(($) => {
      var A;
      return ((A = $.value) == null ? void 0 : A.id) === T.id;
    }) ? k.overlays = k.overlays.map(($) => {
      var A;
      return ((A = $.value) == null ? void 0 : A.id) !== T.id ? $ : {
        value: T,
        paneId: _.paneId
      };
    }) : k.overlays.push({
      value: T,
      paneId: _.paneId
    }) : k.overlays = [{
      value: _,
      paneId: _.paneId
    }]) : k = {
      overlays: [{
        value: T,
        paneId: _.paneId
      }]
    }, localStorage.setItem("chartstatedata", JSON.stringify(k)), C1(!0), !1;
  };
  function i(_, x, k, T, $ = !1) {
    x === "VOL" && (T = { axis: { gap: { bottom: 2 } }, ...T });
    const A = _.createIndicator({
      name: x,
      createTooltipDataSource: (F) => {
        const N = F.chart.getStyles().indicator.tooltip.features, V = [];
        return V.push(F.indicator.visible ? N[1] : N[0]), V.push(N[2]), V.push(N[3]), {
          name: `${x}_${A}`,
          calcParamsText: x,
          features: V,
          legends: []
        };
      }
    }, k, T) ?? null;
    if (A && $) {
      const F = _ == null ? void 0 : _.getIndicators({ id: A, name: x })[0];
      F && e(F, k, { id: A });
    }
    return A;
  }
  const o = (_, x, k = !1) => {
    var F, Z, N;
    const T = (F = ee()) == null ? void 0 : F.createOverlay({ ..._, paneId: x });
    if (!T)
      return !1;
    const $ = (Z = ee()) == null ? void 0 : Z.getOverlays({ id: T })[0], A = (V) => (V.preventDefault && V.preventDefault(), console.info("on right click called", V.preventDefault), TA() ? (console.info("control key down"), s(V.overlay.id), !0) : (d6().openPopup(V, { overlayType: V.overlay.name }), !0));
    if ($) {
      const V = !k && L1[`${$.name}Style`] ? L1[`${$.name}Style`]() : void 0;
      (N = ee()) == null || N.overrideOverlay({
        id: $.id,
        styles: _.styles ?? V,
        onDrawEnd: (Q) => (console.info("on draw end called"), ["measure"].includes($.name) ? !1 : r(Q.overlay)),
        onPressedMoveEnd: (Q) => (console.info("on pressed move end called"), ["measure"].includes($.name) ? !1 : r(Q.overlay)),
        onRightClick: $.onRightClick ? $.onRightClick : A,
        onDoubleClick: $.onDoubleClick ? $.onDoubleClick : A
      }), k || r($);
    }
  }, s = (_) => {
    var k, T;
    const x = localStorage.getItem("chartstatedata");
    if (x) {
      let $ = JSON.parse(x);
      $.overlays = (k = $.overlays) == null ? void 0 : k.filter((A) => {
        var F;
        return ((F = A.value) == null ? void 0 : F.id) !== _;
      }), localStorage.setItem("chartstatedata", JSON.stringify($)), C1(!0);
    }
    (T = ee()) == null || T.removeOverlay({ id: _ });
  }, c = (_) => {
    const x = [...D2()];
    _.added ? (i(ee(), _.name, !0, { id: "candle_pane" }, !0), x.push(_.name)) : (g(_.name, "candle_pane"), x.splice(x.indexOf(_.name), 1)), F2(x);
  }, u = (_) => {
    const x = { ...z2() };
    if (_.added) {
      const k = i(ee(), _.name, !1, void 0, !0);
      k && (x[_.name] = k);
    } else
      _.paneId && (g(_.name, _.paneId), delete x[_.name]);
    N2(x);
  }, f = (_, x) => {
    var T, $;
    const k = localStorage.getItem("chartstatedata");
    if (k) {
      let A = JSON.parse(k);
      A.indicators = (T = A.indicators) == null ? void 0 : T.map((F) => {
        var Z;
        return ((Z = F.value) == null ? void 0 : Z.name) === _.indicatorName && (F.value.name = _.indicatorName, F.value.calcParams = x, F.paneOptions.id = _.paneId), F;
      }), localStorage.setItem("chartstatedata", JSON.stringify(A)), C1(!0), ($ = ee()) == null || $.overrideIndicator({ name: _.indicatorName, calcParams: x, paneId: _.paneId });
    }
  }, g = (_, x, k) => {
    var $, A;
    const T = localStorage.getItem("chartstatedata");
    if (($ = ee()) == null || $.removeIndicator({ id: _, paneId: k, name: x }), T) {
      let F = JSON.parse(T);
      F.indicators = (A = F.indicators) == null ? void 0 : A.filter((Z) => {
        var N, V;
        return ((N = Z.paneOptions) == null ? void 0 : N.id) !== k && ((V = Z.value) == null ? void 0 : V.name) !== x;
      }), localStorage.setItem("chartstatedata", JSON.stringify(F)), C1(!0);
    }
  }, m = (_, x) => {
    document.documentElement.style.setProperty(_, x, "important");
    const k = document.querySelector("[data-theme]");
    k && k.style.setProperty(_, x, "important");
  }, C = (_) => {
    var x;
    _.background && m("--klinecharts-pro-pane-background", _.background), _.backgroundGradientStartColor && m("--klinecharts-pro-pane-background-gradient-start", _.backgroundGradientStartColor), _.backgroundGradientEndColor && m("--klinecharts-pro-pane-background-gradient-end", _.backgroundGradientEndColor), (x = _.separator) != null && x.color && m("--klinecharts-pro-border-color", _.separator.color);
  };
  return { createIndicator: i, modifyIndicator: f, popIndicator: g, syncIndiObject: e, syncObject: r, pushOverlay: o, popOverlay: s, pushMainIndicator: c, pushSubIndicator: u, restoreChartState: async (_) => {
    const x = ($) => {
      const A = JSON.parse($);
      if (A.figures, A.overlays && A.overlays.forEach((F) => {
        o(F.value, F.paneId, !0);
      }), A.indicators && setTimeout(() => {
        const F = [...D2()], Z = { ...z2 };
        A.indicators.forEach((N) => {
          var V, Q, I;
          N.value && ((V = ee()) == null || V.createIndicator(N.value, N.isStack, N.paneOptions), ((Q = N.paneOptions) == null ? void 0 : Q.id) === "candle_pane" ? F.push(N.value.name) : Z[N.value.name] = (I = N.paneOptions) == null ? void 0 : I.id);
        }), F2(F), N2(Z);
      }, 500), A.orderStyles) {
        const F = A.orderStyles;
        pM(F);
      }
    }, k = localStorage.getItem("chartstatedata");
    k && x(k);
    const T = JSON.parse(k) ?? {};
    _ && (C(_), T.styleObj || (T.styleObj = _, localStorage.setItem("chartstatedata", JSON.stringify(T)))), T.styleObj && h6(T.styleObj);
  } };
}, pM = (e) => {
  e.buyStyle && Nf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.buyStyle) != null && o.lineStyle)
      for (const c in e.buyStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.buyStyle.lineStyle[c]);
    if ((s = e.buyStyle) != null && s.labelStyle)
      for (const c in e.buyStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.buyStyle.labelStyle[c]);
    return i;
  }), e.buyLimitStyle && Uf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.buyLimitStyle) != null && o.lineStyle)
      for (const c in e.buyLimitStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.buyLimitStyle.lineStyle[c]);
    if ((s = e.buyLimitStyle) != null && s.labelStyle)
      for (const c in e.buyLimitStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.buyLimitStyle.labelStyle[c]);
    return i;
  }), e.buyStopStyle && Kf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.buyStopStyle) != null && o.lineStyle)
      for (const c in e.buyStopStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.buyStopStyle.lineStyle[c]);
    if ((s = e.buyStopStyle) != null && s.labelStyle)
      for (const c in e.buyStopStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.buyStopStyle.labelStyle[c]);
    return i;
  }), e.sellStyle && Zf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.sellStyle) != null && o.lineStyle)
      for (const c in e.sellStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.sellStyle.lineStyle[c]);
    if ((s = e.sellStyle) != null && s.labelStyle)
      for (const c in e.sellStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.sellStyle.labelStyle[c]);
    return i;
  }), e.sellLimitStyle && Wf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.sellLimitStyle) != null && o.lineStyle)
      for (const c in e.sellLimitStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.sellLimitStyle.lineStyle[c]);
    if ((s = e.sellLimitStyle) != null && s.labelStyle)
      for (const c in e.sellLimitStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.sellLimitStyle.labelStyle[c]);
    return i;
  }), e.sellStopStyle && Qf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.sellStopStyle) != null && o.lineStyle)
      for (const c in e.sellStopStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.sellStopStyle.lineStyle[c]);
    if ((s = e.sellStopStyle) != null && s.labelStyle)
      for (const c in e.sellStopStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.sellStopStyle.labelStyle[c]);
    return i;
  }), e.stopLossStyle && Gf((r) => {
    var o, s;
    const i = Xt.cloneDeep(r);
    if ((o = e.stopLossStyle) != null && o.lineStyle)
      for (const c in e.stopLossStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.stopLossStyle.lineStyle[c]);
    if ((s = e.stopLossStyle) != null && s.labelStyle)
      for (const c in e.stopLossStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.stopLossStyle.labelStyle[c]);
    return i;
  }), e.takeProfitStyle && Yf((r) => {
    var o, s;
    const i = Xt.cloneDeep(Hf());
    if ((o = e.takeProfitStyle) != null && o.lineStyle)
      for (const c in e.takeProfitStyle.lineStyle)
        c !== void 0 && set(i, `lineStyle.${c}`, e.takeProfitStyle.lineStyle[c]);
    if ((s = e.takeProfitStyle) != null && s.labelStyle)
      for (const c in e.takeProfitStyle.labelStyle)
        c !== void 0 && set(i, `labelStyle.${c}`, e.takeProfitStyle.labelStyle[c]);
    return i;
  });
};
var yM = /* @__PURE__ */ U("<button>Send Back"), mM = /* @__PURE__ */ U("<button>Send Front"), Z2 = /* @__PURE__ */ U("<button>"), bM = /* @__PURE__ */ U("<div class=klinecharts-pro-popup_background><div class=popup><button></button><button>Settings");
const vM = () => {
  u9().popOverlay(Fe().id);
}, _M = (e) => {
  e === "overlay" && u6(!0);
}, CM = () => {
  var r, i;
  const e = Fe();
  (r = ee()) == null || r.overrideOverlay({
    id: e == null ? void 0 : e.id,
    zLevel: +e.zLevel + 1
  }), z1(((i = ee()) == null ? void 0 : i.getOverlayById(Fe().id)) ?? Fe());
}, xM = () => {
  var r, i;
  const e = Fe();
  (r = ee()) == null || r.overrideOverlay({
    id: e == null ? void 0 : e.id,
    zLevel: +e.zLevel - 1
  }), z1(((i = ee()) == null ? void 0 : i.getOverlayById(Fe().id)) ?? Fe());
}, LM = () => {
  var e, r, i, o;
  (i = ee()) == null || i.overrideOverlay({
    id: (e = Fe()) == null ? void 0 : e.id,
    lock: !((r = Fe()) != null && r.lock)
  }), z1(((o = ee()) == null ? void 0 : o.getOverlayById(Fe().id)) ?? Fe());
}, SM = () => {
  var e, r, i, o;
  (i = ee()) == null || i.overrideOverlay({
    id: (e = Fe()) == null ? void 0 : e.id,
    visible: !((r = Fe()) != null && r.visible)
  }), z1(((o = ee()) == null ? void 0 : o.getOverlayById(Fe().id)) ?? Fe());
}, wM = () => (() => {
  var e = bM(), r = e.firstChild, i = r.firstChild, o = i.nextSibling;
  return e.$$click = () => d6().closePopup(), i.$$click = vM, G(i, () => `Remove ${f6()}`), o.$$click = () => _M("overlay"), G(r, Y(We, {
    when: !0,
    get children() {
      return [(() => {
        var s = yM();
        return s.$$click = CM, s;
      })(), (() => {
        var s = mM();
        return s.$$click = xM, s;
      })(), (() => {
        var s = Z2();
        return s.$$click = LM, G(s, () => {
          var c;
          return (c = Fe()) != null && c.lock ? "Unlock" : "Lock";
        }), s;
      })(), (() => {
        var s = Z2();
        return s.$$click = SM, G(s, () => {
          var c;
          return (c = Fe()) != null && c.visible ? "Hide" : "Unhide";
        }), s;
      })()];
    }
  }), null), ze((s) => {
    var c = `${rS()}px`, u = `${oS()}px`;
    return c !== s.e && Ao(r, "top", s.e = c), u !== s.t && Ao(r, "left", s.t = u), s;
  }, {
    e: void 0,
    t: void 0
  }), e;
})();
At(["click"]);
var kM = /* @__PURE__ */ U("<img alt=symbol>"), $M = /* @__PURE__ */ U("<div class=symbol><span>"), AM = /* @__PURE__ */ U('<div class=klinecharts-pro-period-bar><div class=menu-container><svg viewBox="0 0 1024 1024"><path d="M192.037 287.953h640.124c17.673 0 32-14.327 32-32s-14.327-32-32-32H192.037c-17.673 0-32 14.327-32 32s14.327 32 32 32zM832.161 479.169H438.553c-17.673 0-32 14.327-32 32s14.327 32 32 32h393.608c17.673 0 32-14.327 32-32s-14.327-32-32-32zM832.161 735.802H192.037c-17.673 0-32 14.327-32 32s14.327 32 32 32h640.124c17.673 0 32-14.327 32-32s-14.327-32-32-32zM319.028 351.594l-160 160 160 160z"></path></svg></div><div class="item tools period_home"><button class="item period"></button></div><div class="item tools"><svg viewBox="0 0 20 20"><path d=M15.873,20L3.65079,20C1.5873,20,0,18.3871,0,16.2903L0,3.70968C-3.78442e-7,1.6129,1.5873,0,3.65079,0L15.873,0C17.9365,0,19.5238,1.6129,19.5238,3.70968C19.5238,4.35484,19.2063,4.51613,18.5714,4.51613C17.9365,4.51613,17.619,4.19355,17.619,3.70968C17.619,2.74194,16.8254,1.93548,15.873,1.93548L3.65079,1.93548C2.69841,1.93548,1.90476,2.74194,1.90476,3.70968L1.90476,16.2903C1.90476,17.2581,2.69841,18.0645,3.65079,18.0645L15.873,18.0645C16.8254,18.0645,17.619,17.2581,17.619,16.2903C17.619,15.8065,18.0952,15.3226,18.5714,15.3226C19.0476,15.3226,19.5238,15.8065,19.5238,16.2903C19.5238,18.2258,17.9365,20,15.873,20ZM14.9206,12.9032C14.7619,12.9032,14.4444,12.9032,14.2857,12.7419L11.2698,9.35484C10.9524,9.03226,10.9524,8.54839,11.2698,8.22581C11.5873,7.90323,12.0635,7.90323,12.381,8.22581L15.3968,11.6129C15.7143,11.9355,15.7143,12.4194,15.3968,12.7419C15.3968,12.9032,15.2381,12.9032,14.9206,12.9032ZM11.4286,13.2258C11.2698,13.2258,11.1111,13.2258,10.9524,13.0645C10.6349,12.7419,10.6349,12.4194,10.9524,12.0968L15.0794,7.74193C15.3968,7.41935,15.7143,7.41935,16.0317,7.74193C16.3492,8.06452,16.3492,8.3871,16.0317,8.70968L11.9048,13.0645C11.746,13.2258,11.5873,13.2258,11.4286,13.2258ZM10.3175,3.70968C10.6349,3.70968,11.4286,3.87097,11.4286,4.67742C11.4286,5.32258,10.4762,5.16129,10.1587,5.16129C8.73016,5.16129,8.25397,5.96774,8.09524,6.6129L7.77778,8.54839L9.36508,8.54839C9.68254,8.54839,10,8.87097,10,9.19355C10,9.51613,9.68254,9.83871,9.36508,9.83871L7.61905,9.83871L6.50794,14.8387Q6.34921,16.2903,5.39683,16.2903Q4.44444,16.2903,4.92064,14.8387L6.03175,10L4.60317,10C4.28571,10,3.96825,9.67742,3.96825,9.35484C3.96825,8.70968,4.28571,8.54839,4.60317,8.54839L6.34921,8.54839L6.8254,6.45161C7.14286,3.70968,9.52381,3.54839,10.3175,3.70968ZM18.4127,6.6129C18.5714,6.12903,18.8889,5.96774,19.3651,5.96774C19.8413,6.12903,20,6.45161,20,6.93548L18.4127,13.3871C18.254,13.871,17.9365,14.0323,17.4603,14.0323C16.9841,13.871,16.8254,13.5484,16.8254,13.0645L18.4127,6.6129Z></path></svg><span></span></div><div class="item tools"><svg width=20 height=20 viewBox="0 0 20 20"><path d=M18.5446,9.09091C18.3333,6.61616,17.2887,4.31818,15.5751,2.63889C13.8498,0.94697,11.6197,0,9.28404,0C8.02817,0,6.81925,0.265151,5.66901,0.782828C5.65728,0.782828,5.65728,0.795454,5.64554,0.795454C5.6338,0.795454,5.6338,0.808081,5.62207,0.808081C4.53052,1.31313,3.55634,2.0202,2.71127,2.92929C1.85446,3.85101,1.18545,4.91162,0.715963,6.11111C0.246479,7.33586,0,8.64899,0,10C0,10.8712,0.105634,11.7172,0.305164,12.5379C0.305164,12.5631,0.316901,12.5884,0.328638,12.6136C0.739437,14.2298,1.51408,15.7197,2.62911,16.9571C4.07277,18.548,5.92723,19.5581,7.93427,19.8737C7.95775,19.8737,7.96948,19.8864,7.99296,19.8864C8.3216,19.9369,8.66197,19.9747,9.00235,19.9747L9.21362,19.9747C9.61268,19.9747,10.3756,19.9369,11.0094,19.697C11.1737,19.6338,11.3028,19.5076,11.3732,19.3434C11.4437,19.1793,11.4554,18.9899,11.3967,18.8131C11.3028,18.5354,11.0563,18.346,10.7864,18.346C10.716,18.346,10.6338,18.3586,10.5634,18.3838C10.0939,18.5606,9.46009,18.5859,9.20188,18.5859L9.09624,18.5859C9.20188,18.2702,9.23709,17.9167,9.15493,17.5505C9.00235,16.8939,8.50939,16.3384,7.58216,15.7955L7.19484,15.5682C6.57277,15.2146,6.23239,15.0253,6.03286,14.7348C5.83333,14.4444,5.69249,13.9899,5.51643,12.9798C5.38732,12.298,5.04695,11.7677,4.50704,11.4646C4.14319,11.2626,3.70892,11.149,3.19249,11.149C2.82864,11.149,2.42958,11.1995,2.00704,11.3005C1.79578,11.351,1.59624,11.4141,1.42019,11.4646C1.33803,10.9848,1.30282,10.4798,1.30282,9.97475C1.30282,6.93182,2.76995,4.26768,4.98826,2.72727C5,3.00505,5.05869,3.29545,5.17606,3.57323C5.48122,4.26768,6.10329,4.7096,7.01878,4.89899C7.06573,4.91162,7.10094,4.91162,7.13615,4.91162L7.1831,4.91162C7.26526,4.91162,7.57042,4.92424,7.88732,5.0505C8.3216,5.2399,8.56808,5.55555,8.65023,6.04798C8.84977,7.61364,9.07277,10.4293,8.79108,11.3384C8.76761,11.4141,8.75587,11.4899,8.75587,11.5657C8.75587,11.9444,9.0493,12.2601,9.40141,12.2601C9.57747,12.2601,9.74179,12.1843,9.85915,12.0581C9.97653,11.9318,12.6174,9.05303,13.3216,8.09343C13.4038,7.97979,13.4859,7.87878,13.5798,7.76515C13.9202,7.33586,14.2723,6.90656,14.4014,6.26262C14.554,5.56818,14.4014,4.79798,13.9437,3.85101C13.615,3.16919,13.5563,2.86616,13.5446,2.75252C13.5563,2.7399,13.5798,2.72727,13.6033,2.71464C15.6221,4.10353,17.0188,6.43939,17.2535,9.19192C17.2887,9.55808,17.5587,9.82323,17.8991,9.82323L17.9577,9.82323C18.3099,9.8106,18.5681,9.48232,18.5446,9.09091ZM3.19249,12.5631C3.48592,12.5631,3.72066,12.6136,3.89671,12.7146C4.08451,12.8283,4.19014,12.9924,4.23709,13.2702C4.43662,14.3434,4.61268,15.0631,5,15.6061C5.37559,16.1364,5.85681,16.4015,6.58451,16.8182L6.60798,16.8308C6.71362,16.8939,6.84272,16.9571,6.96009,17.0328C7.69953,17.4621,7.86385,17.7525,7.89906,17.8914C7.93427,18.0303,7.85211,18.2323,7.74648,18.4343C4.91784,17.8535,2.65258,15.6944,1.73709,12.8283C2.15962,12.702,2.71127,12.5631,3.19249,12.5631ZM12.7934,4.5202C13.4272,5.83333,13.1455,6.18687,12.5822,6.89394C12.4883,7.00758,12.3944,7.12121,12.3005,7.24747C11.9484,7.72727,11.0211,8.77525,10.2113,9.68434C10.2113,9.24242,10.1878,8.73737,10.1526,8.19444C10.0704,6.95707,9.92958,5.90909,9.92958,5.87121L9.92958,5.83333C9.75352,4.83586,9.20188,4.11616,8.3216,3.76263C7.82864,3.56061,7.37089,3.53535,7.19484,3.53535C6.73709,3.43434,6.4554,3.24495,6.33803,2.99242C6.19718,2.68939,6.29108,2.24747,6.38498,1.9697C7.28873,1.59091,8.26291,1.37626,9.28404,1.37626C10.3873,1.37626,11.4437,1.61616,12.4061,2.04545C12.3357,2.18434,12.277,2.34848,12.2535,2.5505C12.2066,3.04293,12.3709,3.64899,12.7934,4.5202Z></path><path d=M15.22299772857666,9.722223632261718C12.59389772857666,9.722223632261718,10.44600772857666,12.020201374511718,10.44600772857666,14.861111374511719C10.44600772857666,17.70202137451172,12.58215772857666,20.000021374511718,15.223007728576661,20.000021374511718C17.86384772857666,20.000021374511718,19.99999772857666,17.70202137451172,19.99999772857666,14.861111374511719C19.99999772857666,12.020201374511718,17.85211772857666,9.72222212709572,15.22299772857666,9.722223632261718ZM15.22299772857666,18.598491374511717C13.30985772857666,18.598491374511717,11.737087728576661,16.91919137451172,11.737087728576661,14.848481374511719C11.737087728576661,12.777781374511719,13.29811772857666,11.098491374511719,15.22299772857666,11.098491374511719C17.14787772857666,11.098491374511719,18.708917728576658,12.777781374511719,18.708917728576658,14.848481374511719C18.708917728576658,16.91919137451172,17.13614772857666,18.59848137451172,15.22299772857666,18.598491374511717Z></path><path d=M15.692486288146974,15.050496970825195L15.692486288146974,12.676760970825196C15.692486288146974,12.297972970825196,15.399058288146973,11.982316970825195,15.046945288146972,11.982316970825195C14.694833288146972,11.982316970825195,14.401406288146973,12.297972970825196,14.401406288146973,12.676760970825196L14.401406288146973,15.340896970825195C14.401406288146973,15.530296970825194,14.471829288146973,15.694436970825196,14.589200288146973,15.833326970825196L15.751176288146972,17.095956970825195C15.868546288146973,17.222216970825194,16.032866288146973,17.297976970825196,16.208916288146973,17.297976970825196C16.384976288146973,17.297976970825196,16.537556288146973,17.222216970825194,16.666666288146974,17.095956970825195C16.78403628814697,16.969686970825194,16.854456288146974,16.792916970825196,16.854456288146974,16.603526970825193C16.854456288146974,16.414136970825197,16.78403628814697,16.237366970825196,16.666666288146974,16.111106970825197L15.692486288146974,15.050496970825195Z></path></svg><span></span></div><div class="item tools"><svg viewBox="0 0 20 20"><path d=M19.7361,12.542L18.1916,11.2919C18.2647,10.8678,18.3025,10.4347,18.3025,10.0017C18.3025,9.56861,18.2647,9.13555,18.1916,8.71142L19.7361,7.46135C19.9743,7.26938,20.0615,6.95686,19.9554,6.6756L19.9342,6.61756C19.5074,5.49026,18.8755,4.45449,18.0549,3.53926L18.0124,3.49238C17.8096,3.26692,17.4819,3.1821,17.1848,3.28032L15.2677,3.92544C14.5603,3.3763,13.7704,2.94324,12.9168,2.63966L12.5466,0.742229C12.49,0.449802,12.2472,0.222111,11.9383,0.168536L11.8746,0.157375C10.6461,-0.0524583,9.35391,-0.0524583,8.1254,0.157375L8.06174,0.168536C7.75284,0.222111,7.50997,0.449802,7.45338,0.742229L7.08082,2.64859C6.2343,2.95217,5.44909,3.383,4.74641,3.92991L2.81522,3.28032C2.52047,3.1821,2.19036,3.26469,1.98757,3.49238L1.94513,3.53926C1.12455,4.45672,0.492609,5.49249,0.0658141,6.61756L0.0445921,6.6756C-0.0615171,6.95463,0.0257283,7.26715,0.263885,7.46135L1.82723,8.72482C1.75413,9.14448,1.71876,9.57308,1.71876,9.99944C1.71876,10.428,1.75413,10.8566,1.82723,11.2741L0.263885,12.5375C0.025729,12.7295,-0.0615164,13.042,0.0445929,13.3233L0.0658148,13.3813C0.49261,14.5064,1.12455,15.5444,1.94513,16.4596L1.98757,16.5065C2.19036,16.732,2.51812,16.8168,2.81522,16.7186L4.74641,16.069C5.44909,16.6159,6.2343,17.0489,7.08082,17.3503L7.45338,19.2567C7.50997,19.5491,7.75284,19.7768,8.06174,19.8303L8.1254,19.8415C8.74084,19.9464,9.37042,20,10,20C10.6296,20,11.2615,19.9464,11.8746,19.8415L11.9383,19.8303C12.2472,19.7768,12.49,19.5491,12.5466,19.2567L12.9168,17.3592C13.7704,17.0556,14.5603,16.6248,15.2677,16.0734L17.1848,16.7186C17.4795,16.8168,17.8096,16.7342,18.0124,16.5065L18.0549,16.4596C18.8755,15.5422,19.5074,14.5064,19.9342,13.3813L19.9554,13.3233C20.0615,13.0487,19.9743,12.7362,19.7361,12.542ZM16.5175,8.97483C16.5764,9.3119,16.6071,9.65791,16.6071,10.0039C16.6071,10.3499,16.5764,10.6959,16.5175,11.033L16.3618,11.9281L18.1233,13.3545C17.8568,13.9372,17.5196,14.4863,17.1188,14.9975L14.9305,14.2631L14.1901,14.839C13.6266,15.2765,12.9994,15.6203,12.3203,15.8614L11.4219,16.1806L10.9998,18.3459C10.3372,18.4173,9.66045,18.4173,8.9955,18.3459L8.57342,16.1761L7.6821,15.8524C7.01008,15.6114,6.38521,15.2676,5.82637,14.8323L5.08596,14.2541L2.88361,14.9953C2.48275,14.4841,2.14791,13.9327,1.8791,13.3523L3.65938,11.9125L3.50611,11.0196C3.44952,10.687,3.41887,10.3432,3.41887,10.0039C3.41887,9.66237,3.44716,9.32083,3.50611,8.98822L3.65938,8.09531L1.8791,6.6555C2.14556,6.07288,2.48275,5.52374,2.88361,5.01255L5.08596,5.75367L5.82637,5.17551C6.38521,4.74022,7.01008,4.39645,7.6821,4.15536L8.57578,3.83615L8.99786,1.66638C9.66045,1.59495,10.3372,1.59495,11.0021,1.66638L11.4242,3.83168L12.3226,4.1509C12.9994,4.39198,13.6289,4.73575,14.1925,5.17328L14.9329,5.7492L17.1211,5.01479C17.522,5.52598,17.8568,6.07734,18.1256,6.65773L16.3642,8.08416L16.5175,8.97483ZM10.0024,5.85189C7.7104,5.85189,5.85231,7.61092,5.85231,9.78068C5.85231,11.9504,7.7104,13.7095,10.0024,13.7095C12.2943,13.7095,14.1524,11.9504,14.1524,9.78068C14.1524,7.61092,12.2943,5.85189,10.0024,5.85189ZM11.8699,11.5486C11.37,12.0196,10.7074,12.2808,10.0024,12.2808C9.29732,12.2808,8.63473,12.0196,8.13483,11.5486C7.6373,11.0754,7.36142,10.4481,7.36142,9.78068C7.36142,9.11323,7.6373,8.48596,8.13483,8.01272C8.63473,7.53948,9.29732,7.28054,10.0024,7.28054C10.7074,7.28054,11.37,7.53948,11.8699,8.01272C12.3674,8.48596,12.6433,9.11323,12.6433,9.78068C12.6433,10.4481,12.3674,11.0754,11.8699,11.5486Z></path></svg><span></span></div><div class="item tools"><svg viewBox="0 0 20 20"><path d=M6.50977,1L13.4902,1C13.6406,1,13.7695,1.1104910000000001,13.7969,1.2631700000000001L14.0273,2.52277C14.1387,3.13147,14.6543,3.57143,15.2559,3.57143L17.5,3.57143C18.8809,3.57143,20,4.72254,20,6.14286L20,16.4286C20,17.8489,18.8809,19,17.5,19L2.5,19C1.11914,19,0,17.8489,0,16.4286L0,6.14286C0,4.72254,1.11914,3.57143,2.5,3.57143L4.74414,3.57143C5.3457,3.57143,5.86133,3.13147,5.97266,2.52277L6.20312,1.2631700000000001C6.23047,1.1104910000000001,6.35937,1,6.50977,1ZM15.2559,4.857139999999999C14.0547,4.857139999999999,13.0215,3.97522,12.7988,2.75982L12.7129,2.28571L7.28711,2.28571L7.20117,2.75982C6.98047,3.97522,5.94727,4.857139999999999,4.74414,4.857139999999999L2.5,4.857139999999999C1.81055,4.857139999999999,1.25,5.43371,1.25,6.14286L1.25,16.4286C1.25,17.1377,1.81055,17.7143,2.5,17.7143L17.5,17.7143C18.1895,17.7143,18.75,17.1377,18.75,16.4286L18.75,6.14286C18.75,5.43371,18.1895,4.857139999999999,17.5,4.857139999999999L15.2559,4.857139999999999ZM4.375,6.78571L3.125,6.78571C2.7793,6.78571,2.5,6.49844,2.5,6.14286C2.5,5.78728,2.7793,5.5,3.125,5.5L4.375,5.5C4.7207,5.5,5,5.78728,5,6.14286C5,6.49844,4.7207,6.78571,4.375,6.78571ZM10,6.14286C7.06641,6.14286,4.6875,8.58973,4.6875,11.6071C4.6875,14.6246,7.06641,17.0714,10,17.0714C12.9336,17.0714,15.3125,14.6246,15.3125,11.6071C15.3125,8.58973,12.9336,6.14286,10,6.14286ZM10,7.42857C11.0859,7.42857,12.1055,7.8625,12.873,8.65201C13.6406,9.44152,14.0625,10.49018,14.0625,11.6071C14.0625,12.7241,13.6406,13.7728,12.873,14.5623C12.1055,15.3518,11.0859,15.7857,10,15.7857C8.91406,15.7857,7.89453,15.3518,7.12695,14.5623C6.35937,13.7728,5.9375,12.7241,5.9375,11.6071C5.9375,10.49018,6.35938,9.44152,7.12695,8.65201C7.89453,7.8625,8.91406,7.42857,10,7.42857ZM10,9.67857C8.96484,9.67857,8.125,10.54241,8.125,11.6071C8.125,12.6719,8.96484,13.5357,10,13.5357C11.0352,13.5357,11.875,12.6719,11.875,11.6071C11.875,10.54241,11.0352,9.67857,10,9.67857ZM10,10.96429C10.3438,10.96429,10.625,11.2536,10.625,11.6071C10.625,11.9607,10.3438,12.25,10,12.25C9.65625,12.25,9.375,11.9607,9.375,11.6071C9.375,11.2536,9.65625,10.96429,10,10.96429Z></path></svg><span></span></div><div class="item tools">'), MM = /* @__PURE__ */ U("<div class=klinecharts-pro-popup_background><div class=period_list>"), TM = /* @__PURE__ */ U("<li>"), IM = /* @__PURE__ */ U('<svg viewBox="0 0 20 20"><path d=M1.08108,0L0,1.079L4.18919,5.27938L2.54826,6.91715L6.9112,6.91715L6.9112,2.56262L5.28957,4.18112L1.08108,0ZM15.8108,5.27938L20,1.079L18.9189,0L14.7104,4.18112L13.0888,2.56262L13.0888,6.91715L17.4517,6.91715L15.8108,5.27938ZM4.16988,14.7014L0.07722,18.8054L1.1583,20L5.27027,15.7996L6.9112,17.4374L6.9112,13.0829L2.54826,13.0829L4.16988,14.7014ZM17.4517,13.0829L13.0888,13.0829L13.0888,17.4374L14.7297,15.7996L18.8417,20L19.9228,18.8054L15.8301,14.7013L17.4517,13.0829Z>'), W2 = /* @__PURE__ */ U("<span>"), OM = /* @__PURE__ */ U('<svg viewBox="0 0 20 20"><path d=M2.93444,1.76899L7.57544,6.40999L6.38918,7.59626L1.76899,2.93444L0,4.70343L0,0L4.70343,0L2.93444,1.76899ZM6.40999,12.4037L1.76899,17.0447L0,15.2758L0,19.9792L4.70343,19.9792L2.93444,18.2102L7.57544,13.5692L6.40999,12.4037ZM15.2758,0L17.0447,1.76899L12.4037,6.40999L13.59,7.59626L18.231,2.95526L20,4.72425L20,0L15.2758,0ZM13.5692,12.4037L12.3829,13.59L17.0239,18.231L15.2549,20L19.9792,20L19.9792,15.2758L18.2102,17.0447L13.5692,12.4037Z>');
const PM = (e) => {
  const [r, i] = E(!1), [o, s] = E(!0);
  E(0);
  const [c, u] = E(0), f = () => {
    i(!1), s(!0);
  }, g = () => {
    hS((C) => !C);
  }, m = () => {
  };
  return ts(() => {
    document.addEventListener("fullscreenchange", g), document.addEventListener("mozfullscreenchange", g), document.addEventListener("webkitfullscreenchange", g), document.addEventListener("msfullscreenchange", g);
  }), y0(() => {
    document.removeEventListener("fullscreenchange", g), document.removeEventListener("mozfullscreenchange", g), document.removeEventListener("webkitfullscreenchange", g), document.removeEventListener("msfullscreenchange", g);
  }), (() => {
    var C = AM(), b = C.firstChild, _ = b.firstChild, x = b.nextSibling, k = x.firstChild, T = x.nextSibling, $ = T.firstChild, A = $.nextSibling, F = T.nextSibling, Z = F.firstChild, N = Z.nextSibling, V = F.nextSibling, Q = V.firstChild, I = Q.nextSibling, q = V.nextSibling, H = q.firstChild, W = H.nextSibling, re = q.nextSibling;
    return zo((K) => {
    }, C), En(_, "click", e.onMenuClick, !0), G(C, Y(We, {
      get when() {
        return e.symbol;
      },
      get children() {
        var K = $M(), X = K.firstChild;
        return K.$$click = m, G(K, Y(We, {
          get when() {
            return e.symbol.logo;
          },
          get children() {
            var R = kM();
            return ze(() => pt(R, "src", e.symbol.logo)), R;
          }
        }), X), G(X, () => e.symbol.shortName ?? e.symbol.name ?? e.symbol.ticker), K;
      }
    }), x), k.$$click = (K) => {
      r() || (f(), u(x1().x - K.pageX > 200 ? K.pageX : x1().x - 200)), s(!1), i(!r());
    }, G(k, () => e.period.text), G(x, (() => {
      var K = ot(() => !!r());
      return () => K() && (() => {
        var X = MM(), R = X.firstChild;
        return X.$$click = () => {
          i(!1), s(!0);
        }, G(R, () => e.periods.map((te) => (() => {
          var le = TM();
          return le.$$click = () => {
            e.onPeriodChange(te), i(!1), s(!0);
          }, G(le, () => te.text), le;
        })())), ze((te) => Ao(R, "left", `${c() - 50}px`)), X;
      })();
    })(), null), En(T, "click", e.onIndicatorClick, !0), G(A, () => y("indicator", e.locale)), En(F, "click", e.onTimezoneClick, !0), G(N, () => y("timezone", e.locale)), En(V, "click", e.onSettingClick, !0), G(I, () => y("setting", e.locale)), En(q, "click", e.onScreenshotClick, !0), G(W, () => y("screenshot", e.locale)), re.$$click = () => {
      if (U2())
        (document.exitFullscreen ?? document.msExitFullscreen ?? document.mozCancelFullScreen ?? document.webkitExitFullscreen).call(document);
      else {
        const K = Rn.isString(Co()) ? document.querySelector(`#${Co()}`) : Co();
        K && (K.requestFullscreen ?? K.webkitRequestFullscreen ?? K.mozRequestFullScreen ?? K.msRequestFullscreen).call(K);
      }
    }, G(re, (() => {
      var K = ot(() => !!U2());
      return () => K() ? [IM(), (() => {
        var X = W2();
        return G(X, () => y("exit_full_screen", e.locale)), X;
      })()] : [OM(), (() => {
        var X = W2();
        return G(X, () => y("full_screen", e.locale)), X;
      })()];
    })()), ze((K) => {
      var X = `${o() ? "overflow-x: auto;" : ""}`, R = e.spread ? "" : "rotate";
      return K.e = en(C, X, K.e), R !== K.t && pt(_, "class", K.t = R), K;
    }, {
      e: void 0,
      t: void 0
    }), C;
  })();
};
At(["click"]);
var BM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M12.41465,11L18.5,11C18.7761,11,19,11.22386,19,11.5C19,11.77614,18.7761,12,18.5,12L12.41465,12C12.20873,12.5826,11.65311,13,11,13C10.34689,13,9.79127,12.5826,9.58535,12L3.5,12C3.223857,12,3,11.77614,3,11.5C3,11.22386,3.223857,11,3.5,11L9.58535,11C9.79127,10.417404,10.34689,10,11,10C11.65311,10,12.20873,10.417404,12.41465,11Z stroke-opacity=0 stroke=none>');
const EM = () => BM();
var RM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M6.91465,11L11.08535,11C11.29127,10.417404,11.84689,10,12.5,10C13.15311,10,13.70873,10.417404,13.91465,11L18.5,11C18.7761,11,19,11.22386,19,11.5C19,11.77614,18.7761,12,18.5,12L13.91465,12C13.70873,12.5826,13.15311,13,12.5,13C11.84689,13,11.29127,12.5826,11.08535,12L6.91465,12C6.70873,12.5826,6.15311,13,5.5,13C4.671573,13,4,12.32843,4,11.5C4,10.671573,4.671573,10,5.5,10C6.15311,10,6.70873,10.417404,6.91465,11Z stroke-opacity=0 stroke=none>');
const DM = () => RM();
var FM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M6.91465,12.5C6.70873,13.0826,6.15311,13.5,5.5,13.5C4.671573,13.5,4,12.82843,4,12C4,11.171573,4.671573,10.5,5.5,10.5C6.15311,10.5,6.70873,10.917404,6.91465,11.5L16.0853,11.5C16.2913,10.917404,16.846899999999998,10.5,17.5,10.5C18.328400000000002,10.5,19,11.171573,19,12C19,12.82843,18.328400000000002,13.5,17.5,13.5C16.846899999999998,13.5,16.2913,13.0826,16.0853,12.5L6.91465,12.5Z stroke-opacity=0 stroke=none>');
const zM = () => FM();
var NM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M11,12.41465L11,18.5C11,18.7761,11.22386,19,11.5,19C11.77614,19,12,18.7761,12,18.5L12,12.41465C12.5826,12.20873,13,11.65311,13,11C13,10.34689,12.5826,9.79127,12,9.58535L12,3.5C12,3.223857,11.77614,3,11.5,3C11.22386,3,11,3.223857,11,3.5L11,9.58535C10.417404,9.79127,10,10.34689,10,11C10,11.65311,10.417404,12.20873,11,12.41465Z stroke-opacity=0 stroke=none>');
const UM = () => NM();
var KM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M11.66558837890625,19C10.83716137890625,19,10.16558837890625,18.328400000000002,10.16558837890625,17.5C10.16558837890625,16.846899999999998,10.58298437890625,16.2913,11.16557337890625,16.0854L11.16557337890625,11.91464C10.58298437890625,11.70872,10.16558837890625,11.1531,10.16558837890625,10.5C10.16558837890625,9.8469,10.58298437890625,9.29128,11.16557337890625,9.08536L11.16557337890625,4.5C11.16557337890625,4.223857,11.38942837890625,4,11.66556837890625,4C11.94171837890625,4,12.16556837890625,4.223857,12.16556837890625,4.5L12.16556837890625,9.08535C12.74817837890625,9.291260000000001,13.16558837890625,9.846879999999999,13.16558837890625,10.5C13.16558837890625,11.153120000000001,12.74817837890625,11.708739999999999,12.16556837890625,11.91465L12.16556837890625,16.0854C12.74817837890625,16.2913,13.16558837890625,16.846899999999998,13.16558837890625,17.5C13.16558837890625,18.328400000000002,12.49401837890625,19,11.66558837890625,19Z stroke-opacity=0 stroke=none>');
const ZM = () => KM();
var WM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M11.165603637695312,6.91465C11.748203637695312,6.70873,12.165603637695312,6.15311,12.165603637695312,5.5C12.165603637695312,4.671573,11.494033637695313,4,10.665603637695312,4C9.837176637695313,4,9.165603637695312,4.671573,9.165603637695312,5.5C9.165603637695312,6.15311,9.583007637695312,6.70873,10.165603637695312,6.91465L10.165603637695312,16.0854C9.583007637695312,16.2913,9.165603637695312,16.846899999999998,9.165603637695312,17.5C9.165603637695312,18.328400000000002,9.837176637695313,19,10.665603637695312,19C11.494033637695313,19,12.165603637695312,18.328400000000002,12.165603637695312,17.5C12.165603637695312,16.846899999999998,11.748203637695312,16.2913,11.165603637695312,16.0854L11.165603637695312,6.91465Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const QM = () => WM();
var HM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M5.146447,15.753C4.9511845,15.9483,4.9511845,16.2649,5.146447,16.4602C5.341709,16.6554,5.658291,16.6554,5.853554,16.4602L8.156600000000001,14.15711C8.352409999999999,14.25082,8.57173,14.3033,8.8033,14.3033C9.631730000000001,14.3033,10.3033,13.63172,10.3033,12.80329C10.3033,12.57172,10.250820000000001,12.352409999999999,10.157119999999999,12.15659L12.156600000000001,10.15711C12.352409999999999,10.250820000000001,12.571729999999999,10.30329,12.8033,10.30329C13.63173,10.30329,14.3033,9.63172,14.3033,8.80329C14.3033,8.57172,14.25082,8.352409999999999,14.15712,8.15659L16.4602,5.853553C16.6554,5.658291,16.6554,5.341709,16.4602,5.146447C16.2649,4.9511843,15.9483,4.9511843,15.753,5.146447L13.45001,7.449479999999999C13.25419,7.35577,13.03487,7.3032900000000005,12.8033,7.3032900000000005C11.97487,7.3032900000000005,11.3033,7.97487,11.3033,8.80329C11.3033,9.03487,11.35578,9.254190000000001,11.44949,9.450009999999999L9.450009999999999,11.449480000000001C9.254190000000001,11.35577,9.03487,11.30329,8.8033,11.30329C7.97487,11.30329,7.3033,11.97487,7.3033,12.80329C7.3033,13.03487,7.35578,13.25419,7.44949,13.45001L5.146447,15.753Z stroke-opacity=0 stroke=none>');
const YM = () => HM();
var GM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M7.573332939453125,14.54567903564453C7.667042939453125,14.741499035644532,7.719512939453125,14.960809035644532,7.719512939453125,15.19239903564453C7.719512939453125,16.02079903564453,7.047942939453125,16.69239903564453,6.219512939453125,16.69239903564453C5.391085939453125,16.69239903564453,4.719512939453125,16.02079903564453,4.719512939453125,15.19239903564453C4.719512939453125,14.36394903564453,5.391085939453125,13.692379035644532,6.219512939453125,13.692379035644532C6.451092939453125,13.692379035644532,6.670412939453125,13.74485903564453,6.866232939453125,13.83856903564453L9.865702939453126,10.83909903564453C9.771992939453124,10.643279035644532,9.719512939453125,10.42395903564453,9.719512939453125,10.192379035644532C9.719512939453125,9.36394903564453,10.391082939453124,8.692379035644532,11.219512939453125,8.692379035644532C11.451092939453126,8.692379035644532,11.670412939453126,8.74485903564453,11.866232939453125,8.838569035644532L15.462112939453124,5.242645035644531C15.657412939453126,5.047383335644532,15.974012939453125,5.047383335644532,16.169212939453125,5.242645035644531C16.364512939453125,5.437907035644531,16.364512939453125,5.754489035644531,16.169212939453125,5.949752035644531L12.573332939453124,9.545679035644532C12.667042939453125,9.74149903564453,12.719512939453125,9.96080903564453,12.719512939453125,10.192379035644532C12.719512939453125,11.020809035644533,12.047942939453126,11.692379035644532,11.219512939453125,11.692379035644532C10.987942939453125,11.692379035644532,10.768632939453125,11.639909035644532,10.572812939453126,11.54619903564453L7.573332939453125,14.54567903564453Z stroke-opacity=0 stroke=none>');
const jM = () => GM();
var VM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M15.719512939453125,8.461776733398438C16.547912939453127,8.461776733398438,17.219512939453125,7.7902067333984375,17.219512939453125,6.9617767333984375C17.219512939453125,6.133349733398438,16.547912939453127,5.4617767333984375,15.719512939453125,5.4617767333984375C14.891082939453124,5.4617767333984375,14.219512939453125,6.133349733398438,14.219512939453125,6.9617767333984375C14.219512939453125,7.193346733398437,14.271992939453124,7.412666733398438,14.365692939453124,7.608486733398438L7.366222939453126,14.607956733398437C7.170402939453125,14.514256733398437,6.951082939453125,14.461776733398438,6.719512939453125,14.461776733398438C5.891085939453125,14.461776733398438,5.219512939453125,15.133346733398437,5.219512939453125,15.961776733398438C5.219512939453125,16.79017673339844,5.891085939453125,17.461776733398438,6.719512939453125,17.461776733398438C7.547942939453125,17.461776733398438,8.219512939453125,16.79017673339844,8.219512939453125,15.961776733398438C8.219512939453125,15.730176733398437,8.167032939453126,15.510876733398437,8.073322939453124,15.315066733398437L15.072802939453124,8.315586733398437C15.268612939453124,8.409296733398438,15.487912939453125,8.461776733398438,15.719512939453125,8.461776733398438Z stroke-opacity=0 stroke=none>');
const qM = () => VM();
var XM = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M17.0643,7.033864912109375L18,3.585784912109375L14.5078,4.509695912109375L15.3537,5.344934912109375L6.02026,14.560584912109375C5.87635,14.517484912109374,5.72366,14.494284912109375,5.5655,14.494284912109375C4.7009,14.494284912109375,4,15.186384912109375,4,16.040084912109375C4,16.893784912109375,4.7009,17.585784912109375,5.5655,17.585784912109375C6.43011,17.585784912109375,7.13101,16.893784912109375,7.13101,16.040084912109375C7.13101,15.722284912109375,7.03392,15.426984912109376,6.86744,15.181384912109374L16.0917,6.073604912109375L17.0643,7.033864912109375Z stroke-opacity=0 stroke=none>');
const JM = () => XM();
var eT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M6.91465,13.00505L18.5,13.00505C18.7761,13.00505,19,13.228909999999999,19,13.50505C19,13.781189999999999,18.7761,14.00505,18.5,14.00505L6.91465,14.00505C6.70873,14.58765,6.15311,15.00505,5.5,15.00505C4.671573,15.00505,4,14.33348,4,13.50505C4,12.67662,4.671573,12.00505,5.5,12.00505C6.15311,12.00505,6.70873,12.422450000000001,6.91465,13.00505ZM7.81404,11.625L10.48591,11.625L10.48591,10.90625L9.65193,10.90625L9.65193,7.125L8.997630000000001,7.125C8.71443,7.306641,8.415600000000001,7.419922,7.96443,7.498047L7.96443,8.05078L8.77497,8.05078L8.77497,10.90625L7.81404,10.90625L7.81404,11.625ZM11.081620000000001,11.625L14.0562,11.625L14.0562,10.88281L13.09724,10.88281C12.8863,10.88281,12.59333,10.90625,12.36482,10.93555C13.17537,10.11328,13.84724,9.2207,13.84724,8.39062C13.84724,7.541016,13.28865,7,12.4488,7C11.84333,7,11.446850000000001,7.234375,11.03279,7.679688L11.52497,8.16797C11.747630000000001,7.914062,12.0113,7.697266,12.33552,7.697266C12.7613,7.697266,13.00154,7.982422,13.00154,8.43359C13.00154,9.14648,12.29255,10.00781,11.081620000000001,11.11523L11.081620000000001,11.625ZM15.9605,11.75C16.8121,11.75,17.526899999999998,11.2832,17.526899999999998,10.4375C17.526899999999998,9.82031,17.142200000000003,9.43945,16.6441,9.30078L16.6441,9.27148C17.1129,9.08594,17.3824,8.7207,17.3824,8.21289C17.3824,7.421875,16.8004,7,15.9429,7C15.4215,7,14.9957,7.210938,14.6109,7.541016L15.066,8.11133C15.3258,7.849609,15.5836,7.697266,15.9019,7.697266C16.2789,7.697266,16.4957,7.914062,16.4957,8.28125C16.4957,8.70898,16.2301,9,15.4215,9L15.4215,9.63672C16.3804,9.63672,16.6383,9.91992,16.6383,10.38086C16.6383,10.79688,16.3336,11.03125,15.8824,11.03125C15.4742,11.03125,15.1578,10.82227,14.8922,10.55078L14.4781,11.13281C14.7906,11.486329999999999,15.2652,11.75,15.9605,11.75Z stroke-opacity=0 stroke=none>');
const tT = () => eT();
var nT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M3.146447,14.178126025390625C2.9511847,13.982826025390626,2.9511847,13.666226025390625,3.146447,13.470926025390625L7.39146,9.225966025390626C7.35417,9.095106025390624,7.33421,8.956946025390625,7.33421,8.814116025390625C7.33421,7.985696025390625,8.00578,7.314116025390625,8.834209999999999,7.314116025390625C8.97703,7.314116025390625,9.11519,7.334086025390625,9.24605,7.371366025390625L13.753,2.864373025390625C13.9483,2.669110325390625,14.2649,2.669110325390625,14.4602,2.864373025390625C14.6554,3.059635025390625,14.6554,3.376217025390625,14.4602,3.571479025390625L10.06916,7.962476025390625C10.23631,8.204386025390626,10.334209999999999,8.497826025390625,10.334209999999999,8.814116025390625C10.334209999999999,9.642546025390626,9.66264,10.314116025390625,8.834209999999999,10.314116025390625C8.51791,10.314116025390625,8.22448,10.216226025390625,7.98256,10.049076025390626L3.853554,14.178126025390625C3.658291,14.373326025390625,3.341709,14.373326025390625,3.146447,14.178126025390625ZM7.67736,19.188526025390626C7.4821,18.993226025390626,7.4821,18.676626025390625,7.67736,18.481426025390626L9.9804,16.178326025390625C9.88669,15.982526025390625,9.834209999999999,15.763226025390624,9.834209999999999,15.531626025390626C9.834209999999999,14.703226025390626,10.50578,14.031626025390626,11.33421,14.031626025390626C11.56579,14.031626025390626,11.78511,14.084126025390624,11.98093,14.177826025390624L13.9804,12.178356025390626C13.8867,11.982536025390624,13.8342,11.763216025390625,13.8342,11.531636025390625C13.8342,10.703206025390624,14.5058,10.031636025390625,15.3342,10.031636025390625C15.5658,10.031636025390625,15.7851,10.084116025390625,15.9809,10.177826025390626L18.284,7.874796025390625C18.4792,7.679536025390625,18.7958,7.679536025390625,18.9911,7.874796025390625C19.1863,8.070056025390624,19.1863,8.386636025390626,18.9911,8.581906025390625L16.688000000000002,10.884936025390624C16.7817,11.080756025390626,16.8342,11.300066025390626,16.8342,11.531636025390625C16.8342,12.360066025390624,16.162599999999998,13.031626025390626,15.3342,13.031626025390626C15.1026,13.031626025390626,14.8833,12.979126025390626,14.6875,12.885426025390625L12.68803,14.884926025390625C12.78174,15.080726025390625,12.83421,15.300026025390626,12.83421,15.531626025390626C12.83421,16.360026025390624,12.16264,17.031626025390626,11.33421,17.031626025390626C11.10264,17.031626025390626,10.88333,16.979126025390627,10.68751,16.885426025390625L8.38446,19.188526025390626C8.1892,19.383726025390626,7.87262,19.383726025390626,7.67736,19.188526025390626Z stroke-opacity=0 stroke=none>');
const rT = () => nT();
var iT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M3.3367688759765626,12.63173C3.5320318759765623,12.82699,3.8486138759765627,12.82699,4.043876875976562,12.63173L11.822052875976562,4.853553C12.017312875976563,4.658291,12.017312875976563,4.341708,11.822052875976562,4.146446C11.626792875976562,3.9511843,11.310202875976563,3.9511843,11.114942875976563,4.146446L3.3367688759765626,11.92462C3.1415071759765625,12.11988,3.1415071759765625,12.43647,3.3367688759765626,12.63173ZM5.001492875976562,17.0351C4.806232875976562,16.8399,4.806232875976562,16.5233,5.001492875976562,16.328L7.304532875976562,14.025C7.210822875976563,13.82916,7.158352875976563,13.60984,7.158352875976563,13.37827C7.158352875976563,12.54984,7.829922875976562,11.87827,8.658352875976561,11.87827C8.889922875976563,11.87827,9.109232875976563,11.93075,9.305052875976562,12.02446L11.304532875976562,10.02498C11.210822875976563,9.82916,11.158352875976561,9.60984,11.158352875976561,9.37827C11.158352875976561,8.54984,11.829922875976562,7.8782700000000006,12.658352875976563,7.8782700000000006C12.889922875976563,7.8782700000000006,13.109232875976563,7.93075,13.305022875976562,8.024460000000001L15.608122875976562,5.72142C15.803322875976562,5.5261499999999995,16.119922875976563,5.5261499999999995,16.315222875976563,5.72142C16.510422875976563,5.9166799999999995,16.510422875976563,6.23326,16.315222875976563,6.42852L14.012122875976562,8.73156C14.105822875976562,8.92738,14.158322875976562,9.1467,14.158322875976562,9.37827C14.158322875976562,10.2067,13.486822875976562,10.87827,12.658352875976563,10.87827C12.426772875976562,10.87827,12.207452875976562,10.82579,12.011642875976563,10.73209L10.012162875976562,12.73156C10.105872875976562,12.92738,10.158352875976561,13.1467,10.158352875976561,13.37827C10.158352875976561,14.2067,9.486772875976563,14.8783,8.658352875976561,14.8783C8.426772875976562,14.8783,8.207452875976562,14.8258,8.011642875976563,14.7321L5.708602875976562,17.0351C5.513342875976562,17.2304,5.196752875976562,17.2304,5.001492875976562,17.0351ZM10.415712875976563,18.328C10.220452875976562,18.5233,9.903862875976563,18.5233,9.708602875976563,18.328C9.513342875976562,18.1328,9.513342875976562,17.816200000000002,9.708602875976563,17.6209L12.304532875976562,15.025C12.210822875976563,14.8292,12.158352875976563,14.6098,12.158352875976563,14.3783C12.158352875976563,13.54984,12.829922875976562,12.87827,13.658322875976562,12.87827C13.889922875976563,12.87827,14.109222875976563,12.93075,14.305022875976562,13.02446L17.486822875976564,9.84274C17.682022875976564,9.64747,17.99862287597656,9.64747,18.19392287597656,9.84274C18.38912287597656,10.038,18.38912287597656,10.35458,18.19392287597656,10.54984L15.012122875976562,13.73156C15.105822875976562,13.92738,15.158322875976562,14.1467,15.158322875976562,14.3783C15.158322875976562,15.2067,14.486822875976562,15.8783,13.658322875976562,15.8783C13.426822875976562,15.8783,13.207422875976562,15.8258,13.011642875976563,15.7321L10.415712875976563,18.328Z stroke-opacity=0 stroke=none>');
const oT = () => iT();
var aT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M13.1889,6C12.98303,6.582599999999999,12.42741,7,11.7743,7C11.12119,7,10.565570000000001,6.582599999999999,10.35965,6L3.5,6C3.223857,6,3,5.77614,3,5.5C3,5.22386,3.223857,5,3.5,5L10.35965,5C10.565570000000001,4.417404,11.12119,4,11.7743,4C12.42741,4,12.98303,4.417404,13.1889,5L18.5,5C18.7761,5,19,5.22386,19,5.5C19,5.77614,18.7761,6,18.5,6L13.1889,6ZM3,8.5C3,8.22386,3.223857,8,3.5,8L18.5,8C18.7761,8,19,8.22386,19,8.5C19,8.77614,18.7761,9,18.5,9L3.5,9C3.223857,9,3,8.77614,3,8.5ZM3.278549,11.5C3.278549,11.22386,3.502407,11,3.778549,11L18.7785,11C19.0547,11,19.2785,11.22386,19.2785,11.5C19.2785,11.77614,19.0547,12,18.7785,12L3.778549,12C3.502407,12,3.278549,11.77614,3.278549,11.5ZM3.139267,14.5C3.139267,14.2239,3.363124,14,3.6392670000000003,14L18.6393,14C18.915399999999998,14,19.1393,14.2239,19.1393,14.5C19.1393,14.7761,18.915399999999998,15,18.6393,15L3.6392670000000003,15C3.363124,15,3.139267,14.7761,3.139267,14.5ZM13.1889,18C12.98303,18.5826,12.42741,19,11.7743,19C11.12119,19,10.565570000000001,18.5826,10.35965,18L3.778549,18C3.502407,18,3.278549,17.7761,3.278549,17.5C3.278549,17.2239,3.502407,17,3.778549,17L10.35965,17C10.565570000000001,16.4174,11.12119,16,11.7743,16C12.42741,16,12.98303,16.4174,13.1889,17L18.7785,17C19.0547,17,19.2785,17.2239,19.2785,17.5C19.2785,17.7761,19.0547,18,18.7785,18L13.1889,18Z stroke-opacity=0 stroke=none>');
const sT = () => aT();
var lT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M4.91465,6C4.70873,6.582599999999999,4.15311,7,3.5,7C2.671573,7,2,6.32843,2,5.5C2,4.671573,2.671573,4,3.5,4C4.15311,4,4.70873,4.417404,4.91465,5L18.2257,5C18.5018,5,18.7257,5.22386,18.7257,5.5C18.7257,5.77614,18.5018,6,18.2257,6L4.91465,6ZM2.7257,8.5C2.7257,8.22386,2.949558,8,3.2257,8L18.2257,8C18.5018,8,18.7257,8.22386,18.7257,8.5C18.7257,8.77614,18.5018,9,18.2257,9L3.2257,9C2.949558,9,2.7257,8.77614,2.7257,8.5ZM3.00425,11.5C3.00425,11.22386,3.22811,11,3.50425,11L18.5042,11C18.7804,11,19.0042,11.22386,19.0042,11.5C19.0042,11.77614,18.7804,12,18.5042,12L3.50425,12C3.22811,12,3.00425,11.77614,3.00425,11.5ZM2.864967,14.5C2.864967,14.2239,3.08882,14,3.36497,14L18.365,14C18.6411,14,18.865,14.2239,18.865,14.5C18.865,14.7761,18.6411,15,18.365,15L3.36497,15C3.08882,15,2.864967,14.7761,2.864967,14.5ZM20,17.5C20,18.328400000000002,19.3284,19,18.5,19C17.846899999999998,19,17.2913,18.5826,17.0854,18L3.50425,18C3.22811,18,3.00425,17.7761,3.00425,17.5C3.00425,17.2239,3.22811,17,3.50425,17L17.0854,17C17.2913,16.4174,17.846899999999998,16,18.5,16C19.3284,16,20,16.671599999999998,20,17.5Z stroke-opacity=0 stroke=none>');
const cT = () => lT();
var uT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><ellipse cx=10.5 cy=11.5 rx=1.5 ry=1.5 stroke-opacity=0 stroke=none></ellipse><ellipse cx=17.5 cy=11.5 rx=1.5 ry=1.5 stroke-opacity=0 stroke=none></ellipse><ellipse cx=10.5 cy=11.5 rx=7 ry=7 fill-opacity=0 stroke-opacity=1 fill=none stroke-width=1></ellipse><ellipse cx=10.5 cy=11.5 rx=5 ry=5 fill-opacity=0 stroke-opacity=1 fill=none stroke-width=1></ellipse><ellipse cx=10.5 cy=11.5 rx=3 ry=3 fill-opacity=0 stroke-opacity=1 fill=none stroke-width=1>');
const fT = () => uT();
var dT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M3,7.32468C5.90649,3.3893050000000002,11.49833,2.81306,14.6674,6.31944C14.9056,6.1554199999999994,15.192,6.05979,15.5,6.05979C15.845,6.05979,16.1628,6.17974,16.4162,6.381349999999999L18.4509,4.23827L19,4.816615L16.8945,7.03429C16.962600000000002,7.21075,17,7.40319,17,7.60463C17,8.45782,16.328400000000002,9.14947,15.5,9.14947C14.6716,9.14947,14,8.45782,14,7.60463C14,7.36402,14.0534,7.13625,14.1487,6.93322C11.32695,3.748365,6.25159,4.253956,3.612785,7.82695L3,7.32468ZM14.09,15.4717C15.7427,13.78985,16.244500000000002,11.524740000000001,15.5633,9.30134L15.5618,9.30134L16.3012,9.0502C17.072400000000002,11.56646,16.497700000000002,14.158,14.6282,16.0599C12.28737,18.442,8.62386,18.6988,6.41348,16.4501C4.5526,14.5572,4.52076,11.19671,6.36766,9.3177C7.89069,7.76754,10.07544,7.706189999999999,11.56741,9.22363C11.95453,9.61742,12.24817,10.08363,12.43369,10.57677L14.1451,8.77421L14.6942,9.35256L12.64982,11.50582C12.65827,11.59712,12.66295,11.68839,12.66378,11.77936C12.87398,12.04523,13,12.38451,13,12.7541C13,13.60729,12.32843,14.2989,11.5,14.2989C10.67157,14.2989,10,13.60729,10,12.7541C10,11.90091,10.67157,11.20926,11.5,11.20926C11.60387,11.20926,11.70528,11.220130000000001,11.8032,11.240829999999999L11.81763,11.22564C11.69858,10.71874,11.42858,10.21929,11.0284,9.81179C9.844000000000001,8.60765,8.136890000000001,8.65592,6.90822,9.90586C5.37975,11.460930000000001,5.40693,14.288,6.95404,15.8619C8.84598,17.7867,12.03496,17.5626,14.09,15.4717Z stroke-opacity=0 stroke=none>');
const hT = () => dT();
var gT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M4,17.0854L4,3.5C4,3.223858,4.22386,3,4.5,3C4.77614,3,5,3.223858,5,3.5L5,10L7.57584,10L9.8127,4.46359C9.91614,4.20756,10.20756,4.08386,10.46359,4.1873000000000005C10.71963,4.29075,10.84333,4.58216,10.73988,4.8382000000000005L8.65438,10L11.08535,10C11.29127,9.4174,11.84689,9,12.5,9C12.65154,9,12.79784,9.02247,12.93573,9.06427L16.6464,5.35355C16.8417,5.15829,17.1583,5.15829,17.3536,5.35355C17.5488,5.54882,17.5488,5.8654,17.3536,6.06066L13.7475,9.66675C13.907,9.90508,14,10.19168,14,10.5C14,11.15311,13.5826,11.70873,13,11.91465L13,14.3638L18.3714,12.1936C18.6274,12.09015,18.918799999999997,12.21385,19.0222,12.46989C19.1257,12.72592,19.002,13.0173,18.746000000000002,13.1208L13,15.4423L13,18L19.5,18C19.7761,18,20,18.2239,20,18.5C20,18.7761,19.7761,19,19.5,19L5.91465,19C5.70873,19.5826,5.15311,20,4.5,20C3.671573,20,3,19.3284,3,18.5C3,17.846899999999998,3.417404,17.2913,4,17.0854ZM6.3729499999999994,17.0413L12,14.7678L12,11.91465C11.88136,11.87271,11.76956,11.81627,11.66675,11.74746L6.3729499999999994,17.0413ZM12,15.8463L6.6694700000000005,18L12,18L12,15.8463ZM6.38629,15.6137L8.250350000000001,11L11,11L6.38629,15.6137ZM5,11L7.17182,11L5,16.3754L5,11Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const pT = () => gT();
var yT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M17,4.5C17,5.32843,16.328400000000002,6,15.5,6C15.0931,6,14.7241,5.83802,14.4539,5.57503L5.98992,8.32515C5.99658,8.38251,6,8.440850000000001,6,8.5C6,9.15311,5.582599999999999,9.70873,5,9.91465L5,11.08535C5.42621,11.236,5.763999999999999,11.57379,5.91465,12L19.5,12C19.7761,12,20,12.22386,20,12.5C20,12.77614,19.7761,13,19.5,13L5.91465,13C5.70873,13.5826,5.15311,14,4.5,14C3.671573,14,3,13.3284,3,12.5C3,11.84689,3.417404,11.29127,4,11.08535L4,9.91465C3.417404,9.70873,3,9.15311,3,8.5C3,7.67157,3.671573,7,4.5,7C4.90411,7,5.2709,7.15981,5.5406200000000005,7.41967L14.0093,4.66802C14.0032,4.6128599999999995,14,4.5568,14,4.5C14,3.671573,14.6716,3,15.5,3C16.328400000000002,3,17,3.671573,17,4.5ZM4,15.5C4,15.2239,4.22386,15,4.5,15L19.5,15C19.7761,15,20,15.2239,20,15.5C20,15.7761,19.7761,16,19.5,16L4.5,16C4.22386,16,4,15.7761,4,15.5ZM4,18.5C4,18.2239,4.22386,18,4.5,18L19.5,18C19.7761,18,20,18.2239,20,18.5C20,18.7761,19.7761,19,19.5,19L4.5,19C4.22386,19,4,18.7761,4,18.5Z stroke-opacity=0 stroke=none>');
const mT = () => yT();
var bT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M20,3.5C20,4.15311,19.5826,4.70873,19,4.91465L19,18.5C19,18.7761,18.7761,19,18.5,19L4.91465,19C4.70873,19.5826,4.15311,20,3.5,20C2.671573,20,2,19.3284,2,18.5C2,17.846899999999998,2.417404,17.2913,3,17.0854L3,3.5C3,3.22386,3.22386,3,3.5,3L17.0854,3C17.2913,2.417404,17.846899999999998,2,18.5,2C19.3284,2,20,2.671573,20,3.5ZM17.0854,4C17.236,4.42621,17.5738,4.763999999999999,18,4.91465L18,8L14,8L14,4L17.0854,4ZM13,4L13,8L9,8L9,4L13,4ZM13,9L9,9L9,13L13,13L13,9ZM13,14L9,14L9,18L13,18L13,14ZM14,18L14,14L18,14L18,18L14,18ZM18,13L14,13L14,9L18,9L18,13ZM4.91465,18C4.763999999999999,17.5738,4.42621,17.236,4,17.0854L4,14L8,14L8,18L4.91465,18ZM4,8L4,4L8,4L8,8L4,8ZM8,9L8,13L4,13L4,9L8,9Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const vT = () => bT();
var _T = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><ellipse cx=10.5 cy=11.5 rx=1.5 ry=1.5 stroke-opacity=0 stroke=none></ellipse><ellipse cx=17.5 cy=11.5 rx=1.5 ry=1.5 stroke-opacity=0 stroke=none></ellipse><ellipse cx=10.5 cy=11.5 rx=7 ry=7 fill-opacity=0 fill=none stroke-opacity=1 stroke-width=1>');
const CT = () => _T();
var xT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M11.57625,6.9981C11.55099,6.999359999999999,11.52557,7,11.5,7C11.34,7,11.18584,6.97495,11.04125,6.9285499999999995L5.55401,16.4327C5.713760000000001,16.5905,5.83826,16.7839,5.91465,17L16.0854,17C16.2187,16.622700000000002,16.4987,16.314700000000002,16.8569,16.1445L11.57625,6.9981ZM12.50759,6.611219999999999C12.81005,6.336790000000001,13,5.94058,13,5.5C13,4.671573,12.32843,4,11.5,4C10.67157,4,10,4.671573,10,5.5C10,5.80059,10.08841,6.08052,10.24066,6.31522L4.64514,16.0069C4.59738,16.002299999999998,4.54896,16,4.5,16C3.671573,16,3,16.671599999999998,3,17.5C3,18.328400000000002,3.671573,19,4.5,19C5.15311,19,5.70873,18.5826,5.91465,18L16.0854,18C16.2913,18.5826,16.846899999999998,19,17.5,19C18.328400000000002,19,19,18.328400000000002,19,17.5C19,16.8365,18.5691,16.2735,17.971899999999998,16.075699999999998L12.50759,6.611219999999999Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const LT = () => xT();
var ST = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M19,4.5C19,5.15311,18.5826,5.70873,18,5.91465L18,18.5C18,18.7761,17.7761,19,17.5,19L5.91465,19C5.70873,19.5826,5.15311,20,4.5,20C3.671573,20,3,19.3284,3,18.5C3,17.846899999999998,3.417404,17.2913,4,17.0854L4,4.5C4,4.22386,4.22386,4,4.5,4L16.0854,4C16.2913,3.417404,16.846899999999998,3,17.5,3C18.328400000000002,3,19,3.671573,19,4.5ZM5,5L16.0854,5C16.236,5.42621,16.5738,5.763999999999999,17,5.91465L17,18L5.91465,18C5.763999999999999,17.5738,5.42621,17.236,5,17.0854L5,5Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const wT = () => ST();
var kT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M19.6401,7.99355C20.4028,7.92291,21,7.2811900000000005,21,6.5C21,5.671573,20.3284,5,19.5,5C18.8469,5,18.2913,5.417404,18.0854,6L7.62067,6C7.34453,6,7.12067,6.22386,7.12067,6.5C7.12067,6.5479,7.12741,6.59423,7.13999,6.63809L3.2294099999999997,15.0243C2.530138,15.1517,2,15.764,2,16.5C2,17.328400000000002,2.671573,18,3.5,18C4.15311,18,4.70873,17.5826,4.91465,17L14.5963,17C14.6456,17.076,14.7162,17.1396,14.8044,17.1807C15.0546,17.2974,15.3521,17.1891,15.4688,16.9388L19.6401,7.99355ZM14.7896,16.0293L18.6551,7.739599999999999C18.3942,7.56144,18.1925,7.30307,18.0854,7L8.0746,7L4.25044,15.2009C4.55701,15.3784,4.79493,15.6613,4.91465,16L14.6207,16C14.68,16,14.7368,16.0103,14.7896,16.0293Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const $T = () => kT();
var AT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M8.134443814697265,7.494615087890625L8.764323814697265,7.494615087890625L8.764323814697265,3.414215087890625L8.310223814697267,3.414215087890625L7.294603814697266,4.005035087890625L7.289713814697266,4.634915087890625L8.134443814697265,4.149892087890625L8.134443814697265,7.494615087890625ZM18.832003814697266,6.933095087890624Q19.004603814697266,6.635245087890625,19.004603814697266,6.2543850878906255Q19.004603814697266,5.884915087890625,18.845103814697264,5.593575087890625Q18.685503814697267,5.3006050878906255,18.399103814697266,5.136225087890625Q18.114303814697266,4.9702050878906245,17.754603814697266,4.9653250878906245L18.820603814697265,3.840647087890625L18.820603814697265,3.414215087890625L16.519203814697264,3.414215087890625L16.519203814697264,3.939931087890625L18.050803814697264,3.939931087890625L16.719403814697266,5.334785087890625L17.074203814697263,5.7205350878906245Q17.254903814697265,5.484525087890625,17.619503814697268,5.484525087890625Q17.980803814697268,5.484525087890625,18.187503814697266,5.689605087890625Q18.394203814697267,5.894685087890625,18.394203814697267,6.2543850878906255Q18.394203814697267,6.604315087890625,18.187503814697266,6.822415087890625Q17.980803814697268,7.0405150878906255,17.640603814697265,7.0405150878906255Q17.334603814697267,7.0405150878906255,17.124703814697266,6.890775087890625Q16.914703814697265,6.739415087890626,16.820303814697265,6.469225087890624L16.354803814697263,6.744295087890626Q16.480103814697266,7.125155087890625,16.821903814697265,7.341625087890625Q17.165403814697264,7.559725087890625,17.640603814697265,7.559725087890625Q18.039403814697266,7.559725087890625,18.348603814697267,7.393705087890625Q18.659503814697267,7.229315087890625,18.832003814697266,6.933095087890624ZM10.000003814697266,10.634915087890626C10.000003814697266,11.024655087890626,9.851363814697265,11.379685087890625,9.607683814697266,11.646395087890625L12.168903814697266,15.171615087890626C12.275403814697265,15.147615087890625,12.386203814697266,15.134915087890626,12.500003814697266,15.134915087890626C12.596503814697266,15.134915087890626,12.690803814697265,15.144015087890624,12.782303814697265,15.161415087890624L16.108803814697268,11.196955087890625C16.038703814697264,11.023375087890624,16.000003814697266,10.833655087890625,16.000003814697266,10.634915087890626C16.000003814697266,9.806495087890625,16.671603814697264,9.134915087890626,17.500003814697266,9.134915087890626C18.328403814697264,9.134915087890626,19.000003814697266,9.806495087890625,19.000003814697266,10.634915087890626C19.000003814697266,11.463345087890625,18.328403814697264,12.134915087890626,17.500003814697266,12.134915087890626C17.239503814697265,12.134915087890626,16.994503814697268,12.068495087890625,16.781003814697264,11.951675087890624L13.654703814697266,15.677415087890624C13.870303814697266,15.937215087890625,14.000003814697266,16.270915087890625,14.000003814697266,16.634915087890626C14.000003814697266,17.463315087890624,13.328403814697266,18.134915087890626,12.500003814697266,18.134915087890626C11.671573814697265,18.134915087890626,11.000003814697266,17.463315087890624,11.000003814697266,16.634915087890626C11.000003814697266,16.284415087890626,11.120193814697265,15.962015087890626,11.321603814697266,15.706715087890625L8.715393814697265,12.119565087890624C8.645053814697267,12.129685087890625,8.573143814697266,12.134915087890626,8.500003814697266,12.134915087890626C8.162103814697264,12.134915087890626,7.8503038146972655,12.023195087890626,7.599523814697266,11.834665087890626L4.505583814697266,15.521915087890624C4.809213814697266,15.796415087890624,5.000003814697266,16.193415087890624,5.000003814697266,16.634915087890626C5.000003814697266,17.463315087890624,4.328433814697266,18.134915087890626,3.5000038146972656,18.134915087890626C2.6715768146972656,18.134915087890626,2.0000038146972656,17.463315087890624,2.0000038146972656,16.634915087890626C2.0000038146972656,15.806515087890626,2.6715768146972656,15.134915087890626,3.5000038146972656,15.134915087890626C3.508253814697266,15.134915087890626,3.5164838146972657,15.135015087890626,3.524703814697266,15.135115087890625L7.033823814697266,10.953115087890625C7.011673814697265,10.850565087890626,7.000003814697266,10.744105087890624,7.000003814697266,10.634915087890626C7.000003814697266,9.806495087890625,7.671573814697266,9.134915087890626,8.500003814697266,9.134915087890626C9.328433814697267,9.134915087890626,10.000003814697266,9.806495087890625,10.000003814697266,10.634915087890626Z stroke-opacity=0 stroke=none>');
const MT = () => AT();
var TT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M8.13444,7.494615087890625L8.76432,7.494615087890625L8.76432,3.414215087890625L8.310220000000001,3.414215087890625L7.2946,4.005035087890625L7.28971,4.634915087890625L8.13444,4.149892087890625L8.13444,7.494615087890625ZM18.832,6.929835087890625Q19.0046,6.635245087890625,19.0046,6.2543850878906255Q19.0046,5.889805087890625,18.8451,5.5952050878906245Q18.6855,5.3006050878906255,18.3975,5.132965087890625Q18.1094,4.9653250878906245,17.7399,4.9653250878906245Q17.435499999999998,4.9653250878906245,17.1556,5.149245087890625L17.2793,3.939931087890625L18.8304,3.939931087890625L18.8304,3.414215087890625L16.7406,3.414215087890625L16.5094,5.665195087890625L17.0156,5.795405087890625Q17.095399999999998,5.655425087890626,17.2516,5.570795087890625Q17.4095,5.484525087890625,17.6357,5.484525087890625Q17.9694,5.484525087890625,18.1842,5.697745087890625Q18.4007,5.909335087890625,18.4007,6.2543850878906255Q18.4007,6.604315087890625,18.1842,6.822415087890625Q17.9694,7.0405150878906255,17.6292,7.0405150878906255Q17.3298,7.0405150878906255,17.119799999999998,6.890775087890625Q16.9098,6.739415087890626,16.825200000000002,6.474115087890625L16.3597,6.749175087890626Q16.470399999999998,7.110505087890624,16.807299999999998,7.335115087890625Q17.144199999999998,7.559725087890625,17.6292,7.559725087890625Q18.0296,7.559725087890625,18.3438,7.392075087890625Q18.6595,7.224435087890625,18.832,6.929835087890625ZM10,10.634915087890626C10,11.024655087890626,9.85136,11.379685087890625,9.60768,11.646395087890625L12.1689,15.171615087890626C12.2754,15.147615087890625,12.3862,15.134915087890626,12.5,15.134915087890626C12.5965,15.134915087890626,12.6908,15.144015087890624,12.7823,15.161415087890624L16.108800000000002,11.196955087890625C16.0387,11.023375087890624,16,10.833655087890625,16,10.634915087890626C16,9.806495087890625,16.671599999999998,9.134915087890626,17.5,9.134915087890626C18.3284,9.134915087890626,19,9.806495087890625,19,10.634915087890626C19,11.463345087890625,18.3284,12.134915087890626,17.5,12.134915087890626C17.2395,12.134915087890626,16.994500000000002,12.068505087890625,16.781,11.951675087890624L13.6547,15.677415087890624C13.8703,15.937215087890625,14,16.270915087890625,14,16.634915087890626C14,17.463315087890624,13.3284,18.134915087890626,12.5,18.134915087890626C11.67157,18.134915087890626,11,17.463315087890624,11,16.634915087890626C11,16.284415087890626,11.12019,15.962015087890626,11.3216,15.706715087890625L8.71539,12.119565087890624C8.645050000000001,12.129685087890625,8.57314,12.134915087890626,8.5,12.134915087890626C8.162099999999999,12.134915087890626,7.8503,12.023195087890626,7.59952,11.834665087890626L4.50558,15.521915087890624C4.80921,15.796415087890624,5,16.193415087890624,5,16.634915087890626C5,17.463315087890624,4.32843,18.134915087890626,3.5,18.134915087890626C2.671573,18.134915087890626,2,17.463315087890624,2,16.634915087890626C2,15.806515087890626,2.671573,15.134915087890626,3.5,15.134915087890626C3.5082500000000003,15.134915087890626,3.51648,15.135015087890626,3.5247,15.135115087890625L7.03382,10.953115087890625C7.01167,10.850565087890626,7,10.744105087890624,7,10.634915087890626C7,9.806495087890625,7.67157,9.134915087890626,8.5,9.134915087890626C9.32843,9.134915087890626,10,9.806495087890625,10,10.634915087890626Z stroke-opacity=0 stroke=none>');
const IT = () => TT();
var OT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M18.8532,7.020985087890625Q19.0257,6.734525087890625,19.0257,6.369945087890625Q19.0257,6.020005087890625,18.8499,5.754705087890625Q18.6758,5.489415087890626,18.3649,5.339675087890625Q18.5944,5.209465087890625,18.7214,4.994615087890625Q18.8499,4.779775087890625,18.8499,4.5193550878906255Q18.8499,4.2003480878906245,18.7002,3.951324087890625Q18.5505,3.700673087890625,18.277,3.557444087890625Q18.0052,3.414215087890625,17.6455,3.414215087890625Q17.285800000000002,3.414215087890625,17.0107,3.557444087890625Q16.7357,3.700673087890625,16.5843,3.951324087890625Q16.4346,4.2003480878906245,16.4346,4.5193550878906255Q16.4346,4.779775087890625,16.561500000000002,4.994615087890625Q16.6901,5.209465087890625,16.919600000000003,5.339675087890625Q16.6055,5.489415087890626,16.4297,5.757965087890625Q16.255499999999998,6.024895087890625,16.255499999999998,6.369945087890625Q16.255499999999998,6.734525087890625,16.4297,7.020985087890625Q16.6055,7.305815087890625,16.919600000000003,7.465325087890625Q17.2354,7.624825087890625,17.6455,7.624825087890625Q18.0557,7.624825087890625,18.3682,7.465325087890625Q18.6807,7.305815087890625,18.8532,7.020985087890625ZM8.76432,7.559725087890625L8.13444,7.559725087890625L8.13444,4.214996087890625L7.28971,4.700025087890625L7.2946,4.070139087890625L8.310220000000001,3.479319087890625L8.76432,3.479319087890625L8.76432,7.559725087890625ZM17.1816,4.955555087890625Q17.0042,4.784655087890625,17.0042,4.5095950878906255Q17.0042,4.229645087890625,17.18,4.057119087890625Q17.355800000000002,3.884592087890625,17.6455,3.884592087890625Q17.935200000000002,3.884592087890625,18.1077,4.057119087890625Q18.2803,4.229645087890625,18.2803,4.5095950878906255Q18.2803,4.784655087890625,18.1045,4.955555087890625Q17.930300000000003,5.124825087890625,17.6455,5.124825087890625Q17.3607,5.124825087890625,17.1816,4.955555087890625ZM18.2217,5.7953950878906255Q18.4398,6.005365087890625,18.4398,6.3552950878906245Q18.4398,6.705235087890625,18.2217,6.915195087890625Q18.0052,7.125155087890625,17.6455,7.125155087890625Q17.285800000000002,7.125155087890625,17.067700000000002,6.915195087890625Q16.849600000000002,6.705235087890625,16.849600000000002,6.3552950878906245Q16.849600000000002,6.005365087890625,17.064500000000002,5.7953950878906255Q17.2793,5.585435087890625,17.6455,5.585435087890625Q18.0052,5.585435087890625,18.2217,5.7953950878906255ZM9.60768,11.711495087890626C9.85136,11.444785087890626,10,11.089765087890626,10,10.700025087890625C10,9.871595087890626,9.32843,9.200025087890625,8.5,9.200025087890625C7.67157,9.200025087890625,7,9.871595087890626,7,10.700025087890625C7,10.809205087890625,7.01167,10.915665087890625,7.03382,11.018215087890624L3.5247,15.200215087890625C3.51648,15.200115087890625,3.5082500000000003,15.200015087890625,3.5,15.200015087890625C2.671573,15.200015087890625,2,15.871615087890625,2,16.700015087890627C2,17.528415087890625,2.671573,18.200015087890627,3.5,18.200015087890627C4.32843,18.200015087890627,5,17.528415087890625,5,16.700015087890627C5,16.258515087890625,4.80921,15.861515087890625,4.50558,15.587015087890626L7.59952,11.899765087890625C7.8503,12.088295087890625,8.162099999999999,12.200025087890625,8.5,12.200025087890625C8.57314,12.200025087890625,8.645050000000001,12.194785087890626,8.71539,12.184675087890625L11.3216,15.771815087890625C11.12019,16.027215087890625,11,16.349515087890623,11,16.700015087890627C11,17.528415087890625,11.67157,18.200015087890627,12.5,18.200015087890627C13.3284,18.200015087890627,14,17.528415087890625,14,16.700015087890627C14,16.336015087890623,13.8703,16.002315087890626,13.6547,15.742515087890625L16.781,12.016775087890625C16.994500000000002,12.133605087890626,17.2395,12.200025087890625,17.5,12.200025087890625C18.3284,12.200025087890625,19,11.528445087890624,19,10.700025087890625C19,9.871595087890626,18.3284,9.200025087890625,17.5,9.200025087890625C16.671599999999998,9.200025087890625,16,9.871595087890626,16,10.700025087890625C16,10.898765087890624,16.0387,11.088475087890625,16.108800000000002,11.262055087890625L12.7823,15.226515087890625C12.6908,15.209115087890625,12.5965,15.200015087890625,12.5,15.200015087890625C12.3862,15.200015087890625,12.2754,15.212715087890626,12.1689,15.236715087890625L9.60768,11.711495087890626Z stroke-opacity=0 stroke=none>');
const PT = () => OT();
var BT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M9.474616630859375,7.494615087890625L8.844736630859375,7.494615087890625L8.844736630859375,4.149892087890625L8.000006630859374,4.634915087890625L8.004896630859374,4.005035087890625L9.020516630859376,3.414215087890625L9.474616630859375,3.414215087890625L9.474616630859375,7.494615087890625ZM18.529296630859378,4.8318550878906255Q18.307996630859375,5.028795087890625,18.122396630859377,5.385245087890625Q17.868496630859376,5.019035087890625,17.629196630859376,4.8269750878906255Q17.389996630859375,4.634915087890625,17.168596630859376,4.634915087890625Q16.794296630859375,4.634915087890625,16.522496630859376,4.976715087890625Q16.252296630859377,5.3168850878906255,16.252296630859377,5.7856350878906255Q16.252296630859377,6.218575087890625,16.502896630859375,6.521315087890625Q16.755196630859373,6.822415087890625,17.114896630859377,6.822415087890625Q17.368796630859375,6.822415087890625,17.588596630859374,6.625475087890624Q17.809896630859377,6.428535087890625,17.998696630859374,6.0688350878906245Q18.249396630859373,6.439935087890625,18.488596630859377,6.631985087890625Q18.727896630859377,6.822415087890625,18.952496630859375,6.822415087890625Q19.326796630859373,6.822415087890625,19.596996630859376,6.482245087890625Q19.868796630859375,6.140455087890626,19.868796630859375,5.671705087890626Q19.868796630859375,5.238755087890625,19.618196630859376,4.937655087890625Q19.367496630859375,4.634915087890625,19.006196630859375,4.634915087890625Q18.750696630859377,4.634915087890625,18.529296630859378,4.8318550878906255ZM18.337296630859377,5.674955087890625L18.278696630859375,5.596835087890625Q18.449596630859375,5.272935087890625,18.622096630859374,5.1101750878906245Q18.794596630859374,4.947415087890625,18.967096630859373,4.947415087890625Q19.194996630859375,4.947415087890625,19.346396630859374,5.1345950878906255Q19.497696630859377,5.320135087890625,19.497696630859377,5.598455087890625Q19.497696630859377,5.8914250878906245,19.360996630859376,6.096505087890625Q19.224296630859374,6.301585087890626,19.027396630859375,6.301585087890626Q18.915096630859374,6.301585087890626,18.742496630859375,6.146965087890624Q18.569996630859375,5.992335087890625,18.337296630859377,5.674955087890625ZM17.785496630859377,5.779125087890625L17.842496630859372,5.857245087890625Q17.668296630859373,6.186025087890625,17.495796630859374,6.348785087890625Q17.324896630859374,6.509915087890625,17.153996630859375,6.509915087890625Q16.926096630859377,6.509915087890625,16.774796630859377,6.324375087890624Q16.623396630859375,6.137195087890625,16.623396630859375,5.858875087890625Q16.623396630859375,5.565905087890625,16.761696630859376,5.360825087890625Q16.900096630859373,5.1557550878906255,17.095396630859376,5.1557550878906255Q17.228896630859374,5.1557550878906255,17.365596630859375,5.2778250878906245Q17.502296630859377,5.399895087890625,17.785496630859377,5.779125087890625ZM10.710296630859375,10.634915087890626C10.710296630859375,11.024655087890626,10.561656630859375,11.379685087890625,10.317976630859375,11.646395087890625L12.879196630859376,15.171615087890626C12.985696630859374,15.147615087890625,13.096496630859376,15.134915087890626,13.210296630859375,15.134915087890626C13.306796630859376,15.134915087890626,13.401096630859374,15.144015087890624,13.492596630859374,15.161415087890624L16.819096630859377,11.196955087890625C16.748996630859374,11.023375087890624,16.710296630859375,10.833655087890625,16.710296630859375,10.634915087890626C16.710296630859375,9.806495087890625,17.381896630859373,9.134915087890626,18.210296630859375,9.134915087890626C19.038696630859373,9.134915087890626,19.710296630859375,9.806495087890625,19.710296630859375,10.634915087890626C19.710296630859375,11.463345087890625,19.038696630859373,12.134915087890626,18.210296630859375,12.134915087890626C17.949796630859375,12.134915087890626,17.704796630859377,12.068505087890625,17.491296630859374,11.951675087890624L14.364996630859375,15.677415087890624C14.580596630859375,15.937215087890625,14.710296630859375,16.270915087890625,14.710296630859375,16.634915087890626C14.710296630859375,17.463315087890624,14.038696630859375,18.134915087890626,13.210296630859375,18.134915087890626C12.381866630859374,18.134915087890626,11.710296630859375,17.463315087890624,11.710296630859375,16.634915087890626C11.710296630859375,16.284415087890626,11.830486630859374,15.962015087890626,12.031896630859375,15.706715087890625L9.425686630859374,12.119565087890624C9.355346630859376,12.129685087890625,9.283436630859375,12.134915087890626,9.210296630859375,12.134915087890626C8.872396630859374,12.134915087890626,8.560596630859376,12.023195087890626,8.309816630859375,11.834665087890626L5.215876630859375,15.521915087890624C5.519506630859375,15.796415087890624,5.710296630859375,16.193415087890624,5.710296630859375,16.634915087890626C5.710296630859375,17.463315087890624,5.038726630859375,18.134915087890626,4.210296630859375,18.134915087890626C3.381869630859375,18.134915087890626,2.710296630859375,17.463315087890624,2.710296630859375,16.634915087890626C2.710296630859375,15.806515087890626,3.381869630859375,15.134915087890626,4.210296630859375,15.134915087890626C4.218546630859375,15.134915087890626,4.226776630859375,15.135015087890626,4.234996630859375,15.135115087890625L7.744116630859375,10.953115087890625C7.721966630859375,10.850565087890626,7.710296630859375,10.744105087890624,7.710296630859375,10.634915087890626C7.710296630859375,9.806495087890625,8.381866630859374,9.134915087890626,9.210296630859375,9.134915087890626C10.038726630859376,9.134915087890626,10.710296630859375,9.806495087890625,10.710296630859375,10.634915087890626Z stroke-opacity=0 stroke=none>');
const ET = () => BT();
var RT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M21,5.5C21,6.32843,20.3284,7,19.5,7C19.4136,7,19.3289,6.99269,19.2465,6.97866L15.6257,15.5086C15.8587,15.7729,16,16.119999999999997,16,16.5C16,17.328400000000002,15.3284,18,14.5,18C13.8469,18,13.2913,17.5826,13.0854,17L3.91465,17C3.70873,17.5826,3.15311,18,2.5,18C1.671573,18,1,17.328400000000002,1,16.5C1,15.6716,1.671573,15,2.5,15C2.5840199999999998,15,2.66643,15.0069,2.74668,15.0202L6.36934,6.48574C6.13933,6.22213,6,5.87733,6,5.5C6,4.671573,6.67157,4,7.5,4C8.15311,4,8.70873,4.417404,8.91465,5L18.0854,5C18.2913,4.417404,18.8469,4,19.5,4C20.3284,4,21,4.671573,21,5.5ZM18.0854,6L8.91465,6C8.892579999999999,6.06243,8.8665,6.12296,8.83672,6.18128L13.9814,15.0921C14.143,15.0325,14.3177,15,14.5,15C14.584,15,14.6664,15.0069,14.7467,15.0202L18.3693,6.48574C18.2462,6.3446,18.149,6.1802,18.0854,6ZM13.2036,15.745L8.0861,6.8811800000000005C7.90605,6.95768,7.70797,7,7.5,7C7.41359,7,7.32888,6.99269,7.24647,6.97866L3.62571,15.5086C3.7512,15.651,3.8501,15.8174,3.91465,16L13.0854,16C13.1169,15.9108,13.1566,15.8255,13.2036,15.745Z stroke-opacity=0 stroke=none>');
const DT = () => RT();
var FT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M5.92159,5.93994C6.04014,5.90529,6.152620000000001,5.85639,6.25704,5.79523L9.12729,9.89437C9.045449999999999,10.07959,9,10.28449,9,10.5C9,10.79522,9.08529,11.07053,9.232569999999999,11.30262L4.97573,16.7511L5.92159,5.93994ZM4.92259,5.8848400000000005C4.38078,5.658659999999999,4,5.1238,4,4.5C4,3.671573,4.67157,3,5.5,3C6.2157,3,6.81433,3.50124,6.96399,4.17183L15.1309,4.88634C15.3654,4.36387,15.8902,4,16.5,4C17.328400000000002,4,18,4.67157,18,5.5C18,6.08983,17.659599999999998,6.60015,17.1645,6.84518L18.4264,14.0018C18.4508,14.0006,18.4753,14,18.5,14C19.3284,14,20,14.6716,20,15.5C20,16.328400000000002,19.3284,17,18.5,17C17.932499999999997,17,17.4386,16.6849,17.183799999999998,16.22L5.99686,18.5979C5.946429999999999,19.3807,5.29554,20,4.5,20C3.671573,20,3,19.3284,3,18.5C3,17.869300000000003,3.389292,17.3295,3.94071,17.1077L4.92259,5.8848400000000005ZM5.72452,17.6334C5.69799,17.596,5.6698,17.5599,5.64004,17.525100000000002L10.01843,11.92103C10.16958,11.97223,10.33155,12,10.5,12C10.80059,12,11.08052,11.91158,11.31522,11.75934L17.0606,15.0765C17.0457,15.1271,17.0335,15.1789,17.023899999999998,15.2317L5.72452,17.6334ZM11.92855,10.95875L17.4349,14.1379L16.1699,6.96356C15.9874,6.92257,15.8174,6.8483,15.6667,6.74746L11.99771,10.4165C11.99923,10.44414,12,10.47198,12,10.5C12,10.66,11.97495,10.814160000000001,11.92855,10.95875ZM10.5,9C10.259830000000001,9,10.03285,9.05644,9.83159,9.15679L7.04919,5.1831L15.0493,5.88302C15.054,5.90072,15.059,5.91829,15.0643,5.9357299999999995L11.56066,9.43934C11.28921,9.16789,10.91421,9,10.5,9Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const zT = () => FT();
var NT = /* @__PURE__ */ U('<svg viewBox="0 0 22 22"><path d=M4.727219638671875,8.007996215820313L9.973849638671876,2.7629472158203123C10.167279638671875,2.5696791158203123,10.480729638671875,2.5696791158203123,10.674169638671875,2.7629472158203123L13.223329638671874,5.311756215820313C13.416929638671874,5.505236215820313,13.416929638671874,5.8189862158203125,13.223329638671874,6.012466215820313L7.977129638671875,11.257906215820313C7.379859638671875,11.855176215820313,7.407609638671875,12.909396215820312,8.033809638671876,13.535596215820313C8.660409638671876,14.162596215820313,9.713849638671874,14.189996215820312,10.311129638671876,13.591896215820313L15.556929638671875,8.346066215820311C15.750429638671875,8.152526215820313,16.064229638671875,8.152526215820313,16.257629638671872,8.346066215820311L18.806529638671876,10.895266215820312C19.000029638671876,11.088746215820313,19.000029638671876,11.402496215820312,18.806529638671876,11.595976215820313L13.560629638671875,16.841796215820313C11.165619638671876,19.237196215820312,7.197149638671875,19.19919621582031,4.783499638671875,16.785496215820313C2.3698426386718747,14.371896215820312,2.331397638671875,10.403416215820313,4.727219638671875,8.007996215820313ZM12.172299638671875,5.662106215820312L10.323809638671875,3.8136162158203124L5.4287196386718755,8.709096215820313C3.422893638671875,10.714536215820312,3.4549956386718748,14.055196215820313,5.484999638671875,16.08479621582031C7.514609638671875,18.114796215820313,10.855289638671875,18.146496215820314,12.860719638671876,16.141096215820312L15.465629638671874,13.535796215820312L14.090929638671875,12.160756215820312L14.791629638671875,11.460436215820312L16.166229638671876,12.834996215820313L17.755829638671877,11.245226215820313L15.907729638671874,9.396736215820312L11.011839638671875,14.292596215820312C10.042809638671875,15.262396215820312,8.418249638671874,15.243796215820312,7.406019638671875,14.306496215820312L7.333099638671875,14.236296215820312C6.327599638671876,13.230796215820313,6.284009638671876,11.550396215820312,7.276419638671875,10.557586215820312L9.882199638671874,7.952026215820313L8.501079638671875,6.570906215820313L9.201789638671876,5.870186215820313L10.582939638671874,7.251336215820312L12.172299638671875,5.662106215820312Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const UT = (e) => (() => {
  var r = NT();
  return pt(r, "class", `icon-overlay ${e ?? ""}`), r;
})();
var KT = /* @__PURE__ */ U('<svg viewBox="0 0 22 22"><defs><clipPath id=master_svg0_151_615><rect x=0 y=0 width=22 height=22 rx=0></rect></clipPath></defs><g clip-path=url(#master_svg0_151_615)><path d=M19.672,3.0673368C19.4417,2.9354008,19.1463,3.00292252,18.9994,3.2210900000000002L17.4588,5.50622L16.743299999999998,3.781253L13.9915,7.4662L13.9618,7.51108C13.8339,7.72862,13.8936,8.005659999999999,14.1004,8.15391L14.1462,8.183430000000001C14.3683,8.308720000000001,14.6511,8.25001,14.8022,8.047229999999999L16.4907,5.78571L17.246299999999998,7.60713L19.8374,3.7635389999999997L19.8651,3.717088C19.9871,3.484615,19.9023,3.199273,19.672,3.0673368ZM4.79974,8.462530000000001L10.117740000000001,3.252975C10.31381,3.0610145,10.63152,3.0610145,10.82759,3.252975L13.4115,5.78453C13.6076,5.976710000000001,13.6076,6.28833,13.4115,6.4805L8.093869999999999,11.69045C7.48847,12.28368,7.51659,13.3308,8.151309999999999,13.9528C8.786439999999999,14.5755,9.85421,14.6027,10.45961,14.0087L15.7768,8.79831C15.9729,8.60609,16.2909,8.60609,16.487099999999998,8.79831L19.0705,11.33026C19.2667,11.52244,19.2667,11.83406,19.0705,12.02623L13.7533,17.2366C11.32572,19.6158,7.30328,19.578,4.85679,17.1807C2.410298,14.7834,2.371331,10.84174,4.79974,8.462530000000001ZM12.3461,6.1325199999999995L10.47246,4.29654L5.51079,9.15889C3.477674,11.15076,3.510214,14.4688,5.56784,16.4847C7.62506,18.500999999999998,11.01117,18.5325,13.0439,16.540599999999998L15.6842,13.9529L14.2908,12.58718L15.0011,11.89161L16.394399999999997,13.2569L18.0056,11.67786L16.1323,9.84188L11.16985,14.7046C10.18764,15.6679,8.540980000000001,15.6494,7.51498,14.7184L7.44107,14.6487C6.4219,13.65,6.37771,11.98096,7.38362,10.994869999999999L10.02485,8.40693L8.624939999999999,7.03516L9.335180000000001,6.33919L10.73512,7.71099L12.3461,6.1325199999999995Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const ZT = (e) => (() => {
  var r = KT();
  return pt(r, "class", `icon-overlay ${e ?? ""}`), r;
})();
var WT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M11,17C5.80945,17,3.667717,12.85,3.113386,11.575C2.9622047,11.2,2.9622047,10.8,3.113386,10.425C3.667717,9.15,5.80945,5,11,5C16.165399999999998,5,18.3323,9.15,18.8866,10.425C19.0378,10.8,19.0378,11.2,18.8866,11.575C18.3323,12.85,16.165399999999998,17,11,17ZM4.04567,10.8C3.995276,10.925,3.995276,11.05,4.04567,11.175C4.52441,12.325,6.43937,16,11,16C15.5606,16,17.4756,12.325,17.9543,11.2C18.0047,11.075,18.0047,10.95,17.9543,10.825C17.4756,9.675,15.5606,6,11,6C6.43937,6,4.52441,9.675,4.04567,10.8ZM11,13.5C9.61417,13.5,8.480319999999999,12.375,8.480319999999999,11C8.480319999999999,9.625,9.61417,8.5,11,8.5C12.38583,8.5,13.5197,9.625,13.5197,11C13.5197,12.375,12.38583,13.5,11,13.5ZM11,9.5C10.1685,9.5,9.48819,10.175,9.48819,11C9.48819,11.825,10.1685,12.5,11,12.5C11.8315,12.5,12.51181,11.825,12.51181,11C12.51181,10.175,11.8315,9.5,11,9.5Z stroke-opacity=0 fill-opacity=1>');
const QT = () => WT();
var HT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M5.80417,14.9887L4.62563,16.167299999999997C4.43037,16.3625,4.43037,16.6791,4.62563,16.8744C4.82089,17.0696,5.13748,17.0696,5.332739999999999,16.8744L6.62638,15.5807C7.75595,16.290100000000002,9.19328,16.7929,11,16.7929C16.165399999999998,16.7929,18.3323,12.64289,18.8866,11.36789C19.0378,10.99289,19.0378,10.59289,18.8866,10.21789C18.5549,9.45486,17.6456,7.66212,15.8617,6.34545L17.3536,4.853553C17.5488,4.658291,17.5488,4.341709,17.3536,4.146447C17.1583,3.9511845,16.8417,3.9511845,16.6464,4.146447L15.0014,5.7915399999999995C13.9314,5.1969,12.61166,4.792893,11,4.792893C5.80945,4.792893,3.667717,8.94289,3.113386,10.21789C2.9622049,10.59289,2.9622049,10.99289,3.113386,11.36789C3.424435,12.08333,4.2353000000000005,13.70399,5.80417,14.9887ZM7.36012,14.847C8.32327,15.4074,9.52286,15.7929,11,15.7929C15.5606,15.7929,17.4756,12.11789,17.9543,10.99289C18.0047,10.86789,18.0047,10.74289,17.9543,10.61789C17.659,9.90846,16.8171,8.23812,15.1447,7.06241L12.96929,9.23782C13.3134,9.66543,13.5197,10.20642,13.5197,10.79289C13.5197,12.16789,12.38583,13.29289,11,13.29289C10.41596,13.29289,9.87667,13.09308,9.44815,12.75896L7.36012,14.847ZM8.794609999999999,11.99829L6.520099999999999,14.2728C5.06905,13.12119,4.32057,11.628250000000001,4.04567,10.96789C3.995275,10.84289,3.995275,10.71789,4.04567,10.59289C4.52441,9.46789,6.43937,5.79289,11,5.79289C12.28868,5.79289,13.3661,6.086320000000001,14.2596,6.53329L12.19759,8.5953C11.84086,8.40257,11.43271,8.29289,11,8.29289C9.61417,8.29289,8.480319999999999,9.41789,8.480319999999999,10.79289C8.480319999999999,11.22918,8.594470000000001,11.64029,8.794609999999999,11.99829ZM10.16528,12.04183C10.404869999999999,12.20032,10.692070000000001,12.29289,11,12.29289C11.8315,12.29289,12.51181,11.61789,12.51181,10.79289C12.51181,10.48318,12.41593,10.194600000000001,12.25216,9.95494L10.16528,12.04183ZM11.43602,9.35687L9.55616,11.236740000000001C9.512,11.09633,9.48819,10.94724,9.48819,10.79289C9.48819,9.96789,10.1685,9.29289,11,9.29289C11.15142,9.29289,11.29782,9.31528,11.43602,9.35687Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const YT = () => HT();
var GT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><defs><clipPath id=master_svg0_151_625><rect x=0 y=0 width=22 height=22 rx=0></rect></clipPath></defs><g clip-path=url(#master_svg0_151_625)><path d=M14.5385,9.76923L15.6538,9.76923C16.6538,9.76923,17.4615,10.576920000000001,17.4615,11.576920000000001L17.4615,17.1923C17.4615,18.1923,16.6538,19,15.6538,19L5.80769,19C4.807692,19,4,18.1923,4,17.1923L4,11.576920000000001C4,10.576920000000001,4.807692,9.76923,5.80769,9.76923L7.23077,9.76923L7.23077,7.576919999999999C7.23077,5.61538,8.88462,4,10.88462,4C12.88462,4,14.5385,5.61538,14.5385,7.576919999999999L14.5385,9.76923ZM10.88461,5.15385C9.5,5.15385,8.38461,6.23077,8.38461,7.576919999999999L8.38461,9.76923L13.38462,9.76923L13.38462,7.576919999999999C13.38462,6.23077,12.26923,5.15385,10.88461,5.15385ZM15.6538,17.8462C16,17.8462,16.3077,17.5385,16.3077,17.1923L16.3077,11.576920000000001C16.3077,11.23077,16,10.923079999999999,15.6538,10.923079999999999L5.80769,10.923079999999999C5.46154,10.923079999999999,5.15385,11.23077,5.15385,11.576920000000001L5.15385,17.1923C5.15385,17.5385,5.46154,17.8462,5.80769,17.8462L15.6538,17.8462ZM10.153839999999999,12.65385C10.153839999999999,12.34615,10.42307,12.07692,10.73076,12.07692C11.038450000000001,12.07692,11.307680000000001,12.34615,11.307680000000001,12.65385L11.307680000000001,14.5769C11.307680000000001,14.8846,11.038450000000001,15.1538,10.73076,15.1538C10.42307,15.1538,10.153839999999999,14.8846,10.153839999999999,14.5769L10.153839999999999,12.65385Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const jT = () => GT();
var VT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><defs><clipPath id=master_svg0_151_620><rect x=0 y=0 width=22 height=22 rx=0></rect></clipPath></defs><g clip-path=url(#master_svg0_151_620)><path d=M8.38461,9.76923L15.6538,9.76923C16.6538,9.76923,17.4615,10.576920000000001,17.4615,11.576920000000001L17.4615,17.1923C17.4615,18.1923,16.6538,19,15.6538,19L5.80769,19C4.807692,19,4,18.1923,4,17.1923L4,11.576920000000001C4,10.576920000000001,4.807693,9.76923,5.80769,9.76923L7.23077,9.76923L7.23077,7.576919999999999C7.23077,5.61538,8.88462,4,10.88462,4C12.46154,4,13.84615,4.961539,14.3462,6.423080000000001C14.4615,6.73077,14.3077,7.038460000000001,14,7.15385C13.69231,7.26923,13.38461,7.11538,13.26923,6.80769C12.92308,5.80769,11.96154,5.15385,10.88462,5.15385C9.5,5.15385,8.38461,6.23077,8.38461,7.576919999999999L8.38461,9.76923ZM15.6538,17.8462C16,17.8462,16.3077,17.5385,16.3077,17.1923L16.3077,11.576920000000001C16.3077,11.23077,16,10.923079999999999,15.6538,10.923079999999999L5.80769,10.923079999999999C5.46154,10.923079999999999,5.15385,11.23077,5.15385,11.576920000000001L5.15385,17.1923C5.15385,17.5385,5.46154,17.8462,5.80769,17.8462L15.6538,17.8462ZM10.153839999999999,12.65385C10.153839999999999,12.34615,10.42307,12.07692,10.73076,12.07692C11.03846,12.07692,11.307690000000001,12.34615,11.307690000000001,12.65385L11.307690000000001,14.5769C11.307690000000001,14.8846,11.03846,15.1538,10.73076,15.1538C10.42307,15.1538,10.153839999999999,14.8846,10.153839999999999,14.5769L10.153839999999999,12.65385Z stroke-opacity=0 fill-rule=evenodd fill-opacity=1>');
const qT = () => VT();
var XT = /* @__PURE__ */ U('<svg class=icon-overlay viewBox="0 0 22 22"><path d=M16.966900000000003,8.67144C16.6669,8.67144,16.4247,8.91558,16.4247,9.21802L16.4247,16.631500000000003C16.4247,17.322,16.007199999999997,17.9068,15.5139,17.9068L13.93072,17.9068L13.93072,9.2162C13.93072,8.91741,13.68675,8.67144,13.38855,8.67144C13.09036,8.67144,12.84639,8.91741,12.84639,9.21802L12.84639,17.9068L10.151810000000001,17.9068L10.151810000000001,9.21802C10.151810000000001,8.91741,9.90783,8.67144,9.609639999999999,8.67144C9.31145,8.67144,9.06747,8.91741,9.06747,9.219850000000001L9.06747,17.9068L7.48614,17.9068C6.99277,17.9068,6.5753,17.322,6.5753,16.631500000000003L6.5753,9.21802C6.5753,8.91558,6.333130000000001,8.67144,6.03313,8.67144C5.73313,8.67144,5.49096,8.91558,5.49096,9.21802L5.49096,16.631500000000003C5.49096,17.9378,6.385540000000001,19,7.48614,19L15.512,19C16.6127,19,17.509,17.9378,17.509,16.631500000000003L17.509,9.21802C17.509,8.91558,17.2669,8.67144,16.966900000000003,8.67144ZM18.4578,6.21183L4.542169,6.21183C4.243976,6.21183,4,6.45779,4,6.75841C4,7.05903,4.243976,7.30499,4.542169,7.30499L18.4578,7.30499C18.756,7.30499,19,7.05903,19,6.75841C19,6.45779,18.756,6.21183,18.4578,6.21183ZM8.68072,5.10045L14.3193,5.10045C14.6175,5.10045,14.8614,4.852666,14.8614,4.550225C14.8614,4.247783,14.6175,4,14.3193,4L8.68072,4C8.38253,4,8.13855,4.247783,8.13855,4.550225C8.13855,4.852666,8.38253,5.10045,8.68072,5.10045Z stroke-opacity=0 fill-opacity=1>');
const JT = () => XT(), eI = {
  horizontalStraightLine: EM,
  horizontalRayLine: DM,
  horizontalSegment: zM,
  verticalStraightLine: UM,
  verticalRayLine: ZM,
  verticalSegment: QM,
  straightLine: YM,
  rayLine: jM,
  segment: qM,
  arrow: JM,
  priceLine: tT,
  priceChannelLine: rT,
  parallelStraightLine: oT,
  fibonacciLine: sT,
  fibonacciSegment: cT,
  fibonacciCircle: fT,
  fibonacciSpiral: hT,
  fibonacciSpeedResistanceFan: pT,
  fibonacciExtension: mT,
  gannBox: vT,
  circle: CT,
  triangle: LT,
  rect: wT,
  parallelogram: $T,
  threeWaves: MT,
  fiveWaves: IT,
  eightWaves: PT,
  anyWaves: ET,
  abcd: DT,
  xabcd: zT,
  weak_magnet: UT,
  strong_magnet: ZT,
  lock: jT,
  unlock: qT,
  visible: QT,
  invisible: YT,
  remove: JT
};
function tI(e) {
  return [
    { key: "horizontalStraightLine", text: y("horizontal_straight_line", e) },
    { key: "horizontalRayLine", text: y("horizontal_ray_line", e) },
    { key: "horizontalSegment", text: y("horizontal_segment", e) },
    { key: "verticalStraightLine", text: y("vertical_straight_line", e) },
    { key: "verticalRayLine", text: y("vertical_ray_line", e) },
    { key: "verticalSegment", text: y("vertical_segment", e) },
    { key: "straightLine", text: y("straight_line", e) },
    { key: "rayLine", text: y("ray_line", e) },
    { key: "segment", text: y("segment", e) },
    { key: "arrow", text: y("arrow", e) },
    { key: "priceLine", text: y("price_line", e) }
  ];
}
function nI(e) {
  return [
    { key: "priceChannelLine", text: y("price_channel_line", e) },
    { key: "parallelStraightLine", text: y("parallel_straight_line", e) }
  ];
}
function rI(e) {
  return [
    { key: "circle", text: y("circle", e) },
    { key: "rect", text: y("rect", e) },
    { key: "parallelogram", text: y("parallelogram", e) },
    { key: "triangle", text: y("triangle", e) }
  ];
}
function iI(e) {
  return [
    { key: "fibonacciLine", text: y("fibonacci_line", e) },
    { key: "fibonacciSegment", text: y("fibonacci_segment", e) },
    { key: "fibonacciCircle", text: y("fibonacci_circle", e) },
    { key: "fibonacciSpiral", text: y("fibonacci_spiral", e) },
    { key: "fibonacciSpeedResistanceFan", text: y("fibonacci_speed_resistance_fan", e) },
    { key: "fibonacciExtension", text: y("fibonacci_extension", e) },
    { key: "gannBox", text: y("gann_box", e) }
  ];
}
function oI(e) {
  return [
    { key: "xabcd", text: y("xabcd", e) },
    { key: "abcd", text: y("abcd", e) },
    { key: "threeWaves", text: y("three_waves", e) },
    { key: "fiveWaves", text: y("five_waves", e) },
    { key: "eightWaves", text: y("eight_waves", e) },
    { key: "anyWaves", text: y("any_waves", e) }
  ];
}
function aI(e) {
  return [
    { key: "weak_magnet", text: y("weak_magnet", e) },
    { key: "strong_magnet", text: y("strong_magnet", e) }
  ];
}
const Dt = (e) => eI[e.name](e.class);
var sI = /* @__PURE__ */ U('<div class=klinecharts-pro-drawing-bar><span class=split-line></span><div class=item tabindex=0><span style=width:32px;height:32px></span><div class=icon-arrow><svg viewBox="0 0 4 6"><path d=M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z stroke=none stroke-opacity=0></path></svg></div></div><div class=item><span style=width:32px;height:32px></span></div><div class=item><span style=width:32px;height:32px></span></div><span class=split-line></span><div class=item><span style=width:32px;height:32px>'), lI = /* @__PURE__ */ U('<div class=item tabindex=0><span style=width:32px;height:32px></span><div class=icon-arrow><svg viewBox="0 0 4 6"><path d=M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z stroke=none stroke-opacity=0>'), Q2 = /* @__PURE__ */ U("<li><span style=padding-left:8px>");
const H2 = "drawing_tools", cI = (e) => {
  const [r, i] = E("horizontalStraightLine"), [o, s] = E("priceChannelLine"), [c, u] = E("circle"), [f, g] = E("fibonacciLine"), [m, C] = E("xabcd"), [b, _] = E("weak_magnet"), [x, k] = E("normal"), [T, $] = E(!1), [A, F] = E(!0), [Z, N] = E(""), V = Jt(() => [{
    key: "singleLine",
    icon: r(),
    list: tI(e.locale),
    setter: i
  }, {
    key: "moreLine",
    icon: o(),
    list: nI(e.locale),
    setter: s
  }, {
    key: "polygon",
    icon: c(),
    list: rI(e.locale),
    setter: u
  }, {
    key: "fibonacci",
    icon: f(),
    list: iI(e.locale),
    setter: g
  }, {
    key: "wave",
    icon: m(),
    list: oI(e.locale),
    setter: C
  }]), Q = Jt(() => aI(e.locale));
  return (() => {
    var I = sI(), q = I.firstChild, H = q.nextSibling, W = H.firstChild, re = W.nextSibling, K = re.firstChild, X = H.nextSibling, R = X.firstChild, te = X.nextSibling, le = te.firstChild, ie = te.nextSibling, ce = ie.nextSibling, Ye = ce.firstChild;
    return G(I, () => V().map((be) => (() => {
      var Oe = lI(), lt = Oe.firstChild, yt = lt.nextSibling, t1 = yt.firstChild;
      return Oe.addEventListener("blur", () => {
        N("");
      }), lt.$$click = () => {
        e.onDrawingItemClick({
          groupId: H2,
          name: be.icon,
          visible: A(),
          lock: T(),
          mode: x()
        });
      }, G(lt, Y(Dt, {
        get name() {
          return be.icon;
        }
      })), yt.$$click = () => {
        be.key === Z() ? N("") : N(be.key);
      }, G(Oe, (() => {
        var ye = ot(() => be.key === Z());
        return () => ye() && Y(L0, {
          class: "list",
          get children() {
            return be.list.map((qe) => (() => {
              var Ne = Q2(), Ue = Ne.firstChild;
              return Ne.$$click = () => {
                be.setter(qe.key), e.onDrawingItemClick({
                  name: qe.key,
                  lock: T(),
                  mode: x()
                }), N("");
              }, G(Ne, Y(Dt, {
                get name() {
                  return qe.key;
                }
              }), Ue), G(Ue, () => qe.text), Ne;
            })());
          }
        });
      })(), null), ze(() => pt(t1, "class", be.key === Z() ? "rotate" : "")), Oe;
    })()), q), H.addEventListener("blur", () => {
      N("");
    }), W.$$click = () => {
      let be = b();
      x() !== "normal" && (be = "normal"), k(be), e.onModeChange(be);
    }, G(W, (() => {
      var be = ot(() => b() === "weak_magnet");
      return () => be() ? ot(() => x() === "weak_magnet")() ? Y(Dt, {
        name: "weak_magnet",
        class: "selected"
      }) : Y(Dt, {
        name: "weak_magnet"
      }) : ot(() => x() === "strong_magnet")() ? Y(Dt, {
        name: "strong_magnet",
        class: "selected"
      }) : Y(Dt, {
        name: "strong_magnet"
      });
    })()), re.$$click = () => {
      Z() === "mode" ? N("") : N("mode");
    }, G(H, (() => {
      var be = ot(() => Z() === "mode");
      return () => be() && Y(L0, {
        class: "list",
        get children() {
          return Q().map((Oe) => (() => {
            var lt = Q2(), yt = lt.firstChild;
            return lt.$$click = () => {
              _(Oe.key), k(Oe.key), e.onModeChange(Oe.key), N("");
            }, G(lt, Y(Dt, {
              get name() {
                return Oe.key;
              }
            }), yt), G(yt, () => Oe.text), lt;
          })());
        }
      });
    })(), null), R.$$click = () => {
      const be = !T();
      $(be), e.onLockChange(be);
    }, G(R, (() => {
      var be = ot(() => !!T());
      return () => be() ? Y(Dt, {
        name: "lock"
      }) : Y(Dt, {
        name: "unlock"
      });
    })()), le.$$click = () => {
      const be = !A();
      F(be), e.onVisibleChange(be);
    }, G(le, (() => {
      var be = ot(() => !!A());
      return () => be() ? Y(Dt, {
        name: "visible"
      }) : Y(Dt, {
        name: "invisible"
      });
    })()), Ye.$$click = () => {
      e.onRemoveClick(H2);
    }, G(Ye, Y(Dt, {
      name: "remove"
    })), ze(() => pt(K, "class", Z() === "mode" ? "rotate" : "")), I;
  })();
};
At(["click"]);
var Y2 = /* @__PURE__ */ U("<li class=title>"), G2 = /* @__PURE__ */ U("<li class=row>");
const uI = (e) => Y(e1, {
  get title() {
    return y("indicator", e.locale);
  },
  width: 400,
  get onClose() {
    return e.onClose;
  },
  get children() {
    return Y(L0, {
      class: "klinecharts-pro-indicator-modal-list",
      get children() {
        return [(() => {
          var r = Y2();
          return G(r, () => y("main_indicator", e.locale)), r;
        })(), ot(() => ["MA", "EMA", "SMA", "BOLL", "SAR", "BBI"].map((r) => {
          const i = e.mainIndicators.includes(r);
          return (() => {
            var o = G2();
            return o.$$click = (s) => {
              e.onMainIndicatorChange({
                name: r,
                id: "candle_pane",
                added: !i
              });
            }, G(o, Y(C2, {
              checked: i,
              get label() {
                return y(r.toLowerCase(), e.locale);
              }
            })), o;
          })();
        })), (() => {
          var r = Y2();
          return G(r, () => y("sub_indicator", e.locale)), r;
        })(), ot(() => ["MA", "EMA", "VOL", "MACD", "BOLL", "KDJ", "RSI", "BIAS", "BRAR", "CCI", "DMI", "CR", "PSY", "DMA", "TRIX", "OBV", "VR", "WR", "MTM", "EMV", "SAR", "SMA", "ROC", "PVT", "BBI", "AO"].map((r) => {
          const i = r in e.subIndicators;
          return (() => {
            var o = G2();
            return o.$$click = (s) => {
              e.onSubIndicatorChange({
                name: r,
                id: e.subIndicators[r] ?? "",
                added: !i
              });
            }, G(o, Y(C2, {
              checked: i,
              get label() {
                return y(r.toLowerCase(), e.locale);
              }
            })), o;
          })();
        }))];
      }
    });
  }
});
At(["click"]);
function j2(e, r) {
  switch (e) {
    case "Etc/UTC":
      return y("utc", r);
    case "Pacific/Honolulu":
      return y("honolulu", r);
    case "America/Juneau":
      return y("juneau", r);
    case "America/Los_Angeles":
      return y("los_angeles", r);
    case "America/Chicago":
      return y("chicago", r);
    case "America/Toronto":
      return y("toronto", r);
    case "America/Sao_Paulo":
      return y("sao_paulo", r);
    case "Europe/London":
      return y("london", r);
    case "Europe/Berlin":
      return y("berlin", r);
    case "Asia/Bahrain":
      return y("bahrain", r);
    case "Asia/Dubai":
      return y("dubai", r);
    case "Asia/Ashkhabad":
      return y("ashkhabad", r);
    case "Asia/Almaty":
      return y("almaty", r);
    case "Asia/Bangkok":
      return y("bangkok", r);
    case "Asia/Shanghai":
      return y("shanghai", r);
    case "Asia/Tokyo":
      return y("tokyo", r);
    case "Australia/Sydney":
      return y("sydney", r);
    case "Pacific/Norfolk":
      return y("norfolk", r);
  }
  return e;
}
function fI(e) {
  return [
    { key: "Etc/UTC", text: y("utc", e) },
    { key: "Pacific/Honolulu", text: y("honolulu", e) },
    { key: "America/Juneau", text: y("juneau", e) },
    { key: "America/Los_Angeles", text: y("los_angeles", e) },
    { key: "America/Chicago", text: y("chicago", e) },
    { key: "America/Toronto", text: y("toronto", e) },
    { key: "America/Sao_Paulo", text: y("sao_paulo", e) },
    { key: "Europe/London", text: y("london", e) },
    { key: "Europe/Berlin", text: y("berlin", e) },
    { key: "Asia/Bahrain", text: y("bahrain", e) },
    { key: "Asia/Dubai", text: y("dubai", e) },
    { key: "Asia/Ashkhabad", text: y("ashkhabad", e) },
    { key: "Asia/Almaty", text: y("almaty", e) },
    { key: "Asia/Bangkok", text: y("bangkok", e) },
    { key: "Asia/Shanghai", text: y("shanghai", e) },
    { key: "Asia/Tokyo", text: y("tokyo", e) },
    { key: "Australia/Sydney", text: y("sydney", e) },
    { key: "Pacific/Norfolk", text: y("norfolk", e) }
  ];
}
const dI = (e) => {
  const [r, i] = E(e.timezone), o = Jt(() => fI(e.locale));
  return Y(e1, {
    get title() {
      return y("timezone", e.locale);
    },
    width: 320,
    get buttons() {
      return [{
        children: y("confirm", e.locale),
        onClick: () => {
          e.onConfirm(r()), e.onClose();
        }
      }];
    },
    get onClose() {
      return e.onClose;
    },
    get children() {
      return Y(Jo, {
        style: {
          width: "100%",
          "margin-top": "20px"
        },
        get value() {
          return r().text;
        },
        onSelected: (s) => {
          i(s);
        },
        get dataSource() {
          return o();
        }
      });
    }
  });
}, wn = (e) => {
  const r = [
    { key: "solid", text: y("solid", e) },
    { key: "dashed", text: y("dashed", e) }
  ], i = [
    { key: [4, 4] }
  ], o = [
    { key: "true", text: !0 },
    { key: "false", text: !1 }
  ], s = [
    { key: 1, text: 1 },
    { key: 2, text: 2 },
    { key: 3, text: 3 },
    { key: 4, text: 4 },
    { key: 5, text: 5 },
    { key: 6, text: 6 },
    { key: 7, text: 7 },
    { key: 8, text: 8 },
    { key: 9, text: 9 },
    { key: 10, text: 10 },
    { key: 11, text: 11 },
    { key: 12, text: 12 },
    { key: 13, text: 13 },
    { key: 14, text: 14 },
    { key: 15, text: 15 }
  ], c = [
    { key: "fill", text: y("fill", e) },
    { key: "stroke", text: y("stroke", e) },
    { key: "stroke_fill", text: y("stroke_fill", e) }
  ], u = [
    { key: "none", text: y("none", e) },
    { key: "always", text: y("always", e) },
    { key: "follow_cross", text: y("follow_cross", e) }
  ], f = [
    { key: 10, text: 10 },
    { key: 11, text: 11 },
    { key: 12, text: 12 },
    { key: 14, text: 14 },
    { key: 16, text: 16 },
    { key: 18, text: 18 },
    { key: 20, text: 20 },
    { key: 22, text: 22 },
    { key: 24, text: 24 }
  ], g = [
    { key: "normal", text: y("Normal", e) }
  ], m = [
    { key: "Helvetica Neue", text: y("Helvetica Neue", e) }
  ];
  return { solid_dashed: r, dashed_value: i, size: s, fill_stroke: c, font_family: m, font_size: f, font_weight: g, none_always_followCross: u, true_false: o };
}, hI = (e) => {
  const { font_family: r, font_size: i, font_weight: o, size: s, solid_dashed: c, fill_stroke: u, none_always_followCross: f } = wn(e);
  return [
    {
      key: "candle.type",
      text: y("candle_type", e),
      component: "select",
      dataSource: [
        { key: "candle_solid", text: y("candle_solid", e) },
        { key: "candle_stroke", text: y("candle_stroke", e) },
        { key: "candle_up_stroke", text: y("candle_up_stroke", e) },
        { key: "candle_down_stroke", text: y("candle_down_stroke", e) },
        { key: "ohlc", text: y("ohlc", e) },
        { key: "area", text: y("area", e) },
        { key: "heikin_ashi", text: y("heikin_ashi", e) }
      ]
    },
    {
      key: "candle.bar.upColor",
      text: y("Bar up color", e),
      component: "color"
    },
    {
      key: "candle.bar.downColor",
      text: y("Bar down color", e),
      component: "color"
    },
    {
      key: "candle.bar.noChangeColor",
      text: y("Bar no-change color", e),
      component: "color"
    },
    {
      key: "candle.bar.upBorderColor",
      text: y("Bar up-border color", e),
      component: "color"
    },
    {
      key: "candle.bar.downBorderColor",
      text: y("Bar down-border color", e),
      component: "color"
    },
    {
      key: "candle.bar.noChangeBorderColor",
      text: y("Bar no-change-border color", e),
      component: "color"
    },
    {
      key: "candle.bar.upWickColor",
      text: y("Bar up-wick color", e),
      component: "color"
    },
    {
      key: "candle.bar.downWickColor",
      text: y("Bar down-wick color", e),
      component: "color"
    },
    {
      key: "candle.bar.noChangeWickColor",
      text: y("Bar no-change-wick color", e),
      component: "color"
    },
    {
      key: "candle.area.lineSize",
      text: y("Area linesize", e),
      component: "select",
      dataSource: s
    },
    {
      key: "candle.area.lineColor",
      text: y("Area line color", e),
      component: "color"
    },
    {
      key: "candle.priceMark.high.show",
      text: y("high_price_show", e),
      component: "switch"
    },
    {
      key: "candle.priceMark.high.color",
      text: y("Pricemark high color", e),
      component: "color"
    },
    {
      key: "candle.priceMark.high.textSize",
      text: y("Pricemark High Textsize", e),
      component: "select",
      dataSource: i
    },
    {
      key: "candle.priceMark.high.textFamily",
      text: y("Pricemark High Font family", e),
      component: "select",
      dataSource: r
    },
    {
      key: "candle.priceMark.high.textWeight",
      text: y("Pricemark High Font Weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "candle.priceMark.low.show",
      text: y("low_price_show", e),
      component: "switch"
    },
    {
      key: "candle.priceMark.low.color",
      text: y("Pricemark low color", e),
      component: "color"
    },
    {
      key: "candle.priceMark.low.textSize",
      text: y("Pricemark Low Textsize", e),
      component: "select",
      dataSource: i
    },
    {
      key: "candle.priceMark.low.textFamily",
      text: y("Pricemark Low Font family", e),
      component: "select",
      dataSource: r
    },
    {
      key: "candle.priceMark.low.textWeight",
      text: y("Pricemark Low Font Weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "candle.priceMark.last.show",
      text: y("Show Pricemark last", e),
      component: "switch"
    },
    {
      key: "candle.priceMark.last.upColor",
      text: y("Pricemark last up-color", e),
      component: "color"
    },
    {
      key: "candle.priceMark.last.downColor",
      text: y("Pricemark last down-color", e),
      component: "color"
    },
    {
      key: "candle.priceMark.last.noChangeColor",
      text: y("Pricemark last no-change-color", e),
      component: "color"
    },
    {
      key: "candle.priceMark.last.line.show",
      text: y("Show Pricemark last line", e),
      component: "switch"
    },
    {
      key: "candle.priceMark.last.line.style",
      text: y("Pricemark last line style", e),
      component: "select",
      dataSource: c
    },
    {
      key: "candle.priceMark.last.line.size",
      text: y("Pricemark last line size", e),
      component: "select",
      dataSource: s
    },
    {
      key: "candle.priceMark.last.text.show",
      text: y("Show Pricemark last text", e),
      component: "switch"
    },
    {
      key: "candle.priceMark.last.text.style",
      text: y("Pricemark last text style", e),
      component: "select",
      dataSource: u
    },
    {
      key: "candle.priceMark.last.text.size",
      text: y("Pricemark last text size", e),
      component: "select",
      dataSource: i
    },
    {
      key: "candle.priceMark.last.text.color",
      text: y("Pricemark last text color", e),
      component: "color"
    },
    // candle tooltip
    {
      key: "candle.tooltip.showRule",
      text: y("candle_tooltip", e),
      component: "select",
      dataSource: f
    },
    {
      key: "candle.tooltip.showType",
      text: y("Tooltip showtype", e),
      component: "select",
      dataSource: [
        { key: "rect", text: y("Rect", e) },
        { key: "standard", text: y("Standard", e) }
      ]
    },
    {
      key: "candle.tooltip.rect.position",
      text: y("Tooltip rect position", e),
      component: "select",
      dataSource: [
        { key: "fixed", text: y("Fixed", e) },
        { key: "pointer", text: y("Pointer", e) }
      ]
    },
    {
      key: "candle.tooltip.rect.color",
      text: y("Tooltip rect color", e),
      component: "color"
    },
    {
      key: "candle.tooltip.rect.borderColor",
      text: y("Tooltip rect border-color", e),
      component: "color"
    },
    {
      key: "candle.tooltip.text.size",
      text: y("Tooltip text size", e),
      component: "select",
      dataSource: i
    },
    {
      key: "candle.tooltip.text.weight",
      text: y("Tooltip text weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "candle.tooltip.text.color",
      text: y("Tooltip text color", e),
      component: "color"
    }
  ];
}, gI = (e) => {
  const { fill_stroke: r, font_size: i, font_weight: o, none_always_followCross: s } = wn(e);
  return [
    // {
    //   key: 'indicator.bars.style',
    //   text: i18n('Bar style', locale),
    //   component: 'select',
    //   dataSource: [
    //     { key: 'fill', text: i18n('Fill', locale) },
    //     { key: 'stroke', text: i18n('Stroke', locale) },
    //     { key: 'stroke_fill', text: i18n('Stroke fill', locale) }
    //   ]
    // },
    // {
    //   key: 'indicator.bars.borderStyle',
    //   text: i18n('Bar border style', locale),
    //   component: 'select',
    //   dataSource: [
    //     { key: 'solid', text: i18n('Solid', locale) },
    //     { key: 'dashed', text: i18n('Dashed', locale) }
    //   ]
    // },
    // {
    //   key: 'indicator.bars.borderSize',
    //   text: i18n('Bar border thickness', locale),
    //   component: 'select',
    //   dataSource: [
    //     { key: 1, text: 1},
    //     { key: 2, text: 2},
    //     { key: 3, text: 3},
    //     { key: 4, text: 4}
    //   ]
    // },
    {
      key: "indicator.ohlc.upColor",
      text: y("Ohlc up-color", e),
      component: "color"
    },
    {
      key: "indicator.ohlc.downColor",
      text: y("Ohlc down-color", e),
      component: "color"
    },
    {
      key: "indicator.ohlc.noChangeColor",
      text: y("Ohlc no-change-color", e),
      component: "color"
    },
    {
      key: "indicator.lastValueMark.show",
      text: y("indicator_last_value_show", e),
      component: "switch"
    },
    {
      key: "indicator.lastValueMark.text.show",
      text: y("Show last value mark text", e),
      component: "switch"
    },
    {
      key: "indicator.lastValueMark.text.style",
      text: y("Last value mark text style", e),
      component: "select",
      dataSource: r
    },
    {
      key: "indicator.lastValueMark.text.size",
      text: y("Last value mark text size", e),
      component: "select",
      dataSource: i
    },
    {
      key: "indicator.lastValueMark.text.weight",
      text: y("Last value mark text Weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "indicator.lastValueMark.text.color",
      text: y("Last value mark text color", e),
      component: "color"
    },
    {
      key: "indicator.tooltip.showRule",
      text: y("Tooltip showrule", e),
      component: "select",
      dataSource: s
    },
    {
      key: "indicator.tooltip.showType",
      text: y("Tooltip showtype", e),
      component: "select",
      dataSource: [
        { key: "standard", text: y("Standard", e) },
        { key: "rect", text: y("Rect", e) }
      ]
    },
    {
      key: "indicator.tooltip.showName",
      text: y("Show tooltip name", e),
      component: "switch"
    },
    {
      key: "indicator.tooltip.showParams",
      text: y("Show tooltip params", e),
      component: "switch"
    },
    {
      key: "indicator.tooltip.text.size",
      text: y("Tooltip text size", e),
      component: "select",
      dataSource: i
    },
    {
      key: "indicator.tooltip.text.weight",
      text: y("Tooltip text Weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "indicator.tooltip.text.color",
      text: y("Tooltip text color", e),
      component: "color"
    }
  ];
}, pI = (e) => {
  const { font_size: r, size: i, font_weight: o } = wn(e);
  return [
    {
      key: "xAxis.show",
      text: y("Show xAxis", e),
      component: "switch"
    },
    {
      key: "xAxis.axisLine.show",
      text: y("Show axis line", e),
      component: "switch"
    },
    {
      key: "xAxis.axisLine.color",
      text: y("Axis line color", e),
      component: "color"
    },
    {
      key: "xAxis.axisLine.size",
      text: y("Axis line size", e),
      component: "select",
      dataSource: i
    },
    {
      key: "xAxis.tickText.show",
      text: y("Show tick text", e),
      component: "switch"
    },
    {
      key: "xAxis.tickText.size",
      text: y("Tick text size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "xAxis.tickText.weight",
      text: y("Tick text Weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "xAxis.tickText.color",
      text: y("Tick text color", e),
      component: "color"
    },
    {
      key: "xAxis.tickLine.show",
      text: y("Show tick line", e),
      component: "switch"
    },
    {
      key: "xAxis.tickLine.size",
      text: y("Tick line size", e),
      component: "select",
      dataSource: i
    },
    {
      key: "xAxis.tickLine.length",
      text: y("Tick line length", e),
      component: "select",
      dataSource: i
    },
    {
      key: "xAxis.tickLine.color",
      text: y("Tick line color", e),
      component: "color"
    }
  ];
}, yI = (e) => {
  const { size: r, font_weight: i, font_size: o } = wn(e);
  return [
    {
      key: "yAxis.show",
      text: y("Show yAxis", e),
      component: "switch"
    },
    {
      key: "yAxis.position",
      text: y("Position", e),
      component: "select",
      dataSource: [
        { key: "right", text: y("Right", e) },
        { key: "left", text: y("Left", e) }
      ]
    },
    {
      key: "yAxis.type",
      text: y("price_axis_type", e),
      component: "select",
      dataSource: [
        { key: "normal", text: y("normal", e) },
        { key: "percentage", text: y("percentage", e) },
        { key: "log", text: y("log", e) }
      ]
    },
    {
      key: "yAxis.inside",
      text: y("Inside", e),
      component: "switch"
    },
    {
      key: "yAxis.reverse",
      text: y("reverse_coordinate", e),
      component: "switch"
    },
    {
      key: "yAxis.axisLine.show",
      text: y("Show axis line", e),
      component: "switch"
    },
    {
      key: "yAxis.axisLine.size",
      text: y("Axis line size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "yAxis.axisLine.color",
      text: y("Axis line color", e),
      component: "color"
    },
    {
      key: "yAxis.tickText.show",
      text: y("Show tick text", e),
      component: "switch"
    },
    {
      key: "yAxis.tickText.color",
      text: y("Tick text color", e),
      component: "color"
    },
    {
      key: "yAxis.tickText.size",
      text: y("Tick text size", e),
      component: "select",
      dataSource: o
    },
    {
      key: "yAxis.tickText.weight",
      text: y("Tick text Weight", e),
      component: "select",
      dataSource: i
    },
    {
      key: "yAxis.tickLine.show",
      text: y("Show tick line", e),
      component: "switch"
    },
    {
      key: "yAxis.tickLine.color",
      text: y("Tick line color", e),
      component: "color"
    },
    {
      key: "yAxis.tickLine.size",
      text: y("Tick line size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "yAxis.tickLine.length",
      text: y("Tick line length", e),
      component: "select",
      dataSource: r
    }
  ];
}, mI = (e) => {
  const { size: r } = wn(e);
  return [
    {
      key: "grid.show",
      text: y("grid_show", e),
      component: "switch"
    },
    {
      key: "grid.horizontal.show",
      text: y("Show horizontal", e),
      component: "switch"
    },
    {
      key: "grid.horizontal.show",
      text: y("Horizontal size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "grid.horizontal.color",
      text: y("Horizontal color", e),
      component: "color"
    },
    {
      key: "grid.vertical.show",
      text: y("Show vertical", e),
      component: "switch"
    },
    {
      key: "grid.vertical.show",
      text: y("Vertical size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "grid.vertical.color",
      text: y("Vertical color", e),
      component: "color"
    }
  ];
}, bI = (e) => {
  const { solid_dashed: r, dashed_value: i, fill_stroke: o, size: s, font_size: c, font_weight: u } = wn(e);
  return [
    {
      key: "crosshair.show",
      text: y("Show Crosshair", e),
      component: "switch"
    },
    {
      key: "crosshair.horizontal.show",
      text: y("Show horizontal", e),
      component: "switch"
    },
    {
      key: "crosshair.horizontal.line.show",
      text: y("Show horizontal line", e),
      component: "switch"
    },
    {
      key: "crosshair.horizontal.line.style",
      text: y("Horizontal Line Style", e),
      component: "select",
      dataSource: r
    },
    {
      key: "crosshair.horizontal.line.dashed_value",
      text: y("Horizontal Line Style", e),
      component: "select",
      dataSource: i
    },
    {
      key: "crosshair.horizontal.line.size",
      text: y("Horizontal Line size", e),
      component: "select",
      dataSource: s
    },
    {
      key: "crosshair.horizontal.line.color",
      text: y("Horizontal Line color", e),
      component: "color"
    },
    {
      key: "crosshair.horizontal.text.show",
      text: y("Show horizontal text", e),
      component: "switch"
    },
    {
      key: "crosshair.horizontal.text.style",
      text: y("Horizontal text Style", e),
      component: "select",
      dataSource: o
    },
    {
      key: "crosshair.horizontal.text.size",
      text: y("Horizontal text size", e),
      component: "select",
      dataSource: c
    },
    {
      key: "crosshair.horizontal.text.weight",
      text: y("Horizontal text weight", e),
      component: "select",
      dataSource: u
    },
    {
      key: "crosshair.horizontal.text.color",
      text: y("Horizontal text color", e),
      component: "color"
    },
    {
      key: "crosshair.horizontal.text.backgroundColor",
      text: y("Horizontal text background color", e),
      component: "color"
    },
    {
      key: "crosshair.vertical.show",
      text: y("Show vertical", e),
      component: "switch"
    },
    {
      key: "crosshair.vertical.line.show",
      text: y("Show vertical line", e),
      component: "switch"
    },
    {
      key: "crosshair.vertical.line.style",
      text: y("Vertical Line Style", e),
      component: "select",
      dataSource: r
    },
    {
      key: "crosshair.vertical.line.size",
      text: y("Vertical Line size", e),
      component: "select",
      dataSource: s
    },
    {
      key: "crosshair.vertical.line.size",
      text: y("Vertical Line size", e),
      component: "select",
      dataSource: s
    },
    {
      key: "crosshair.vertical.line.color",
      text: y("Vertical line color", e),
      component: "color"
    },
    {
      key: "crosshair.vertical.text.show",
      text: y("Show vertical text", e),
      component: "switch"
    },
    {
      key: "crosshair.vertical.text.style",
      text: y("Vertical text Style", e),
      component: "select",
      dataSource: o
    },
    {
      key: "crosshair.vertical.text.size",
      text: y("Vertical text size", e),
      component: "select",
      dataSource: c
    },
    {
      key: "crosshair.vertical.text.weight",
      text: y("Vertical text weight", e),
      component: "select",
      dataSource: u
    },
    {
      key: "crosshair.vertical.text.color",
      text: y("Vertical text color", e),
      component: "color"
    },
    {
      key: "crosshair.vertical.text.backgroundColor",
      text: y("Vertical text background color", e),
      component: "color"
    }
  ];
}, vI = (e) => {
  const { solid_dashed: r, fill_stroke: i, size: o, font_size: s, font_weight: c, font_family: u } = wn(e);
  return [
    {
      key: "overlay.point.color",
      text: y("Point color", e),
      component: "color"
    },
    {
      key: "overlay.point.borderColor",
      text: y("Point border color", e),
      component: "color"
    },
    {
      key: "overlay.point.activeColor",
      text: y("Point active color", e),
      component: "color"
    },
    {
      key: "overlay.point.activeBorderColor",
      text: y("Point active border color", e),
      component: "color"
    },
    {
      key: "overlay.line.style",
      text: y("Line Style", e),
      component: "select",
      dataSource: r
    },
    {
      key: "overlay.line.smooth",
      text: y("Smooth line", e),
      component: "switch"
    },
    {
      key: "overlay.line.size",
      text: y("Line size", e),
      component: "select",
      dataSource: o
    },
    {
      key: "overlay.line.color",
      text: y("Line color", e),
      component: "color"
    },
    {
      key: "overlay.rect.style",
      text: y("Rect Style", e),
      component: "select",
      dataSource: i
    },
    {
      key: "overlay.rect.color",
      text: y("Rect color", e),
      component: "color"
    },
    {
      key: "overlay.rect.borderColor",
      text: y("Rect border color", e),
      component: "color"
    },
    {
      key: "overlay.polygon.style",
      text: y("Polygon Style", e),
      component: "select",
      dataSource: i
    },
    {
      key: "overlay.polygon.color",
      text: y("Polygon color", e),
      component: "color"
    },
    {
      key: "overlay.polygon.borderColor",
      text: y("Polygon border color", e),
      component: "color"
    },
    {
      key: "overlay.circle.style",
      text: y("Circle Style", e),
      component: "select",
      dataSource: i
    },
    {
      key: "overlay.circle.color",
      text: y("Circle color", e),
      component: "color"
    },
    {
      key: "overlay.circle.borderColor",
      text: y("Circle border color", e),
      component: "color"
    },
    {
      key: "overlay.arc.style",
      text: y("Arc Style", e),
      component: "select",
      dataSource: r
    },
    {
      key: "overlay.arc.size",
      text: y("Arc size", e),
      component: "select",
      dataSource: o
    },
    {
      key: "overlay.arc.color",
      text: y("Arc color", e),
      component: "color"
    },
    {
      key: "overlay.text.size",
      text: y("Text size", e),
      component: "select",
      dataSource: s
    },
    {
      key: "overlay.text.weight",
      text: y("Text weight", e),
      component: "select",
      dataSource: c
    },
    {
      key: "overlay.text.color",
      text: y("Text color", e),
      component: "color"
    },
    {
      key: "overlay.rectText.style",
      text: y("Rect_text style", e),
      component: "select",
      dataSource: i
    },
    {
      key: "overlay.rectText.size",
      text: y("Rect_text size", e),
      component: "select",
      dataSource: s
    },
    {
      key: "overlay.rectText.family",
      text: y("Rect_text font family", e),
      component: "select",
      dataSource: u
    },
    {
      key: "overlay.rectText.weight",
      text: y("Rect_text weight", e),
      component: "select",
      dataSource: c
    },
    {
      key: "overlay.rectText.color",
      text: y("Rect_text color", e),
      component: "color"
    },
    {
      key: "overlay.rectText.backgroundColor",
      text: y("Rect_text background color", e),
      component: "color"
    },
    {
      key: "overlay.rectText.borderColor",
      text: y("Rect_text border color", e),
      component: "color"
    }
  ];
};
function V2(e) {
  const { size: r } = wn(e);
  return [
    ...hI(e),
    ...gI(e),
    ...pI(e),
    ...yI(e),
    ...mI(e),
    ...bI(e),
    ...vI(e),
    // seperator
    {
      key: "separator.size",
      text: y("Seperator size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "separator.fill",
      text: y("Fill", e),
      component: "switch"
    },
    {
      key: "separator.activeBackgroundColor",
      text: y("Background color", e),
      component: "color"
    }
  ];
}
var _I = /* @__PURE__ */ U("<div class=klinecharts-pro-setting-modal-content><div class=sidebar></div><div class=content>"), CI = /* @__PURE__ */ U("<button>"), xI = /* @__PURE__ */ U("<div class=component><span>");
const LI = (e) => {
  const [r, i] = E(e.currentStyles), [o, s] = E(V2(e.locale)), [c, u] = E("candle");
  mn(() => {
    s(V2(e.locale));
  });
  const f = (C, b) => {
    const _ = localStorage.getItem("chartstatedata");
    let x;
    _ ? (x = JSON.parse(_), x.styleObj = x.styleObj ?? {}) : x = {
      styleObj: {}
    }, cr(x.styleObj, C.key, b), localStorage.setItem("chartstatedata", JSON.stringify(x)), C1(!0);
    const k = {};
    cr(k, C.key, b), cr(k, C.key, b);
    const T = Se.clone(r());
    cr(T, C.key, b), i(T), s(o().map(($) => ({
      ...$
    }))), e.onChange(k);
  }, g = () => {
    const C = localStorage.getItem("chartstatedata");
    let b;
    C && (b = JSON.parse(C), b.styleObj && (b.styleObj = {}), localStorage.setItem("chartstatedata", JSON.stringify(b))), e.onRestoreDefault(o()), e.onClose();
  }, m = [{
    text: "Candle",
    key: "candle"
  }, {
    text: "Indicator",
    key: "indicator"
  }, {
    text: "Grid",
    key: "grid"
  }, {
    text: "X-axis",
    key: "xAxis"
  }, {
    text: "Y-axis",
    key: "yAxis"
  }, {
    text: "Separator",
    key: "separator"
  }, {
    text: "Crosshair",
    key: "crosshair"
  }, {
    text: "Overlay",
    key: "overlay"
  }];
  return Y(e1, {
    get title() {
      return y("setting", e.locale);
    },
    get buttons() {
      return [{
        children: y("restore_default", e.locale),
        onClick: () => {
          g();
        }
      }];
    },
    get onClose() {
      return e.onClose;
    },
    get children() {
      var C = _I(), b = C.firstChild, _ = b.nextSibling;
      return G(b, () => m.map((x) => (() => {
        var k = CI();
        return k.$$click = () => u(x.key), G(k, () => x.text), ze(() => Ln(k, `${c() == x.key ? "selected" : ""}`)), k;
      })())), G(_, Y($o, {
        get each() {
          return o().filter((x) => x.key.includes(c()));
        },
        children: (x) => {
          let k;
          const T = Se.formatValue(r(), x.key);
          switch (x.component) {
            case "select": {
              k = Y(Jo, {
                style: {
                  width: "120px"
                },
                get value() {
                  return y(T, e.locale);
                },
                get dataSource() {
                  return x.dataSource;
                },
                onSelected: ($) => {
                  const A = $.key;
                  f(x, A);
                }
              });
              break;
            }
            case "switch": {
              const $ = !!T;
              k = Y(jC, {
                open: $,
                onChange: () => {
                  f(x, !$);
                }
              });
              break;
            }
            case "color": {
              k = Y(c6, {
                style: {
                  width: "120px"
                },
                value: T,
                reactiveChange: !1,
                onChange: ($) => {
                  f(x, $);
                }
              });
              break;
            }
          }
          return (() => {
            var $ = xI(), A = $.firstChild;
            return G(A, () => x.text), G($, k, null), $;
          })();
        }
      })), C;
    }
  });
};
At(["click"]);
var SI = /* @__PURE__ */ U("<img style=width:500px;margin-top:20px>");
const wI = (e) => Y(e1, {
  get title() {
    return y("screenshot", e.locale);
  },
  width: 540,
  get buttons() {
    return [{
      type: "confirm",
      children: y("save", e.locale),
      onClick: () => {
        const r = document.createElement("a");
        r.download = "screenshot", r.href = e.url, document.body.appendChild(r), r.click(), r.remove();
      }
    }];
  },
  get onClose() {
    return e.onClose;
  },
  get children() {
    var r = SI();
    return ze(() => pt(r, "src", e.url)), r;
  }
}), kI = {
  AO: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 5 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 34 }
  ],
  BIAS: [
    { paramNameKey: "BIAS1", precision: 0, min: 1, styleKey: "lines[0].color" },
    { paramNameKey: "BIAS2", precision: 0, min: 1, styleKey: "lines[1].color" },
    { paramNameKey: "BIAS3", precision: 0, min: 1, styleKey: "lines[2].color" },
    { paramNameKey: "BIAS4", precision: 0, min: 1, styleKey: "lines[3].color" },
    { paramNameKey: "BIAS5", precision: 0, min: 1, styleKey: "lines[4].color" }
  ],
  BOLL: [
    { paramNameKey: "period", precision: 0, min: 1, default: 20 },
    { paramNameKey: "standard_deviation", precision: 2, min: 1, default: 2 }
  ],
  BRAR: [
    { paramNameKey: "period", precision: 0, min: 1, default: 26 }
  ],
  BBI: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 3 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 6 },
    { paramNameKey: "params_3", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_4", precision: 0, min: 1, default: 24 }
  ],
  CCI: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 20 }
  ],
  CR: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 26 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 10 },
    { paramNameKey: "params_3", precision: 0, min: 1, default: 20 },
    { paramNameKey: "params_4", precision: 0, min: 1, default: 40 },
    { paramNameKey: "params_5", precision: 0, min: 1, default: 60 }
  ],
  DMA: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 10 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 50 },
    { paramNameKey: "params_3", precision: 0, min: 1, default: 10 }
  ],
  DMI: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 14 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 6 }
  ],
  EMV: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 14 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 9 }
  ],
  EMA: [
    { paramNameKey: "EMA1", precision: 0, min: 1, styleKey: "lines[0].color" },
    { paramNameKey: "EMA2", precision: 0, min: 1, styleKey: "lines[1].color" },
    { paramNameKey: "EMA3", precision: 0, min: 1, styleKey: "lines[2].color" },
    { paramNameKey: "EMA4", precision: 0, min: 1, styleKey: "lines[3].color" },
    { paramNameKey: "EMA5", precision: 0, min: 1, styleKey: "lines[4].color" }
  ],
  MTM: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 6 }
  ],
  MA: [
    { paramNameKey: "MA1", precision: 0, min: 1, styleKey: "lines[0].color" },
    { paramNameKey: "MA2", precision: 0, min: 1, styleKey: "lines[1].color" },
    { paramNameKey: "MA3", precision: 0, min: 1, styleKey: "lines[2].color" },
    { paramNameKey: "MA4", precision: 0, min: 1, styleKey: "lines[3].color" },
    { paramNameKey: "MA5", precision: 0, min: 1, styleKey: "lines[4].color" }
  ],
  MACD: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 26 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 9 }
  ],
  OBV: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 30 }
  ],
  PVT: [],
  PSY: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 6 }
  ],
  ROC: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 6 }
  ],
  RSI: [
    { paramNameKey: "RSI1", precision: 0, min: 1, styleKey: "lines[0].color" },
    { paramNameKey: "RSI2", precision: 0, min: 1, styleKey: "lines[1].color" },
    { paramNameKey: "RSI3", precision: 0, min: 1, styleKey: "lines[2].color" },
    { paramNameKey: "RSI4", precision: 0, min: 1, styleKey: "lines[3].color" },
    { paramNameKey: "RSI5", precision: 0, min: 1, styleKey: "lines[4].color" }
  ],
  SMA: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 2 }
  ],
  KDJ: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 9 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 3 },
    { paramNameKey: "params_3", precision: 0, min: 1, default: 3 }
  ],
  SAR: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 2 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 2 },
    { paramNameKey: "params_3", precision: 0, min: 1, default: 20 }
  ],
  TRIX: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 12 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 9 }
  ],
  VOL: [
    { paramNameKey: "MA1", precision: 0, min: 1, styleKey: "lines[0].color" },
    { paramNameKey: "MA2", precision: 0, min: 1, styleKey: "lines[1].color" },
    { paramNameKey: "MA3", precision: 0, min: 1, styleKey: "lines[2].color" },
    { paramNameKey: "MA4", precision: 0, min: 1, styleKey: "lines[3].color" },
    { paramNameKey: "MA5", precision: 0, min: 1, styleKey: "lines[4].color" }
  ],
  VR: [
    { paramNameKey: "params_1", precision: 0, min: 1, default: 26 },
    { paramNameKey: "params_2", precision: 0, min: 1, default: 6 }
  ],
  WR: [
    { paramNameKey: "WR1", precision: 0, min: 1, styleKey: "lines[0].color" },
    { paramNameKey: "WR2", precision: 0, min: 1, styleKey: "lines[1].color" },
    { paramNameKey: "WR3", precision: 0, min: 1, styleKey: "lines[2].color" },
    { paramNameKey: "WR4", precision: 0, min: 1, styleKey: "lines[3].color" },
    { paramNameKey: "WR5", precision: 0, min: 1, styleKey: "lines[4].color" }
  ]
};
var $I = /* @__PURE__ */ U("<div class=klinecharts-pro-indicator-setting-modal-content>"), AI = /* @__PURE__ */ U("<span>");
const MI = (e) => {
  const [r, i] = E(Se.clone(e.params.calcParams)), o = (s) => kI[s];
  return Y(e1, {
    get title() {
      return e.params.indicatorName;
    },
    width: 360,
    get buttons() {
      return [{
        type: "confirm",
        children: y("confirm", e.locale),
        onClick: () => {
          const s = o(e.params.indicatorName), c = [];
          Se.clone(r()).forEach((u, f) => {
            !Se.isValid(u) || u === "" ? "default" in s[f] && c.push(s[f].default) : c.push(u);
          }), e.onConfirm(c), e.onClose();
        }
      }];
    },
    get onClose() {
      return e.onClose;
    },
    get children() {
      var s = $I();
      return G(s, () => o(e.params.indicatorName).map((c, u) => [(() => {
        var f = AI();
        return G(f, () => y(c.paramNameKey, e.locale)), f;
      })(), Y(fr, {
        style: {
          width: "200px"
        },
        get value() {
          return r()[u] ?? "";
        },
        get precision() {
          return c.precision;
        },
        get min() {
          return c.min;
        },
        onChange: (f) => {
          const g = Se.clone(r());
          g[u] = f, i(g);
        }
      })])), s;
    }
  });
};
var TI = /* @__PURE__ */ U('<svg viewBox="0 0 1024 1024"><path d="M945.066667 898.133333l-189.866667-189.866666c55.466667-64 87.466667-149.333333 87.466667-241.066667 0-204.8-168.533333-373.333333-373.333334-373.333333S96 264.533333 96 469.333333 264.533333 842.666667 469.333333 842.666667c91.733333 0 174.933333-34.133333 241.066667-87.466667l189.866667 189.866667c6.4 6.4 14.933333 8.533333 23.466666 8.533333s17.066667-2.133333 23.466667-8.533333c8.533333-12.8 8.533333-34.133333-2.133333-46.933334zM469.333333 778.666667C298.666667 778.666667 160 640 160 469.333333S298.666667 160 469.333333 160 778.666667 298.666667 778.666667 469.333333 640 778.666667 469.333333 778.666667z">'), II = /* @__PURE__ */ U("<img alt=symbol>"), OI = /* @__PURE__ */ U("<li><div><span>");
const PI = (e) => {
  const [r, i] = E(""), [o] = Af(r, e.datafeed.searchSymbols.bind(e.datafeed));
  return Y(e1, {
    get title() {
      return y("symbol_search", e.locale);
    },
    width: 460,
    get onClose() {
      return e.onClose;
    },
    get children() {
      return [Y(fr, {
        class: "klinecharts-pro-symbol-search-modal-input",
        get placeholder() {
          return y("symbol_code", e.locale);
        },
        get suffix() {
          return TI();
        },
        get value() {
          return r();
        },
        onChange: (s) => {
          const c = `${s}`;
          i(c);
        }
      }), Y(L0, {
        class: "klinecharts-pro-symbol-search-modal-list",
        get loading() {
          return o.loading;
        },
        get dataSource() {
          return o() ?? [];
        },
        renderItem: (s) => (() => {
          var c = OI(), u = c.firstChild, f = u.firstChild;
          return c.$$click = () => {
            e.onSymbolSelected(s), e.onClose();
          }, G(u, Y(We, {
            get when() {
              return s.logo;
            },
            get children() {
              var g = II();
              return ze(() => pt(g, "src", s.logo)), g;
            }
          }), f), G(f, () => s.shortName ?? s.ticker, null), G(f, () => `${s.name ? `(${s.name})` : ""}`, null), G(c, () => s.exchange ?? "", null), ze(() => pt(f, "title", s.name ?? "")), c;
        })()
      })];
    }
  });
};
At(["click"]);
const BI = (e) => {
  const { font_size: r, font_family: i, font_weight: o, fill_stroke: s, solid_dashed: c, size: u, true_false: f } = wn(e), g = [
    {
      key: "activeBorderSize",
      text: y("active border size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "borderSize",
      text: y("Border size", e),
      component: "select",
      dataSource: u
    },
    {
      key: "color",
      text: y("Color", e),
      component: "color"
    },
    {
      key: "activeColor",
      text: y("Color", e),
      component: "color"
    },
    {
      key: "activeBorderColor",
      text: y("Color", e),
      component: "color"
    },
    {
      key: "borderColor",
      text: y("Border color", e),
      component: "color"
    },
    {
      key: "activeRadius",
      text: y("Active radius", e),
      component: "input"
    },
    {
      key: "radius",
      text: y("Radius", e),
      component: "input"
    }
  ], m = [
    {
      key: "style",
      text: y("Style", e),
      component: "select",
      dataSource: s
    },
    {
      key: "size",
      text: y("Font size", e),
      component: "select",
      dataSource: r
    },
    {
      key: "family",
      text: y("Font family", e),
      component: "select",
      dataSource: i
    },
    {
      key: "weight",
      text: y("Font weight", e),
      component: "select",
      dataSource: o
    },
    {
      key: "borderStyle",
      text: y("Border style", e),
      component: "select",
      dataSource: c
    },
    {
      key: "borderSize",
      text: y("Border size", e),
      component: "select",
      dataSource: u
    },
    {
      key: "color",
      text: y("Color", e),
      component: "color"
    },
    {
      key: "backgroundColor",
      text: y("Background color", e),
      component: "color"
    },
    {
      key: "borderColor",
      text: y("Border color", e),
      component: "color"
    },
    {
      key: "borderDashedValue",
      text: y("Border dashed value", e),
      component: "input"
    },
    {
      key: "borderRadius",
      text: y("Border radius", e),
      component: "input"
    },
    {
      key: "paddingLeft",
      text: y("Padding left", e),
      component: "input"
    },
    {
      key: "paddingRight",
      text: y("Padding right", e),
      component: "input"
    },
    {
      key: "paddingBottom",
      text: y("Padding bottom", e),
      component: "input"
    },
    {
      key: "paddingTop",
      text: y("Padding top", e),
      component: "input"
    }
  ], C = [
    {
      key: "style",
      text: y("Style", e),
      component: "select",
      dataSource: c
    },
    {
      key: "size",
      text: y("Size", e),
      component: "select",
      dataSource: u
    },
    {
      key: "color",
      text: y("Color", e),
      component: "color"
    },
    {
      key: "dashedValue",
      text: y("Dashed Value", e),
      component: "input"
    }
  ], b = [
    {
      key: "style",
      text: y("Style", e),
      component: "select",
      dataSource: s
    },
    {
      key: "color",
      text: y("Color", e),
      component: "color"
    },
    {
      key: "borderColor",
      text: y("Border color", e),
      component: "color"
    },
    {
      key: "borderSize",
      text: y("Active border size", e),
      component: "select",
      dataSource: u
    },
    {
      key: "borderStyle",
      text: y("Border style", e),
      component: "select",
      dataSource: c
    },
    {
      key: "borderDashedValue",
      text: y("Border dashed value", e),
      component: "input"
    }
  ], _ = C;
  _.push({
    key: "smooth",
    text: y("Smooth", e),
    component: "select",
    dataSource: f
  });
  const x = b;
  return x.push({
    key: "borderRadius",
    text: y("Border radius", e),
    component: "input"
  }), {
    point: g,
    text: m,
    line: _,
    rect: x,
    polygon: b,
    circle: b,
    arc: C
  };
};
var EI = /* @__PURE__ */ U("<div class=klinecharts-pro-overlay-setting-modal-content><div class=content>"), RI = /* @__PURE__ */ U("<div style=width:120px;display:flex;flex-direction:row;align-items:center;vertical-align:middle>"), DI = /* @__PURE__ */ U("<div class=component><span>");
const FI = (e) => {
  var f, g;
  const r = BI(e.locale), i = (m, C) => {
    var _, x, k, T;
    const b = Fe();
    return C ? b && b.styles[C][m] ? b.styles[C][m] : L1[`${(_ = lr()) == null ? void 0 : _.overlayType}Style`]()[C][m] : (x = Fe()) != null && x.styles[m] ? (k = Fe()) == null ? void 0 : k.styles[m] : L1[`${(T = lr()) == null ? void 0 : T.overlayType}Style`]()[m];
  }, o = (m, C, b) => {
    var $;
    const _ = localStorage.getItem("chartstatedata");
    let x;
    _ ? (x = JSON.parse(_), x.orderStyles = x.orderStyles ?? {}) : x = {
      orderStyles: {}
    };
    const k = (A) => {
      var Z, N, V;
      const F = Rn.cloneDeep(A);
      return b ? Rn.set(F, `${b}.${m.key}`, C) : Rn.set(F, `${m.key}`, C), (N = ee()) == null || N.overrideOverlay({
        id: (Z = Fe()) == null ? void 0 : Z.id,
        styles: F
      }), z1((Q) => {
        var I;
        return ((I = ee()) == null ? void 0 : I.getOverlayById(Q == null ? void 0 : Q.id)) ?? Q;
      }), Fe() && u9().syncObject(Fe()), (V = ee()) == null || V.setStyles(x.styleObj ?? {}), F;
    }, T = ($ = lr()) == null ? void 0 : $.overlayType;
    K2[`set${T}Style`] && K2[`set${T}Style`]((A) => k(A));
  }, s = L1[`${(f = lr()) == null ? void 0 : f.overlayType}Style`] ? L1[`${(g = lr()) == null ? void 0 : g.overlayType}Style`]() : void 0;
  let c = [], u = [];
  return s && (c = Object.keys(r), u = Object.keys(s)), Y(e1, {
    get title() {
      return `Style ${f6()}`;
    },
    onClose: () => u6(!1),
    get children() {
      var m = EI(), C = m.firstChild;
      return G(C, Y($o, {
        each: u,
        children: (b) => {
          if (c.includes(b))
            return Y($o, {
              get each() {
                return r[b];
              },
              children: (_) => {
                let x;
                const k = i(_.key, b);
                if (k !== void 0) {
                  switch (_.component) {
                    case "select": {
                      x = Y(Jo, {
                        style: {
                          width: "120px"
                        },
                        get value() {
                          return y(k, e.locale);
                        },
                        get dataSource() {
                          return _.dataSource;
                        },
                        onSelected: (T) => {
                          const $ = T.key;
                          o(_, $, b);
                        }
                      });
                      break;
                    }
                    case "input": {
                      x = [Y(We, {
                        get when() {
                          return Rn.isArray(k);
                        },
                        get children() {
                          var T = RI();
                          return G(T, Y(fr, {
                            style: {
                              width: "50px",
                              "margin-right": "10px"
                            },
                            get value() {
                              return k[0] ?? "4";
                            },
                            onChange: ($) => {
                              let A = i(_.key, b);
                              A[0] = Number($), o(_, A, b);
                            }
                          }), null), G(T, Y(fr, {
                            style: {
                              width: "50px",
                              "margin-left": "10px"
                            },
                            get value() {
                              return k[1] ?? "4";
                            },
                            onChange: ($) => {
                              let A = i(_.key, b);
                              A[1] = Number($), o(_, A, b);
                            }
                          }), null), T;
                        }
                      }), Y(We, {
                        get when() {
                          return !Rn.isArray(k);
                        },
                        get children() {
                          return Y(fr, {
                            style: {
                              width: "120px"
                            },
                            value: k ?? "4",
                            onChange: (T) => {
                              let $ = Number(T);
                              o(_, $, b);
                            }
                          });
                        }
                      })];
                      break;
                    }
                    case "color": {
                      x = Y(c6, {
                        style: {
                          width: "120px"
                        },
                        value: k,
                        onChange: (T) => {
                          o(_, T, b);
                        }
                      });
                      break;
                    }
                  }
                  if (x)
                    return (() => {
                      var T = DI(), $ = T.firstChild;
                      return G($, () => _.text), G(T, x, null), T;
                    })();
                }
              }
            });
        }
      })), m;
    }
  });
};
class f9 {
  constructor(r, i) {
    ht(this, "_chart");
    ht(this, "_charts", /* @__PURE__ */ new Map());
    ht(this, "id");
    const o = nf(r, i);
    if (!o)
      throw new Error("Failed to initialize chart");
    this._chart = o, this.id = o.id;
  }
  get chart() {
    return this._chart;
  }
  get charts() {
    return Array.from(this._charts.values());
  }
  static init(r, i) {
    return new f9(r, i);
  }
  /**
   * Base Proxy Methods
   */
  getDom(r, i) {
    return this._chart.getDom(r, i);
  }
  getSize(r, i) {
    return this._chart.getSize(r, i);
  }
  createIndicator(r, i, o) {
    return this._chart.createIndicator(r, i, o);
  }
  getIndicators(r) {
    return this._chart.getIndicators(r);
  }
  createOverlay(r) {
    return this._chart.createOverlay(r);
  }
  getOverlays(r) {
    return this._chart.getOverlays(r);
  }
  setPaneOptions(r) {
    return this._chart.setPaneOptions(r);
  }
  getPaneOptions(r) {
    return this._chart.getPaneOptions(r);
  }
  scrollByDistance(r, i) {
    return this._chart.scrollByDistance(r, i);
  }
  scrollToRealTime(r) {
    return this._chart.scrollToRealTime(r);
  }
  scrollToDataIndex(r, i) {
    return this._chart.scrollToDataIndex(r, i);
  }
  scrollToTimestamp(r, i) {
    return this._chart.scrollToTimestamp(r, i);
  }
  zoomAtCoordinate(r, i, o) {
    return this._chart.zoomAtCoordinate(r, i, o);
  }
  zoomAtDataIndex(r, i, o) {
    return this._chart.zoomAtDataIndex(r, i, o);
  }
  zoomAtTimestamp(r, i, o) {
    return this._chart.zoomAtTimestamp(r, i, o);
  }
  convertToPixel(r, i) {
    return this._chart.convertToPixel(r, i);
  }
  convertFromPixel(r, i) {
    return this._chart.convertFromPixel(r, i);
  }
  executeAction(r, i) {
    return this._chart.executeAction(r, i);
  }
  subscribeAction(r, i) {
    return this._chart.subscribeAction(r, i);
  }
  unsubscribeAction(r, i) {
    return this._chart.unsubscribeAction(r, i);
  }
  getConvertPictureUrl(r, i, o) {
    return this._chart.getConvertPictureUrl(r, i, o);
  }
  resize() {
    return this._chart.resize();
  }
  /**
   * Store Proxy Methods
   */
  setStyles(r) {
    return this._chart.setStyles(r);
  }
  getStyles() {
    return this._chart.getStyles();
  }
  setFormatter(r) {
    return this._chart.setFormatter(r);
  }
  getFormatter() {
    return this._chart.getFormatter();
  }
  setLocale(r) {
    return this._chart.setLocale(r);
  }
  getLocale() {
    return this._chart.getLocale();
  }
  setTimezone(r) {
    return this._chart.setTimezone(r);
  }
  getTimezone() {
    return this._chart.getTimezone();
  }
  setThousandsSeparator(r) {
    return this._chart.setThousandsSeparator(r);
  }
  getThousandsSeparator() {
    return this._chart.getThousandsSeparator();
  }
  setDecimalFold(r) {
    return this._chart.setDecimalFold(r);
  }
  getDecimalFold() {
    return this._chart.getDecimalFold();
  }
  //Still deciding about using type from klinecharts or our own type
  setSymbol(r) {
    return this._chart.setSymbol(r);
  }
  //Still deciding about using type from klinecharts or our own type
  getSymbol() {
    return this._chart.getSymbol();
  }
  //Still deciding about using type from klinecharts or our own type
  setPeriod(r) {
    return this._chart.setPeriod(r);
  }
  //Still deciding about using type from klinecharts or our own type
  getPeriod() {
    return this._chart.getPeriod();
  }
  getDataList() {
    return this._chart.getDataList();
  }
  setOffsetRightDistance(r) {
    return this._chart.setOffsetRightDistance(r);
  }
  getOffsetRightDistance() {
    return this._chart.getOffsetRightDistance();
  }
  setMaxOffsetLeftDistance(r) {
    return this._chart.setMaxOffsetLeftDistance(r);
  }
  setMaxOffsetRightDistance(r) {
    return this._chart.setMaxOffsetRightDistance(r);
  }
  setLeftMinVisibleBarCount(r) {
    return this._chart.setLeftMinVisibleBarCount(r);
  }
  setRightMinVisibleBarCount(r) {
    return this._chart.setRightMinVisibleBarCount(r);
  }
  setBarSpace(r) {
    return this._chart.setBarSpace(r);
  }
  getBarSpace() {
    return this._chart.getBarSpace();
  }
  setBarSpaceLimit(r) {
    return this._chart.setBarSpaceLimit(r);
  }
  getBarSpaceLimit() {
    return this._chart.getBarSpaceLimit();
  }
  getVisibleRange() {
    return this._chart.getVisibleRange();
  }
  setDataLoader(r) {
    return this._chart.setDataLoader(r);
  }
  overrideIndicator(r) {
    return this._chart.overrideIndicator(r);
  }
  removeIndicator(r) {
    return this._chart.removeIndicator(r);
  }
  overrideOverlay(r) {
    return this._chart.overrideOverlay(r);
  }
  removeOverlay(r) {
    return this._chart.removeOverlay(r);
  }
  setZoomEnabled(r) {
    return this._chart.setZoomEnabled(r);
  }
  isZoomEnabled() {
    return this._chart.isZoomEnabled();
  }
  setZoomAnchor(r) {
    this._chart.setZoomAnchor(r);
  }
  zoomAnchor() {
    return this._chart.zoomAnchor();
  }
  setScrollEnabled(r) {
    return this._chart.setScrollEnabled(r);
  }
  isScrollEnabled() {
    return this._chart.isScrollEnabled();
  }
  resetData() {
    return this._chart.resetData();
  }
  /**
   * Custom methods
   */
  setActiveChart(r) {
    const i = this._charts.get(r);
    return i && (this._chart = i), this;
  }
  chartById(r) {
    return this._charts.get(r);
  }
  getOverlayById(r) {
    return this._chart.getOverlays({ id: r })[0] ?? null;
  }
  createOrderLine(r) {
    const i = this._chart.getDataList(), o = this._chart.createOverlay({
      name: "orderLine",
      paneId: "candle_pane",
      points: [{
        timestamp: i[i.length - 40].timestamp,
        value: i[i.length - 40].close
      }]
    });
    return o ? this._chart.getOverlays({ id: o, paneId: "candle_pane" })[0] : null;
  }
  createOrderLines(r, i) {
    const o = [], s = this._chart.getDataList(), c = Math.floor(s.length / (r + 1));
    for (let g = 1; g <= r; g++)
      o.push({
        timestamp: s[c * g].timestamp,
        value: s[c * g].close
      });
    const u = {
      name: "orderLine",
      paneId: "candle_pane",
      points: o
    }, f = this._chart.createOverlay(u);
    return !f || Rn.isArray(f) && f.length === 0 ? [] : f.map((g) => this._chart.getOverlays({ id: g, paneId: "canlde_pane" })[0]);
  }
}
var zI = /* @__PURE__ */ U('<i class="icon-close klinecharts-pro-load-icon">'), NI = /* @__PURE__ */ U("<div class=klinecharts-pro-content><div class=klinecharts-pro-widget>");
const {
  createIndicator: u0,
  pushOverlay: UI,
  restoreChartState: KI
} = u9(), ZI = (e) => {
  let r, i;
  const [o, s] = E(e.theme), [c, u] = E(e.locale), [f, g] = E(!1), [m, C] = E([...e.mainIndicators]), [b, _] = E({}), [x, k] = E(!1), [T, $] = E({
    key: e.timezone,
    text: j2(e.timezone, e.locale)
  }), [A, F] = E(!1), [Z, N] = E(), [V, Q] = E(""), [I, q] = E(e.drawingBarVisible), [H, W] = E(!1), [re, K] = E({
    visible: !1,
    indicatorName: "",
    paneId: "",
    calcParams: []
  });
  Lo(e.period), xo(e.symbol), e.ref({
    setTheme: s,
    getTheme: () => o(),
    setStyles: h6,
    getStyles: () => So() ?? {},
    setLocale: u,
    getLocale: () => c(),
    setTimezone: (R) => {
      $({
        key: R,
        text: j2(e.timezone, c())
      });
    },
    getTimezone: () => T().key,
    setSymbol: xo,
    getSymbol: () => Dn(),
    setPeriod: Lo,
    getPeriod: () => yn(),
    getInstanceApi: () => ee(),
    resize: () => {
      var R;
      return (R = ee()) == null ? void 0 : R.resize();
    },
    dispose: () => {
    }
  });
  const X = () => {
    var R;
    (R = ee()) == null || R.resize();
  };
  return ts(() => {
    var te, le, ie, ce, Ye, be, Oe, lt, yt, t1;
    if (window.addEventListener("resize", X), dS(f9.init(r, {
      formatter: {
        formatDate: (ye) => {
          switch (yn().type) {
            case "minute":
              return ye.type === "xAxis" ? Se.formatDate(ye.dateTimeFormat, ye.timestamp, "HH:mm") : Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM-DD HH:mm");
            case "hour":
              return ye.type === "xAxis" ? Se.formatDate(ye.dateTimeFormat, ye.timestamp, "MM-DD HH:mm") : Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM-DD HH:mm");
            case "day":
            case "week":
              return Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM-DD");
            case "month":
              return ye.type === "xAxis" ? Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM") : Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM-DD");
            case "year":
              return ye.type === "xAxis" ? Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY") : Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM-DD");
          }
          return Se.formatDate(ye.dateTimeFormat, ye.timestamp, "YYYY-MM-DD HH:mm");
        }
      }
    })), ee()) {
      uS(e.rootElementId), console.info("ChartPro widget initialized");
      const ye = ee().getDom("candle_pane", "main");
      if (ye) {
        let Ue = document.createElement("div");
        if (Ue.className = "klinecharts-pro-watermark", Se.isString(e.watermark)) {
          const Me = e.watermark.replace(/(^\s*)|(\s*$)/g, "");
          Ue.innerHTML = Me;
        } else
          Ue.appendChild(e.watermark);
        ye.appendChild(Ue);
      }
      const qe = ee().getDom("candle_pane", "yAxis");
      i = document.createElement("span"), i.className = "klinecharts-pro-price-unit", qe == null || qe.appendChild(i), (te = ee()) == null || te.setZoomAnchor({
        main: "last_bar",
        xAxis: "last_bar"
      }), (le = ee()) == null || le.setBarSpaceLimit({
        max: 400
      }), (ie = ee()) == null || ie.subscribeAction("onCrosshairFeatureClick", (Ue) => {
        console.info("onCrosshairFeatureClick", Ue);
      }), (ce = ee()) == null || ce.subscribeAction("onIndicatorTooltipFeatureClick", (Ue) => {
        var pr, Nn, Un, N1, mt;
        console.info("onIndicatorTooltipFeatureClick", Ue);
        const Me = Ue;
        switch (Me.feature.id) {
          case "visible": {
            (pr = ee()) == null || pr.overrideIndicator({
              name: Me.indicator.name,
              visible: !0,
              paneId: Me.paneId
            });
            break;
          }
          case "invisible": {
            (Nn = ee()) == null || Nn.overrideIndicator({
              name: Me.indicator.name,
              visible: !1,
              paneId: Me.paneId
            });
            break;
          }
          case "setting": {
            const ct = (Un = ee()) == null ? void 0 : Un.getIndicators({
              paneId: Me.paneId,
              name: Me.indicator.name,
              id: Me.indicator.id
            }).at(0);
            if (!ct)
              return;
            K({
              visible: !0,
              indicatorName: Me.indicator.name,
              paneId: Me.paneId,
              calcParams: ct.calcParams
            });
            break;
          }
          case "close":
            if (Me.paneId === "candle_pane") {
              const ct = [...m()];
              (N1 = ee()) == null || N1.removeIndicator({
                paneId: Me.paneId,
                name: Me.indicator.name,
                id: Me.indicator.id
              }), ct.splice(ct.indexOf(Me.indicator.name), 1), C(ct);
            } else {
              const ct = {
                ...b()
              };
              (mt = ee()) == null || mt.removeIndicator({
                paneId: Me.paneId,
                name: Me.indicator.name,
                id: Me.indicator.id
              }), delete ct[Me.indicator.name], _(ct);
            }
        }
      }), (Ye = ee()) == null || Ye.subscribeAction("onCandleTooltipFeatureClick", (Ue) => {
        console.info("onCandleTooltipFeatureClick", Ue);
      }), (be = ee()) == null || be.subscribeAction("onZoom", (Ue) => {
        console.info("chart zoomed: ", Ue);
      }), (Oe = ee()) == null || Oe.subscribeAction("onCrosshairChange", (Ue) => {
      }), console.info("calling restoreChartState"), KI(e.overrides);
      const Ne = Dn();
      Ne != null && Ne.priceCurrency ? (i.innerHTML = Ne == null ? void 0 : Ne.priceCurrency.toLocaleUpperCase(), i.style.display = "flex") : i.style.display = "none", (lt = ee()) == null || lt.setSymbol({
        ticker: Ne.ticker,
        pricePrecision: (Ne == null ? void 0 : Ne.pricePrecision) ?? 2,
        volumePrecision: (Ne == null ? void 0 : Ne.volumePrecision) ?? 0
      }), (yt = ee()) == null || yt.setPeriod(yn()), (t1 = ee()) == null || t1.setDataLoader(e.dataloader);
    }
    const R = ee();
    if (R) {
      m().forEach((qe) => {
        u0(R, qe, !0, {
          id: "candle_pane"
        });
      });
      const ye = {};
      e.subIndicators.forEach((qe) => {
        const Ne = u0(R, qe, !0);
        Ne && (ye[qe] = Ne);
      }), _(ye);
    }
  }), y0(() => {
    window.removeEventListener("resize", X), q2(r);
  }), mn((R) => {
    var te, le, ie;
    if (console.info("symbol or period changed effect", Dn(), yn(), R), !e.dataloader.loading) {
      console.info("setLoadingVisible false by effect");
      const ce = Dn(), Ye = yn();
      return (R == null ? void 0 : R.period.span) !== Ye.span && (R == null ? void 0 : R.period.type) !== Ye.type && (console.info("period changed: set period", Ye), (te = ee()) == null || te.setPeriod(Ye)), ((le = R == null ? void 0 : R.symbol) == null ? void 0 : le.ticker) !== ce.ticker && console.info("ticker changed: set symbol", ce), (ie = ee()) == null || ie.setSymbol({
        ticker: ce.ticker,
        pricePrecision: ce.pricePrecision,
        volumePrecision: ce.volumePrecision
      }), y0(() => {
      }), {
        symbol: ce,
        period: Ye
      };
    }
    return console.info("props.dataloader.loading is true, skip setLoadingVisible false"), R;
  }), mn(() => {
    var le, ie;
    const R = o();
    (le = ee()) == null || le.setStyles(R);
    const te = R === "dark" ? "#929AA5" : "#76808F";
    (ie = ee()) == null || ie.setStyles({
      indicator: {
        tooltip: {
          features: [{
            id: "visible",
            position: "middle",
            marginLeft: 8,
            marginTop: 1,
            marginRight: 0,
            marginBottom: 0,
            paddingLeft: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            type: "icon_font",
            content: {
              code: "",
              family: "icomoon"
            },
            size: 14,
            color: te,
            activeColor: te,
            backgroundColor: "transparent",
            activeBackgroundColor: "rgba(22, 119, 255, 0.15)"
          }, {
            id: "invisible",
            position: "middle",
            marginLeft: 8,
            marginTop: 1,
            marginRight: 0,
            marginBottom: 0,
            paddingLeft: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            type: "icon_font",
            content: {
              code: "",
              family: "icomoon"
            },
            size: 14,
            color: te,
            activeColor: te,
            backgroundColor: "transparent",
            activeBackgroundColor: "rgba(22, 119, 255, 0.15)"
          }, {
            id: "setting",
            position: "middle",
            marginLeft: 6,
            marginTop: 1,
            marginBottom: 0,
            marginRight: 0,
            paddingLeft: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            type: "icon_font",
            content: {
              code: "",
              family: "icomoon"
            },
            size: 14,
            color: te,
            activeColor: te,
            backgroundColor: "transparent",
            activeBackgroundColor: "rgba(22, 119, 255, 0.15)"
          }, {
            id: "close",
            position: "middle",
            marginLeft: 6,
            marginTop: 1,
            marginRight: 0,
            marginBottom: 0,
            paddingLeft: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            type: "icon_font",
            content: {
              code: "",
              family: "icomoon"
            },
            size: 14,
            color: te,
            activeColor: te,
            backgroundColor: "transparent",
            activeBackgroundColor: "rgba(22, 119, 255, 0.15)"
          }]
        }
      }
    });
  }), mn(() => {
    var R;
    (R = ee()) == null || R.setLocale(c());
  }), mn(() => {
    var R;
    (R = ee()) == null || R.setTimezone(T().key);
  }), mn(() => {
    var R;
    So() && ((R = ee()) == null || R.setStyles(So()), N(wC(ee().getStyles())));
  }), [zI(), Y(We, {
    get when() {
      return nS();
    },
    get children() {
      return Y(wM, {});
    }
  }), Y(We, {
    get when() {
      return lS();
    },
    get children() {
      return Y(FI, {
        get locale() {
          return e.locale;
        }
      });
    }
  }), Y(We, {
    get when() {
      return H();
    },
    get children() {
      return Y(PI, {
        get locale() {
          return e.locale;
        },
        get datafeed() {
          return e.dataloader;
        },
        onSymbolSelected: (R) => {
          xo(R);
        },
        onClose: () => {
          W(!1);
        }
      });
    }
  }), Y(We, {
    get when() {
      return f();
    },
    get children() {
      return Y(uI, {
        get locale() {
          return e.locale;
        },
        get mainIndicators() {
          return m();
        },
        get subIndicators() {
          return b();
        },
        onClose: () => {
          g(!1);
        },
        onMainIndicatorChange: (R) => {
          var le;
          const te = [...m()];
          R.added ? (u0(ee(), R.name, !0, {
            id: "candle_pane"
          }), te.push(R.name)) : ((le = ee()) == null || le.removeIndicator({
            name: R.name,
            paneId: "candle_pane",
            id: R.id ?? void 0
          }), te.splice(te.indexOf(R.name), 1)), C(te);
        },
        onSubIndicatorChange: (R) => {
          var le;
          console.info("onSubIndicatorChange", R);
          const te = {
            ...b()
          };
          if (R.added) {
            const ie = u0(ee(), R.name);
            ie && (te[R.name] = ie);
          } else
            R.id && ((le = ee()) == null || le.removeIndicator({
              name: R.name,
              id: R.id
            }), delete te[R.name]);
          _(te);
        }
      });
    }
  }), Y(We, {
    get when() {
      return x();
    },
    get children() {
      return Y(dI, {
        get locale() {
          return e.locale;
        },
        get timezone() {
          return T();
        },
        onClose: () => {
          k(!1);
        },
        onConfirm: $
      });
    }
  }), Y(We, {
    get when() {
      return A();
    },
    get children() {
      return Y(LI, {
        get locale() {
          return e.locale;
        },
        get currentStyles() {
          return Se.clone(ee().getStyles());
        },
        onClose: () => {
          F(!1);
        },
        onChange: (R) => {
          var te;
          (te = ee()) == null || te.setStyles(R);
        },
        onRestoreDefault: (R) => {
          var le;
          const te = {};
          R.forEach((ie) => {
            const ce = ie.key;
            cr(te, ce, Se.formatValue(Z(), ce));
          }), (le = ee()) == null || le.setStyles(te);
        }
      });
    }
  }), Y(We, {
    get when() {
      return V().length > 0;
    },
    get children() {
      return Y(wI, {
        get locale() {
          return e.locale;
        },
        get url() {
          return V();
        },
        onClose: () => {
          Q("");
        }
      });
    }
  }), Y(We, {
    get when() {
      return re().visible;
    },
    get children() {
      return Y(MI, {
        get locale() {
          return e.locale;
        },
        get params() {
          return re();
        },
        onClose: () => {
          K({
            visible: !1,
            indicatorName: "",
            paneId: "",
            calcParams: []
          });
        },
        onConfirm: (R) => {
          var le;
          const te = re();
          (le = ee()) == null || le.overrideIndicator({
            name: te.indicatorName,
            calcParams: R,
            paneId: te.paneId
          });
        }
      });
    }
  }), Y(PM, {
    get locale() {
      return e.locale;
    },
    get symbol() {
      return Dn();
    },
    get spread() {
      return I();
    },
    get period() {
      return yn();
    },
    get periods() {
      return e.periods;
    },
    onMenuClick: async () => {
      var R;
      try {
        await Tf(() => q(!I())), (R = ee()) == null || R.resize();
      } catch {
      }
    },
    onSymbolClick: () => {
      W(!H());
    },
    onPeriodChange: Lo,
    onIndicatorClick: () => {
      g((R) => !R);
    },
    onTimezoneClick: () => {
      k((R) => !R);
    },
    onSettingClick: () => {
      F((R) => !R);
    },
    onScreenshotClick: () => {
      if (ee()) {
        const R = ee().getConvertPictureUrl(!0, "jpeg", e.theme === "dark" ? "#151517" : "#ffffff");
        Q(R);
      }
    }
  }), (() => {
    var R = NI(), te = R.firstChild;
    G(R, Y(We, {
      get when() {
        return fS();
      },
      get children() {
        return Y(Os, {});
      }
    }), te), G(R, Y(We, {
      get when() {
        return I();
      },
      get children() {
        return Y(cI, {
          get locale() {
            return e.locale;
          },
          onDrawingItemClick: (ie) => {
            UI(ie);
          },
          onModeChange: (ie) => {
            var ce;
            (ce = ee()) == null || ce.overrideOverlay({
              mode: ie
            });
          },
          onLockChange: (ie) => {
            var ce;
            (ce = ee()) == null || ce.overrideOverlay({
              lock: ie
            });
          },
          onVisibleChange: (ie) => {
            var ce;
            (ce = ee()) == null || ce.overrideOverlay({
              visible: ie
            });
          },
          onRemoveClick: (ie) => {
            var ce;
            (ce = ee()) == null || ce.removeOverlay({
              groupId: ie
            });
          }
        });
      }
    }), te);
    var le = r;
    return typeof le == "function" ? zo(le, te) : r = te, ze((ie) => {
      var ce = cS(), Ye = e.overrides.backgroundType ?? "solid", be = I();
      return ce !== ie.e && pt(R, "data-orders-pane-visible", ie.e = ce), Ye !== ie.t && pt(te, "data-pane-style", ie.t = Ye), be !== ie.a && pt(te, "data-drawing-bar-visible", ie.a = be), ie;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), R;
  })()];
};
class WI {
  constructor(r) {
    ht(this, "_datafeed");
    ht(this, "_loading");
    console.info("ChartDataLoader initialized"), this._datafeed = r, this._loading = !1;
  }
  async getBars(r) {
    console.info("ChartDataLoader getBars", r);
    const { type: i, timestamp: o, symbol: s, period: c, callback: u } = r;
    if (i === "backward" || i === "update") {
      console.info("getBars: type is backward or update (no forward support yet)"), u([], !1);
      return;
    }
    this._loading = !0, R2(!0);
    const f = o ?? (/* @__PURE__ */ new Date()).getTime();
    await (async () => {
      const m = yn(), C = Dn(), [b] = this.adjustFromTo(m, f, 1), [_] = this.adjustFromTo(m, b, 500), x = await this._datafeed.getHistoryKLineData(C, m, _, b);
      u(x, x.length > 0), this._loading = !1, R2(!1);
    })();
  }
  subscribeBar(r) {
    console.info("ChartDataLoader subscribeBar", r);
    const { symbol: i, period: o, callback: s } = r;
    this._datafeed.subscribe(Dn(), yn(), s);
  }
  unsubscribeBar(r) {
    console.info("ChartDataLoader unsubscribeBar", r), this._datafeed.unsubscribe(Dn(), yn());
  }
  searchSymbols(r) {
    return this._datafeed.searchSymbols(r);
  }
  get loading() {
    return this._loading;
  }
  set loading(r) {
    this._loading = r;
  }
  adjustFromTo(r, i, o) {
    let s = i, c = s;
    switch (r.type) {
      case "minute":
        s -= s % (60 * 1e3), c = s - o * r.span * 60 * 1e3;
        break;
      case "hour":
        s -= s % (60 * 60 * 1e3), c = s - o * r.span * 60 * 60 * 1e3;
        break;
      case "day":
        s -= s % (24 * 60 * 60 * 1e3), c = s - o * r.span * 24 * 60 * 60 * 1e3;
        break;
      case "week": {
        const u = new Date(s), f = u.getDay() || 7;
        u.setHours(0, 0, 0, 0), s = u.getTime() - (f - 1) * 24 * 60 * 60 * 1e3, c = s - o * r.span * 7 * 24 * 60 * 60 * 1e3;
        break;
      }
      case "month": {
        const u = new Date(s);
        s = new Date(u.getFullYear(), u.getMonth(), 1).getTime();
        const f = new Date(s - o * r.span * 30 * 24 * 60 * 60 * 1e3);
        c = new Date(f.getFullYear(), f.getMonth(), 1).getTime();
        break;
      }
      case "year": {
        const u = new Date(s);
        s = new Date(u.getFullYear(), 0, 1).getTime();
        const f = new Date(s - o * r.span * 365 * 24 * 60 * 60 * 1e3);
        c = new Date(f.getFullYear(), 0, 1).getTime();
        break;
      }
    }
    return [c, s];
  }
}
var QI = /* @__PURE__ */ U('<svg class=logo viewBox="0 0 80 92"><path d=M28.148808359375,51.7280513671875L22.963588359375,51.7280513671875C21.572648359375002,51.7280513671875,20.445068359375,52.6220613671875,20.445068359375,53.7248813671875L20.445068359375,72.3979013671875C20.445068359375,73.5007013671875,21.572648359375002,74.39470136718751,22.963588359375,74.39470136718751L33.926568359375,74.39470136718751C35.317468359375,74.39470136718751,36.445068359375,73.5007013671875,36.445068359375,72.3979013671875L36.445068359375,53.7248813671875C36.445068359375,52.6220613671875,35.317468359375,51.7280513671875,33.926568359375,51.7280513671875L28.741398359374998,51.7280513671875L28.741398359374998,46.2963223671875C28.741398359374998,46.1665793671875,28.608748359375,46.0614013671875,28.445108359375,46.0614013671875C28.281468359375,46.0614013671875,28.148808359375,46.1665793671875,28.148808359375,46.2963223671875L28.148808359375,51.7280513671875ZM28.741398359374998,74.3948013671875L28.741398359374998,79.82650136718749C28.741398359374998,79.9563013671875,28.608748359375,80.0614013671875,28.445108359375,80.0614013671875C28.281468359375,80.0614013671875,28.148808359375,79.9563013671875,28.148808359375,79.82650136718749L28.148808359375,74.3948013671875L28.741398359374998,74.3948013671875Z></path><path d=M51.148808359374996,44.7280513671875L45.963588359375,44.7280513671875C44.572648359375,44.7280513671875,43.445068359375,45.6220613671875,43.445068359375,46.7248813671875L43.445068359375,65.3979013671875C43.445068359375,66.5007013671875,44.572648359375,67.39470136718751,45.963588359375,67.39470136718751L56.926568359375,67.39470136718751C58.317468359375,67.39470136718751,59.445068359375,66.5007013671875,59.445068359375,65.3979013671875L59.445068359375,46.7248813671875C59.445068359375,45.6220613671875,58.317468359375,44.7280513671875,56.926568359375,44.7280513671875L51.741398359375,44.7280513671875L51.741398359375,39.2963223671875C51.741398359375,39.1665793671875,51.608748359375,39.0614013671875,51.445108359375,39.0614013671875C51.281468359375,39.0614013671875,51.148808359374996,39.1665793671875,51.148808359374996,39.2963223671875L51.148808359374996,44.7280513671875ZM51.741398359375,67.3948013671875L51.741398359375,72.82650136718749C51.741398359375,72.9563013671875,51.608748359375,73.0614013671875,51.445108359375,73.0614013671875C51.281468359375,73.0614013671875,51.148808359374996,72.9563013671875,51.148808359374996,72.82650136718749L51.148808359374996,67.3948013671875L51.741398359375,67.3948013671875Z></path><path d=M17.7274,90.6541C17.5901,90.6541,17.4517,90.6436,17.3121,90.6225C9.93219,89.5095,4.80718,86.7136,2.07787,82.3084C-1.1223,77.1437,0.241766,71.6314,0.56829,70.5137C5.37624,46.647,15.0785,38.4945,21.5025,33.0957C22.9683,31.8633,24.2342,30.7995,25.1676,29.7672C25.4105,29.4984,25.6051,29.2154,25.7556,28.9202C24.7465,29.2231,24.1971,29.4326,24.1703,29.4429C22.908,29.9368,21.4777,29.3247,20.9761,28.076C20.4756,26.8272,21.0897,25.4146,22.352,24.9172C22.5042,24.8571,23.5312,24.4607,25.3073,23.9616C24.087,21.4425,21.7693,18.7949,19.7125,16.6431L19.2819,16.1902C16.2438,12.9776,14.6017,4.80159,14.3036,3.19471C14.1306,2.26212,14.4636,1.30796,15.1814,0.679657C15.8995,0.0512175,16.8976,-0.159672,17.8125,0.123747C22.7731,1.66274,24.2638,1.81255,27.2321,2.11098C28.7357,2.26195,29.83,3.59029,29.6762,5.07662C29.5236,6.56295,28.182,7.64786,26.6784,7.49454C24.4992,7.27569,22.9517,7.09896,20.724,6.56646C21.4493,9.09088,22.3803,11.5427,23.2771,12.4919L23.6876,12.9237C25.3757,14.69,28.9691,18.45,30.7016,22.7299C35.0392,21.9433,40.8791,21.3359,47.7817,21.7249C48.2004,20.7386,48.8054,19.7953,49.5907,18.9135C49.7137,18.7754,49.8498,18.6502,49.9988,18.539C53.6142,15.8508,57.5491,12.857,59.7803,11.0758C58.1028,11.2502,56.1034,11.0278,53.9124,9.70882C53.2439,9.30622,52.5992,8.89427,51.9662,8.48933C48.4668,6.25164,46.497,5.12109,43.4234,5.94853C41.9647,6.34058,40.4622,5.48975,40.0659,4.04789C39.6695,2.60604,40.5296,1.11853,41.9871,0.726471C47.5602,-0.773825,51.4796,1.73271,54.9364,3.9434L54.9364,3.9434C55.5284,4.32176,56.1318,4.70797,56.7564,5.08482C58.3843,6.06556,59.4858,5.76127,61.2899,5.13865C62.3511,4.77234,63.5567,4.35687,64.8675,4.53476C66.3321,4.73254,67.4406,5.56933,67.9103,6.83096C68.7444,9.07333,67.1035,11.5533,65.5797,13.2374C64.6729,14.2394,60.0845,17.7606,56.4519,20.4957C56.9477,20.3369,57.4767,20.2511,58.026,20.2511C59.4281,20.2511,60.6982,20.8102,61.621,21.7153C65.4948,20.6901,67.87,17.9563,67.9033,17.9175C68.78,16.8888,70.3322,16.7577,71.3721,17.6226C72.412,18.4886,72.5457,20.0253,71.6702,21.054C71.5221,21.2286,69.5063,23.5492,66.0787,25.233C69.5399,26.8822,72.9993,29.682,74.1841,34.4145C74.5106,35.7206,73.7062,37.0407,72.3859,37.3638C72.1871,37.4117,71.9884,37.4351,71.792,37.4351C70.687,37.4351,69.6826,36.6932,69.4046,35.5848C68.4378,31.7217,64.8144,29.7431,61.7619,28.7456C60.8298,29.7349,59.5009,30.3535,58.026,30.3535C55.8642,30.3535,54.0162,29.0245,53.2713,27.1474C53.2022,27.138,53.1331,27.1287,53.0642,27.1195C54.232,29.5936,57.0851,31.9259,58.1868,32.665C58.3157,32.7516,58.4423,32.8523,58.5547,32.9599C66.5865,40.6151,72.4887,48.8133,76.0971,57.3287C76.6815,58.7074,76.0249,60.2932,74.6313,60.8702C74.2976,61.01,73.9388,61.082,73.576,61.082C72.5065,61.082,71.4914,60.4582,71.0525,59.4213C67.7577,51.6455,62.331,44.1074,54.9203,37.0116C53.6073,36.1009,48.0984,31.9917,47.2065,26.583C40.9421,26.2679,35.6187,26.8278,31.6725,27.5336C31.6197,29.527,30.9225,31.5172,29.2456,33.3731C28.0614,34.6827,26.5968,35.915,25.0446,37.2188C21.9414,39.8269,18.2648,42.9169,14.8104,48.1192C11.356,53.3215,8.12389,60.6361,5.9098,71.6934C5.88732,71.8035,5.85893,71.9123,5.82344,72.0188C5.81634,72.041,4.57886,76.0413,6.77344,79.5289C8.6332,82.4828,12.4557,84.4139,18.1367,85.2705C19.6297,85.4953,20.6566,86.8762,20.4295,88.3532C20.2213,89.6944,19.0559,90.6541,17.7274,90.6541ZM35.1195,7.03101C33.3502,7.03101,31.9158,5.61208,31.9158,3.86173C31.9158,2.11139,33.3502,0.69245,35.1195,0.69245C36.8889,0.69245,38.3233,2.11139,38.3233,3.86173C38.3233,5.61208,36.8889,7.03101,35.1195,7.03101ZM57.6848,23.1892L58.414,24.4754C58.8984,24.3623,59.3923,24.3435,59.8644,24.4203C60.2191,24.5005,60.5087,24.7182,60.6663,25.0229C60.8636,25.3394,60.8993,25.7346,60.7646,26.1094C60.5988,26.5176,60.2972,26.8749,59.9085,27.1235L60.31,27.8316L59.7886,28.1294L59.3994,27.443C58.9257,27.7175,58.399,27.883,57.8664,27.9247L57.3744,27.0569C57.6378,27.0741,57.9071,27.048,58.1704,26.9797C58.4501,26.9251,58.7239,26.8323,58.9829,26.7044L58.2801,25.4647C57.8047,25.5877,57.3167,25.6065,56.8549,25.5197C56.4913,25.4263,56.196,25.1971,56.0328,24.8814C55.8433,24.5561,55.8127,24.1572,55.9484,23.7789C56.088,23.373,56.3763,23.0149,56.7584,22.7726L56.4166,22.1699L56.938,21.8721L57.2727,22.4625C57.6615,22.2376,58.0888,22.0901,58.5254,22.0301L59.0042,22.8746C58.5548,22.8828,58.103,22.9906,57.6848,23.1892ZM56.9319,24.2961Q57.1278,24.6417,57.7863,24.5856L57.1695,23.4978Q56.6982,23.884,56.9319,24.2961ZM58.9077,25.3462L59.4981,26.3875L59.499,26.3891Q59.9965,26.0045,59.7628,25.5923Q59.573,25.2576,58.9077,25.3462ZM73.2212,66.5065C73.2212,68.2569,74.6555,69.6758,76.4249,69.6758C78.1943,69.6758,79.6286,68.2569,79.6286,66.5065C79.6286,64.7562,78.1943,63.3372,76.4249,63.3372C74.6555,63.3372,73.2212,64.7562,73.2212,66.5065ZM35.9465,91.8045C35.0734,91.8045,34.2038,91.7987,33.3378,91.7858C31.827,91.7636,30.6203,90.5359,30.6428,89.0402C30.6653,87.5457,31.9158,86.3297,33.4183,86.3742C49.6344,86.6059,65.7512,84.6175,67.6134,84.037C72.1953,82.4184,74.5295,79.3603,74.5295,74.9575C74.5295,73.463,75.754,72.2517,77.2648,72.2517C78.7755,72.2517,80,73.463,80,74.9575C80,81.5992,76.148,86.7686,69.4317,89.142C67.0041,89.9999,51.0955,91.8046,35.9465,91.8045ZM25.2731,92C23.5037,92,22.0693,90.5811,22.0693,88.8307C22.0693,87.0804,23.5037,85.6615,25.2731,85.6615C27.0424,85.6615,28.4768,87.0804,28.4768,88.8307C28.4768,90.5811,27.0424,92,25.2731,92Z>');
const HI = QI();
class uO {
  constructor(r) {
    ht(this, "_container");
    ht(this, "_chartApi", null);
    if (Se.isString(r.container)) {
      if (this._container = document.getElementById(r.container), !this._container)
        throw new Error("Container is null");
    } else
      this._container = r.container;
    this._container.classList.add("klinecharts-pro"), this._container.setAttribute("data-theme", r.theme ?? "light");
    const i = new WI(r.datafeed);
    Jf(() => {
      const o = this;
      return Y(ZI, {
        ref: (s) => {
          o._chartApi = s;
        },
        get watermark() {
          return r.watermark ?? HI;
        },
        get theme() {
          return r.theme ?? "light";
        },
        get locale() {
          return r.locale ?? "zh-CN";
        },
        get drawingBarVisible() {
          return r.drawingBarVisible ?? !0;
        },
        get orderPanelVisible() {
          return r.orderPanelVisible ?? !1;
        },
        get symbol() {
          return r.symbol;
        },
        get period() {
          return r.period;
        },
        get periods() {
          return r.periods ?? [{
            span: 1,
            type: "minute",
            text: "1m"
          }, {
            span: 5,
            type: "minute",
            text: "5m"
          }, {
            span: 15,
            type: "minute",
            text: "15m"
          }, {
            span: 1,
            type: "hour",
            text: "1H"
          }, {
            span: 2,
            type: "hour",
            text: "2H"
          }, {
            span: 4,
            type: "hour",
            text: "4H"
          }, {
            span: 1,
            type: "day",
            text: "D"
          }, {
            span: 1,
            type: "week",
            text: "W"
          }, {
            span: 1,
            type: "month",
            text: "M"
          }, {
            span: 1,
            type: "year",
            text: "Y"
          }];
        },
        get overrides() {
          return r.overrides ?? {};
        },
        get timezone() {
          return r.timezone ?? "Etc/UTC";
        },
        get mainIndicators() {
          return r.mainIndicators ?? ["MA"];
        },
        get subIndicators() {
          return r.subIndicators ?? ["VOL"];
        },
        get dataTimestamp() {
          return r.dataTimestamp ?? (/* @__PURE__ */ new Date()).getTime();
        },
        get rootElementId() {
          var s;
          return r.rootElementId ?? ((s = o._container) == null ? void 0 : s.id) ?? "";
        },
        dataloader: i
      });
    }, this._container);
  }
  destroy() {
    this._container && q2(this._container), this._container = null, this._chartApi = null;
  }
  setTheme(r) {
    var i;
    (i = this._container) == null || i.setAttribute("data-theme", r), this._chartApi.setTheme(r);
  }
  getTheme() {
    return this._chartApi.getTheme();
  }
  setStyles(r) {
    this._chartApi.setStyles(r);
  }
  getStyles() {
    return this._chartApi.getStyles();
  }
  setLocale(r) {
    this._chartApi.setLocale(r);
  }
  getLocale() {
    return this._chartApi.getLocale();
  }
  setTimezone(r) {
    this._chartApi.setTimezone(r);
  }
  getTimezone() {
    return this._chartApi.getTimezone();
  }
  setSymbol(r) {
    this._chartApi.setSymbol(r);
  }
  getSymbol() {
    return this._chartApi.getSymbol();
  }
  setPeriod(r) {
    this._chartApi.setPeriod(r);
  }
  getPeriod() {
    return this._chartApi.getPeriod();
  }
  getInstanceApi() {
    return ee();
  }
  resize() {
    ee().resize();
  }
  dispose() {
    this.destroy();
  }
}
qf.forEach((e) => {
  rf(e);
});
export {
  tO as DefaultDatafeed,
  nO as DefaultOrderController,
  rO as DummyOrderController,
  uO as KLineChartPro,
  lO as loadLocales
};
//# sourceMappingURL=klinecharts-pro.js.map
