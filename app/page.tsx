'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Playfair_Display } from 'next/font/google'
import SplashScreen from '@/components/SplashScreen'
import AnalyseModal from '@/components/AnalyseModal'
import BriefModal from '@/components/BriefModal'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/UserMenu'

const SPLASH_KEY = 'designBestiSplashSeen'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400'], style: ['italic'] })

const CRITIQUES = [
  { text: '"Your navigation CTA is invisible above the fold. Users can\'t act on what they can\'t find."', meta: 'Issue · Critical · Navigation · Hick\'s Law', label: 'Critical issue detected', word: 'wrong?', sub: 'See what\'s wrong before your users do.' },
  { text: '"Strong visual hierarchy in the hero — clean and intentional. Exactly what good design looks like."', meta: 'Win · Visual hierarchy · Well executed', label: 'Win detected', word: 'get right?', sub: 'Know what\'s working before you change it.' },
  { text: '"Low contrast on body text fails WCAG AA. One in twelve users can\'t read this page."', meta: 'Issue · Critical · Accessibility · WCAG 2.1', label: 'Accessibility issue found', word: 'cost you?', sub: 'Every UX mistake costs users, trust, and conversions.' },
  { text: '"Two competing CTAs at the bottom. Paradox of choice — users freeze and leave without acting."', meta: 'Issue · Major · Conversion · Footer', label: 'Conversion issue found', word: 'convert?', sub: 'Know exactly what\'s hurting your conversion rate.' },
]

const MODES = [
  { id: 'audit',       label: 'UX Audit',     desc: 'Score, issues, wins, reading patterns and benchmark — everything a senior designer catches.' },
  { id: 'roast',       label: 'Roast Mode',   desc: 'No sugar-coating. The brutal truth your design needs before it ships.' },
  { id: 'stress',      label: 'Stress Test',  desc: '7 user personas — first-timers, power users, accessibility users and more.' },
  { id: 'stakeholder', label: 'Stakeholder',  desc: 'Translate UX issues into conversion, retention and revenue impact.' },
  { id: 'brief',       label: 'Brief Mode',   desc: 'Paste requirements — get screens, states, edge cases and questions to ask.' },
]

// ── SVG Logo ──────────────────────────────────────────────────────────────────
function LogoSVG({ opacity = 1, style }: { opacity?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="144 380 637 240" xmlns="http://www.w3.org/2000/svg" style={{ fill: '#fff', opacity, ...style }}>
      <rect x="144" y="385.44" width="30" height="235.13"/>
      <rect x="198" y="406.66" width="120" height="86.69"/>
      <rect x="198" y="512.66" width="240" height="86.69"/>
      <path d="M396.59,412.1c6.82,3.62,12.11,8.71,15.85,15.25,3.74,6.54,5.61,14.1,5.61,22.66s-1.87,16.01-5.61,22.6c-3.74,6.59-9.05,11.69-15.91,15.31-6.87,3.62-14.82,5.43-23.86,5.43h-32.43v-86.69h32.43c9.13,0,17.1,1.81,23.92,5.43ZM389.93,468.54c4.44-4.36,6.66-10.54,6.66-18.52s-2.22-14.2-6.66-18.65c-4.44-4.45-10.65-6.67-18.62-6.67h-9.99v50.38h9.99c7.97,0,14.18-2.18,18.62-6.54Z"/>
      <path d="M450.97,423.59v17.54h28.24v16.3h-28.24v19.02h31.94v16.92h-53.03v-86.69h53.03v16.92h-31.94Z"/>
      <path d="M510.91,491.14c-5.02-2.06-9.02-5.1-12.02-9.14-3-4.03-4.58-8.89-4.75-14.57h22.44c.33,3.21,1.44,5.66,3.33,7.35,1.89,1.69,4.36,2.53,7.4,2.53s5.59-.72,7.4-2.16c1.81-1.44,2.71-3.44,2.71-5.99,0-2.14-.72-3.91-2.16-5.31-1.44-1.4-3.21-2.55-5.3-3.46-2.1-.91-5.08-1.93-8.94-3.09-5.59-1.73-10.15-3.46-13.69-5.19-3.54-1.73-6.58-4.28-9.13-7.66-2.55-3.38-3.82-7.78-3.82-13.21,0-8.07,2.92-14.39,8.76-18.96,5.84-4.57,13.44-6.85,22.81-6.85s17.22,2.28,23.06,6.85c5.84,4.57,8.96,10.93,9.37,19.08h-22.81c-.16-2.8-1.19-5-3.08-6.61-1.89-1.61-4.32-2.41-7.28-2.41-2.55,0-4.6.68-6.17,2.04-1.56,1.36-2.34,3.31-2.34,5.87,0,2.8,1.31,4.98,3.95,6.54,2.63,1.56,6.74,3.25,12.33,5.06,5.59,1.89,10.13,3.7,13.63,5.43,3.49,1.73,6.51,4.24,9.06,7.53,2.55,3.29,3.82,7.53,3.82,12.72s-1.25,9.43-3.76,13.46c-2.51,4.03-6.15,7.25-10.91,9.63-4.77,2.39-10.4,3.58-16.9,3.58s-12-1.03-17.02-3.09Z"/>
      <path d="M593.53,406.67v86.69h-21.09v-86.69h21.09Z"/>
      <path d="M666.29,434.08c-1.56-2.88-3.8-5.08-6.72-6.61-2.92-1.52-6.35-2.28-10.3-2.28-6.82,0-12.29,2.24-16.4,6.73-4.11,4.49-6.17,10.48-6.17,17.97,0,7.99,2.16,14.22,6.47,18.71,4.32,4.49,10.25,6.73,17.82,6.73,5.18,0,9.56-1.32,13.13-3.95,3.58-2.63,6.18-6.42,7.83-11.36h-26.76v-15.56h45.87v19.63c-1.56,5.27-4.21,10.17-7.95,14.7-3.74,4.53-8.49,8.19-14.24,10.99-5.76,2.8-12.25,4.2-19.48,4.2-8.55,0-16.18-1.87-22.88-5.62-6.7-3.75-11.92-8.95-15.66-15.62-3.74-6.67-5.61-14.28-5.61-22.85s1.87-16.2,5.61-22.91c3.74-6.71,8.94-11.94,15.6-15.68,6.66-3.75,14.26-5.62,22.81-5.62,10.36,0,19.09,2.51,26.2,7.53,7.11,5.02,11.82,11.98,14.12,20.87h-23.31Z"/>
      <path d="M780.23,493.36h-21.09l-35.27-53.47v53.47h-21.09v-86.69h21.09l35.27,53.72v-53.72h21.09v86.69Z"/>
      <path d="M526.58,562.72c3.04,3.91,4.57,8.38,4.57,13.4,0,7.25-2.53,12.99-7.59,17.23-5.06,4.24-12.12,6.36-21.18,6.36h-40.38v-86.69h39.02c8.81,0,15.7,2.02,20.68,6.05,4.98,4.03,7.47,9.51,7.47,16.42,0,5.11-1.34,9.34-4.01,12.72-2.68,3.38-6.24,5.72-10.68,7.04,5.02,1.07,9.06,3.56,12.1,7.47ZM483.12,548.08h13.83c3.46,0,6.11-.76,7.96-2.28,1.85-1.52,2.78-3.77,2.78-6.73s-.93-5.23-2.78-6.79c-1.85-1.56-4.51-2.35-7.96-2.35h-13.83v18.15ZM506.89,580.25c1.93-1.61,2.9-3.93,2.9-6.98s-1.01-5.43-3.03-7.16c-2.02-1.73-4.8-2.59-8.34-2.59h-15.31v19.14h15.56c3.54,0,6.28-.8,8.21-2.41Z"/>
      <path d="M564.5,529.93v17.54h28.28v16.3h-28.28v19.02h31.98v16.92h-53.1v-86.69h53.1v16.92h-31.98Z"/>
      <path d="M624.51,597.48c-5.02-2.06-9.04-5.1-12.04-9.14-3.01-4.03-4.59-8.89-4.75-14.57h22.48c.33,3.21,1.44,5.66,3.33,7.35,1.89,1.69,4.36,2.53,7.41,2.53s5.6-.72,7.41-2.16c1.81-1.44,2.72-3.44,2.72-5.99,0-2.14-.72-3.91-2.16-5.31-1.44-1.4-3.21-2.55-5.31-3.46-2.1-.91-5.08-1.93-8.95-3.09-5.6-1.73-10.17-3.46-13.71-5.19-3.54-1.73-6.59-4.28-9.14-7.66-2.55-3.38-3.83-7.78-3.83-13.21,0-8.07,2.92-14.39,8.77-18.96,5.84-4.57,13.46-6.85,22.85-6.85s17.25,2.28,23.09,6.85c5.84,4.57,8.97,10.93,9.38,19.08h-22.85c-.17-2.8-1.19-5-3.09-6.61-1.89-1.61-4.32-2.41-7.29-2.41-2.55,0-4.61.68-6.17,2.04-1.57,1.36-2.35,3.31-2.35,5.87,0,2.8,1.32,4.98,3.95,6.54,2.63,1.56,6.75,3.25,12.35,5.06,5.6,1.89,10.15,3.7,13.65,5.43,3.5,1.73,6.52,4.24,9.08,7.53,2.55,3.29,3.83,7.53,3.83,12.72s-1.26,9.43-3.77,13.46c-2.51,4.04-6.16,7.25-10.93,9.63-4.78,2.39-10.42,3.58-16.92,3.58s-12.02-1.03-17.04-3.09Z"/>
      <path d="M748.5,513.01v16.92h-22.97v69.77h-21.12v-69.77h-22.97v-16.92h67.05Z"/>
      <path d="M780.23,513.01v86.69h-21.12v-86.69h21.12Z"/>
    </svg>
  )
}

// ── Blast particles ───────────────────────────────────────────────────────────
const COLORS = [
  {r:255,g:90,b:90},{r:255,g:175,b:45},{r:90,g:215,b:115},
  {r:75,g:155,b:255},{r:195,g:115,b:255},{r:255,g:255,b:255},
]

function BlastCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({x:-9999,y:-9999})
  const prevMouse = useRef({x:-9999,y:-9999})
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext('2d'); if(!ctx) return
    let W=canvas.offsetWidth, H=canvas.offsetHeight
    canvas.width=W; canvas.height=H

    const onResize=()=>{W=canvas.offsetWidth;H=canvas.offsetHeight;canvas.width=W;canvas.height=H;initGrid()}
    const onMove=(e:MouseEvent)=>{const r=canvas.getBoundingClientRect();prevMouse.current={...mouseRef.current};mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top}}
    const onLeave=()=>{mouseRef.current={x:-9999,y:-9999}}
    window.addEventListener('resize',onResize)
    window.addEventListener('mousemove',onMove)
    window.addEventListener('mouseleave',onLeave)

    interface Dot{x:number;y:number;ox:number;oy:number;r:number;col:typeof COLORS[0];glow:number;baseA:number;vx:number;vy:number}
    interface Burst{x:number;y:number;vx:number;vy:number;r:number;life:number;maxLife:number;col:typeof COLORS[0]}
    interface Wave{x:number;y:number;radius:number;maxR:number;life:number}

    let grid:Dot[]=[], bursts:Burst[]=[], waves:Wave[]=[], frame=0

    function initGrid(){
      grid=[]
      const sp=36
      for(let i=0;i<Math.ceil(W/sp);i++){
        for(let j=0;j<Math.ceil(H/sp);j++){
          const ox=(i+0.5)*sp+(Math.random()-0.5)*6
          const oy=(j+0.5)*sp+(Math.random()-0.5)*6
          grid.push({x:ox,y:oy,ox,oy,r:Math.random()*1.1+0.3,col:COLORS[Math.floor(Math.random()*COLORS.length)],glow:0,baseA:Math.random()*0.1+0.03,vx:0,vy:0})
        }
      }
    }

    function blast(mx:number,my:number,speed:number){
      waves.push({x:mx,y:my,radius:0,maxR:speed*3+60,life:1})
      const count=Math.min(Math.floor(speed*0.5)+6,18)
      for(let i=0;i<count;i++){
        const angle=Math.random()*Math.PI*2
        const v=speed*0.25+Math.random()*8+4
        bursts.push({x:mx+(Math.random()-0.5)*8,y:my+(Math.random()-0.5)*8,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,r:Math.random()*3+1.5,life:0,maxLife:Math.random()*28+16,col:COLORS[Math.floor(Math.random()*COLORS.length)]})
      }
    }

    function draw(){
      ctx.fillStyle='rgba(8,9,15,0.22)'; ctx.fillRect(0,0,W,H)
      frame++
      const {x:mx,y:my}=mouseRef.current
      const {x:px,y:py}=prevMouse.current
      const speed=Math.sqrt((mx-px)**2+(my-py)**2)
      if(speed>6&&mx>0&&frame%2===0) blast(mx,my,speed)

      // shockwaves
      waves=waves.filter(w=>{
        w.radius+=(w.maxR-w.radius)*0.18; w.life-=0.06
        if(w.life<=0) return false
        ctx.beginPath(); ctx.arc(w.x,w.y,w.radius,0,Math.PI*2)
        ctx.strokeStyle=`rgba(255,255,255,${w.life*0.15})`; ctx.lineWidth=1.5; ctx.stroke()
        return true
      })

      // center mask radii
      const cx=W/2, cy=H*0.45
      const maskR=Math.min(W,H)*0.28

      // grid dots
      grid.forEach(d=>{
        const dcx=Math.sqrt((d.ox-cx)**2+(d.oy-cy)**2)
        const mask=Math.min(1,Math.max(0,(dcx-maskR*0.3)/(maskR*0.7)))
        const dx=mx-d.ox, dy=my-d.oy
        const dist=Math.sqrt(dx*dx+dy*dy)
        if(dist<120&&dist>0&&mx>0){const f=(1-dist/120)*55;d.vx+=(-dx/dist*f)*0.14;d.vy+=(-dy/dist*f)*0.14}
        d.vx+=(d.ox-d.x)*0.09; d.vy+=(d.oy-d.y)*0.09; d.vx*=0.76; d.vy*=0.76; d.x+=d.vx; d.y+=d.vy
        const tg=dist<160&&mx>0?(1-dist/160)*mask:0; d.glow+=(tg-d.glow)*0.1
        const {r:cr,g:cg,b:cb}=d.col
        const alpha=(d.baseA+d.glow*0.5)*mask
        if(alpha<0.01) return
        if(d.glow>0.03){
          const gr=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r+d.glow*10)
          gr.addColorStop(0,`rgba(${cr},${cg},${cb},${d.glow*0.45})`); gr.addColorStop(1,`rgba(${cr},${cg},${cb},0)`)
          ctx.beginPath(); ctx.arc(d.x,d.y,d.r+d.glow*10,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r+d.glow*2,0,Math.PI*2)
        ctx.fillStyle=`rgba(${cr},${cg},${cb},${alpha})`; ctx.fill()
      })

      // burst particles
      bursts=bursts.filter(b=>{
        b.vx*=0.88; b.vy*=0.88; b.x+=b.vx; b.y+=b.vy; b.life++
        const p=b.life/b.maxLife; if(p>=1) return false
        const size=b.r*Math.max(0,1-p*p*1.2)
        const alpha=Math.max(0,1-p*1.1)
        const {r:cr,g:cg,b:cb}=b.col
        const gr=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,size*4)
        gr.addColorStop(0,`rgba(${cr},${cg},${cb},${alpha*0.7})`); gr.addColorStop(0.4,`rgba(${cr},${cg},${cb},${alpha*0.2})`); gr.addColorStop(1,`rgba(${cr},${cg},${cb},0)`)
        ctx.beginPath(); ctx.arc(b.x,b.y,size*4,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill()
        ctx.beginPath(); ctx.arc(b.x,b.y,size,0,Math.PI*2)
        ctx.fillStyle=`rgba(${cr},${cg},${cb},${alpha})`; ctx.fill()
        return true
      })

      rafRef.current=requestAnimationFrame(draw)
    }

    initGrid(); draw()
    return()=>{window.removeEventListener('resize',onResize);window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseleave',onLeave);cancelAnimationFrame(rafRef.current)}
  },[])

  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>
}

// ── MacBook screens ───────────────────────────────────────────────────────────
const BAR:React.CSSProperties={background:'#0A0B10',borderBottom:'0.5px solid rgba(255,255,255,0.07)',padding:'9px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}
const BL:React.CSSProperties={fontSize:10,fontWeight:500,color:'rgba(255,255,255,0.5)'}
const BT:React.CSSProperties={fontSize:9,color:'rgba(255,255,255,0.25)',letterSpacing:'0.1em',textTransform:'uppercase'}

function AuditScreen(){return(<div style={{display:'flex',flexDirection:'column',height:'100%',background:'#07080D'}}><div style={BAR}><span style={BL}>● design besti</span><span style={BT}>UX Audit</span></div><div style={{padding:'12px 14px',flex:1,overflow:'hidden'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>{[['UX health','74','Top 35%','#0D1E3D'],['Issues','5','2 crit · 3 maj','#1A0D0D'],['Wins','3','Strong hier.','#0D1A0D']].map(([l,v,s,bg])=>(<div key={l} style={{borderRadius:8,padding:'10px 12px',background:bg as string,border:'0.5px solid rgba(255,255,255,0.07)'}}><div style={{fontSize:8,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5}}>{l}</div><div style={{fontSize:22,fontWeight:500,color:'#fff',lineHeight:1}}>{v}</div><div style={{fontSize:8,color:'rgba(255,255,255,0.4)',marginTop:3}}>{s}</div></div>))}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:8,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Categories</div>{[['Clarity','80'],['Hierarchy','72'],['Accessibility','58'],['Consistency','85'],['Cognitive','70']].map(([l,v])=>(<div key={l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}><div style={{fontSize:8,color:'rgba(255,255,255,0.5)',width:56}}>{l}</div><div style={{flex:1,height:2,background:'rgba(255,255,255,0.08)',borderRadius:1,overflow:'hidden'}}><div style={{height:'100%',width:`${v}%`,background:'rgba(255,255,255,0.4)',borderRadius:1}}/></div><div style={{fontSize:8,color:'rgba(255,255,255,0.4)',width:16,textAlign:'right'}}>{v}</div></div>))}</div><div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:8,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Priority fixes</div>{[['Nav CTA missing above fold','c'],['Body text fails WCAG AA','c'],['Two competing footer CTAs','m'],['Card spacing too tight','m']].map(([t,s])=>(<div key={t} style={{display:'flex',gap:6,paddingBottom:5,borderBottom:'0.5px solid rgba(255,255,255,0.05)',marginBottom:5}}><div style={{width:4,height:4,borderRadius:'50%',background:s==='c'?'rgba(255,100,100,0.7)':'rgba(255,180,50,0.7)',flexShrink:0,marginTop:3}}/><div style={{fontSize:9,color:'rgba(255,255,255,0.6)',lineHeight:1.4}}>{t}</div></div>))}</div></div></div></div>)}
function RoastScreen(){return(<div style={{display:'flex',flexDirection:'column',height:'100%',background:'#07080D'}}><div style={BAR}><span style={BL}>● design besti</span><span style={BT}>Roast Mode</span></div><div style={{padding:'14px 16px',flex:1}}>{['"This CTA is playing hide and seek — and winning."','"Your spacing says I gave up halfway. Your users can tell."','"Three fonts. One page. Zero reason."','"The contrast is so low the text is embarrassed."'].map((q,i)=>(<div key={i} style={{background:'rgba(255,80,80,0.06)',border:'0.5px solid rgba(255,80,80,0.15)',borderRadius:10,padding:'11px 14px',fontSize:11,fontStyle:'italic',color:'rgba(255,255,255,0.65)',lineHeight:1.55,marginBottom:8}}>{q}</div>))}</div></div>)}
function StressScreen(){const p=[['First-time','68'],['Power user','82'],['Accessibility','54'],['Older user','61'],['Mobile','75'],['Non-native','70'],['Distracted','65']];return(<div style={{display:'flex',flexDirection:'column',height:'100%',background:'#07080D'}}><div style={BAR}><span style={BL}>● design besti</span><span style={BT}>Stress Test · 7 personas</span></div><div style={{padding:'14px 16px',flex:1}}>{p.map(([n,s])=>(<div key={n} style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}><div style={{fontSize:10,color:'rgba(255,255,255,0.55)',width:88}}>{n}</div><div style={{flex:1,height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${s}%`,background:parseInt(s)<60?'rgba(255,100,100,0.5)':parseInt(s)>75?'rgba(100,220,100,0.5)':'rgba(255,200,50,0.5)',borderRadius:2}}/></div><div style={{fontSize:10,color:'rgba(255,255,255,0.5)',width:22,textAlign:'right'}}>{s}</div></div>))}</div></div>)}
function StakeholderScreen(){return(<div style={{display:'flex',flexDirection:'column',height:'100%',background:'#07080D'}}><div style={BAR}><span style={BL}>● design besti</span><span style={BT}>Stakeholder</span></div><div style={{padding:'14px 16px',flex:1}}>{[['Conversion impact','Missing CTA reduces conversion by 20–35% based on industry benchmarks.'],['Legal exposure','Low contrast fails WCAG 2.1 AA — compliance risk in regulated markets.'],['Retention risk','Cognitive overload raises estimated bounce rate by 15–25%.']].map(([t,s])=>(<div key={t} style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'11px 14px',marginBottom:8}}><div style={{fontSize:10,fontWeight:500,color:'rgba(255,255,255,0.75)',marginBottom:5}}>{t}</div><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',lineHeight:1.55}}>{s}</div></div>))}</div></div>)}
function BriefScreen(){return(<div style={{display:'flex',flexDirection:'column',height:'100%',background:'#07080D'}}><div style={BAR}><span style={BL}>● design besti</span><span style={BT}>Brief Mode</span></div><div style={{padding:'14px 16px',flex:1}}>{[['Onboarding flow','Welcome, permissions, profile setup — 3 screens min'],['Empty states','No data, error, loading — all three needed'],['Settings screen','Account, notifications, privacy — grouped logically'],['Edge case: offline','What happens when connection drops?']].map(([t,s])=>(<div key={t} style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'9px 12px',marginBottom:6}}><div style={{fontSize:10,fontWeight:500,color:'rgba(255,255,255,0.7)',marginBottom:3}}>{t}</div><div style={{fontSize:9,color:'rgba(255,255,255,0.45)',lineHeight:1.45}}>{s}</div></div>))}</div></div>)}

const SCREENS:Record<string,React.FC>={audit:AuditScreen,roast:RoastScreen,stress:StressScreen,stakeholder:StakeholderScreen,brief:BriefScreen}

// ── Angled MacBook ────────────────────────────────────────────────────────────
// ── Scroll snap service cards ─────────────────────────────────────────────────
const SVCS = [
  { num:'01', label:'UX Audit',    title:'Senior-level critique.',    desc:'Score, issues, wins, reading patterns and benchmark — everything a senior designer catches.',   tag:'Score · Issues · Wins · Benchmark' },
  { num:'02', label:'Roast Mode',  title:'Brutal. Honest. Real.',     desc:'No sugar-coating. Just the truth your design needs before it ships to real users.',             tag:'"This CTA is playing hide and seek."' },
  { num:'03', label:'Stress Test', title:'7 user personas.',          desc:'First-timers, power users, accessibility users, older users — all tested against your design.',  tag:'7 personas · Cross-persona insights' },
  { num:'04', label:'Stakeholder', title:'Business language.',        desc:'Translate every UX issue into conversion, retention and revenue impact.',                       tag:'Conversion · Retention · Revenue' },
  { num:'05', label:'Brief Mode',  title:'Start from requirements.',  desc:'Paste your brief — get screens, states, edge cases and questions to ask before designing.',      tag:'Screens · States · Edge cases' },
]

function ServiceCards() {
  const [cur, setCur] = useState(0)

  return (
    <section style={{ background: '#0B0C10', position: 'relative', padding: '80px 7%', borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>Five perspectives</p>
        <h2 style={{ fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 500, letterSpacing: '-2px', color: '#fff', marginBottom: 10, lineHeight: 1 }}>One design. Every angle.</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Each mode built for a different moment in your process.</p>
      </div>

      {/* tab buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
        {SVCS.map((s, i) => (
          <button key={i} onClick={() => setCur(i)} style={{ fontSize: 12, padding: '7px 16px', borderRadius: 100, border: `0.5px solid ${cur === i ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, background: cur === i ? 'rgba(255,255,255,0.08)' : 'transparent', color: cur === i ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: cur === i ? 500 : 400 }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* active card */}
      <div style={{ maxWidth: 780, margin: '0 auto', minHeight: 320 }}>
        {SVCS.map((s, i) => (
          <div key={i} style={{ display: cur === i ? 'flex' : 'none', flexDirection: 'column', borderRadius: 20, padding: '44px 48px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{s.num} — {s.label}</div>
            <div style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 500, letterSpacing: '-1.5px', color: '#fff', lineHeight: 1.05, marginBottom: 18 }}>{s.title}</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>{s.desc}</div>
            <div style={{ display: 'inline-block', fontSize: 11, padding: '6px 16px', borderRadius: 100, border: '0.5px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.4)' }}>{s.tag}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── MacBook with real photo + scroll services ─────────────────────────────────
const SERVICE_SCREENS = [
  { num:'01', label:'UX Audit',    title:'Senior-level\ncritique.',     desc:'Score, issues, wins, reading patterns and benchmark — everything a senior designer catches.',   tag:'Score · Issues · Wins · Benchmark' },
  { num:'02', label:'Roast Mode',  title:'Brutal.\nHonest. Real.',     desc:'No sugar-coating. Just the truth your design needs before it ships to real users.',             tag:'"This CTA is playing hide and seek."' },
  { num:'03', label:'Stress Test', title:'7 user\npersonas.',          desc:'First-timers, power users, accessibility users, older users — all tested.',                     tag:'7 personas · Cross-persona insights' },
  { num:'04', label:'Stakeholder', title:'Business\nlanguage.',        desc:'Translate UX issues into conversion, retention and revenue impact.',                            tag:'Conversion · Retention · Revenue' },
  { num:'05', label:'Brief Mode',  title:'Start from\nrequirements.',  desc:'Paste your brief — get screens, states, edge cases and questions to ask before designing.',      tag:'Screens · States · Edge cases' },
]

const SCREEN_HTML = [
  `<div style="padding:10px;height:100%;background:#07080D;display:flex;flex-direction:column;gap:6px;box-sizing:border-box"><div style="font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em">UX Audit</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:4px"><div style="background:#0D1E3D;border-radius:5px;padding:7px 8px"><div style="font-size:7px;color:rgba(255,255,255,.35);margin-bottom:3px">UX health</div><div style="font-size:18px;font-weight:500;color:#fff">74</div><div style="font-size:7px;color:rgba(255,255,255,.3)">Top 35%</div></div><div style="background:#1A0D0D;border-radius:5px;padding:7px 8px"><div style="font-size:7px;color:rgba(255,255,255,.35);margin-bottom:3px">Issues</div><div style="font-size:18px;font-weight:500;color:#fff">5</div><div style="font-size:7px;color:rgba(255,255,255,.3)">2 critical</div></div><div style="background:#0D1A0D;border-radius:5px;padding:7px 8px"><div style="font-size:7px;color:rgba(255,255,255,.35);margin-bottom:3px">Wins</div><div style="font-size:18px;font-weight:500;color:#fff">3</div><div style="font-size:7px;color:rgba(255,255,255,.3)">Strong</div></div></div><div style="background:rgba(255,255,255,.04);border-radius:5px;padding:8px;flex:1"><div style="font-size:7px;color:rgba(255,255,255,.3);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em">Categories</div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px"><div style="font-size:7px;color:rgba(255,255,255,.4);width:52px">Clarity</div><div style="flex:1;height:2px;background:rgba(255,255,255,.08);border-radius:1px;overflow:hidden"><div style="height:100%;width:80%;background:rgba(255,255,255,.4)"></div></div><div style="font-size:7px;color:rgba(255,255,255,.3);width:14px;text-align:right">80</div></div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px"><div style="font-size:7px;color:rgba(255,255,255,.4);width:52px">Hierarchy</div><div style="flex:1;height:2px;background:rgba(255,255,255,.08);border-radius:1px;overflow:hidden"><div style="height:100%;width:72%;background:rgba(255,255,255,.4)"></div></div><div style="font-size:7px;color:rgba(255,255,255,.3);width:14px;text-align:right">72</div></div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px"><div style="font-size:7px;color:rgba(255,255,255,.4);width:52px">Access.</div><div style="flex:1;height:2px;background:rgba(255,255,255,.08);border-radius:1px;overflow:hidden"><div style="height:100%;width:58%;background:rgba(255,255,255,.4)"></div></div><div style="font-size:7px;color:rgba(255,255,255,.3);width:14px;text-align:right">58</div></div><div style="display:flex;align-items:center;gap:5px"><div style="font-size:7px;color:rgba(255,255,255,.4);width:52px">Consist.</div><div style="flex:1;height:2px;background:rgba(255,255,255,.08);border-radius:1px;overflow:hidden"><div style="height:100%;width:85%;background:rgba(255,255,255,.4)"></div></div><div style="font-size:7px;color:rgba(255,255,255,.3);width:14px;text-align:right">85</div></div></div></div>`,
  `<div style="padding:10px;height:100%;background:#07080D;display:flex;flex-direction:column;gap:7px;box-sizing:border-box"><div style="font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em">Roast Mode</div><div style="background:rgba(255,80,80,.07);border:.5px solid rgba(255,80,80,.15);border-radius:7px;padding:9px 11px;font-size:9px;font-style:italic;color:rgba(255,255,255,.6);line-height:1.5">"This CTA is playing hide and seek — and winning."</div><div style="background:rgba(255,80,80,.07);border:.5px solid rgba(255,80,80,.15);border-radius:7px;padding:9px 11px;font-size:9px;font-style:italic;color:rgba(255,255,255,.6);line-height:1.5">"Your spacing says I gave up halfway."</div><div style="background:rgba(255,80,80,.07);border:.5px solid rgba(255,80,80,.15);border-radius:7px;padding:9px 11px;font-size:9px;font-style:italic;color:rgba(255,255,255,.6);line-height:1.5">"Three fonts. One page. Zero reason."</div><div style="background:rgba(255,80,80,.07);border:.5px solid rgba(255,80,80,.15);border-radius:7px;padding:9px 11px;font-size:9px;font-style:italic;color:rgba(255,255,255,.6);line-height:1.5">"Contrast so low the text is embarrassed."</div></div>`,
  `<div style="padding:10px;height:100%;background:#07080D;display:flex;flex-direction:column;gap:6px;box-sizing:border-box"><div style="font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em">Stress Test</div>${[['First-time','68','rgba(255,200,50,.5)'],['Power user','82','rgba(100,220,100,.5)'],['Accessibility','54','rgba(255,100,100,.5)'],['Older user','61','rgba(255,200,50,.5)'],['Mobile','75','rgba(100,220,100,.5)'],['Non-native','70','rgba(255,200,50,.5)'],['Distracted','65','rgba(255,200,50,.5)']].map(([n,s,c])=>`<div style="display:flex;align-items:center;gap:7px"><div style="font-size:8px;color:rgba(255,255,255,.45);width:68px">${n}</div><div style="flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden"><div style="height:100%;width:${s}%;background:${c}"></div></div><div style="font-size:8px;color:rgba(255,255,255,.35);width:16px;text-align:right">${s}</div></div>`).join('')}</div>`,
  `<div style="padding:10px;height:100%;background:#07080D;display:flex;flex-direction:column;gap:7px;box-sizing:border-box"><div style="font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em">Stakeholder</div>${[['Conversion impact','Missing CTA reduces conversion by 20–35%.'],['Legal exposure','Low contrast fails WCAG 2.1 AA.'],['Retention risk','Cluttered layout raises bounce rate 15–25%.']].map(([t,s])=>`<div style="background:rgba(255,255,255,.04);border:.5px solid rgba(255,255,255,.08);border-radius:8px;padding:9px 11px"><div style="font-size:9px;font-weight:500;color:rgba(255,255,255,.7);margin-bottom:3px">${t}</div><div style="font-size:8px;color:rgba(255,255,255,.4);line-height:1.45">${s}</div></div>`).join('')}</div>`,
  `<div style="padding:10px;height:100%;background:#07080D;display:flex;flex-direction:column;gap:6px;box-sizing:border-box"><div style="font-size:8px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em">Brief Mode</div>${[['Onboarding flow','Welcome, permissions, profile setup'],['Empty states','No data, error, loading — all 3'],['Settings screen','Account, notifications, privacy'],['Edge case: offline','Connection drops mid-flow?']].map(([t,s])=>`<div style="background:rgba(255,255,255,.04);border:.5px solid rgba(255,255,255,.08);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:500;color:rgba(255,255,255,.65);margin-bottom:2px">${t}</div><div style="font-size:8px;color:rgba(255,255,255,.35);line-height:1.3">${s}</div></div>`).join('')}</div>`,
]

function MacBookServices({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const [active, setActive] = useState(0)
  const [scrHtml, setScrHtml] = useState(SCREEN_HTML[0])
  const [scrVis, setScrVis] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const macRef = useRef<HTMLDivElement>(null)
  const mT = useRef({ cx: 0, cy: 0 })
  const rafRef = useRef<number>(0)

  const positionOverlay = useCallback(() => {
    const img = imgRef.current
    const ov = overlayRef.current
    if (!img || !ov) return
    const iw = img.offsetWidth, ih = img.offsetHeight
    ov.style.left   = (iw * 0.245) + 'px'
    ov.style.top    = (ih * 0.135) + 'px'
    ov.style.width  = (iw * 0.405) + 'px'
    ov.style.height = (ih * 0.385) + 'px'
  }, [])

  useEffect(() => {
    window.addEventListener('resize', positionOverlay)
    return () => window.removeEventListener('resize', positionOverlay)
  }, [positionOverlay])

  // smooth mouse tilt
  useEffect(() => {
    const loop = () => {
      mT.current.cx += (mouseX - mT.current.cx) * 0.07
      mT.current.cy += (mouseY - mT.current.cy) * 0.07
      if (macRef.current) {
        const { cx, cy } = mT.current
        macRef.current.style.transform = `perspective(1200px) rotateX(${cy * -5}deg) rotateY(${cx * 7}deg)`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(rafRef.current)
  }, [mouseX, mouseY])

  const goTo = (i: number) => {
    if (i === active) return
    setActive(i)
    setScrVis(false)
    setTimeout(() => { setScrHtml(SCREEN_HTML[i]); setScrVis(true) }, 200)
  }

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 0, alignItems: 'center', minHeight: 520 }}>

      {/* LEFT — text */}
      <div style={{ padding: '0 0 0 0', position: 'relative', height: 380 }}>
        {/* dot nav */}
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SERVICE_SCREENS.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{ width: 5, height: 5, borderRadius: '50%', background: active === i ? '#fff' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* text items */}
        <div style={{ position: 'relative', height: '100%', marginLeft: 24 }}>
          {SERVICE_SCREENS.map((s, i) => (
            <div key={i} style={{ position: 'absolute', top: '50%', width: '100%', opacity: active === i ? 1 : 0, transform: active === i ? 'translateY(-50%)' : active > i ? 'translateY(calc(-50% - 20px))' : 'translateY(calc(-50% + 20px))', transition: 'opacity 0.5s, transform 0.5s', pointerEvents: active === i ? 'auto' : 'none' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>{s.num} — {s.label}</div>
              <div style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 500, letterSpacing: '-1.5px', color: '#fff', lineHeight: 1.05, marginBottom: 14, whiteSpace: 'pre-line' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 280, marginBottom: 16 }}>{s.desc}</div>
              <div style={{ display: 'inline-block', fontSize: 10, padding: '5px 14px', borderRadius: 100, border: '0.5px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.45)' }}>{s.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — real macbook photo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={macRef} style={{ position: 'relative', width: '100%', willChange: 'transform' }}>
          <img
            ref={imgRef}
            src="/macbook.png"
            alt="MacBook"
            style={{ width: '100%', display: 'block' }}
            onLoad={positionOverlay}
          />
          <div ref={overlayRef} style={{ position: 'absolute', background: '#07080D', overflow: 'hidden', borderRadius: 3 }}>
            <div style={{ width: '100%', height: '100%', opacity: scrVis ? 1 : 0, transition: 'opacity 0.2s ease' }} dangerouslySetInnerHTML={{ __html: scrHtml }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AngledMacBook({ screenContent, mouseX, mouseY }: { screenContent: React.ReactNode; mouseX: number; mouseY: number }) {
  // Base angle — dramatic tilt like reference image
  // Additional mouse-driven tilt on top
  const baseRotX = -18  // screen tilted back
  const baseRotY = 8    // slight left-to-right angle
  const mouseRotX = mouseY * 4
  const mouseRotY = mouseX * 6

  const rotX = baseRotX + mouseRotX
  const rotY = baseRotY + mouseRotY

  return (
    <div style={{ perspective: 1200, perspectiveOrigin: '50% 40%', display: 'inline-block' }}>
      <div style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transition: 'transform 0.1s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* ── LID — the screen ── */}
        <div style={{
          width: 720,
          background: 'linear-gradient(145deg,#3A3B3E 0%,#2A2B2E 30%,#1E1F22 70%,#17181A 100%)',
          borderRadius: '12px 12px 2px 2px',
          padding: '10px 10px 6px',
          boxShadow: [
            '0 0 0 0.5px rgba(255,255,255,0.14) inset',
            '0 0 0 1px rgba(0,0,0,0.95)',
            '0 -2px 0 rgba(255,255,255,0.06) inset',
            // deep floating shadow
            '0 60px 140px rgba(0,0,0,0.98)',
            '0 30px 60px rgba(0,0,0,0.8)',
            '0 10px 20px rgba(0,0,0,0.6)',
            // edge highlight — right side brighter like reference
            '4px 0 0 rgba(255,255,255,0.04)',
          ].join(','),
          position: 'relative',
        }}>
          {/* top edge shine */}
          <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),rgba(255,255,255,0.1),transparent)', borderRadius:'12px 12px 0 0' }} />

          {/* right edge highlight — like the reference blue sheen */}
          <div style={{ position:'absolute', top:0, right:0, width:3, height:'100%', background:'linear-gradient(180deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.03) 50%,transparent 100%)', borderRadius:'0 12px 2px 0' }} />

          {/* camera */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:9 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#0C0D0F', border:'0.5px solid rgba(255,255,255,0.09)', boxShadow:'0 0 0 1.5px rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:'rgba(60,130,255,0.15)' }} />
            </div>
          </div>

          {/* screen */}
          <div style={{ background:'#000', borderRadius:7, overflow:'hidden', height:406, border:'0.5px solid rgba(0,0,0,1)', boxShadow:'0 0 0 0.5px rgba(255,255,255,0.05) inset, 0 0 50px rgba(0,0,0,0.95) inset', position:'relative' }}>
            {/* LCD glow */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.04) 0%,transparent 55%)', pointerEvents:'none', zIndex:1 }} />
            <div style={{ width:'100%', height:'100%', position:'relative', zIndex:0 }}>
              {screenContent}
            </div>
          </div>

          {/* bottom lid */}
          <div style={{ height:5, marginTop:5, background:'linear-gradient(180deg,rgba(255,255,255,0.02) 0%,transparent 100%)', borderRadius:'0 0 2px 2px' }} />
        </div>

        {/* ── HINGE — 3D depth ── */}
        <div style={{
          width: 724,
          height: 7,
          background: 'linear-gradient(180deg,#080809 0%,#151618 60%,#1E2022 100%)',
          borderRadius: '0 0 1px 1px',
          boxShadow: '0 3px 6px rgba(0,0,0,0.95), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          transform: 'translateZ(-2px)',
        }} />

        {/* ── BASE — keyboard area ── */}
        <div style={{
          width: 740,
          background: 'linear-gradient(180deg,#2A2C2F 0%,#202224 40%,#1A1C1E 100%)',
          borderRadius: '0 0 8px 8px',
          height: 20,
          boxShadow: [
            '0 0 0 0.5px rgba(255,255,255,0.08) inset',
            '0 0 0 0.5px rgba(0,0,0,0.9)',
            '0 8px 30px rgba(0,0,0,0.95)',
            '0 20px 60px rgba(0,0,0,0.8)',
          ].join(','),
          position: 'relative',
          transform: 'translateZ(-1px)',
        }}>
          {/* trackpad */}
          <div style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:90, height:10, background:'rgba(255,255,255,0.025)', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.05)' }} />
          {/* left edge highlight */}
          <div style={{ position:'absolute', top:0, left:0, width:2, height:'100%', background:'linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 100%)', borderRadius:'0 0 0 8px' }} />
        </div>

        {/* ── BOTTOM EDGE ── */}
        <div style={{ width:758, height:5, background:'#111213', borderRadius:'0 0 12px 12px', boxShadow:'0 12px 40px rgba(0,0,0,0.98), 0 4px 12px rgba(0,0,0,0.8)', transform:'translateZ(-2px)' }} />

        {/* ── FOOT ── */}
        <div style={{ width:280, height:7, background:'#0D0E0F', borderRadius:'0 0 10px 10px', boxShadow:'0 8px 20px rgba(0,0,0,0.9)' }} />

        {/* ── GROUND SHADOW ── floating effect ── */}
        <div style={{ width:600, height:30, background:'radial-gradient(ellipse,rgba(0,0,0,0.7) 0%,transparent 70%)', borderRadius:'50%', marginTop:8, filter:'blur(8px)', transform:'scaleY(0.3)' }} />
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, openLoginModal } = useAuth()
  const [critiqueText, setCritiqueText]         = useState('')
  const [critiqueMeta, setCritiqueMeta]         = useState('')
  const [critiqueLabel, setCritiqueLabel]       = useState('Analysing a design')
  const [critiqueProgress, setCritiqueProgress] = useState(0)
  const [dynWord, setDynWord]                   = useState('wrong?')
  const [dynSub, setDynSub]                     = useState('See what\'s wrong before your users do.')
  const [mounted, setMounted]                   = useState(false)
  const [macMouse, setMacMouse]                 = useState({ x: 0, y: 0 })
  const [showSplash, setShowSplash]             = useState(false)
  const [analyseOpen, setAnalyseOpen]           = useState(false)
  const [briefOpen, setBriefOpen]               = useState(false)

  const wrapRef  = useRef<HTMLDivElement>(null)
  const cboxRef  = useRef<HTMLDivElement>(null)
  const macSecRef = useRef<HTMLElement>(null)
  const rafRef   = useRef<number>(0)
  const mouse    = useRef({ x:0, y:0 })
  const cT       = useRef({ cx:0, cy:0 })
  const cidx     = useRef(0)
  const timer    = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem(SPLASH_KEY)) {
      setShowSplash(true)
    }
    setMounted(true)
  }, [])

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, '1')
    setShowSplash(false)
  }, [])

  useEffect(() => {
    if (!mounted) return
    let lenis: any
    ;(async () => {
      const { default: Lenis } = await import('lenis')
      lenis = new Lenis({ duration:1.4, easing:(t:number)=>Math.min(1,1.001-Math.pow(2,-10*t)) })
      const raf=(time:number)=>{lenis.raf(time);requestAnimationFrame(raf)}
      requestAnimationFrame(raf)
    })()
    return () => { if (lenis) lenis.destroy() }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    ;(async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      gsap.fromTo('.hpMhd', {opacity:0,y:36}, {scrollTrigger:{trigger:'.hpS2',start:'top 78%'},opacity:1,y:0,duration:0.9,ease:'power3.out'})
      gsap.fromTo('.hpMacW', {opacity:0,y:80,scale:0.95}, {scrollTrigger:{trigger:'.hpS2',start:'top 68%'},opacity:1,y:0,scale:1,duration:1.3,ease:'power3.out',delay:0.1})
      gsap.fromTo('.hpS3i', {opacity:0,y:32}, {scrollTrigger:{trigger:'.hpS3',start:'top 78%'},opacity:1,y:0,duration:0.9,ease:'power3.out'})
    })()
  }, [mounted])

  // critique box parallax
  useEffect(() => {
    if (!mounted) return
    const onMove=(e:MouseEvent)=>{
      const w=wrapRef.current; if(!w) return
      const r=w.getBoundingClientRect()
      mouse.current={x:(e.clientX-r.left-r.width/2)/r.width,y:(e.clientY-r.top-r.height/2)/r.height}

      // mac section mouse
      const ms=macSecRef.current; if(!ms) return
      const mr=ms.getBoundingClientRect()
      if(e.clientY>=mr.top && e.clientY<=mr.bottom){
        setMacMouse({x:(e.clientX-mr.left-mr.width/2)/mr.width, y:(e.clientY-mr.top-mr.height/2)/mr.height})
      }
    }
    const onLeave=()=>{mouse.current={x:0,y:0};setMacMouse({x:0,y:0})}
    window.addEventListener('mousemove',onMove)
    window.addEventListener('mouseleave',onLeave)
    const loop=()=>{
      const {x,y}=mouse.current
      cT.current.cx+=(x-cT.current.cx)*0.07; cT.current.cy+=(y-cT.current.cy)*0.07
      if(cboxRef.current){
        const {cx,cy}=cT.current
        cboxRef.current.style.transform=`perspective(800px) rotateX(${cy*-12}deg) rotateY(${cx*12}deg) translate(${cx*14}px,${cy*10}px)`
      }
      rafRef.current=requestAnimationFrame(loop)
    }
    loop()
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseleave',onLeave);cancelAnimationFrame(rafRef.current)}
  }, [mounted])

  const runType = useCallback(() => {
    const c=CRITIQUES[cidx.current]
    setCritiqueLabel(c.label);setCritiqueMeta('');setCritiqueProgress(0);setCritiqueText('')
    let i=0
    const step=()=>{
      if(i<c.text.length){i++;setCritiqueText(c.text.slice(0,i));setCritiqueProgress(i/c.text.length);if(i===18){setDynWord(c.word);setDynSub(c.sub)};timer.current=setTimeout(step,22)}
      else{setCritiqueMeta(c.meta);timer.current=setTimeout(()=>{setCritiqueText('');setCritiqueMeta('');timer.current=setTimeout(()=>{cidx.current=(cidx.current+1)%CRITIQUES.length;runType()},300)},2800)}
    }
    timer.current=setTimeout(step,300)
  },[])

  useEffect(()=>{timer.current=setTimeout(runType,800);return()=>{if(timer.current)clearTimeout(timer.current)}},[runType])

  // mac section mouse tracking handled in main mouse handler

  if (!mounted) {
    return <div style={{position:'fixed',inset:0,background:'#08090F',zIndex:99999}} />
  }

  return (
    <>
    {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    <AnalyseModal open={analyseOpen} onClose={()=>setAnalyseOpen(false)} />
    <BriefModal open={briefOpen} onClose={()=>setBriefOpen(false)} />
    <div ref={wrapRef} style={{background:'#08090F',color:'#fff',overflowX:'hidden',fontFamily:'var(--font-geist-sans), sans-serif'}}>

      {/* ── NAV — compact ── */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 7%',position:'sticky',top:0,zIndex:100,background:'rgba(8,9,15,0.93)',backdropFilter:'blur(20px)',borderBottom:'0.5px solid rgba(255,255,255,0.06)'}}>
        <LogoSVG style={{width:110,height:'auto'}} opacity={0.92}/>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {user ? (
            <UserMenu />
          ) : (
            <span onClick={openLoginModal} style={{fontSize:13,color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>Sign in</span>
          )}
          <button style={{fontSize:13,padding:'7px 20px',borderRadius:100,background:'#fff',color:'#08090F',fontWeight:500,cursor:'pointer',border:'none'}}>Try free</button>
        </div>
      </nav>

      {/* ── S1 HERO ── */}
      <section style={{background:'#08090F',padding:'100px 7% 90px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',overflow:'hidden',minHeight:'88vh',justifyContent:'center'}}>
        {mounted && <BlastCanvas/>}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 52% 58% at 50% 48%,rgba(8,9,15,0.88) 0%,transparent 100%)',pointerEvents:'none',zIndex:1}}/>
        <div style={{position:'absolute',left:'1.5%',top:'50%',transform:'translateY(-50%) rotate(-90deg)',zIndex:2,pointerEvents:'none'}}>
          <LogoSVG opacity={0.04} style={{width:130,height:'auto'}}/>
        </div>
        <div style={{position:'absolute',right:'1.5%',top:'50%',transform:'translateY(-50%) rotate(90deg)',zIndex:2,pointerEvents:'none'}}>
          <LogoSVG opacity={0.04} style={{width:130,height:'auto'}}/>
        </div>

        <div style={{position:'relative',zIndex:3,display:'flex',flexDirection:'column',alignItems:'center',width:'100%'}}>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.4)',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:28,textAlign:'center'}}>AI-powered UX intelligence</p>

          <div ref={cboxRef} style={{width:'100%',maxWidth:560,marginBottom:40,willChange:'transform'}}>
            <div style={{background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:18,padding:'26px 30px',position:'relative',overflow:'hidden',minHeight:124,boxShadow:'0 20px 60px rgba(0,0,0,0.5),0 0 0 0.5px rgba(255,255,255,0.04) inset'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#fff',opacity:0.5,display:'inline-block',animation:'livePulse 1.5s ease infinite'}}/>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em'}}>{critiqueLabel}</span>
              </div>
              <div style={{fontSize:16,color:'rgba(255,255,255,0.92)',lineHeight:1.65,minHeight:52,letterSpacing:'-0.1px'}}>
                {critiqueText||'​'}
                {critiqueText&&<span style={{display:'inline-block',width:2,height:15,background:'#fff',opacity:0.7,marginLeft:2,verticalAlign:'middle',animation:'cursorBlink 0.9s step-end infinite'}}/>}
              </div>
              {critiqueMeta&&<div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:10,letterSpacing:'0.02em'}}>{critiqueMeta}</div>}
              <div style={{position:'absolute',bottom:0,left:0,height:1.5,background:'rgba(255,255,255,0.2)',width:`${critiqueProgress*100}%`,transition:'width 0.07s linear'}}/>
            </div>
          </div>

          <div style={{textAlign:'center',marginBottom:14}}>
            <span style={{fontSize:'clamp(46px,6.5vw,80px)',fontWeight:500,letterSpacing:'-3.5px',color:'#fff',lineHeight:0.95}}>What does your design{' '}</span>
            <span className={playfair.className} style={{fontSize:'clamp(46px,6.5vw,80px)',fontWeight:400,letterSpacing:'-3px',color:'rgba(255,255,255,0.28)',fontStyle:'italic',lineHeight:0.95}}>{dynWord}</span>
          </div>

          <p style={{fontSize:16,color:'rgba(255,255,255,0.5)',textAlign:'center',marginBottom:36,minHeight:22}}>{dynSub}</p>

          {/* CTA — outside parallax, no mouse animation */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:460,width:'100%',marginBottom:22,position:'relative',zIndex:20,pointerEvents:'auto',background:'rgba(8,9,15,0.6)',borderRadius:18,padding:'16px'}}>
            <button onClick={()=>setAnalyseOpen(true)} style={{borderRadius:14,padding:'16px 0',fontSize:15,fontWeight:500,cursor:'pointer',background:'#fff',color:'#08090F',border:'none',letterSpacing:'-0.2px'}}>Analyse my design →</button>
            <button onClick={()=>setBriefOpen(true)} style={{borderRadius:14,padding:'16px 0',fontSize:15,fontWeight:500,cursor:'pointer',background:'transparent',color:'rgba(255,255,255,0.8)',border:'1.5px solid rgba(255,255,255,0.55)',letterSpacing:'-0.2px'}}>Create a brief →</button>
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            {['Upload','Analyse','Fix','Re-upload'].map((step,i)=>(
              <div key={step} style={{display:'flex',alignItems:'center'}}>
                <div style={{background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:100,padding:'5px 14px',fontSize:11,color:'rgba(255,255,255,0.5)',fontWeight:500}}>{step}</div>
                {i<3&&<div style={{fontSize:11,color:'rgba(255,255,255,0.18)',margin:'0 4px'}}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{height:60,background:'linear-gradient(180deg,#08090F 0%,#0A0B10 100%)',marginTop:-1}}/>

      {/* ── S1b ISSUE CARD ── */}
      <section style={{background:'#0A0B10',padding:'70px 7% 80px',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{width:'100%',maxWidth:680}}>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.4)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:18,textAlign:'center'}}>Real output · What you actually get</p>
          <h2 style={{fontSize:'clamp(28px,4vw,46px)',fontWeight:500,letterSpacing:'-2px',color:'#fff',marginBottom:10,textAlign:'center',lineHeight:1.05}}>One design. Multiple perspectives.</h2>
          <p style={{fontSize:15,color:'rgba(255,255,255,0.5)',textAlign:'center',marginBottom:40,lineHeight:1.6}}>See your design like a user, a critic, and a stakeholder — all at once.</p>
          <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:16,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
            <div style={{background:'rgba(255,80,80,0.08)',borderBottom:'0.5px solid rgba(255,80,80,0.15)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:6,height:6,borderRadius:'50%',background:'rgba(255,100,100,0.8)'}}/><span style={{fontSize:13,fontWeight:500,color:'#fff'}}>Navigation CTA</span></div>
              <span style={{fontSize:10,padding:'3px 10px',borderRadius:100,background:'rgba(255,80,80,0.15)',color:'rgba(255,180,180,0.9)',fontWeight:500}}>Critical</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
              {[['WHAT','No primary action visible above the fold.'],['WHY','Hick\'s Law — users can\'t act on what they can\'t find.'],['USER IMPACT','Visitors scan and leave without knowing what to do next.'],['FIX DIRECTION','Needs to be singular, prominent, immediately visible on load.']].map(([k,v],i)=>(
                <div key={k} style={{padding:'16px 22px',borderRight:i%2===0?'0.5px solid rgba(255,255,255,0.06)':'none',borderBottom:i<2?'0.5px solid rgba(255,255,255,0.06)':'none'}}>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>{k}</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',lineHeight:1.55}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{height:60,background:'linear-gradient(180deg,#0A0B10 0%,#0D0808 100%)',marginTop:-1}}/>

      {/* ── ROAST ── */}
      <section style={{background:'#0D0808',padding:'70px 7% 80px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',width:'40%',height:200,borderRadius:'50%',background:'rgba(255,60,60,0.05)',top:'50%',left:'50%',transform:'translate(-50%,-50%)',filter:'blur(60px)',pointerEvents:'none'}}/>
        <div style={{width:'100%',maxWidth:560,textAlign:'center',position:'relative',zIndex:1}}>
          <p style={{fontSize:11,color:'rgba(255,100,100,0.6)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:18}}>Roast Mode</p>
          <h2 style={{fontSize:'clamp(28px,4vw,46px)',fontWeight:500,letterSpacing:'-2px',color:'#fff',marginBottom:16,lineHeight:1.05}}>The truth your design<br/>needs to hear.</h2>
          <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,80,80,0.2)',borderRadius:14,padding:'22px 26px',marginBottom:18}}>
            <p style={{fontSize:18,fontStyle:'italic',color:'rgba(255,255,255,0.8)',lineHeight:1.55,letterSpacing:'-0.2px'}}>"This CTA is playing hide and seek — and winning."</p>
          </div>
          <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>No "consider improving". No "you might want to". Just the truth.</p>
        </div>
      </section>

      <div style={{height:60,background:'linear-gradient(180deg,#0D0808 0%,#0B0C10 100%)',marginTop:-1}}/>

      {/* ── S2 SCROLL CARDS ── */}
      <ServiceCards/>

      <div style={{height:60,background:'linear-gradient(180deg,#0B0C10 0%,#0F1014 100%)',marginTop:-1}}/>

      {/* ── S3 QUOTE + CTA ── */}
      <section className="hpS3" style={{background:'#0F1014',padding:'90px 7%',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',width:'60%',height:300,borderRadius:'50%',background:'rgba(255,255,255,0.015)',top:'10%',left:'50%',transform:'translateX(-50%)',filter:'blur(80px)',pointerEvents:'none'}}/>
        <div className="hpS3i" style={{position:'relative',zIndex:1,width:'100%',maxWidth:700}}>
          <blockquote className={playfair.className} style={{fontSize:'clamp(26px,3.5vw,44px)',fontWeight:400,fontStyle:'italic',letterSpacing:'-1px',color:'rgba(255,255,255,0.75)',lineHeight:1.4,marginBottom:52}}>
            "The senior design partner<br/>you can't afford — now you can."
          </blockquote>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:20}}>Start free today</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:440,width:'100%',margin:'0 auto 18px'}}>
            <button onClick={()=>setAnalyseOpen(true)} style={{borderRadius:14,padding:'17px 0',fontSize:15,fontWeight:600,cursor:'pointer',background:'#fff',color:'#08090F',border:'none',letterSpacing:'-0.3px'}}>Analyse my design →</button>
            <button onClick={()=>setBriefOpen(true)} style={{borderRadius:14,padding:'17px 0',fontSize:15,fontWeight:500,cursor:'pointer',background:'transparent',color:'rgba(255,255,255,0.8)',border:'1.5px solid rgba(255,255,255,0.55)',letterSpacing:'-0.2px'}}>Create a brief →</button>
          </div>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.5)',letterSpacing:'0.04em'}}>Free · 5 analyses/month · No credit card needed</p>
        </div>
      </section>

    </div>
    </>
  )
}
