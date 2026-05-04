import { useState, useEffect, useRef } from "react";

const GAMES = [
  { id: "liuyao", name: "六爻占卜", desc: "摇卦问天·解读吉凶", gua: "☰", color: "#d4a03e" },
  { id: "qimen", name: "奇门遁甲", desc: "九宫八卦·运筹帷幄", gua: "☲", color: "#c41e3a" },
  { id: "bazi", name: "八字推命", desc: "生辰命理·知命改运", gua: "☵", color: "#2d7d9a" },
  { id: "palmistry", name: "手相分析", desc: "掌纹观相·解密天机", gua: "☳", color: "#7b5ea7" },
  { id: "zhougong", name: "周公解梦", desc: "梦境预兆·窥探潜意识", gua: "☴", color: "#2d8b5a" },
  { id: "lifekline", name: "人生K线", desc: "百岁流年·预判起伏", gua: "☱", color: "#b87333" },
];

const MASTERS = [
  { id: "zhouwenwang", name: "周文王", dynasty: "西周", desc: "周朝奠基人，精通易经，开创八卦理论，被誉为易学之祖", seal: "文" },
  { id: "zhugeliang", name: "诸葛亮", dynasty: "三国", desc: "三国时期蜀汉丞相，智谋过人，精通奇门遁甲之术", seal: "亮" },
  { id: "guiguzi", name: "鬼谷子", dynasty: "战国", desc: "战国时期纵横家鼻祖，精通天文、兵学，善于观人识心", seal: "鬼" },
  { id: "yuanshoucheng", name: "袁守诚", dynasty: "唐朝", desc: "唐代著名术士，精通算命卜卦，能知过去未来", seal: "袁" },
  { id: "libowen", name: "李博文", dynasty: "明朝", desc: "通晓天文地理数术，辅佐明太祖开国", seal: "李" },
  { id: "chentunan", name: "陈图南", dynasty: "宋朝", desc: "道学宗师，精于相术命理，著有心相篇", seal: "陈" },
  { id: "dazhangwei", name: "大张伟", dynasty: "当代", desc: "以娱乐精神解读命理，诙谐幽默", seal: "张" },
  { id: "leijiaoyin", name: "雷佳音", dynasty: "当代", desc: "亲和力满满的解读风格，细致入微", seal: "雷" },
  { id: "zhaosi", name: "刘小光", dynasty: "当代", desc: "幽默风趣的命理大师，妙语连珠", seal: "刘" },
];

const WX = { "木": "#2d8b5a", "火": "#c41e3a", "土": "#b87333", "金": "#d4a03e", "水": "#2d7d9a" };
const CASES = [
  { id: "c1", title: "张三命例", gender: "男", mode: "阳历输入", birth: "1990-05-15 14:00", question: "事业发展方向" },
  { id: "c2", title: "李四命例", gender: "女", mode: "农历输入", birth: "农历1988年三月廿一", question: "" },
];

const Seal = ({ c, on, s = 36 }) => (
  <div style={{ width: s, height: s, borderRadius: 4, border: `2px solid ${on ? "#c41e3a" : "rgba(196,30,58,0.25)"}`, background: on ? "rgba(196,30,58,0.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Serif SC', serif", fontSize: s * 0.5, fontWeight: 500, color: on ? "#c41e3a" : "rgba(196,30,58,0.45)", transition: "all 0.3s", transform: on ? "rotate(-3deg)" : "none", margin: "0 auto" }}>{c}</div>
);
const Div = ({ l }) => (<div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", opacity: 0.3 }}><div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg, transparent, #d4a03e, transparent)" }} />{l && <span style={{ fontSize: 10, color: "#d4a03e", letterSpacing: 4 }}>{l}</span>}<div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg, transparent, #d4a03e, transparent)" }} /></div>);
const C = ({ children, hl, s = {} }) => (<div style={{ background: "#12120f", border: hl ? "1px solid rgba(196,30,58,0.35)" : "0.5px solid rgba(212,160,62,0.12)", borderRadius: 16, padding: 16, ...s }}>{children}</div>);
const WC = ({ children, s = {} }) => (<div style={{ background: "#fffaf2", border: "1px solid #eadbc4", borderRadius: 20, padding: 16, color: "#5f4a33", ...s }}>{children}</div>);
const SL = ({ en, zh }) => (<div><div style={{ fontSize: 10, letterSpacing: 3, color: "#6b6050", textTransform: "uppercase" }}>{en}</div><div style={{ fontSize: 17, fontWeight: 500, color: "#f5f0e3", fontFamily: "'Noto Serif SC', serif", marginTop: 4 }}>{zh}</div></div>);
const WL = ({ en, zh }) => (<div><div style={{ fontSize: 10, letterSpacing: 3, color: "#9f8c72", textTransform: "uppercase" }}>{en}</div><div style={{ fontSize: 17, fontWeight: 500, color: "#4f3924", fontFamily: "'Noto Serif SC', serif", marginTop: 4 }}>{zh}</div></div>);
const Pill = ({ opts, val, fn, clr = "#d4a03e" }) => (<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{opts.map(o => (<button key={o.v} onClick={() => fn(o.v)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", background: val === o.v ? `${clr}22` : "transparent", border: `0.5px solid ${val === o.v ? `${clr}55` : "rgba(212,160,62,0.15)"}`, color: val === o.v ? clr : "#6b6050", fontFamily: "'Noto Serif SC', serif" }}>{o.l}</button>))}</div>);
const FSR = ({ label, items, sel, onSel, ph }) => (<WC s={{ marginBottom: 10 }}><div style={{ fontSize: 11, letterSpacing: 2, color: "#a08b70", marginBottom: 8 }}>{label}</div>{items.length > 0 ? (<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{items.map(i => (<button key={i.k} onClick={() => onSel(i.k)} style={{ padding: "6px 12px", borderRadius: 14, fontSize: 11, cursor: "pointer", background: sel === i.k ? "#efe4d3" : "white", border: sel === i.k ? "1px solid #c9a96e" : "1px solid #eadfcf", color: sel === i.k ? "#4f3924" : "#7b6753" }}><div style={{ fontWeight: 500 }}>{i.l}</div>{i.m && <div style={{ fontSize: 10, color: "#a18f79", marginTop: 2 }}>{i.m}</div>}</button>))}</div>) : (<div style={{ fontSize: 12, color: "#a18f79", padding: "8px 0" }}>{ph}</div>)}</WC>);

const TABS = [{ id: "home", l: "首页", i: "⌂" }, { id: "divine", l: "占卜", i: "卦" }, { id: "master", l: "大师", i: "师" }, { id: "history", l: "历史", i: "册" }, { id: "settings", l: "设置", i: "齿" }];

export default function App() {
  const [tab, setTab] = useState("home");
  const [master, setMaster] = useState(MASTERS[0]);
  const [game, setGame] = useState(null);
  const [q, setQ] = useState("");
  const [dvn, setDvn] = useState(false);
  const [res, setRes] = useState(false);
  const [bn, setBn] = useState(""); const [bq, setBq] = useState(""); const [bg, setBg] = useState("男"); const [bm, setBm] = useState("solar");
  const [bgen, setBgen] = useState(false); const [bt, setBt] = useState("basic"); const [acid, setAcid] = useState(null);
  const [sf, setSf] = useState(null); const [sy, setSy] = useState(null); const [sm, setSm] = useState(null);
  const [ci, setCi] = useState(""); const [cms, setCms] = useState([]); const [stm, setStm] = useState(false);
  const [st, setSt] = useState("api");

  const go = g => { setGame(g); setRes(false); setQ(""); setTab("divine"); };
  const divine = () => { if (game?.id === "bazi" ? !bn.trim() : !q.trim()) return; setDvn(true); setTimeout(() => { setDvn(false); setRes(true); if (game?.id === "bazi") setBgen(true); }, 2000); };
  const chat = () => { if (!ci.trim()) return; setCms(p => [...p, { r: "user", c: ci, t: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) }]); setCi(""); setStm(true); setTimeout(() => { setCms(p => [...p, { r: "ai", c: "根据命盘分析，日主为壬水，生于申月，金水相生，命局偏旺。八字中官杀混杂，需要注意事业发展中的人际关系处理。建议近三年重点关注印星方位，有利于学业和技术突破...", t: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) }]); setStm(false); }, 1500); };

  const inp = (v, ph, extra = {}) => ({ type: "text", value: v, placeholder: ph, style: { width: "100%", padding: "12px 14px", background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.15)", borderRadius: 12, color: "#f5f0e3", fontSize: 14, outline: "none", boxSizing: "border-box", ...extra }, disabled: dvn });
  const btn = (label, onClick, primary = true, disabled = false) => (<button onClick={onClick} disabled={disabled} style={{ padding: primary ? "13px" : "8px 16px", borderRadius: primary ? 14 : 20, border: primary ? "none" : "0.5px solid rgba(212,160,62,0.15)", width: primary ? "100%" : "auto", marginTop: primary ? 14 : 0, background: disabled ? "rgba(212,160,62,0.12)" : primary ? "linear-gradient(135deg, #d4a03e, #b8882a)" : "transparent", color: disabled ? "#5a5040" : primary ? "#0a0a0f" : "#d4a03e", fontSize: primary ? 14 : 12, fontWeight: 500, cursor: disabled ? "default" : "pointer", fontFamily: "'Noto Serif SC', serif", letterSpacing: primary ? 2 : 0 }}>{label}</button>);

  // HOME
  const rHome = () => (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ overflow: "hidden", background: "rgba(212,160,62,0.06)", borderBottom: "0.5px solid rgba(212,160,62,0.1)", padding: "8px 0", marginBottom: 6 }}>
        <div style={{ whiteSpace: "nowrap", fontSize: 11, color: "#8a7d6b", animation: "marquee 20s linear infinite" }}>欢迎使用周文王AI占卜 · 全新移动端体验已上线 · 支持六爻、八字、奇门遁甲等多种占卜方式</div>
      </div>
      <div style={{ textAlign: "center", padding: "20px 0 14px" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#6b6050", fontFamily: "'Noto Serif SC', serif", marginBottom: 8 }}>传承千年 · 古典智慧</div>
        <h1 style={{ fontSize: 26, fontWeight: 500, margin: "0 0 6px", fontFamily: "'Noto Serif SC', serif", background: "linear-gradient(135deg, #f5f0e3 0%, #d4a03e 60%, #c41e3a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>周文王在线算命</h1>
        <p style={{ fontSize: 13, color: "#7a7060", lineHeight: 1.7, maxWidth: 260, margin: "0 auto" }}>融合古典易学与现代AI技术<br/>为您提供精准的占卜分析与人生指导</p>
      </div>
      <button onClick={() => go(GAMES[0])} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", maxWidth: 260, margin: "0 auto 16px", padding: "13px 24px", border: "none", borderRadius: 14, background: "linear-gradient(135deg, #c41e3a, #a01830)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Serif SC', serif", letterSpacing: 2, boxShadow: "0 8px 24px rgba(196,30,58,0.3)" }}>
        <span style={{ fontSize: 18 }}>☯</span> 算一卦 <span style={{ fontSize: 18 }}>☯</span>
      </button>
      <Div l="❖" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}><SL en="Ancient Wisdom" zh="古老智慧" /><span style={{ fontSize: 11, color: "#5a5040" }}>择法而行</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 4 }}>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => go(g)} style={{ background: "#12120f", border: "0.5px solid rgba(212,160,62,0.12)", borderRadius: 16, padding: "14px 12px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 6, right: 8, fontSize: 26, opacity: 0.06, color: g.color }}>{g.gua}</div>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${g.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 8, color: g.color }}>{g.gua}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginBottom: 3, fontFamily: "'Noto Serif SC', serif" }}>{g.name}</div>
            <div style={{ fontSize: 11, color: "#6b6050", lineHeight: 1.4 }}>{g.desc}</div>
          </button>
        ))}
      </div>
      <Div l="❖" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}><SL en="Master Team" zh="大师团队" /><button onClick={() => setTab("master")} style={{ fontSize: 11, color: "#d4a03e", background: "none", border: "none", cursor: "pointer", padding: 0 }}>全部 →</button></div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, margin: "0 -16px", padding: "0 16px 4px", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
        {MASTERS.slice(0, 6).map(m => (
          <button key={m.id} onClick={() => setMaster(m)} style={{ flexShrink: 0, width: 92, background: master.id === m.id ? "rgba(196,30,58,0.08)" : "#12120f", border: master.id === m.id ? "1px solid rgba(196,30,58,0.35)" : "0.5px solid rgba(212,160,62,0.1)", borderRadius: 14, padding: "10px 6px", cursor: "pointer", textAlign: "center", scrollSnapAlign: "start" }}>
            <Seal c={m.seal} on={master.id === m.id} s={30} />
            <div style={{ fontSize: 12, fontWeight: 500, color: "#f5f0e3", marginTop: 5, fontFamily: "'Noto Serif SC', serif" }}>{m.name}</div>
            <div style={{ fontSize: 10, color: "#5a5040", marginTop: 1 }}>{m.dynasty}</div>
          </button>
        ))}
      </div>
      {master && <C s={{ marginTop: 8 }} hl><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Seal c={master.seal} on s={24} /><span style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e3" }}>{master.name}</span><span style={{ fontSize: 10, color: "#5a5040" }}>{master.dynasty}</span></div><p style={{ fontSize: 12, color: "#8a7d6b", lineHeight: 1.7, margin: 0 }}>{master.desc}</p></C>}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20, paddingTop: 14, borderTop: "0.5px solid rgba(212,160,62,0.08)" }}>
        {[{ i: "🛡", l: "隐私保护" }, { i: "🧠", l: "AI分析" }, { i: "📜", l: "易学智慧" }].map(f => (<div key={f.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#5a5040" }}><span style={{ fontSize: 12 }}>{f.i}</span>{f.l}</div>))}
      </div>
    </div>
  );

  // DIVINE - General + Bazi
  const rDiv = () => {
    const g = game || GAMES[0];
    if (g.id === "bazi") return rBazi();
    const qqs = g.id === "liuyao" ? ["今年财运如何？", "事业能否顺利？", "感情会有变化吗？"] : ["帮我分析一下", "近期运势如何？", "有何注意事项？"];
    return (
      <div style={{ padding: "0 16px 100px" }}>
        <div style={{ textAlign: "center", padding: "20px 0 14px", position: "relative" }}><div style={{ fontSize: 28, opacity: 0.05, position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", color: g.color }}>{g.gua}</div><h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", fontFamily: "'Noto Serif SC', serif", color: "#f5f0e3" }}>{g.name}</h1><p style={{ fontSize: 12, color: "#6b6050", margin: 0 }}>{g.desc}</p></div>
        <C s={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6b6050", letterSpacing: 2, marginBottom: 8 }}>诚心问卦</div>
          <input {...inp(q, "您想算点什么？")} onChange={e => setQ(e.target.value)} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#d4a03e" }}>⏰</span><span style={{ fontSize: 12, color: "#8a7d6b" }}>起卦时间：</span>
            <Pill opts={[{ v: "now", l: "当前时间" }, { v: "custom", l: "自选时间" }]} val="now" fn={() => {}} />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
            {qqs.map(qq => (<button key={qq} onClick={() => setQ(qq)} style={{ flexShrink: 0, padding: "7px 14px", background: "rgba(212,160,62,0.06)", border: "0.5px solid rgba(212,160,62,0.12)", borderRadius: 20, color: "#9a8e7a", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>{qq}</button>))}
          </div>
          {btn(dvn ? "天机显现中..." : g.id === "liuyao" ? "开始摇卦" : "开始占卜", divine, true, dvn || !q.trim())}
        </C>
        {dvn && <div style={{ textAlign: "center", padding: "28px 0" }}><div style={{ fontSize: 38, animation: "spin 2.5s linear infinite", marginBottom: 10 }}>☯</div><p style={{ fontSize: 13, color: "#8a7d6b", fontFamily: "'Noto Serif SC', serif" }}>古法摇卦，天机显现...</p></div>}
        {res && !dvn && g.id === "liuyao" && (
          <C>
            <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "0.5px solid rgba(212,160,62,0.1)", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5a5040", marginBottom: 4 }}>本卦</div>
              <div style={{ fontSize: 34, color: "#d4a03e", fontFamily: "serif", marginBottom: 4 }}>☰</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#f5f0e3", fontFamily: "'Noto Serif SC', serif" }}>乾为天</div>
              <div style={{ fontSize: 11, color: "#6b6050", marginTop: 4 }}>起卦：2026年5月3日 14时 · 世爻：5爻 · 应爻：2爻</div>
            </div>
            <div style={{ padding: "0 4px", marginBottom: 12 }}>
              {[{ p: "上九", t: "yang", mv: false }, { p: "九五", t: "yang", mv: true }, { p: "九四", t: "yang", mv: false }, { p: "九三", t: "yang", mv: false }, { p: "六二", t: "yin", mv: true }, { p: "初九", t: "yang", mv: false }].map((y, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
                  <span style={{ width: 34, fontSize: 12, fontWeight: 500, color: "#d4a03e", fontFamily: "'Noto Serif SC', serif", textAlign: "right", flexShrink: 0 }}>{y.p}</span>
                  <div style={{ flex: 1 }}>{y.t === "yang" ? <div style={{ height: 14, borderRadius: 3, background: y.mv ? "#fbbf24" : "#d4a03e", boxShadow: y.mv ? "0 2px 6px rgba(251,191,36,0.3)" : "none" }} /> : <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ height: 14, borderRadius: 3, width: "42%", background: y.mv ? "#9ca3af" : "#6b7280" }} /><div style={{ height: 14, borderRadius: 3, width: "42%", background: y.mv ? "#9ca3af" : "#6b7280" }} /></div>}</div>
                  <span style={{ width: 18, textAlign: "center", fontSize: 14, color: y.mv ? (y.t === "yang" ? "#fbbf24" : "#e5e7eb") : "transparent" }}>{y.t === "yang" ? "○" : "×"}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Seal c={master.seal} on s={22} /><span style={{ fontSize: 12, fontWeight: 500, color: "#d4a03e" }}>{master.name}</span><span style={{ fontSize: 11, color: "#5a5040" }}>为您解卦</span></div>
            <div style={{ fontSize: 13, color: "#c9bfaa", lineHeight: 1.8 }}>
              <p style={{ margin: "0 0 8px" }}><span style={{ color: "#d4a03e" }}>【卦辞】</span>元亨利贞。天行健，君子以自强不息。</p>
              <p style={{ margin: "0 0 8px" }}><span style={{ color: "#c41e3a" }}>【解析】</span>问卦之人近期运势正盛，宜把握机遇大展宏图。</p>
              <p style={{ margin: 0 }}><span style={{ color: "#2d8b5a" }}>【建议】</span>宜于近期推动重要事项，注意保持谦逊之心。</p>
            </div>
          </C>
        )}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#5a5040", marginBottom: 6, letterSpacing: 2 }}>切换占卜</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {GAMES.map(gg => (<button key={gg.id} onClick={() => go(gg)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontSize: 12, background: game?.id === gg.id ? "rgba(212,160,62,0.12)" : "transparent", border: game?.id === gg.id ? "0.5px solid rgba(212,160,62,0.25)" : "0.5px solid rgba(212,160,62,0.08)", color: game?.id === gg.id ? "#d4a03e" : "#5a5040", cursor: "pointer", whiteSpace: "nowrap" }}>{gg.name}</button>))}
          </div>
        </div>
      </div>
    );
  };

  // BAZI
  const rBazi = () => (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "20px 0 14px" }}><h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", fontFamily: "'Noto Serif SC', serif", color: "#f5f0e3" }}>八字推命</h1><p style={{ fontSize: 12, color: "#6b6050" }}>承古圣贤智慧，析命理玄机</p></div>
      {/* Case Manager */}
      <C s={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#6b6050", textTransform: "uppercase" }}>Case Manager</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#f5f0e3", fontFamily: "'Noto Serif SC', serif", marginTop: 4, marginBottom: 4 }}>八字命例管理</div>
        <p style={{ fontSize: 11, color: "#6b6050", lineHeight: 1.6, marginBottom: 8 }}>保存常用命例，支持按阳历、农历或四柱录入后随时载入。</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <button style={{ padding: "8px 16px", borderRadius: 20, background: "#f4f1e8", border: "none", color: "#0a0a0f", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{acid ? "更新命例" : "保存为命例"}</button>
          {acid && <button style={{ padding: "8px 14px", borderRadius: 20, background: "rgba(212,160,62,0.08)", border: "0.5px solid rgba(212,160,62,0.15)", color: "#d4a03e", fontSize: 12, cursor: "pointer" }}>另存为新</button>}
          <button style={{ padding: "8px 14px", borderRadius: 20, background: "transparent", border: "0.5px solid rgba(212,160,62,0.12)", color: "#8a7d6b", fontSize: 12, cursor: "pointer" }}>新建命例</button>
        </div>
        {CASES.map(c => (
          <div key={c.id} style={{ background: acid === c.id ? "rgba(184,137,68,0.08)" : "#0d0d0a", border: acid === c.id ? "1px solid rgba(184,137,68,0.25)" : "0.5px solid rgba(212,160,62,0.06)", borderRadius: 14, padding: 10, marginBottom: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e3" }}>{c.title}</span>{acid === c.id && <span style={{ fontSize: 9, color: "#d4a03e", background: "rgba(212,160,62,0.12)", padding: "2px 8px", borderRadius: 10 }}>当前</span>}</div>
            <div style={{ fontSize: 11, color: "#6b6050", marginTop: 3 }}>{c.gender} · {c.mode} · {c.birth}</div>
            <div style={{ fontSize: 11, color: "#8a7d6b", marginTop: 3 }}>{c.question || "默认命盘总览"}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <button onClick={() => setAcid(c.id)} style={{ padding: "4px 12px", borderRadius: 12, background: "#1a1a17", border: "none", color: "#f5f0e3", fontSize: 11, cursor: "pointer" }}>载入</button>
              <button style={{ padding: "4px 12px", borderRadius: 12, background: "rgba(196,30,58,0.06)", border: "0.5px solid rgba(196,30,58,0.12)", color: "#e2a5a5", fontSize: 11, cursor: "pointer" }}>删除</button>
            </div>
          </div>
        ))}
      </C>
      {/* Form */}
      <C s={{ marginBottom: 10 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div><div style={{ fontSize: 11, color: "#8a7d6b", letterSpacing: 2, marginBottom: 4 }}>* 姓名</div><input {...inp(bn, "请输入命主姓名")} onChange={e => setBn(e.target.value)} /></div>
          <div><div style={{ fontSize: 11, color: "#8a7d6b", letterSpacing: 2, marginBottom: 4 }}>问事</div><input {...inp(bq, "有具体想问的事情吗？")} onChange={e => setBq(e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, color: "#8a7d6b", letterSpacing: 2, marginBottom: 4 }}>性别</div><Pill opts={[{ v: "男", l: "男" }, { v: "女", l: "女" }]} val={bg} fn={setBg} /></div>
        <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, color: "#8a7d6b", letterSpacing: 2, marginBottom: 4 }}>录入方式</div><Pill opts={[{ v: "solar", l: "阳历输入" }, { v: "lunar", l: "农历输入" }, { v: "pillars", l: "四柱反查" }]} val={bm} fn={setBm} /></div>
        {bm === "solar" && <div style={{ marginTop: 10, background: "#0d0d0a", borderRadius: 14, padding: 12, border: "0.5px solid rgba(212,160,62,0.06)" }}><div style={{ fontSize: 10, letterSpacing: 2, color: "#6b6050" }}>SOLAR BIRTH</div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginTop: 3, marginBottom: 8 }}>阳历出生时间</div><input type="datetime-local" style={{ width: "100%", padding: "10px 12px", background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.12)", borderRadius: 10, color: "#f5f0e3", fontSize: 13, outline: "none", boxSizing: "border-box", colorScheme: "dark" }} /></div>}
        {bm === "lunar" && <div style={{ marginTop: 10, background: "#0d0d0a", borderRadius: 14, padding: 12, border: "0.5px solid rgba(212,160,62,0.06)" }}><div style={{ fontSize: 10, letterSpacing: 2, color: "#6b6050" }}>LUNAR BIRTH</div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginTop: 3, marginBottom: 8 }}>农历出生时间</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>{["年", "月", "日", "时", "分"].map(l => (<div key={l}><div style={{ fontSize: 10, color: "#6b6050", marginBottom: 3 }}>{l}</div><input type="number" placeholder={l === "年" ? "1990" : l === "月" ? "1-12" : "0"} style={{ width: "100%", padding: "8px 10px", background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.1)", borderRadius: 8, color: "#f5f0e3", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>))}</div></div>}
        {bm === "pillars" && <div style={{ marginTop: 10, background: "#0d0d0a", borderRadius: 14, padding: 12, border: "0.5px solid rgba(212,160,62,0.06)" }}><div style={{ fontSize: 10, letterSpacing: 2, color: "#6b6050" }}>FOUR PILLARS LOOKUP</div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginTop: 3, marginBottom: 8 }}>四柱反查</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>{[{ l: "年柱", p: "庚午" }, { l: "月柱", p: "甲申" }, { l: "日柱", p: "壬子" }, { l: "时柱", p: "丁未" }].map(x => (<div key={x.l}><div style={{ fontSize: 10, color: "#6b6050", marginBottom: 3 }}>{x.l}</div><input type="text" placeholder={`例如 ${x.p}`} style={{ width: "100%", padding: "8px 10px", background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.1)", borderRadius: 8, color: "#f5f0e3", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>))}</div><button style={{ marginTop: 8, padding: "8px 14px", borderRadius: 16, background: "#f4f1e8", border: "none", color: "#0a0a0f", fontSize: 12, cursor: "pointer" }}>反查候选</button></div>}
        <div style={{ marginTop: 10, background: "#0d0d0a", borderRadius: 14, padding: 12, border: "0.5px solid rgba(212,160,62,0.06)" }}><div style={{ fontSize: 10, letterSpacing: 2, color: "#6b6050" }}>INPUT PREVIEW</div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginTop: 3, marginBottom: 6 }}>录入预览</div><div style={{ fontSize: 12, color: "#5a5040", background: "#0a0a0f", borderRadius: 10, padding: 10, border: "0.5px dashed rgba(212,160,62,0.08)" }}>录入完整后即时预览阳历、农历和四柱。</div></div>
        {btn(dvn ? "正在起盘..." : "开始八字推命", divine, true, dvn || !bn.trim())}
      </C>
      {dvn && <div style={{ textAlign: "center", padding: "28px 0" }}><div style={{ fontSize: 38, animation: "spin 2.5s linear infinite", marginBottom: 10 }}>☯</div><p style={{ fontSize: 13, color: "#8a7d6b" }}>八字推演，命理推测...</p></div>}
      {/* Dashboard */}
      {bgen && !dvn && (<div>
        <C s={{ marginBottom: 8, background: "radial-gradient(circle at top left, rgba(245,236,215,0.12), rgba(18,18,15,0.96) 40%)" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6b6050" }}>CANTIAN DASHBOARD</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: "#f5f0e3", fontFamily: "'Noto Serif SC', serif", marginTop: 4 }}>{bn} 的八字仪表盘</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>{["壬子 甲申 庚午 丁未", "庚金日主", "属马", "6岁起运"].map(t => (<span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, border: "0.5px solid rgba(212,160,62,0.12)", background: "rgba(212,160,62,0.05)", color: "#c9bfaa" }}>{t}</span>))}</div>
        </C>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", marginBottom: 10, paddingBottom: 2, scrollbarWidth: "none" }}>
          {[{ id: "consult", l: "咨询AI" }, { id: "basic", l: "基本信息" }, { id: "fortune", l: "大运流年" }, { id: "annual", l: "2026年报" }, { id: "personality", l: "个性报告" }].map(t => (<button key={t.id} onClick={() => setBt(t.id)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 12, fontSize: 11, cursor: "pointer", background: bt === t.id ? "#efe4d3" : "#12120f", border: bt === t.id ? "1px solid #c9a96e" : "0.5px solid rgba(212,160,62,0.08)", color: bt === t.id ? "#4f3924" : "#5a5040", fontWeight: bt === t.id ? 500 : 400 }}>{t.l}</button>))}
        </div>
        {/* CONSULT */}
        {bt === "consult" && (<div>
          <C s={{ marginBottom: 8 }}><div style={{ fontSize: 10, letterSpacing: 2, color: "#6b6050" }}>AI MASTER CHAT</div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginTop: 3 }}>{bq.trim() ? "问事会话" : "命盘会话"}</div><p style={{ fontSize: 11, color: "#6b6050", lineHeight: 1.5, marginTop: 3 }}>多轮上下文 + 本地会话记忆</p><div style={{ display: "flex", gap: 5, marginTop: 8 }}><button onClick={chat} style={{ padding: "7px 16px", borderRadius: 16, background: "#f4f1e8", border: "none", color: "#0a0a0f", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{cms.length > 0 ? "发送追问" : "开始总览"}</button><button style={{ padding: "7px 12px", borderRadius: 16, background: "transparent", border: "0.5px solid rgba(212,160,62,0.12)", color: "#8a7d6b", fontSize: 12, cursor: "pointer" }}>清空</button></div></C>
          <C s={{ marginBottom: 8, minHeight: cms.length === 0 ? 120 : "auto" }}>{cms.length === 0 && !stm ? <div style={{ textAlign: "center", padding: "24px 0" }}><div style={{ fontSize: 10, letterSpacing: 3, color: "#5a5040" }}>CONVERSATION READY</div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3", marginTop: 4 }}>先发起第一轮命盘咨询</div></div> : cms.map((m, i) => (<div key={i} style={{ background: m.r === "ai" ? "rgba(184,137,68,0.05)" : "rgba(159,183,255,0.04)", border: `0.5px solid ${m.r === "ai" ? "rgba(184,137,68,0.1)" : "rgba(159,183,255,0.06)"}`, borderRadius: 12, padding: 10, marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}><span style={{ color: m.r === "ai" ? "#d9b36a" : "#9fb7ff" }}>{m.r === "ai" ? "AI 命理师" : "你"}</span><span style={{ color: "#4a4030" }}>{m.t}</span></div><div style={{ fontSize: 12, color: "#c9bfaa", lineHeight: 1.7 }}>{m.c}</div></div>))}{stm && <div style={{ fontSize: 11, color: "#d9b36a", padding: 6 }}>AI 命理师正在生成...</div>}</C>
          <C><textarea value={ci} onChange={e => setCi(e.target.value)} placeholder="继续追问..." style={{ width: "100%", minHeight: 60, padding: 10, background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.1)", borderRadius: 10, color: "#f5f0e3", fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ fontSize: 11, color: "#5a5040", letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>Special Actions</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}><button style={{ padding: "6px 12px", borderRadius: 14, background: "rgba(212,160,62,0.08)", border: "0.5px solid rgba(212,160,62,0.15)", color: "#d4a03e", fontSize: 11, cursor: "pointer" }}>喜用神详解</button><button style={{ padding: "6px 12px", borderRadius: 14, background: "rgba(54,68,95,0.12)", border: "0.5px solid rgba(54,68,95,0.25)", color: "#b8d1ff", fontSize: 11, cursor: "pointer" }}>过三关直断</button></div>
            <div style={{ fontSize: 11, color: "#5a5040", letterSpacing: 1, marginBottom: 4 }}>Quick Start</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{["整体命盘总览", "事业财运", "感情婚姻", "大运看三年"].map(qq => (<button key={qq} onClick={() => setCi(qq)} style={{ padding: "5px 10px", borderRadius: 12, background: "#0d0d0a", border: "0.5px solid rgba(212,160,62,0.06)", color: "#6b6050", fontSize: 11, cursor: "pointer" }}>{qq}</button>))}</div>
          </C>
        </div>)}
        {/* BASIC */}
        {bt === "basic" && (<div>
          <WC s={{ marginBottom: 8 }}><WL en="MCP Structured Chart" zh="八字原盘信息" /><div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5, marginTop: 10 }}>{[{ l: "姓名", v: bn }, { l: "性别", v: bg }, { l: "八字", v: "壬子甲申庚午丁未" }, { l: "日主", v: "庚金" }, { l: "生肖", v: "马" }, { l: "命宫", v: "辰宫" }, { l: "身宫", v: "申宫" }, { l: "星座", v: "金牛座" }].map(x => (<div key={x.l} style={{ background: "white", borderRadius: 10, padding: 8, border: "1px solid #eadfcf" }}><div style={{ fontSize: 10, letterSpacing: 1, color: "#a18f79" }}>{x.l}</div><div style={{ fontSize: 12, color: "#5d4731", marginTop: 3 }}>{x.v}</div></div>))}</div></WC>
          <WC s={{ marginBottom: 8 }}><WL en="Four Pillars Matrix" zh="四柱矩阵" /><div style={{ overflowX: "auto", marginTop: 10, scrollbarWidth: "none" }}><table style={{ width: "100%", minWidth: 320, borderCollapse: "separate", borderSpacing: "0 3px", fontSize: 11 }}><thead><tr><th style={{ textAlign: "left", padding: "5px 6px", background: "#efe4d3", borderRadius: 6, color: "#8e7758", fontSize: 9, letterSpacing: 2 }}>字段</th>{["年柱", "月柱", "日柱", "时柱"].map(c => (<th key={c} style={{ textAlign: "center", padding: "5px 6px", background: "#efe4d3", borderRadius: 6, color: "#654c32", fontSize: 11 }}>{c}</th>))}</tr></thead><tbody>{[{ l: "天干", vs: [{ c: "壬", w: "水" }, { c: "甲", w: "木" }, { c: "庚", w: "金" }, { c: "丁", w: "火" }] }, { l: "地支", vs: [{ c: "子", w: "水" }, { c: "申", w: "金" }, { c: "午", w: "火" }, { c: "未", w: "土" }] }].map(r => (<tr key={r.l}><td style={{ padding: "5px 6px", background: "#f5ecdf", borderRadius: 6, color: "#866c4e", fontWeight: 500 }}>{r.l}</td>{r.vs.map((v, i) => (<td key={i} style={{ padding: "5px 6px", background: "white", borderRadius: 6, textAlign: "center" }}><div style={{ width: 24, height: 24, borderRadius: 6, background: WX[v.w], color: "white", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 12 }}>{v.c}</div><div style={{ fontSize: 9, color: "#6b5842", marginTop: 2 }}>{v.w}</div></td>))}</tr>))}</tbody></table></div></WC>
          <WC><WL en="Five Elements" zh="五行分析" /><div style={{ marginTop: 10 }}>{[{ e: "木", n: 2, x: 4 }, { e: "火", n: 3, x: 4 }, { e: "土", n: 1, x: 4 }, { e: "金", n: 4, x: 4 }, { e: "水", n: 3, x: 4 }].map(i => (<div key={i.e} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><div style={{ width: 20, textAlign: "center", fontSize: 14, fontWeight: 700, color: WX[i.e] }}>{i.e}</div><div style={{ flex: 1, height: 12, borderRadius: 6, background: "#efe4d3", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 6, width: `${(i.n / i.x) * 100}%`, background: `linear-gradient(90deg, ${WX[i.e]}, ${WX[i.e]}bb)` }} /></div><div style={{ width: 44, textAlign: "right", fontSize: 11, color: "#6b5842" }}>{i.n} <span style={{ color: "#9c886d" }}>{i.n > 2 ? "旺" : i.n > 1 ? "平" : i.n === 1 ? "弱" : "缺"}</span></div></div>))}</div></WC>
        </div>)}
        {/* FORTUNE */}
        {bt === "fortune" && (<div>
          <WC s={{ marginBottom: 8 }}><WL en="Fortune Cycle" zh="大运流年" /><p style={{ fontSize: 11, color: "#77624a", lineHeight: 1.5, marginTop: 4 }}>按层级展开 大运/流年/流月/流日/流时，每选一层矩阵自动追加列。</p></WC>
          <FSR label="大运" items={[{ k: "0", l: "壬戌", m: "2020-2029" }, { k: "1", l: "辛酉", m: "2030-2039" }, { k: "2", l: "庚申", m: "2040-2049" }]} sel={sf} onSel={k => { setSf(k); setSy(null); setSm(null); }} ph="先选择一个大运" />
          <FSR label="流年" items={sf ? [{ k: "2024", l: "2024", m: "甲辰 · 34岁" }, { k: "2025", l: "2025", m: "乙巳 · 35岁" }, { k: "2026", l: "2026", m: "丙午 · 36岁" }] : []} sel={sy} onSel={k => { setSy(k); setSm(null); }} ph="选中大运后展开流年" />
          <FSR label="流月" items={sy ? [{ k: "m1", l: "立春", m: "庚寅 · 2/4-3/5" }, { k: "m2", l: "惊蛰", m: "辛卯 · 3/5-4/4" }] : []} sel={sm} onSel={setSm} ph="选中流年后展开流月" />
        </div>)}
        {bt === "annual" && <C><SL en="Annual Focus" zh="2026 年度报告" /><p style={{ fontSize: 12, color: "#6b6050", lineHeight: 1.6, marginTop: 6 }}>点击咨询AI标签页发起2026年度运势分析。</p><button onClick={() => setBt("consult")} style={{ marginTop: 10, padding: "8px 16px", borderRadius: 14, background: "#f4f1e8", border: "none", color: "#0a0a0f", fontSize: 12, cursor: "pointer" }}>前往咨询AI</button></C>}
        {bt === "personality" && <C><SL en="Personality Report" zh="个性报告" /><p style={{ fontSize: 12, color: "#6b6050", lineHeight: 1.6, marginTop: 6 }}>基于五行强弱与十神配置分析性格特征。请先在咨询AI中发起。</p></C>}
      </div>)}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f5f0e3", fontFamily: "'Noto Sans SC', 'PingFang SC', -apple-system, sans-serif", position: "relative", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&family=Noto+Sans+SC:wght@400;500&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}*{box-sizing:border-box;margin:0}::-webkit-scrollbar{display:none}input::placeholder,textarea::placeholder{color:#4a4030!important}button:active{opacity:0.85}`}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 20% 0%, rgba(196,30,58,0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(212,160,62,0.02) 0%, transparent 50%)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {tab === "home" && rHome()}
        {tab === "divine" && rDiv()}
        {tab === "master" && (<div style={{ padding: "0 16px 100px" }}><div style={{ textAlign: "center", padding: "20px 0 14px" }}><h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", fontFamily: "'Noto Serif SC', serif", color: "#f5f0e3" }}>大师团队</h1></div><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>{MASTERS.map(m => (<button key={m.id} onClick={() => setMaster(m)} style={{ background: master.id === m.id ? "rgba(196,30,58,0.08)" : "#12120f", border: master.id === m.id ? "1px solid rgba(196,30,58,0.3)" : "0.5px solid rgba(212,160,62,0.1)", borderRadius: 14, padding: 12, cursor: "pointer", textAlign: "center" }}><Seal c={m.seal} on={master.id === m.id} s={36} /><div style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e3", marginTop: 6, fontFamily: "'Noto Serif SC', serif" }}>{m.name}</div><div style={{ fontSize: 10, color: "#5a5040", marginTop: 2, marginBottom: 3 }}>{m.dynasty}</div><div style={{ fontSize: 10, color: "#6b6050", lineHeight: 1.4 }}>{m.desc}</div></button>))}</div>{master && <C s={{ marginTop: 10 }} hl><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Seal c={master.seal} on s={32} /><div><div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e3" }}>{master.name}</div><div style={{ fontSize: 10, color: "#5a5040" }}>{master.dynasty} · 当前</div></div></div><p style={{ fontSize: 12, color: "#8a7d6b", lineHeight: 1.7, margin: "0 0 8px" }}>{master.desc}</p><button onClick={() => setTab("divine")} style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(196,30,58,0.12)", border: "0.5px solid rgba(196,30,58,0.25)", color: "#c41e3a", fontSize: 12, cursor: "pointer" }}>请 {master.name} 为我占卜</button></C>}</div>)}
        {tab === "history" && (<div style={{ padding: "0 16px 100px" }}><div style={{ textAlign: "center", padding: "20px 0 14px" }}><h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", fontFamily: "'Noto Serif SC', serif", color: "#f5f0e3" }}>占卜记录</h1></div>{[{ t: "六爻占卜", q: "今年事业运如何？", d: "2026.05.03", m: "周文王", g: "☰", r: "乾为天 · 大吉" }, { t: "八字推命", q: "命格总览", d: "2026.05.02", m: "诸葛亮", g: "☵", r: "庚金日主 · 偏旺" }, { t: "周公解梦", q: "梦见飞翔", d: "2026.05.01", m: "鬼谷子", g: "☴", r: "主事业上升" }].map((r, i) => (<C key={i} s={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 16, color: "#d4a03e", opacity: 0.5 }}>{r.g}</span><span style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e3" }}>{r.t}</span></div><span style={{ fontSize: 10, color: "#4a4030" }}>{r.d}</span></div><p style={{ fontSize: 12, color: "#8a7d6b", margin: "0 0 3px" }}>{r.q}</p><div style={{ fontSize: 11, color: "#5a5040", marginBottom: 6 }}>解卦：{r.m} · {r.r}</div><div style={{ display: "flex", gap: 5 }}><button style={{ padding: "4px 12px", borderRadius: 12, background: "#1a1a17", border: "none", color: "#d4a03e", fontSize: 11, cursor: "pointer" }}>详情</button><button style={{ padding: "4px 12px", borderRadius: 12, background: "rgba(196,30,58,0.06)", border: "0.5px solid rgba(196,30,58,0.12)", color: "#e2a5a5", fontSize: 11, cursor: "pointer" }}>删除</button></div></C>))}</div>)}
        {tab === "settings" && (<div style={{ padding: "0 16px 100px" }}><div style={{ textAlign: "center", padding: "20px 0 14px" }}><h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", fontFamily: "'Noto Serif SC', serif", color: "#f5f0e3" }}>设置</h1></div><div style={{ display: "flex", gap: 5, marginBottom: 12 }}>{[{ id: "api", l: "API配置" }, { id: "master", l: "大师选择" }, { id: "data", l: "数据管理" }].map(t => (<button key={t.id} onClick={() => setSt(t.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, cursor: "pointer", background: st === t.id ? "#f4f1e8" : "#12120f", border: st === t.id ? "none" : "0.5px solid rgba(212,160,62,0.08)", color: st === t.id ? "#0a0a0f" : "#5a5040", fontWeight: st === t.id ? 500 : 400 }}>{t.l}</button>))}</div>{st === "api" && <div><C s={{ marginBottom: 8 }}><div style={{ fontSize: 11, color: "#6b6050", letterSpacing: 2, marginBottom: 4 }}>Gemini API 密钥</div><input type="password" placeholder="AIza..." style={{ width: "100%", padding: "10px 12px", background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.12)", borderRadius: 10, color: "#f5f0e3", fontSize: 13, outline: "none", boxSizing: "border-box" }} /><button style={{ marginTop: 8, padding: "7px 14px", borderRadius: 12, background: "#f4f1e8", border: "none", color: "#0a0a0f", fontSize: 12, cursor: "pointer" }}>验证密钥</button></C><C><div style={{ fontSize: 11, color: "#6b6050", letterSpacing: 2, marginBottom: 4 }}>服务器地址</div><input type="text" placeholder="https://your-server.com" style={{ width: "100%", padding: "10px 12px", background: "#0a0a0f", border: "0.5px solid rgba(212,160,62,0.12)", borderRadius: 10, color: "#f5f0e3", fontSize: 13, outline: "none", boxSizing: "border-box" }} /><button style={{ marginTop: 8, padding: "7px 14px", borderRadius: 12, background: "transparent", border: "0.5px solid rgba(212,160,62,0.12)", color: "#d4a03e", fontSize: 12, cursor: "pointer" }}>测试连接</button></C></div>}{st === "master" && <C><div style={{ fontSize: 11, color: "#6b6050", letterSpacing: 2, marginBottom: 8 }}>选择默认大师</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>{MASTERS.map(m => (<button key={m.id} onClick={() => setMaster(m)} style={{ padding: 8, borderRadius: 10, cursor: "pointer", textAlign: "center", background: master.id === m.id ? "rgba(196,30,58,0.08)" : "#0d0d0a", border: master.id === m.id ? "1px solid rgba(196,30,58,0.25)" : "0.5px solid rgba(212,160,62,0.05)" }}><Seal c={m.seal} on={master.id === m.id} s={26} /><div style={{ fontSize: 11, color: "#f5f0e3", marginTop: 3 }}>{m.name}</div></button>))}</div></C>}{st === "data" && <div><C s={{ marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e3", marginBottom: 6 }}>数据管理</div>{["📤 导出设置", "📥 导入设置", "📊 导出占卜记录"].map(l => (<button key={l} style={{ display: "block", width: "100%", padding: "9px 12px", borderRadius: 10, background: "#0d0d0a", border: "0.5px solid rgba(212,160,62,0.08)", color: "#c9bfaa", fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 5 }}>{l}</button>))}<button style={{ display: "block", width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(196,30,58,0.06)", border: "0.5px solid rgba(196,30,58,0.12)", color: "#e2a5a5", fontSize: 12, cursor: "pointer", textAlign: "left" }}>🗑 清除所有数据</button></C><C><div style={{ fontSize: 12, fontWeight: 500, color: "#c9bfaa", marginBottom: 4 }}>关于</div><p style={{ fontSize: 11, color: "#5a5040", lineHeight: 1.7, margin: 0 }}>周文王在线算命 v2.0 · 移动端优化版<br/>传承千年古典智慧，融合现代AI技术</p></C></div>}</div>)}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "0.5px solid rgba(212,160,62,0.1)", display: "flex", padding: "5px 0 env(safe-area-inset-bottom, 6px)", zIndex: 100 }}>
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "6px 0 2px", background: "none", border: "none", cursor: "pointer", color: tab === t.id ? "#d4a03e" : "#4a4030" }}><span style={{ fontSize: 16, lineHeight: 1, fontFamily: tab === t.id ? "'Noto Serif SC', serif" : "inherit", fontWeight: tab === t.id ? 500 : 400 }}>{t.i}</span><span style={{ fontSize: 10, letterSpacing: 1 }}>{t.l}</span>{tab === t.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#d4a03e" }} />}</button>))}
      </div>
    </div>
  );
}